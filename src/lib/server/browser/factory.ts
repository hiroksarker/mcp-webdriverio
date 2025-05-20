import { Logger } from '../logger.js';
import type { BrowserManager, BrowserOptions, BrowserCapabilities, BrowserType } from './types.js';
import { ChromeManager } from './chrome.js';
import { FirefoxManager } from './firefox.js';
import { EdgeManager } from './edge.js';
import { SafariManager } from './safari.js';
import { IOSSafariManager } from './ios-safari.js';
import { AndroidChromeManager } from './android-chrome.js';

export class BrowserFactory {
    private managers: Map<BrowserType, BrowserManager>;
    private logger: Logger;

    constructor(logger: Logger) {
        this.logger = logger;
        this.managers = new Map<BrowserType, BrowserManager>();
        
        // Initialize desktop browser managers
        this.managers.set('chrome', new ChromeManager(logger));
        this.managers.set('firefox', new FirefoxManager(logger));
        this.managers.set('edge', new EdgeManager(logger));
        this.managers.set('safari', new SafariManager(logger));

        // Initialize mobile browser managers
        this.managers.set('ios_safari', new IOSSafariManager(logger));
        this.managers.set('android_chrome', new AndroidChromeManager(logger));
    }

    async getCapabilities(browserType: BrowserType, options: BrowserOptions = {}): Promise<BrowserCapabilities> {
        const baseCapabilities = {
            browserName: browserType,
            'goog:chromeOptions': {
                args: ['--headless', '--disable-gpu', '--no-sandbox'],
                w3c: true
            },
            'moz:firefoxOptions': {
                args: ['-headless']
            },
            // Enable WebDriver Bidi protocol
            webSocketUrl: true,
            // Add Bidi-specific capabilities
            'webdriver.bidi.enabled': true,
            'webdriver.bidi.version': '1.0'
        };

        const manager = this.managers.get(browserType);
        if (!manager) {
            throw new Error(`Unsupported browser type: ${browserType}`);
        }
        return manager.getCapabilities(options);
    }

    async validateBrowser(browserType: BrowserType): Promise<boolean> {
        const manager = this.managers.get(browserType);
        if (!manager) {
            throw new Error(`Unsupported browser type: ${browserType}`);
        }
        return manager.validateInstallation();
    }

    getAvailableBrowsers(): BrowserType[] {
        return Array.from(this.managers.keys());
    }

    getManager(browserType: BrowserType): BrowserManager {
        const manager = this.managers.get(browserType);
        if (!manager) {
            throw new Error(`Unsupported browser type: ${browserType}`);
        }
        return manager;
    }
} 