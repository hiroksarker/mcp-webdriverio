#!/usr/bin/env node

import { remote, Browser } from 'webdriverio';
import type { Options } from '@wdio/types';
import { z } from 'zod';
import { CustomEventEmitter } from './events.js';
import type { TestRunnerOptions, BaseServer } from './test/types.js';
import { TestRunner } from './test/runner.js';
import { join } from 'path';
import type { BrowserType } from './server/browser/types.js';
import { BrowserFactory } from './server/browser/factory.js';
import { Logger } from './server/logger.js';
import type { CommandEvent } from './events.js';
import { promises as fs } from 'fs';
import { PNG } from 'pngjs';
import pixelmatch from 'pixelmatch';
import html2canvas from 'html2canvas';

// MCP Protocol Types
const CommandSchema = z.object({
    type: z.enum(['navigate', 'click', 'type', 'getText', 'getAttribute', 'waitForDisplayed']),
    selector: z.string(),
    value: z.string().optional(),
    timeout: z.number().optional()
});

type Command = z.infer<typeof CommandSchema>;

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

        default:
            throw new Error(`Unsupported browser: ${browserName}`);
    }
}

// Define visual regression service type
type VisualRegressionService = {
    baselineFolder: string;
    formatImageName: string;
    screenshotPath: string;
    savePerInstance: boolean;
    autoSaveBaseline: boolean;
};

// Extend WebdriverIO options to include services
interface ExtendedWebdriverIOOptions extends Options.WebdriverIO {
    services?: Array<[string, any]>;
}

export class WebdriverioMCPServer extends CustomEventEmitter implements BaseServer {
    private driver: Browser | null = null;
    private isConnected: boolean = false;
    private testRunner?: TestRunner;
    private browserFactory: BrowserFactory;
    private logger: Logger;
    private sessionId: string = '';
    private screenshotPath: string;
    private baselinePath: string;

    constructor() {
        super();
        this.logger = new Logger();
        this.browserFactory = new BrowserFactory(this.logger);
        this.screenshotPath = join(process.cwd(), './screenshots');
        this.baselinePath = join(this.screenshotPath, 'baseline');
        this.setupEventHandlers();
        this.ensureDirectories();
    }

    private async ensureDirectories() {
        await fs.mkdir(this.screenshotPath, { recursive: true });
        await fs.mkdir(this.baselinePath, { recursive: true });
    }

    private setupEventHandlers() {
        this.on('command', this.handleCommand.bind(this));
        this.on('disconnect', this.cleanup.bind(this));
    }

    private async getDefaultOptions(): Promise<ExtendedWebdriverIOOptions> {
        return {
            capabilities: await this.browserFactory.getCapabilities('chrome', { headless: true }),
        };
    }

    async saveScreenshot(name: string, baseline: boolean = false): Promise<string> {
        if (!this.driver) throw new Error('Browser not connected');
        
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `${name}-${timestamp}.png`;
        const path = join(baseline ? this.baselinePath : this.screenshotPath, filename);
        
        // Inject html2canvas into the page
        await this.driver.execute(() => {
            return new Promise<void>((resolve, reject) => {
                if ((window as any).html2canvas) {
                    resolve();
                    return;
                }
                
                const script = document.createElement('script');
                script.src = 'https://html2canvas.hertzen.com/dist/html2canvas.min.js';
                script.onload = () => resolve();
                script.onerror = () => reject(new Error('Failed to load html2canvas'));
                document.head.appendChild(script);
            });
        });
        
        // Take screenshot using html2canvas
        const screenshot = await this.driver.execute(() => {
            return new Promise<string>((resolve, reject) => {
                const html2canvas = (window as any).html2canvas;
                if (!html2canvas) {
                    reject(new Error('html2canvas not loaded'));
                    return;
                }
                
                // Hide ads before taking screenshot
                const ads = document.querySelectorAll('.ads');
                ads.forEach((ad: Element) => {
                    (ad as HTMLElement).style.display = 'none';
                });
                
                html2canvas(document.body, {
                    useCORS: true,
                    allowTaint: true,
                    logging: false,
                    background: '#ffffff',
                    width: window.innerWidth,
                    height: window.innerHeight
                }).then((canvas: HTMLCanvasElement) => {
                    resolve(canvas.toDataURL('image/png').split(',')[1]);
                }).catch(reject);
            });
        });
        
        await fs.writeFile(path, screenshot, 'base64');
        return path;
    }

    async compareScreenshots(name: string, tolerance: number = 0.1): Promise<{ 
        match: boolean; 
        diffPercentage: number;
        diffPath?: string;
    }> {
        const baselinePath = join(this.baselinePath, `${name}.png`);
        const screenshotPath = join(this.screenshotPath, `${name}.png`);
        
        // Check if baseline exists
        try {
            await fs.access(baselinePath);
        } catch {
            // If baseline doesn't exist, save current screenshot as baseline
            await this.saveScreenshot(name, true);
            return { match: true, diffPercentage: 0 };
        }
        
        // Read both images
        const baseline = PNG.sync.read(await fs.readFile(baselinePath));
        const screenshot = PNG.sync.read(await fs.readFile(screenshotPath));
        
        // Create diff image
        const { width, height } = baseline;
        const diff = new PNG({ width, height });
        
        // Compare images
        const diffPixels = pixelmatch(
            baseline.data,
            screenshot.data,
            diff.data,
            width,
            height,
            {
                threshold: tolerance,
                includeAA: true,
                alpha: 0.5,
                diffColor: [255, 0, 0],
                diffColorAlt: [0, 0, 255]
            }
        );
        
        const diffPercentage = (diffPixels / (width * height)) * 100;
        const match = diffPercentage <= tolerance * 100;
        
        // Save diff image if there's a mismatch
        let diffPath: string | undefined;
        if (!match) {
            diffPath = join(this.screenshotPath, `${name}-diff.png`);
            await fs.writeFile(diffPath, PNG.sync.write(diff));
        }
        
        return { match, diffPercentage, diffPath };
    }

    async connect(options?: ExtendedWebdriverIOOptions) {
        try {
            const defaultOptions = await this.getDefaultOptions();
            this.driver = await remote(options || defaultOptions);
            this.isConnected = true;
            this.sessionId = `session_${Date.now()}`; // Generate a unique session ID
            this.emit('connected');
            return true;
        } catch (error: unknown) {
            console.error('WebdriverIO connect error:', error);
            const errorMessage = error instanceof Error ? error.message : String(error);
            this.emit('error', `Failed to connect: ${errorMessage}`);
            return false;
        }
    }

    private async handleCommand(command: CommandEvent['command']) {
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
                    await element.waitForDisplayed({ timeout: command.timeout || 5000 });
                    break;
                    
                default:
                    throw new Error(`Unsupported command type: ${command.type}`);
            }
            
            this.emit('commandComplete', { success: true });
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            this.emit('commandComplete', { success: false, error: errorMessage });
            throw error;
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

    async createSession(options: { browserName: BrowserType; headless?: boolean }): Promise<string> {
        if (!this.isBrowserSupported(options.browserName)) {
            throw new Error(`Unsupported browser: ${options.browserName}`);
        }

        const capabilities = await this.browserFactory.getCapabilities(options.browserName, {
            headless: options.headless ?? true
        });

        if (!this.driver) {
            await this.connect({ capabilities });
        }

        return this.sessionId;
    }

    async closeSession(sessionId: string): Promise<void> {
        if (!this.driver) return;
        await this.driver.deleteSession();
    }

    getSupportedBrowsers(): BrowserType[] {
        return this.browserFactory.getAvailableBrowsers();
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