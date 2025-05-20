import { Logger } from '../logger.js';
import type { BrowserOptions, BrowserCapabilities, BrowserProfile } from './types.js';
import type { Options } from '@wdio/types';
import { BaseBrowserManager } from './base.js';
import { BaseProfileManager } from './profile-manager.js';
import { execSync } from 'child_process';
import { existsSync, createWriteStream } from 'fs';
import path from 'path';
import fs from 'fs/promises';
import archiver from 'archiver';
import extract from 'extract-zip';

class SafariProfileManager extends BaseProfileManager {
    constructor(logger: Logger) {
        super(logger, 'safari');
    }

    protected getProfileStoragePath(profileId: string): string {
        return path.join(this.profilesDir, profileId);
    }

    protected async exportProfileData(profileId: string, targetPath: string): Promise<void> {
        const profilePath = this.getProfileStoragePath(profileId);
        const output = createWriteStream(targetPath);
        const archive = archiver('zip', { zlib: { level: 9 } });

        return new Promise((resolve, reject) => {
            output.on('close', () => {
                this.logger.info(`Safari profile ${profileId} exported to ${targetPath}`);
                resolve();
            });

            archive.on('error', (err: Error) => {
                this.logger.error('Failed to export Safari profile:', err);
                reject(err);
            });

            archive.pipe(output);
            archive.directory(profilePath, false);
            archive.finalize();
        });
    }

    protected async importProfileData(sourcePath: string, profileId: string): Promise<void> {
        const profilePath = this.getProfileStoragePath(profileId);
        await extract(sourcePath, { dir: profilePath });

        // Ensure proper permissions for Safari profile
        if (process.platform !== 'win32') {
            await fs.chmod(profilePath, 0o700);
        }

        this.logger.info(`Safari profile imported to ${profilePath}`);
    }

    async createDefaultProfile(): Promise<string> {
        const profile = await this.createProfile({
            name: 'Default Safari Profile',
            browserType: 'safari',
            options: {
                args: [
                    '--disable-gpu',
                    '--disable-dev-shm-usage'
                ]
            },
            metadata: {
                description: 'Default Safari profile with common settings',
                tags: ['default', 'safari']
            }
        });
        return profile.id;
    }
}

export class SafariManager extends BaseBrowserManager {
    constructor(logger: Logger) {
        const profileManager = new SafariProfileManager(logger);
        super(logger, profileManager);
    }

    async getCapabilities(options: BrowserOptions = {}): Promise<BrowserCapabilities> {
        const capabilities: BrowserCapabilities = {
            browserName: 'safari',
            capabilities: {
                browserName: 'safari',
                'safari.options': {
                    cleanSession: true,
                    useCleanSession: true
                }
            },
            logLevel: 'error' as Options.WebdriverIO['logLevel'],
            automationProtocol: 'webdriver' as Options.WebdriverIO['automationProtocol']
        };

        // Handle profile options
        if (options.profile) {
            if (options.profile.id) {
                // Use existing profile
                const profilePath = await this.getProfilePath(options.profile.id);
                capabilities.capabilities['safari.options'].userDataDir = profilePath;
            } else if (options.profile.name) {
                // Create new profile
                const profile = await this.createProfile({
                    name: options.profile.name,
                    browserType: 'safari',
                    options,
                    metadata: {
                        description: `Profile created for ${options.profile.name}`,
                        tags: ['safari', 'custom']
                    }
                });
                const profilePath = await this.getProfilePath(profile.id);
                capabilities.capabilities['safari.options'].userDataDir = profilePath;
            } else if (options.profile.path) {
                // Use profile from path
                if (!existsSync(options.profile.path)) {
                    throw new Error(`Profile path not found: ${options.profile.path}`);
                }
                capabilities.capabilities['safari.options'].userDataDir = options.profile.path;
            }
        }

        this.logger.debug('Safari capabilities:', capabilities);
        return capabilities;
    }

    async validateInstallation(): Promise<boolean> {
        try {
            // Check if Safari is installed
            const safariPath = await this.getBinaryPath();
            if (!existsSync(safariPath)) {
                this.logger.error('Safari not found at:', safariPath);
                return false;
            }

            // Check Safari version
            const version = execSync(`"${safariPath}" --version`).toString().trim();
            this.logger.info('Safari version:', version);

            return true;
        } catch (error) {
            this.logger.error('Safari validation failed:', error);
            return false;
        }
    }

    async getBinaryPath(): Promise<string> {
        // Platform-specific Safari binary paths
        const paths = {
            darwin: '/Applications/Safari.app/Contents/MacOS/Safari',
            win32: 'C:\\Program Files\\Safari\\Safari.exe'
        };

        const path = paths[process.platform as keyof typeof paths];
        if (!path) {
            throw new Error(`Unsupported platform: ${process.platform}`);
        }

        return path;
    }

    getDefaultArgs(options: BrowserOptions = {}): string[] {
        const args = [
            '--disable-gpu',
            '--disable-dev-shm-usage'
        ];

        if (options.args) {
            args.push(...options.args);
        }

        return args;
    }
} 