import { Options } from '@wdio/types';
import type { LogLevel } from './logger.js';

export interface BrowserConfig {
    headless?: boolean;
    arguments?: string[];
    logLevel?: Options.WebdriverIO['logLevel'];
}

export interface ServerConfig {
    version: string;
    logLevel: LogLevel;
    browser: BrowserConfig;
    uploadsDir: string;
}

export class Config implements ServerConfig {
    version: string;
    logLevel: LogLevel;
    browser: BrowserConfig;
    uploadsDir: string;

    constructor(config: Partial<ServerConfig> = {}) {
        // Default configuration
        this.version = config.version || '1.0.0';
        this.logLevel = config.logLevel || 'info';
        this.uploadsDir = config.uploadsDir || 'uploads';
        
        // Default browser configuration
        this.browser = {
            headless: config.browser?.headless ?? true,
            arguments: config.browser?.arguments || ['--headless=new'],
            logLevel: config.browser?.logLevel || 'error'
        };
    }

    getBrowserOptions(): Options.WebdriverIO {
        return {
            logLevel: this.browser.logLevel,
            capabilities: {
                browserName: 'chrome',
                'goog:chromeOptions': {
                    args: this.browser.headless ? this.browser.arguments : []
                }
            }
        };
    }
} 