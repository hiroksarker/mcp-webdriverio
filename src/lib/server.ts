#!/usr/bin/env node

import type { Browser } from 'webdriverio';
import type { Options } from '@wdio/types';
import { remote } from 'webdriverio';
import { z } from 'zod';
import { CustomEventEmitter } from './events.js';

// MCP Protocol Types
const CommandSchema = z.object({
    type: z.enum(['navigate', 'click', 'type', 'getText', 'getAttribute', 'waitForDisplayed']),
    selector: z.string(),
    value: z.string().optional(),
    timeout: z.number().optional()
});

type Command = z.infer<typeof CommandSchema>;

export class WebdriverioMCPServer extends CustomEventEmitter {
    private driver: Browser | null = null;
    private isConnected: boolean = false;

    constructor() {
        super();
        this.setupEventHandlers();
    }

    private setupEventHandlers() {
        this.on('command', this.handleCommand.bind(this));
        this.on('disconnect', this.cleanup.bind(this));
    }

    async connect(options: Options.WebdriverIO = {
        capabilities: {
            browserName: 'chrome'
        }
    }) {
        try {
            this.driver = await remote(options);
            this.isConnected = true;
            this.emit('connected');
            return true;
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
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
}

export default WebdriverioMCPServer;

// Export the MCPServer instance for testing
export const server = new WebdriverioMCPServer();