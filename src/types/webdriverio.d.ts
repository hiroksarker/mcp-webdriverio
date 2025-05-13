declare module './enhanced-webdriverio' {
    import { MCPServer } from '@modelcontextprotocol/sdk';
    import { Browser } from 'webdriverio';
    
    export interface SessionInfo {
        browser: Browser;
        id: string;
    }
    
    export interface EnhancedWebdriverIO {
        registerTools(): void;
    }
    
    export function startEnhancedWebdriverIO(server: MCPServer): Promise<EnhancedWebdriverIO>;
}

// Add type declarations for WebdriverIO methods
declare module 'webdriverio' {
    import { Browser, Element } from '@wdio/types';
    
    export type LocatorStrategy = 'id' | 'css' | 'xpath' | 'name' | 'tag' | 'class' | 'linkText' | 'partialLinkText' | 'shadow';
    
    export interface Browser {
        setupNetworkInterception(): Promise<void>;
        intercept(urlPattern: string, response: any): Promise<void>;
        compareScreenshots(screenshot: string, baseline: string, options?: any): Promise<any>;
        takeFullPageScreenshot(): Promise<string>;
        $(selector: string): Promise<Element>;
        $$(selector: string): Promise<Element[]>;
        url(url: string): Promise<void>;
        waitUntil(condition: () => Promise<boolean>, options?: { timeout?: number; timeoutMsg?: string }): Promise<void>;
        execute(script: string | ((...args: any[]) => any), ...args: any[]): Promise<any>;
        pause(ms: number): Promise<void>;
        getUrl(): Promise<string>;
        getTitle(): Promise<string>;
        deleteSession(): Promise<void>;
    }
    
    export interface Element {
        takeScreenshot(): Promise<string>;
        isDisplayed(): Promise<boolean>;
        waitForDisplayed(options?: { timeout?: number }): Promise<void>;
        scrollIntoView(options?: { behavior?: 'auto' | 'smooth'; block?: 'start' | 'center' | 'end' | 'nearest' }): Promise<void>;
    }
    
    export function remote(options: any): Promise<Browser>;
} 