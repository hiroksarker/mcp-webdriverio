#!/usr/bin/env node

import { MCPServer } from '@modelcontextprotocol/sdk';
import { ResourceTemplate } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { remote } from 'webdriverio';
import fs from 'fs/promises';
import type { Options } from '@wdio/types';
import type { LocatorStrategy, Browser, Element } from 'webdriverio';

// Type definitions for tool parameters
interface LocatorParams {
    by: LocatorStrategy;
    value: string;
    timeout?: number;
    frame?: string;
    shadow?: string;
}

interface ElementParams extends LocatorParams {
    text?: string;
}

interface ToolParams {
    params: LocatorParams | ElementParams;
}

// Initialize MCP Server with supported options
const server = new MCPServer({
    name: "MCP WebdriverIO Server",
    version: "1.0.0"
});

// Define types for state management
interface SessionInfo {
    browser: Awaited<ReturnType<typeof remote>>;
    id: string;
}

interface BrowserOptions {
    headless?: boolean;
    arguments?: string[];
}

// Default browser options
const defaultBrowserOptions: Options.WebdriverIO = {
    logLevel: 'error',
    capabilities: {
        browserName: 'chrome',
        'goog:chromeOptions': {
            args: ['--headless=new']
        }
    }
};

// Server state
const state: {
    drivers: Map<string, SessionInfo>;
    currentSession: string | null;
} = {
    drivers: new Map<string, SessionInfo>(),
    currentSession: null
};

// Helper functions
const getDriver = (): SessionInfo => {
    if (!state.currentSession) {
        throw new Error('No active browser session');
    }
    
    const driver = state.drivers.get(state.currentSession);
    if (!driver) {
        throw new Error('No active browser session found');
    }
    
    return driver;
};

// Locator strategies
const getSelector = (by: LocatorStrategy, value: string): string => {
    switch (by.toLowerCase() as LocatorStrategy) {
        case 'id': return `#${value}`;
        case 'css': return value;
        case 'xpath': return value;
        case 'name': return `[name="${value}"]`;
        case 'tag': return value;
        case 'class': return `.${value}`;
        case 'linkText': return `//a[text()="${value}"]`;
        case 'partialLinkText': return `//a[contains(text(), "${value}")]`;
        case 'shadow': return value;
        default: throw new Error(`Unsupported locator strategy: ${by}`);
    }
};

// Common schemas
const browserOptionsSchema = z.object({
    headless: z.boolean().optional().describe("Run browser in headless mode"),
    arguments: z.array(z.string()).optional().describe("Additional browser arguments")
}).optional();

const locatorSchema = {
    by: z.enum(["id", "css", "xpath", "name", "tag", "class", "linkText", "partialLinkText", "shadow"]).describe("Locator strategy to find element"),
    value: z.string().describe("Value for the locator strategy"),
    timeout: z.number().optional().describe("Maximum time to wait for element in milliseconds")
};

// Define common parameter types
interface LocatorWithTextParams extends LocatorParams {
    text: string;
}

interface DragAndDropParams extends LocatorParams {
    targetBy: LocatorStrategy;
    targetValue: string;
}

interface FileUploadParams extends LocatorParams {
    filePath: string;
}

