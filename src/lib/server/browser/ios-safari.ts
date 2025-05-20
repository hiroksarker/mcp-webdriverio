import { Logger } from '../logger.js';
import type { BrowserOptions, BrowserCapabilities, BrowserProfile, MobileDevice } from './types.js';
import type { Options } from '@wdio/types';
import { BaseBrowserManager } from './base.js';
import { BaseProfileManager } from './profile-manager.js';
import { execSync } from 'child_process';
import { existsSync } from 'fs';
import path from 'path';
import fs from 'fs/promises';

class IOSSafariProfileManager extends BaseProfileManager {
    constructor(logger: Logger) {
        super(logger, 'ios_safari');
    }

    protected getProfileStoragePath(profileId: string): string {
        return path.join(this.profilesDir, profileId);
    }

    protected async exportProfileData(profileId: string, targetPath: string): Promise<void> {
        // iOS Safari profiles are managed by the device, so we just create a placeholder
        await fs.writeFile(targetPath, JSON.stringify({ deviceProfile: profileId }));
    }

    protected async importProfileData(sourcePath: string, profileId: string): Promise<void> {
        // iOS Safari profiles are managed by the device, so we just create a placeholder
        const profilePath = this.getProfileStoragePath(profileId);
        await fs.mkdir(profilePath, { recursive: true });
    }

    async createDefaultProfile(): Promise<string> {
        const profile = await this.createProfile({
            name: 'Default iOS Safari Profile',
            browserType: 'ios_safari',
            options: {},
            metadata: {
                description: 'Default profile for iOS Safari',
                tags: ['default', 'ios_safari']
            }
        });
        return profile.id;
    }
}

export class IOSSafariManager extends BaseBrowserManager {
    constructor(logger: Logger) {
        const profileManager = new IOSSafariProfileManager(logger);
        super(logger, profileManager);
    }

    async getCapabilities(options: BrowserOptions = {}): Promise<BrowserCapabilities> {
        const device = await this.validateDevice(options.mobile?.udid || '');
        if (!device) {
            throw new Error('No valid iOS device found');
        }

        const capabilities: BrowserCapabilities = {
            browserName: 'safari',
            capabilities: {
                browserName: 'safari',
                platformName: 'iOS',
                'appium:automationName': 'XCUITest',
                'appium:deviceName': device.name,
                'appium:platformVersion': device.version,
                'appium:udid': device.udid,
                'appium:noReset': options.mobile?.noReset ?? true,
                'appium:fullReset': options.mobile?.fullReset ?? false,
                'appium:bundleId': 'com.apple.mobilesafari'
            },
            logLevel: 'error' as Options.WebdriverIO['logLevel'],
            automationProtocol: 'webdriver' as Options.WebdriverIO['automationProtocol']
        };

        // Handle profile options
        if (options.profile) {
            if (options.profile.id) {
                // Use existing profile
                const profilePath = await this.getProfilePath(options.profile.id);
                capabilities.capabilities['appium:safariOptions'] = {
                    userDataDir: profilePath
                };
            } else if (options.profile.name) {
                // Create new profile
                const profile = await this.createProfile({
                    name: options.profile.name,
                    browserType: 'ios_safari',
                    options,
                    metadata: {
                        description: `Profile created for ${options.profile.name}`,
                        tags: ['ios_safari', 'custom']
                    }
                });
                const profilePath = await this.getProfilePath(profile.id);
                capabilities.capabilities['appium:safariOptions'] = {
                    userDataDir: profilePath
                };
            }
        }

        this.logger.debug('iOS Safari capabilities:', capabilities);
        return capabilities;
    }

    async getDeviceInfo(): Promise<MobileDevice[]> {
        try {
            const output = execSync('xcrun xctrace list devices').toString();
            const lines = output.split('\n');
            const devices: MobileDevice[] = [];

            for (const line of lines) {
                if (!line.includes('iPhone') && !line.includes('iPad')) continue;

                const match = line.match(/(iPhone|iPad).*\(([^)]+)\)\s*\(([^)]+)\)/);
                if (!match) continue;

                const [, deviceType, udid, version] = match;
                devices.push({
                    type: 'ios',
                    name: deviceType.trim(),
                    version: version.trim(),
                    udid: udid.trim(),
                    isAvailable: true
                });
            }

            return devices;
        } catch (error) {
            this.logger.error('Failed to get iOS devices:', error);
            return [];
        }
    }

    async validateDevice(udid: string): Promise<MobileDevice | null> {
        const devices = await this.getDeviceInfo();
        const device = devices.find(d => d.udid === udid);

        if (!device) {
            this.logger.warn(`Device not found: ${udid}`);
            return null;
        }

        // Check if device is available and ready
        try {
            const output = execSync(`xcrun simctl list devices | grep ${udid}`).toString();
            if (!output.includes('Booted')) {
                this.logger.warn('Device is not booted');
                return null;
            }
        } catch (error) {
            this.logger.warn('Failed to check device status:', error);
            return null;
        }

        return device;
    }

    async getDeviceCapabilities(udid: string): Promise<BrowserCapabilities> {
        const device = await this.validateDevice(udid);
        if (!device) {
            throw new Error(`Invalid device: ${udid}`);
        }

        return this.getCapabilities({
            mobile: {
                udid,
                deviceName: device.name,
                platformVersion: device.version
            }
        });
    }

    async validateInstallation(): Promise<boolean> {
        try {
            // Check if Xcode is installed
            execSync('xcode-select -p');
            
            // Check if any devices are available
            const devices = await this.getDeviceInfo();
            if (devices.length === 0) {
                this.logger.error('No iOS devices found');
                return false;
            }

            return true;
        } catch (error) {
            this.logger.error('iOS Safari validation failed:', error);
            return false;
        }
    }

    async getBinaryPath(): Promise<string> {
        return 'safari'; // iOS Safari doesn't have a traditional binary path
    }

    getDefaultArgs(options: BrowserOptions = {}): string[] {
        return []; // iOS Safari doesn't support command line arguments
    }
} 