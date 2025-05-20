import { Logger } from '../logger.js';
import { createHash } from 'crypto';
import fs from 'fs/promises';
import path from 'path';

interface CacheEntry {
    url: string;
    method: string;
    headers: Record<string, string>;
    body?: string;
    response: {
        status: number;
        headers: Record<string, string>;
        body: string;
    };
    timestamp: number;
    expiresAt: number;
}

interface CacheOptions {
    maxAge?: number; // Cache duration in milliseconds
    maxSize?: number; // Maximum cache size in bytes
    cacheDir?: string; // Directory to store cache files
}

export class RequestCache {
    private cache: Map<string, CacheEntry> = new Map();
    private logger: Logger;
    private options: Required<CacheOptions>;
    private currentSize: number = 0;

    constructor(logger: Logger, options: CacheOptions = {}) {
        this.logger = logger;
        this.options = {
            maxAge: options.maxAge ?? 5 * 60 * 1000, // 5 minutes default
            maxSize: options.maxSize ?? 100 * 1024 * 1024, // 100MB default
            cacheDir: options.cacheDir ?? path.join(process.cwd(), '.cache')
        };

        // Initialize cache directory
        this.initializeCache();
    }

    private async initializeCache(): Promise<void> {
        try {
            await fs.mkdir(this.options.cacheDir, { recursive: true });
            await this.loadCacheFromDisk();
        } catch (error) {
            this.logger.error('Failed to initialize cache:', error);
        }
    }

    private async loadCacheFromDisk(): Promise<void> {
        try {
            const files = await fs.readdir(this.options.cacheDir);
            for (const file of files) {
                if (!file.endsWith('.json')) continue;

                const content = await fs.readFile(path.join(this.options.cacheDir, file), 'utf-8');
                const entry = JSON.parse(content) as CacheEntry;

                // Only load non-expired entries
                if (entry.expiresAt > Date.now()) {
                    const key = this.getCacheKey(entry.url, entry.method, entry.headers);
                    this.cache.set(key, entry);
                    this.currentSize += this.calculateEntrySize(entry);
                } else {
                    // Clean up expired cache file
                    await fs.unlink(path.join(this.options.cacheDir, file));
                }
            }
        } catch (error) {
            this.logger.error('Failed to load cache from disk:', error);
        }
    }

    private getCacheKey(url: string, method: string, headers: Record<string, string>): string {
        const relevantHeaders = Object.entries(headers)
            .filter(([key]) => !['date', 'etag', 'last-modified'].includes(key.toLowerCase()))
            .sort(([a], [b]) => a.localeCompare(b));

        const data = `${url}|${method}|${JSON.stringify(relevantHeaders)}`;
        return createHash('sha256').update(data).digest('hex');
    }

    private calculateEntrySize(entry: CacheEntry): number {
        return JSON.stringify(entry).length;
    }

    private async saveEntryToDisk(key: string, entry: CacheEntry): Promise<void> {
        try {
            const filePath = path.join(this.options.cacheDir, `${key}.json`);
            await fs.writeFile(filePath, JSON.stringify(entry, null, 2));
        } catch (error) {
            this.logger.error('Failed to save cache entry to disk:', error);
        }
    }

    private async removeEntryFromDisk(key: string): Promise<void> {
        try {
            const filePath = path.join(this.options.cacheDir, `${key}.json`);
            await fs.unlink(filePath);
        } catch (error) {
            this.logger.error('Failed to remove cache entry from disk:', error);
        }
    }

    private async cleanup(): Promise<void> {
        const now = Date.now();
        const expiredKeys = Array.from(this.cache.entries())
            .filter(([_, entry]) => entry.expiresAt <= now)
            .map(([key]) => key);

        for (const key of expiredKeys) {
            const entry = this.cache.get(key);
            if (entry) {
                this.currentSize -= this.calculateEntrySize(entry);
                this.cache.delete(key);
                await this.removeEntryFromDisk(key);
            }
        }

        // If still over size limit, remove oldest entries
        if (this.currentSize > this.options.maxSize) {
            const sortedEntries = Array.from(this.cache.entries())
                .sort(([_, a], [__, b]) => a.timestamp - b.timestamp);

            while (this.currentSize > this.options.maxSize && sortedEntries.length > 0) {
                const [key, entry] = sortedEntries.shift()!;
                this.currentSize -= this.calculateEntrySize(entry);
                this.cache.delete(key);
                await this.removeEntryFromDisk(key);
            }
        }
    }

    async get(url: string, method: string, headers: Record<string, string>): Promise<CacheEntry | null> {
        const key = this.getCacheKey(url, method, headers);
        const entry = this.cache.get(key);

        if (!entry) return null;

        // Check if entry is expired
        if (entry.expiresAt <= Date.now()) {
            this.cache.delete(key);
            await this.removeEntryFromDisk(key);
            this.currentSize -= this.calculateEntrySize(entry);
            return null;
        }

        return entry;
    }

    async set(
        url: string,
        method: string,
        headers: Record<string, string>,
        response: CacheEntry['response'],
        body?: string
    ): Promise<void> {
        const entry: CacheEntry = {
            url,
            method,
            headers,
            body,
            response,
            timestamp: Date.now(),
            expiresAt: Date.now() + this.options.maxAge
        };

        const key = this.getCacheKey(url, method, headers);
        const entrySize = this.calculateEntrySize(entry);

        // Check if we need to make space
        if (this.currentSize + entrySize > this.options.maxSize) {
            await this.cleanup();
        }

        // If still over size limit, don't cache
        if (this.currentSize + entrySize > this.options.maxSize) {
            this.logger.warn('Cache full, skipping entry');
            return;
        }

        this.cache.set(key, entry);
        this.currentSize += entrySize;
        await this.saveEntryToDisk(key, entry);
    }

    async clear(): Promise<void> {
        this.cache.clear();
        this.currentSize = 0;
        try {
            const files = await fs.readdir(this.options.cacheDir);
            await Promise.all(
                files.map(file => fs.unlink(path.join(this.options.cacheDir, file)))
            );
        } catch (error) {
            this.logger.error('Failed to clear cache directory:', error);
        }
    }

    getMetrics(): {
        size: number;
        entryCount: number;
        hitRate: number;
        maxSize: number;
    } {
        return {
            size: this.currentSize,
            entryCount: this.cache.size,
            hitRate: 0, // TODO: Implement hit rate tracking
            maxSize: this.options.maxSize
        };
    }
} 