// Browser Management Tools
server.tool(
    "start_browser",
    "launches browser",
    {
        browser: z.enum(["chrome", "firefox"]).describe("Browser to launch (chrome or firefox)"),
        options: browserOptionsSchema
    },
    async ({ browser, options = {} }: { browser: 'chrome' | 'firefox', options?: BrowserOptions }) => {
        try {
            const browserOptions: Options.WebdriverIO = {
                logLevel: 'error',
                capabilities: {}
            };

            // Configure browser options
            if (browser === 'chrome') {
                browserOptions.capabilities = {
                    browserName: 'chrome',
                    'goog:chromeOptions': {
                        args: []
                    }
                };
                
                if (options?.headless) {
                    (browserOptions.capabilities['goog:chromeOptions'] as any).args.push('--headless=new');
                }
                
                if (options?.arguments) {
                    (browserOptions.capabilities['goog:chromeOptions'] as any).args.push(...options.arguments);
                }
            } else {
                browserOptions.capabilities = {
                    browserName: 'firefox',
                    'moz:firefoxOptions': {
                        args: []
                    }
                };
                
                if (options?.headless) {
                    (browserOptions.capabilities['moz:firefoxOptions'] as any).args.push('--headless');
                }
                
                if (options?.arguments) {
                    (browserOptions.capabilities['moz:firefoxOptions'] as any).args.push(...options.arguments);
                }
            }

            const driver = await remote(browserOptions);
            const sessionId = `${browser}_${Date.now()}`;
            
            state.drivers.set(sessionId, {
                browser: driver,
                id: sessionId
            });
            
            state.currentSession = sessionId;

            return {
                content: [{ type: 'text', text: `Browser started with session_id: ${sessionId}` }]
            };
        } catch (e: any) {
            return {
                content: [{ type: 'text', text: `Error starting browser: ${e.message}` }]
            };
        }
    }
);

server.tool(
    "navigate",
    "navigates to a URL",
    {
        url: z.string().describe("URL to navigate to")
    },
    async ({ url }: { url: string }) => {
        try {
            const { browser } = getDriver();
            await browser.url(url);
            return {
                content: [{ type: 'text', text: `Navigated to ${url}` }]
            };
        } catch (e: any) {
            return {
                content: [{ type: 'text', text: `Error navigating: ${e.message}` }]
            };
        }
    }
);

// Element Interaction Tools
server.tool(
    "find_element",
    "finds an element using the specified locator strategy",
    {
        by: z.enum(["id", "css", "xpath", "name", "tag", "class", "linkText", "partialLinkText", "shadow"] as const),
        value: z.string(),
        timeout: z.number().optional()
    },
    async ({ by, value, timeout = 10000 }: LocatorParams) => {
        try {
            const { browser } = getDriver();
            const element = await browser.$(value);
            await element.waitForDisplayed({ timeout });
            return {
                content: [{ type: 'text', text: `Found element with ${by}: ${value}` }]
            };
        } catch (e: any) {
            return {
                content: [{ type: 'text', text: `Error finding element: ${e.message}` }]
            };
        }
    }
);

server.tool(
    "click_element",
    "clicks an element",
    locatorSchema,
    async ({ by, value, timeout = 10000 }: LocatorParams) => {
        try {
            const { browser } = getDriver();
            const selector = getSelector(by, value);
            const element = await browser.$(selector);
            await element.waitForDisplayed({ timeout });
            await element.click();
            return {
                content: [{ type: 'text', text: `Clicked element with ${by}: ${value}` }]
            };
        } catch (e: any) {
            return {
                content: [{ type: 'text', text: `Error clicking element: ${e.message}` }]
            };
        }
    }
);

server.tool(
    "type_text",
    "types text into an element",
    {
        ...locatorSchema,
        text: z.string().describe("Text to type into the element")
    },
    async (params: { by: LocatorStrategy; value: string; text: string; timeout?: number }) => {
        const { by, value, text, timeout = 10000 } = params;
        try {
            const { browser } = getDriver();
            const selector = getSelector(by, value);
            const element = await browser.$(selector);
            await element.waitForDisplayed({ timeout });
            await element.setValue(text);
            return {
                content: [{ type: 'text', text: `Typed text into element with ${by}: ${value}` }]
            };
        } catch (e: any) {
            return {
                content: [{ type: 'text', text: `Error typing text: ${e.message}` }]
            };
        }
    }
);

server.tool(
    "send_keys",
    "sends keys to an element",
    {
        ...locatorSchema,
        text: z.string().describe("Text to enter into the element")
    },
    async ({ by, value, text, timeout = 10000 }: { by: LocatorStrategy; value: string; text: string; timeout?: number }) => {
        try {
            const { browser } = getDriver();
            const selector = getSelector(by, value);
            const element = await browser.$(selector);
            await element.waitForDisplayed({ timeout });
            await element.setValue(text);
            return {
                content: [{ type: 'text', text: `Text entered into element with ${by}: ${value}` }]
            };
        } catch (e: any) {
            return {
                content: [{ type: 'text', text: `Error entering text: ${e.message}` }]
            };
        }
    }
);

