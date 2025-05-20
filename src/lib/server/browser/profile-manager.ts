import { Logger } from '../logger.js';
import type { BrowserProfile, ProfileManager, BrowserType, BrowserOptions } from './types.js';
import { v4 as uuidv4 } from 'uuid';
import { promises as fs } from 'fs';
import path from 'path';
import { existsSync, mkdirSync } from 'fs';

export abstract class BaseProfileManager implements ProfileManager {
    protected logger: Logger;
    protected profilesDir: string;
    protected profiles: Map<string, BrowserProfile>;
    protected browserType: BrowserType;

    constructor(logger: Logger, browserType: BrowserType) {
        this.logger = logger;
        this.browserType = browserType;
        this.profiles = new Map();
        this.profilesDir = path.join(process.cwd(), 'profiles', browserType);
        
        // Ensure profiles directory exists
        if (!existsSync(this.profilesDir)) {
            mkdirSync(this.profilesDir, { recursive: true });
        }

        // Load existing profiles
        this.loadProfiles().catch(error => {
            this.logger.error('Failed to load profiles:', error);
        });
    }

    protected abstract getProfileStoragePath(profileId: string): string;
    protected abstract exportProfileData(profileId: string, targetPath: string): Promise<void>;
    protected abstract importProfileData(sourcePath: string, profileId: string): Promise<void>;

    async createProfile(options: Omit<BrowserProfile, 'id' | 'createdAt' | 'lastUsed'>): Promise<BrowserProfile> {
        const id = uuidv4();
        const now = new Date();
        
        const profile: BrowserProfile = {
            id,
            ...options,
            createdAt: now,
            lastUsed: now
        };

        // Create profile storage directory
        const profilePath = this.getProfileStoragePath(id);
        await fs.mkdir(profilePath, { recursive: true });

        // Save profile metadata
        await this.saveProfileMetadata(profile);
        this.profiles.set(id, profile);

        this.logger.info(`Created ${this.browserType} profile: ${profile.name} (${id})`);
        return profile;
    }

    async getProfile(id: string): Promise<BrowserProfile | null> {
        if (this.profiles.has(id)) {
            const profile = this.profiles.get(id)!;
            profile.lastUsed = new Date();
            await this.saveProfileMetadata(profile);
            return profile;
        }
        return null;
    }

    async listProfiles(filter?: Partial<BrowserProfile>): Promise<BrowserProfile[]> {
        let profiles = Array.from(this.profiles.values());
        
        if (filter) {
            profiles = profiles.filter(profile => {
                return Object.entries(filter).every(([key, value]) => {
                    if (key === 'metadata') {
                        return Object.entries(value as object).every(([metaKey, metaValue]) => 
                            profile.metadata?.[metaKey] === metaValue
                        );
                    }
                    return profile[key as keyof BrowserProfile] === value;
                });
            });
        }

        return profiles;
    }

    async updateProfile(id: string, updates: Partial<BrowserProfile>): Promise<BrowserProfile> {
        const profile = await this.getProfile(id);
        if (!profile) {
            throw new Error(`Profile not found: ${id}`);
        }

        const updatedProfile = {
            ...profile,
            ...updates,
            lastUsed: new Date()
        };

        await this.saveProfileMetadata(updatedProfile);
        this.profiles.set(id, updatedProfile);

        this.logger.info(`Updated ${this.browserType} profile: ${updatedProfile.name} (${id})`);
        return updatedProfile;
    }

    async deleteProfile(id: string): Promise<boolean> {
        const profile = await this.getProfile(id);
        if (!profile) {
            return false;
        }

        try {
            const profilePath = this.getProfileStoragePath(id);
            await fs.rm(profilePath, { recursive: true, force: true });
            this.profiles.delete(id);
            
            this.logger.info(`Deleted ${this.browserType} profile: ${profile.name} (${id})`);
            return true;
        } catch (error) {
            this.logger.error(`Failed to delete profile ${id}:`, error);
            return false;
        }
    }

    async exportProfile(id: string): Promise<string> {
        const profile = await this.getProfile(id);
        if (!profile) {
            throw new Error(`Profile not found: ${id}`);
        }

        const exportDir = path.join(this.profilesDir, 'exports');
        await fs.mkdir(exportDir, { recursive: true });

        const exportPath = path.join(exportDir, `${profile.name}-${id}.zip`);
        await this.exportProfileData(id, exportPath);

        this.logger.info(`Exported ${this.browserType} profile: ${profile.name} (${id}) to ${exportPath}`);
        return exportPath;
    }

    async importProfile(sourcePath: string): Promise<BrowserProfile> {
        if (!existsSync(sourcePath)) {
            throw new Error(`Profile file not found: ${sourcePath}`);
        }

        const id = uuidv4();
        const profilePath = this.getProfileStoragePath(id);
        await fs.mkdir(profilePath, { recursive: true });

        // Import profile data
        await this.importProfileData(sourcePath, id);

        // Create profile metadata
        const profileName = path.basename(sourcePath, '.zip').split('-')[0];
        const profile = await this.createProfile({
            name: profileName,
            browserType: this.browserType,
            options: {} as BrowserOptions,
            metadata: {
                importedFrom: sourcePath,
                importedAt: new Date().toISOString()
            }
        });

        this.logger.info(`Imported ${this.browserType} profile: ${profile.name} (${profile.id})`);
        return profile;
    }

    protected async loadProfiles(): Promise<void> {
        try {
            const metadataPath = path.join(this.profilesDir, 'metadata.json');
            if (existsSync(metadataPath)) {
                const data = await fs.readFile(metadataPath, 'utf-8');
                const profiles = JSON.parse(data) as BrowserProfile[];
                profiles.forEach(profile => this.profiles.set(profile.id, profile));
                this.logger.info(`Loaded ${this.profiles.size} ${this.browserType} profiles`);
            }
        } catch (error) {
            this.logger.error('Failed to load profiles:', error);
        }
    }

    protected async saveProfileMetadata(profile: BrowserProfile): Promise<void> {
        const metadataPath = path.join(this.profilesDir, 'metadata.json');
        const profiles = Array.from(this.profiles.values());
        await fs.writeFile(metadataPath, JSON.stringify(profiles, null, 2));
    }

    async getProfilePath(profileId: string): Promise<string> {
        const profile = await this.getProfile(profileId);
        if (!profile) {
            throw new Error(`Profile not found: ${profileId}`);
        }

        const profilePath = this.getProfileStoragePath(profileId);
        if (!await fs.access(profilePath).then(() => true).catch(() => false)) {
            throw new Error(`Profile directory not found: ${profilePath}`);
        }

        return profilePath;
    }

    async createDefaultProfile(): Promise<string> {
        const profile = await this.createProfile({
            name: `Default ${this.browserType} Profile`,
            browserType: this.browserType,
            options: {},
            metadata: {
                description: `Default profile for ${this.browserType}`,
                tags: ['default', this.browserType]
            }
        });

        return profile.id;
    }
} 