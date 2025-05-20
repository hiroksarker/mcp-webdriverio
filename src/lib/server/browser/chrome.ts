import { Logger } from '../logger.js';
import type { BrowserManager, BrowserOptions, BrowserCapabilities, BrowserProfile } from './types.js';
import type { Options } from '@wdio/types';
import { ChromeProfileManager } from './chrome-profile-manager.js';
import { BaseBrowserManager } from './base.js';
import { execSync } from 'child_process';
import { existsSync } from 'fs';

export class ChromeManager extends BaseBrowserManager {
    constructor(logger: Logger) {
        const profileManager = new ChromeProfileManager(logger);
        super(logger, profileManager);
    }

    async getCapabilities(options: BrowserOptions = {}): Promise<BrowserCapabilities> {
        const capabilities: BrowserCapabilities = {
            browserName: 'chrome',
            capabilities: {
                browserName: 'chrome',
                'goog:chromeOptions': {
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
                capabilities.capabilities['goog:chromeOptions'].userDataDir = profilePath;
            } else if (options.profile.name) {
                // Create new profile
                const profile = await this.createProfile({
                    name: options.profile.name,
                    browserType: 'chrome',
                    options,
                    metadata: {
                        description: `Profile created for ${options.profile.name}`,
                        tags: ['chrome', 'custom']
                    }
                });
                const profilePath = await this.getProfilePath(profile.id);
                capabilities.capabilities['goog:chromeOptions'].userDataDir = profilePath;
            } else if (options.profile.path) {
                // Use profile from path
                if (!existsSync(options.profile.path)) {
                    throw new Error(`Profile path not found: ${options.profile.path}`);
                }
                capabilities.capabilities['goog:chromeOptions'].userDataDir = options.profile.path;
            }
        }

        // Add headless mode if specified
        if (options.headless) {
            capabilities.capabilities['goog:chromeOptions'].args.push('--headless=new');
        }

        this.logger.debug('Chrome capabilities:', capabilities);
        return capabilities;
    }

    async validateInstallation(): Promise<boolean> {
        try {
            // Check if Chrome is installed
            const chromePath = await this.getBinaryPath();
            if (!existsSync(chromePath)) {
                this.logger.error('Chrome not found at:', chromePath);
                return false;
            }

            // Check Chrome version
            const version = execSync(`"${chromePath}" --version`).toString().trim();
            this.logger.info('Chrome version:', version);

            return true;
        } catch (error) {
            this.logger.error('Chrome validation failed:', error);
            return false;
        }
    }

    async getBinaryPath(): Promise<string> {
        // Platform-specific Chrome binary paths
        const paths = {
            darwin: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
            linux: '/usr/bin/google-chrome',
            win32: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
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