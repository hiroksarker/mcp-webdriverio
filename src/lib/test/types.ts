import type { Browser } from 'webdriverio';
import type { BrowserType } from '../server/browser/types.js';

export interface TestRunnerOptions {
    maxWorkers?: number;
    defaultRetries?: number;
    defaultTimeout?: number;
    defaultPriority?: number;
    browserOptions?: {
        headless?: boolean;
        defaultBrowser?: 'chrome' | 'firefox' | 'safari';
    };
}

export interface TestConfig {
    spec: string;
    retries?: number;
    priority?: number;
    timeout?: number;
    browserName?: string;
    headless?: boolean;
}

export interface TestResult {
    spec: string;
    passed: boolean;
    duration: number;
    error?: string;
    retries?: number;
    browserInfo?: {
        name: string;
        version: string;
    };
}

export interface BaseServer {
    connect(options?: any): Promise<boolean>;
    disconnect(): Promise<void>;
    executeCommand(command: { type: string; selector: string; value?: string }): Promise<any>;
    isBrowserConnected(): boolean;
    createSession(options: { browserName: BrowserType; headless?: boolean }): Promise<string>;
    closeSession(sessionId: string): Promise<void>;
    getSupportedBrowsers(): BrowserType[];
    isBrowserSupported(browserName: string): browserName is BrowserType;
    getDriver(): Browser;
    getTestRunner(options?: TestRunnerOptions): any;

    // Visual regression methods
    saveScreenshot(name: string, baseline?: boolean): Promise<string>;
    compareScreenshots(name: string, tolerance?: number): Promise<{
        match: boolean;
        diffPercentage: number;
        diffPath?: string;
    }>;
}