server.tool(
    "get_element_text",
    "gets the text() of an element",
    {
        ...locatorSchema
    },
    async ({ by, value, timeout = 10000 }: LocatorParams) => {
        try {
            const { browser } = getDriver();
            const selector = getSelector(by as LocatorStrategy, value);
            
            // For XPath selectors, use the $ with xpath= prefix
            const element = by === 'xpath' 
                ? await browser.$(`xpath=${value}`)
                : await browser.$(selector);
                
            await element.waitForExist({ timeout });
            const text = await element.getText();
            
            return {
                content: [{ type: 'text', text }]
            };
        } catch (e: any) {
            return {
                content: [{ type: 'text', text: `Error getting element text: ${e.message}` }]
            };
        }
    }
);

server.tool(
    "hover",
    "moves the mouse to hover over an element",
    {
        ...locatorSchema
    },
    async ({ by, value, timeout = 10000 }: LocatorParams) => {
        try {
            const { browser } = getDriver();
            const selector = getSelector(by as LocatorStrategy, value);
            
            // For XPath selectors, use the $ with xpath= prefix
            const element = by === 'xpath' 
                ? await browser.$(`xpath=${value}`)
                : await browser.$(selector);
                
            await element.waitForExist({ timeout });
            await element.moveTo();
            
            return {
                content: [{ type: 'text', text: 'Hovered over element' }]
            };
        } catch (e: any) {
            return {
                content: [{ type: 'text', text: `Error hovering over element: ${e.message}` }]
            };
        }
    }
);

server.tool(
    "drag_and_drop",
    "drags an element and drops it onto another element",
    {
        ...locatorSchema,
        targetBy: z.enum(["id", "css", "xpath", "name", "tag", "class"]).describe("Locator strategy for target element"),
        targetValue: z.string().describe("Value for target locator strategy")
    },
    async (params: { by: LocatorStrategy; value: string; targetBy: LocatorStrategy; targetValue: string; timeout?: number }) => {
        const { by, value, targetBy, targetValue, timeout = 10000 } = params;
        try {
            const { browser } = getDriver();
            const sourceSelector = getSelector(by, value);
            const targetSelector = getSelector(targetBy, targetValue);
            
            const sourceElement = await browser.$(sourceSelector);
            const targetElement = await browser.$(targetSelector);
            
            await sourceElement.waitForDisplayed({ timeout });
            await targetElement.waitForDisplayed({ timeout });
            
            await sourceElement.dragAndDrop(targetElement);
            return {
                content: [{ type: 'text', text: `Dragged element ${value} to ${targetValue}` }]
            };
        } catch (e: any) {
            return {
                content: [{ type: 'text', text: `Error in drag and drop: ${e.message}` }]
            };
        }
    }
);

server.tool(
    "double_click",
    "performs a double click on an element",
    {
        ...locatorSchema
    },
    async ({ by, value, timeout = 10000 }: LocatorParams) => {
        try {
            const { browser } = getDriver();
            const selector = getSelector(by as LocatorStrategy, value);
            
            // For XPath selectors, use the $ with xpath= prefix
            const element = by === 'xpath' 
                ? await browser.$(`xpath=${value}`)
                : await browser.$(selector);
                
            await element.waitForExist({ timeout });
            await element.doubleClick();
            
            return {
                content: [{ type: 'text', text: 'Double click performed' }]
            };
        } catch (e: any) {
            return {
                content: [{ type: 'text', text: `Error performing double click: ${e.message}` }]
            };
        }
    }
);

server.tool(
    "right_click",
    "performs a right click (context click) on an element",
    {
        ...locatorSchema
    },
    async ({ by, value, timeout = 10000 }: LocatorParams) => {
        try {
            const { browser } = getDriver();
            const selector = getSelector(by as LocatorStrategy, value);
            
            // For XPath selectors, use the $ with xpath= prefix
            const element = by === 'xpath' 
                ? await browser.$(`xpath=${value}`)
                : await browser.$(selector);
                
            await element.waitForExist({ timeout });
            await element.click({ button: 'right' });
            
            return {
                content: [{ type: 'text', text: 'Right click performed' }]
            };
        } catch (e: any) {
            return {
                content: [{ type: 'text', text: `Error performing right click: ${e.message}` }]
            };
        }
    }
);

