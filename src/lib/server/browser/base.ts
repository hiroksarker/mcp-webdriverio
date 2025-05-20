import { Logger } from '../logger.js';
import type { BrowserManager, BrowserOptions, BrowserCapabilities, BrowserType, BrowserProfile } from './types.js';
import { BaseProfileManager } from './profile-manager.js';

export * from './types.js';

export abstract class BaseBrowserManager implements BrowserManager {
    protected logger: Logger;
    protected profileManager: BaseProfileManager;

    constructor(logger: Logger, profileManager: BaseProfileManager) {
        this.logger = logger;
        this.profileManager = profileManager;
    }

    abstract getCapabilities(options?: BrowserOptions): Promise<BrowserCapabilities>;
    abstract validateInstallation(): Promise<boolean>;
    abstract getBinaryPath(version?: string): Promise<string>;
    abstract getDefaultArgs(options?: BrowserOptions): string[];

    getProfileManager(): BaseProfileManager {
        return this.profileManager;
    }

    async createProfile(options: Omit<BrowserProfile, 'id' | 'createdAt' | 'lastUsed'>): Promise<BrowserProfile> {
        return this.profileManager.createProfile(options);
    }

    async getProfilePath(profileId: string): Promise<string> {
        return this.profileManager.getProfilePath(profileId);
    }

    protected getBrowserType(): BrowserType {
        const className = this.constructor.name.toLowerCase();
        if (className.includes('chrome')) return 'chrome';
        if (className.includes('firefox')) return 'firefox';
        if (className.includes('safari')) return 'safari';
        if (className.includes('edge')) return 'edge';
        throw new Error(`Unknown browser type: ${className}`);
    }
} 