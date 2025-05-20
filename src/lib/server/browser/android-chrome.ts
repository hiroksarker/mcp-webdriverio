import { Logger } from '../logger.js';
import type { BrowserOptions, BrowserCapabilities, BrowserProfile, MobileDevice } from './types.js';
import type { Options } from '@wdio/types';
import { BaseBrowserManager } from './base.js';
import { BaseProfileManager } from './profile-manager.js';
import { execSync } from 'child_process';
import { existsSync } from 'fs';
import path from 'path';
import fs from 'fs/promises';

class AndroidChromeProfileManager extends BaseProfileManager {
    constructor(logger: Logger) {
        super(logger, 'android_chrome');
    }

    protected getProfileStoragePath(profileId: string): string {
        return path.join(this.profilesDir, profileId);
    }

    protected async exportProfileData(profileId: string, targetPath: string): Promise<void> {
        // Android Chrome profiles are managed by the device, so we just create a placeholder
        await fs.writeFile(targetPath, JSON.stringify({ deviceProfile: profileId }));
    }

    protected async importProfileData(sourcePath: string, profileId: string): Promise<void> {
        // Android Chrome profiles are managed by the device, so we just create a placeholder
        const profilePath = this.getProfileStoragePath(profileId);
        await fs.mkdir(profilePath, { recursive: true });
    }

    async createDefaultProfile(): Promise<string> {
        const profile = await this.createProfile({
            name: 'Default Android Chrome Profile',
            browserType: 'android_chrome',
            options: {},
            metadata: {
                description: 'Default profile for Android Chrome',
                tags: ['default', 'android_chrome']
            }
        });
        return profile.id;
    }
}

export class AndroidChromeManager extends BaseBrowserManager {
    constructor(logger: Logger) {
        const profileManager = new AndroidChromeProfileManager(logger);
        super(logger, profileManager);
    }

    async getCapabilities(options: BrowserOptions = {}): Promise<BrowserCapabilities> {
        const device = await this.validateDevice(options.mobile?.deviceId || '');
        if (!device) {
            throw new Error('No valid Android device found');
        }

        const capabilities: BrowserCapabilities = {
            browserName: 'chrome',
            capabilities: {
                browserName: 'chrome',
                platformName: 'Android',
                'appium:automationName': 'UiAutomator2',
                'appium:deviceName': device.name,
                'appium:platformVersion': device.version,
                'appium:deviceId': device.deviceId,
                'appium:noReset': options.mobile?.noReset ?? true,
                'appium:fullReset': options.mobile?.fullReset ?? false,
                'appium:chromeOptions': {
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
                capabilities.capabilities['appium:chromeOptions'].userDataDir = profilePath;
            } else if (options.profile.name) {
                // Create new profile
                const profile = await this.createProfile({
                    name: options.profile.name,
                    browserType: 'android_chrome',
                    options,
                    metadata: {
                        description: `Profile created for ${options.profile.name}`,
                        tags: ['android_chrome', 'custom']
                    }
                });
                const profilePath = await this.getProfilePath(profile.id);
                capabilities.capabilities['appium:chromeOptions'].userDataDir = profilePath;
            }
        }

        this.logger.debug('Android Chrome capabilities:', capabilities);
        return capabilities;
    }

    async getDeviceInfo(): Promise<MobileDevice[]> {
        try {
            const output = execSync('adb devices -l').toString();
            const lines = output.split('\n').slice(1); // Skip header
            const devices: MobileDevice[] = [];

            for (const line of lines) {
                if (!line.trim()) continue;

                const [id, state, ...details] = line.split(/\s+/);
                if (state !== 'device') continue;

                const deviceInfo: Record<string, string> = {};
                for (const detail of details) {
                    const [key, value] = detail.split(':');
                    if (key && value) {
                        deviceInfo[key] = value;
                    }
                }

                // Get device model and Android version
                const model = execSync(`adb -s ${id} shell getprop ro.product.model`).toString().trim();
                const version = execSync(`adb -s ${id} shell getprop ro.build.version.release`).toString().trim();

                devices.push({
                    type: 'android',
                    name: model,
                    version,
                    deviceId: id,
                    isAvailable: true
                });
            }

            return devices;
        } catch (error) {
            this.logger.error('Failed to get Android devices:', error);
            return [];
        }
    }

    async validateDevice(deviceId: string): Promise<MobileDevice | null> {
        const devices = await this.getDeviceInfo();
        const device = devices.find(d => d.deviceId === deviceId);

        if (!device) {
            this.logger.warn(`Device not found: ${deviceId}`);
            return null;
        }

        // Check if Chrome is installed
        try {
            const chromeInstalled = execSync(`adb -s ${deviceId} shell pm list packages | grep com.android.chrome`).toString().trim();
            if (!chromeInstalled) {
                this.logger.warn('Chrome not installed on device');
                return null;
            }
        } catch (error) {
            this.logger.warn('Failed to check Chrome installation:', error);
            return null;
        }

        return device;
    }

    async getDeviceCapabilities(deviceId: string): Promise<BrowserCapabilities> {
        const device = await this.validateDevice(deviceId);
        if (!device) {
            throw new Error(`Invalid device: ${deviceId}`);
        }

        return this.getCapabilities({
            mobile: {
                deviceId,
                deviceName: device.name,
                platformVersion: device.version
            }
        });
    }

    async validateInstallation(): Promise<boolean> {
        try {
            // Check if ADB is installed
            execSync('adb version');
            
            // Check if any devices are available
            const devices = await this.getDeviceInfo();
            if (devices.length === 0) {
                this.logger.error('No Android devices found');
                return false;
            }

            return true;
        } catch (error) {
            this.logger.error('Android Chrome validation failed:', error);
            return false;
        }
    }

    async getBinaryPath(): Promise<string> {
        return 'chrome'; // Android Chrome doesn't have a traditional binary path
    }

    getDefaultArgs(options: BrowserOptions = {}): string[] {
        const args = [
            '--no-first-run',
            '--no-default-browser-check',
            '--disable-extensions',
            '--disable-popup-blocking',
            '--disable-notifications'
        ];

        if (options.args) {
            args.push(...options.args);
        }

        return args;
    }
} 