server.tool(
    "press_key",
    "presses a key",
    {
        key: z.string().describe("Key to press (e.g., 'Enter', 'Tab', 'Escape')")
    },
    async ({ key }: { key: string }) => {
        try {
            const { browser } = getDriver();
            await browser.keys(key);
            return {
                content: [{ type: 'text', text: `Pressed key: ${key}` }]
            };
        } catch (e: any) {
            return {
                content: [{ type: 'text', text: `Error pressing key: ${e.message}` }]
            };
        }
    }
);

server.tool(
    "upload_file",
    "uploads a file using a file input element",
    {
        ...locatorSchema,
        filePath: z.string().describe("Path to the file to upload")
    },
    async (params: { by: LocatorStrategy; value: string; filePath: string; timeout?: number }) => {
        const { by, value, filePath, timeout = 10000 } = params;
        try {
            const { browser } = getDriver();
            const selector = getSelector(by, value);
            const element = await browser.$(selector);
            await element.waitForDisplayed({ timeout });
            
            const absolutePath = await fs.realpath(filePath);
            await element.setValue(absolutePath);
            
            return {
                content: [{ type: 'text', text: `Uploaded file: ${filePath}` }]
            };
        } catch (e: any) {
            return {
                content: [{ type: 'text', text: `Error uploading file: ${e.message}` }]
            };
        }
    }
);

server.tool(
    "take_screenshot",
    "captures a screenshot of the current page",
    {
        outputPath: z.string().optional().describe("Optional path where to save the screenshot. If not provided, returns base64 data.")
    },
    async ({ outputPath }: { outputPath?: string }) => {
        try {
            const { browser } = getDriver();
            const screenshot = await browser.takeScreenshot();
            
            if (outputPath) {
                await fs.writeFile(outputPath, Buffer.from(screenshot, 'base64'));
                return {
                    content: [{ type: 'text', text: `Screenshot saved to ${outputPath}` }]
                };
            } else {
                return {
                    content: [
                        { type: 'text', text: 'Screenshot captured as base64:' },
                        { type: 'text', text: screenshot }
                    ]
                };
            }
        } catch (e: any) {
            return {
                content: [{ type: 'text', text: `Error taking screenshot: ${e.message}` }]
            };
        }
    }
);

server.tool(
    "close_session",
    "closes the current browser session",
    {},
    async () => {
        try {
            if (!state.currentSession) {
                return {
                    content: [{ type: 'text', text: 'No active browser session to close' }]
                };
            }
            
            const { browser, id } = getDriver();
            await browser.deleteSession();
            
            state.drivers.delete(state.currentSession);
            const sessionId = state.currentSession;
            state.currentSession = null;
            
            return {
                content: [{ type: 'text', text: `Browser session ${sessionId} closed` }]
            };
        } catch (e: any) {
            return {
                content: [{ type: 'text', text: `Error closing session: ${e.message}` }]
            };
        }
    }
);

server.tool(
    "get_text",
    "gets text from an element",
    locatorSchema,
    async ({ by, value, timeout = 10000 }: LocatorParams) => {
        try {
            const { browser } = getDriver();
            const selector = getSelector(by, value);
            const element = await browser.$(selector);
            await element.waitForDisplayed({ timeout });
            const text = await element.getText();
            return {
                content: [{ type: 'text', text }]
            };
        } catch (e: any) {
            return {
                content: [{ type: 'text', text: `Error getting text: ${e.message}` }]
            };
        }
    }
);

