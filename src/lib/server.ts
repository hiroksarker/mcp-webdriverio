#!/usr/bin/env node

import type { Browser } from 'webdriverio';
import type { Options } from '@wdio/types';
import { remote } from 'webdriverio';
import { z } from 'zod';
import { CustomEventEmitter } from './events.js';
import type { BaseServer, TestRunnerOptions } from './types.js';
import { TestRunner } from './test/runner.js';

// MCP Protocol Types
const CommandSchema = z.object({
    type: z.enum(['navigate', 'click', 'type', 'getText', 'getAttribute', 'waitForDisplayed']),
    selector: z.string(),
    value: z.string().optional(),
    timeout: z.number().optional()
});

type Command = z.infer<typeof CommandSchema>;

type BrowserType = 'chrome' | 'firefox' | 'safari' | 'edge' | 'opera';

interface BrowserOptions {
    headless?: boolean;
    args?: string[];
}

export function buildCapabilities(browserName: BrowserType, options: BrowserOptions = {}) {
    const { headless = true, args = [] } = options;

    switch (browserName) {
        case 'chrome':
            return {
                browserName: 'chrome',
                'goog:chromeOptions': {
                    args: [
                        ...(headless ? ['--headless=new', '--disable-gpu'] : []),
                        '--no-sandbox',
                        '--disable-dev-shm-usage',
                        ...args
                    ]
                }
            };

        case 'firefox':
            return {
                browserName: 'firefox',
                'moz:firefoxOptions': {
                    args: [
                        ...(headless ? ['-headless'] : []),
                        ...args
                    ]
                }
            };

        case 'safari':
            return {
                browserName: 'safari',
                'safari:options': {
                    automatic: headless,
                    ...args.length ? { args } : {}
                }
            };

        case 'edge':
            return {
                browserName: 'MicrosoftEdge',
                'ms:edgeOptions': {
                    args: [
                        ...(headless ? ['--headless'] : []),
                        '--disable-gpu',
                        ...args
                    ]
                }
            };

        case 'opera':
            return {
                browserName: 'opera',
                'opera:options': {
                    args: [
                        ...(headless ? ['--headless'] : []),
                        '--disable-gpu',
                        ...args
                    ]
                }
            };

        default:
            throw new Error(`Unsupported browser: ${browserName}`);
    }
}

export class WebdriverioMCPServer extends CustomEventEmitter implements BaseServer {
    private driver: Browser | null = null;
    private isConnected: boolean = false;
    private testRunner?: TestRunner;

    constructor() {
        super();
        this.setupEventHandlers();
    }

    private setupEventHandlers() {
        this.on('command', this.handleCommand.bind(this));
        this.on('disconnect', this.cleanup.bind(this));
    }

    async connect(options: Options.WebdriverIO = {
        capabilities: buildCapabilities('chrome', { headless: true })
    }) {
        try {
            this.driver = await remote(options);
            this.isConnected = true;
            this.emit('connected');
            return true;
        } catch (error: unknown) {
            console.error('WebdriverIO connect error:', error);
            const errorMessage = error instanceof Error ? error.message : String(error);
            this.emit('error', `Failed to connect: ${errorMessage}`);
            return false;
        }
    }

    private async handleCommand(command: Command) {
        if (!this.driver || !this.isConnected) {
            throw new Error('Browser not connected');
        }

        try {
            const element = await this.driver.$(command.selector);
            
            switch (command.type) {
                case 'navigate':
                    await this.driver.url(command.value || '');
                    break;
                    
                case 'click':
                    await element.click();
                    break;
                    
                case 'type':
                    if (!command.value) throw new Error('Value required for type command');
                    await element.setValue(command.value);
                    break;
                    
                case 'getText':
                    const text = await element.getText();
                    this.emit('result', { type: 'text', value: text });
                    break;
                    
                case 'getAttribute':
                    if (!command.value) throw new Error('Attribute name required');
                    const attr = await element.getAttribute(command.value);
                    this.emit('result', { type: 'attribute', value: attr });
                    break;
                    
                case 'waitForDisplayed':
                    await element.waitForDisplayed({ 
                        timeout: command.timeout || 5000,
                        timeoutMsg: `Element ${command.selector} not displayed after ${command.timeout || 5000}ms`
                    });
                    break;
                    
                default:
                    throw new Error(`Unknown command type: ${command.type}`);
            }
            
            this.emit('commandComplete', { success: true });
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            this.emit('error', `Command failed: ${errorMessage}`);
            this.emit('commandComplete', { 
                success: false, 
                error: errorMessage 
            });
        }
    }

    async getAccessibilityTree() {
        if (!this.driver || !this.isConnected) {
            throw new Error('Browser not connected');
        }

        try {
            // Execute JavaScript to get accessibility tree
            const tree = await this.driver.execute(() => {
                const getAccessibilityTree = (element: Element): any => {
                    const role = element.getAttribute('role') || element.tagName.toLowerCase();
                    const name = element.getAttribute('aria-label') || 
                                element.getAttribute('title') || 
                                element.textContent?.trim();
                    
                    const children = Array.from(element.children).map(getAccessibilityTree);
                    
                    return {
                        role,
                        name,
                        children: children.length ? children : undefined
                    };
                };
                
                return getAccessibilityTree(document.body);
            });

            this.emit('accessibilityTree', tree);
            return tree;
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            this.emit('error', `Failed to get accessibility tree: ${errorMessage}`);
            throw error;
        }
    }

    private async cleanup() {
        if (this.driver) {
            try {
                await this.driver.deleteSession();
            } catch (error) {
                console.error('Error during cleanup:', error);
            }
        }
        this.driver = null;
        this.isConnected = false;
    }

    getTestRunner(options?: TestRunnerOptions): TestRunner {
        if (!this.testRunner) {
            this.testRunner = new TestRunner(this, options);
        }
        return this.testRunner;
    }

    async disconnect(): Promise<void> {
        await this.cleanup();
    }

    async executeCommand(command: { type: string; selector: string; value?: string }) {
        if (!this.driver) throw new Error('Browser not connected');
        
        const element = await this.driver.$(command.selector);
        switch (command.type) {
            case 'type':
                await element.setValue(command.value || '');
                break;
            case 'click':
                await element.click();
                break;
            case 'getText':
                return await element.getText();
        }
    }

    isBrowserConnected(): boolean {
        return this.isConnected;
    }

    async createSession(options: { browserName: string; headless?: boolean }): Promise<string> {
        if (!this.driver) throw new Error('Browser not connected');
        // WebdriverIO doesn't need to create a new session, it's already in one
        // Just return a unique identifier for this session
        return `session_${Date.now()}`;
    }

    async closeSession(sessionId: string): Promise<void> {
        if (!this.driver) return;
        await this.driver.deleteSession();
    }

    getSupportedBrowsers(): BrowserType[] {
        return ['chrome', 'firefox', 'safari', 'edge', 'opera'];
    }

    isBrowserSupported(browserName: string): browserName is BrowserType {
        return this.getSupportedBrowsers().includes(browserName as BrowserType);
    }

    public getDriver() {
        if (!this.driver) throw new Error('WebdriverIO driver not initialized');
        return this.driver;
    }
}

export default WebdriverioMCPServer;

// Export the MCPServer instance for testing
export const server = new WebdriverioMCPServer();