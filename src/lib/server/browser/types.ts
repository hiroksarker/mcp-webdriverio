import type { Browser } from 'webdriverio';
import type { Options } from '@wdio/types';

export type BrowserType = 
    | 'chrome' 
    | 'firefox' 
    | 'safari' 
    | 'edge'
    | 'ios_safari'  // iOS Safari
    | 'android_chrome';  // Android Chrome

export interface MobileOptions {
    deviceName?: string;  // e.g., 'iPhone 12', 'Pixel 6'
    platformVersion?: string;  // iOS/Android version
    udid?: string;  // Device UDID for iOS
    deviceId?: string;  // Device ID for Android
    orientation?: 'PORTRAIT' | 'LANDSCAPE';
    automationName?: 'XCUITest' | 'UiAutomator2';
    noReset?: boolean;  // Don't reset app state between sessions
    fullReset?: boolean;  // Reset app state and remove app
    app?: string;  // Path to .app (iOS) or .apk (Android)
    bundleId?: string;  // iOS bundle ID
    packageName?: string;  // Android package name
}

export interface BrowserOptions {
    headless?: boolean;
    version?: string;
    args?: string[];
    profile?: {
        id?: string;  // Use existing profile
        name?: string;  // Create new profile with name
        path?: string;  // Use profile from path
        exportPath?: string;  // Export profile after session
        reuse?: boolean;  // Whether to reuse the profile
    };
    mobile?: MobileOptions;  // Mobile-specific options
}

export interface BrowserCapabilities {
    browserName: string;
    capabilities: {
        browserName: string;
        platformName?: string;  // 'iOS' or 'Android'
        'appium:automationName'?: string;  // 'XCUITest' or 'UiAutomator2'
        'appium:deviceName'?: string;
        'appium:platformVersion'?: string;
        'appium:udid'?: string;
        'appium:deviceId'?: string;
        'appium:orientation'?: string;
        'appium:noReset'?: boolean;
        'appium:fullReset'?: boolean;
        'appium:app'?: string;
        'appium:bundleId'?: string;
        'appium:packageName'?: string;
        [key: string]: any;  // Allow other browser-specific capabilities
    };
    logLevel: Options.WebdriverIO['logLevel'];
    automationProtocol: Options.WebdriverIO['automationProtocol'];
}

export interface BrowserSession {
    id: string;
    browser: Browser;
    createdAt: Date;
}

export interface BrowserProfile {
    id: string;
    name: string;
    browserType: BrowserType;
    options: BrowserOptions;
    createdAt: Date;
    lastUsed: Date;
    metadata?: {
        description?: string;
        tags?: string[];
        [key: string]: any;
    };
}

export interface ProfileManager {
    createProfile(options: Omit<BrowserProfile, 'id' | 'createdAt' | 'lastUsed'>): Promise<BrowserProfile>;
    getProfile(id: string): Promise<BrowserProfile | null>;
    listProfiles(filter?: Partial<BrowserProfile>): Promise<BrowserProfile[]>;
    updateProfile(id: string, updates: Partial<BrowserProfile>): Promise<BrowserProfile>;
    deleteProfile(id: string): Promise<boolean>;
    exportProfile(id: string): Promise<string>;  // Returns path to exported profile
    importProfile(path: string): Promise<BrowserProfile>;
}

export interface BrowserManager {
    getCapabilities(options?: BrowserOptions): Promise<BrowserCapabilities>;
    validateInstallation(): Promise<boolean>;
    getBinaryPath(version?: string): Promise<string>;
    getDefaultArgs(options?: BrowserOptions): string[];
    getProfileManager(): ProfileManager;
    createProfile(options: Omit<BrowserProfile, 'id' | 'createdAt' | 'lastUsed'>): Promise<BrowserProfile>;
    getProfilePath(profileId: string): Promise<string>;
}

export type MobileDeviceType = 'ios' | 'android';

export interface MobileDevice {
    type: MobileDeviceType;
    name: string;
    version: string;
    udid?: string;
    deviceId?: string;
    isAvailable: boolean;
}

export interface MobileBrowserManager extends BrowserManager {
    getDeviceInfo(): Promise<MobileDevice[]>;
    validateDevice(deviceId: string): Promise<MobileDevice | null>;
    getDeviceCapabilities(deviceId: string): Promise<BrowserCapabilities>;
} 