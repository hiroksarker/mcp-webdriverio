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

class EdgeProfileManager extends BaseProfileManager {
    constructor(logger: Logger) {
        super(logger, 'edge');
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
                this.logger.info(`Edge profile ${profileId} exported to ${targetPath}`);
                resolve();
            });

            archive.on('error', (err: Error) => {
                this.logger.error('Failed to export Edge profile:', err);
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

        // Ensure proper permissions for Edge profile
        if (process.platform !== 'win32') {
            await fs.chmod(profilePath, 0o700);
        }

        this.logger.info(`Edge profile imported to ${profilePath}`);
    }

    async createDefaultProfile(): Promise<string> {
        const profile = await this.createProfile({
            name: 'Default Edge Profile',
            browserType: 'edge',
            options: {
                args: [
                    '--no-first-run',
                    '--no-default-browser-check',
                    '--disable-extensions',
                    '--disable-popup-blocking',
                    '--disable-notifications'
                ]
            },
            metadata: {
                description: 'Default Edge profile with common settings',
                tags: ['default', 'edge']
            }
        });
        return profile.id;
    }
}

export class EdgeManager extends BaseBrowserManager {
    constructor(logger: Logger) {
        const profileManager = new EdgeProfileManager(logger);
        super(logger, profileManager);
    }

    async getCapabilities(options: BrowserOptions = {}): Promise<BrowserCapabilities> {
        const capabilities: BrowserCapabilities = {
            browserName: 'MicrosoftEdge',
            capabilities: {
                browserName: 'MicrosoftEdge',
                'ms:edgeOptions': {
                    args: this.getDefaultArgs(options)
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
                capabilities.capabilities['ms:edgeOptions'].userDataDir = profilePath;
            } else if (options.profile.name) {
                // Create new profile
                const profile = await this.createProfile({
                    name: options.profile.name,
                    browserType: 'edge',
                    options,
                    metadata: {
                        description: `Profile created for ${options.profile.name}`,
                        tags: ['edge', 'custom']
                    }
                });
                const profilePath = await this.getProfilePath(profile.id);
                capabilities.capabilities['ms:edgeOptions'].userDataDir = profilePath;
            } else if (options.profile.path) {
                // Use profile from path
                if (!existsSync(options.profile.path)) {
                    throw new Error(`Profile path not found: ${options.profile.path}`);
                }
                capabilities.capabilities['ms:edgeOptions'].userDataDir = options.profile.path;
            }
        }

        // Add headless mode if specified
        if (options.headless) {
            capabilities.capabilities['ms:edgeOptions'].args.push('--headless=new');
        }

        this.logger.debug('Edge capabilities:', capabilities);
        return capabilities;
    }

    async validateInstallation(): Promise<boolean> {
        try {
            // Check if Edge is installed
            const edgePath = await this.getBinaryPath();
            if (!existsSync(edgePath)) {
                this.logger.error('Edge not found at:', edgePath);
                return false;
            }

            // Check Edge version
            const version = execSync(`"${edgePath}" --version`).toString().trim();
            this.logger.info('Edge version:', version);

            return true;
        } catch (error) {
            this.logger.error('Edge validation failed:', error);
            return false;
        }
    }

    async getBinaryPath(): Promise<string> {
        // Platform-specific Edge binary paths
        const paths = {
            darwin: '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
            linux: '/usr/bin/microsoft-edge',
            win32: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
        };

        const path = paths[process.platform as keyof typeof paths];
        if (!path) {
            throw new Error(`Unsupported platform: ${process.platform}`);
        }

        return path;
    }

    getDefaultArgs(options: BrowserOptions = {}): string[] {
        const args = [
            '--no-first-run',
            '--no-default-browser-check',
            '--disable-extensions',
            '--disable-popup-blocking',
            '--disable-notifications',
            '--disable-gpu',
            '--disable-dev-shm-usage',
            '--disable-setuid-sandbox',
            '--no-sandbox'
        ];

        if (options.args) {
            args.push(...options.args);
        }

        return args;
    }
} 