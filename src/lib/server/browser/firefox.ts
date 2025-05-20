import { Logger } from '../logger.js';
import type { BrowserOptions, BrowserCapabilities, BrowserProfile } from './types.js';
import type { Options } from '@wdio/types';
import { BaseBrowserManager } from './base.js';
import { FirefoxProfileManager } from './firefox-profile-manager.js';
import { execSync } from 'child_process';
import { existsSync } from 'fs';

export class FirefoxManager extends BaseBrowserManager {
    constructor(logger: Logger) {
        const profileManager = new FirefoxProfileManager(logger);
        super(logger, profileManager);
    }

    async getCapabilities(options: BrowserOptions = {}): Promise<BrowserCapabilities> {
        const capabilities: BrowserCapabilities = {
            browserName: 'firefox',
            capabilities: {
                browserName: 'firefox',
                'moz:firefoxOptions': {
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
                capabilities.capabilities['moz:firefoxOptions'].profile = profilePath;
            } else if (options.profile.name) {
                // Create new profile
                const profile = await this.createProfile({
                    name: options.profile.name,
                    browserType: 'firefox',
                    options,
                    metadata: {
                        description: `Profile created for ${options.profile.name}`,
                        tags: ['firefox', 'custom']
                    }
                });
                const profilePath = await this.getProfilePath(profile.id);
                capabilities.capabilities['moz:firefoxOptions'].profile = profilePath;
            } else if (options.profile.path) {
                // Use profile from path
                if (!existsSync(options.profile.path)) {
                    throw new Error(`Profile path not found: ${options.profile.path}`);
                }
                capabilities.capabilities['moz:firefoxOptions'].profile = options.profile.path;
            }
        }

        // Add headless mode if specified
        if (options.headless) {
            capabilities.capabilities['moz:firefoxOptions'].args.push('--headless');
        }

        this.logger.debug('Firefox capabilities:', capabilities);
        return capabilities;
    }

    async validateInstallation(): Promise<boolean> {
        try {
            // Check if Firefox is installed
            const firefoxPath = await this.getBinaryPath();
            if (!existsSync(firefoxPath)) {
                this.logger.error('Firefox not found at:', firefoxPath);
                return false;
            }

            // Check Firefox version
            const version = execSync(`"${firefoxPath}" --version`).toString().trim();
            this.logger.info('Firefox version:', version);

            return true;
        } catch (error) {
            this.logger.error('Firefox validation failed:', error);
            return false;
        }
    }

    async getBinaryPath(): Promise<string> {
        // Platform-specific Firefox binary paths
        const paths = {
            darwin: '/Applications/Firefox.app/Contents/MacOS/firefox',
            linux: '/usr/bin/firefox',
            win32: 'C:\\Program Files\\Mozilla Firefox\\firefox.exe'
        };

        const path = paths[process.platform as keyof typeof paths];
        if (!path) {
            throw new Error(`Unsupported platform: ${process.platform}`);
        }

        return path;
    }

    getDefaultArgs(options: BrowserOptions = {}): string[] {
        const args = [
            '--no-remote',
            '--disable-gpu',
            '--disable-dev-shm-usage'
        ];

        if (options.args) {
            args.push(...options.args);
        }

        return args;
    }
} 