server.tool(
    "get_attribute",
    "gets an attribute value from an element",
    {
        ...locatorSchema,
        attribute: z.string().describe("Name of the attribute to get")
    },
    async (params: { by: LocatorStrategy; value: string; attribute: string; timeout?: number }) => {
        const { by, value, attribute, timeout = 10000 } = params;
        try {
            const { browser } = getDriver();
            const selector = getSelector(by, value);
            const element = await browser.$(selector);
            await element.waitForDisplayed({ timeout });
            const attrValue = await element.getAttribute(attribute);
            return {
                content: [{ type: 'text', text: attrValue || '' }]
            };
        } catch (e: any) {
            return {
                content: [{ type: 'text', text: `Error getting attribute: ${e.message}` }]
            };
        }
    }
);

server.tool(
    "is_displayed",
    "checks if an element is displayed",
    locatorSchema,
    async ({ by, value, timeout = 10000 }: LocatorParams) => {
        try {
            const { browser } = getDriver();
            const selector = getSelector(by, value);
            const element = await browser.$(selector);
            const isDisplayed = await element.isDisplayed();
            return {
                content: [{ type: 'text', text: isDisplayed.toString() }]
            };
        } catch (e: any) {
            return {
                content: [{ type: 'text', text: `Error checking display: ${e.message}` }]
            };
        }
    }
);

server.tool(
    "is_enabled",
    "checks if an element is enabled",
    locatorSchema,
    async ({ by, value, timeout = 10000 }: LocatorParams) => {
        try {
            const { browser } = getDriver();
            const selector = getSelector(by, value);
            const element = await browser.$(selector);
            const isEnabled = await element.isEnabled();
            return {
                content: [{ type: 'text', text: isEnabled.toString() }]
            };
        } catch (e: any) {
            return {
                content: [{ type: 'text', text: `Error checking enabled state: ${e.message}` }]
            };
        }
    }
);

server.tool(
    "clear_text",
    "clears text from an input element",
    locatorSchema,
    async ({ by, value, timeout = 10000 }: LocatorParams) => {
        try {
            const { browser } = getDriver();
            const selector = getSelector(by, value);
            const element = await browser.$(selector);
            await element.waitForDisplayed({ timeout });
            await element.clearValue();
            return {
                content: [{ type: 'text', text: `Cleared text from element with ${by}: ${value}` }]
            };
        } catch (e: any) {
            return {
                content: [{ type: 'text', text: `Error clearing text: ${e.message}` }]
            };
        }
    }
);

server.tool(
    "wait_for_element",
    "waits for an element to be displayed",
    locatorSchema,
    async ({ by, value, timeout = 10000 }: LocatorParams) => {
        try {
            const { browser } = getDriver();
            const selector = getSelector(by, value);
            const element = await browser.$(selector);
            await element.waitForDisplayed({ timeout });
            return {
                content: [{ type: 'text', text: `Element with ${by}: ${value} is displayed` }]
            };
        } catch (e: any) {
            return {
                content: [{ type: 'text', text: `Error waiting for element: ${e.message}` }]
            };
        }
    }
);

// Resources
server.resource(
    "browser-status",
    new ResourceTemplate("browser-status://current", { list: undefined }),
    async (uri: URL) => ({
        contents: [{
            uri: uri.href,
            text: state.currentSession 
                ? `Active browser session: ${state.currentSession}`
                : "No active browser session"
        }]
    })
);

// Cleanup handler
async function cleanup() {
    for (const [sessionId, { browser }] of state.drivers) {
        try {
            await browser.deleteSession();
        } catch (e) {
            console.error(`Error closing browser session ${sessionId}:`, e);
        }
    }
    state.drivers.clear();
    state.currentSession = null;
    process.exit(0);
}

process.on('SIGTERM', cleanup);
process.on('SIGINT', cleanup);

// Start the enhanced WebdriverIO implementation
async function startServer() {
    try {
        // Initialize browser with default options
        const browser = await remote(defaultBrowserOptions);
        
        // Start the server
        const transport = await server.listen();
        console.log('MCP WebdriverIO Server started successfully');
        console.log('Transport:', transport);
        
        return server;
    } catch (error) {
        console.error('Failed to start MCP WebdriverIO Server:', error);
        process.exit(1);
    }
}

// Export for testing
export { server, startServer };

// Start the server if this file is run directly
if (require.main === module) {
    startServer().catch(console.error);
}