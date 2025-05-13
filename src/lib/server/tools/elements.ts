import { MCPServer } from '../../mcp-server.js';
import { Logger } from '../logger.js';
import { SessionManager } from '../session.js';
import type { Element } from 'webdriverio';

type ExtendedLocatorStrategy = 
    | 'css selector'
    | 'xpath'
    | 'id'
    | 'name'
    | 'tag name'
    | 'class name';

function getSelector(by: ExtendedLocatorStrategy, value: string): string {
    switch (by) {
        case 'css selector':
            return value;
        case 'xpath':
            return `//${value}`;
        case 'id':
            return `#${value}`;
        case 'name':
            return `[name="${value}"]`;
        case 'tag name':
            return `<${value}>`;
        case 'class name':
            return `.${value}`;
        default:
            throw new Error(`Unsupported locator strategy: ${by}`);
    }
}

export function registerElementTools(
    server: MCPServer,
    logger: Logger,
    sessionManager: SessionManager
) {
    server.registerTool({
        name: 'find_element',
        description: 'Find a single element using various locator strategies',
        run: async (params: { 
            sessionId: string; 
            by: ExtendedLocatorStrategy; 
            value: string; 
            timeout?: number; 
            url?: string 
        }) => {
            const session = sessionManager.getSession(params.sessionId);
            if (!session) {
                throw new Error(`No browser session found with ID: ${params.sessionId}`);
            }

            const browser = session.browser;
            logger.debug('Finding element:', { by: params.by, value: params.value });

            // Navigate to the page if URL is provided
            if (params.url) {
                await browser.url(params.url);
            }

            const selector = getSelector(params.by, params.value);
            let element = await browser.$(selector);

            if (!element || !(await element.isExisting())) {
                if (params.timeout) {
                    logger.debug('Element not found, waiting with timeout:', { timeout: params.timeout });
                    await new Promise(resolve => setTimeout(resolve, params.timeout));
                    element = await browser.$(selector);
                    if (!element || !(await element.isExisting())) {
                        throw new Error(`timeout: Element not found with ${params.by}="${params.value}"`);
                    }
                } else {
                    throw new Error(`Element not found with ${params.by}="${params.value}"`);
                }
            }

            logger.debug('Element found successfully');
            return element;
        }
    });

    server.registerTool({
        name: 'find_elements',
        description: 'Find multiple elements using various locator strategies',
        run: async (params: { 
            sessionId: string; 
            by: ExtendedLocatorStrategy; 
            value: string; 
            url?: string 
        }) => {
            const session = sessionManager.getSession(params.sessionId);
            if (!session) {
                throw new Error(`No browser session found with ID: ${params.sessionId}`);
            }

            const browser = session.browser;
            logger.debug('Finding elements:', { by: params.by, value: params.value });

            // Navigate to the page if URL is provided
            if (params.url) {
                await browser.url(params.url);
            }

            const selector = getSelector(params.by, params.value);
            const elements = await browser.$$(selector);
            
            logger.debug('Found elements:', { count: elements.length });
            return elements;
        }
    });

    server.registerTool({
        name: 'element_action',
        description: 'Perform an action on an element',
        run: async (params: {
            sessionId: string;
            elementId: string;
            action: 'click' | 'type' | 'clear' | 'submit';
            value?: string;
        }) => {
            const session = sessionManager.getSession(params.sessionId);
            if (!session) {
                throw new Error(`No browser session found with ID: ${params.sessionId}`);
            }

            const browser = session.browser;
            const element = await browser.$(`[data-wdio-id="${params.elementId}"]`);
            
            if (!element || !(await element.isExisting())) {
                throw new Error(`Element not found with ID: ${params.elementId}`);
            }

            logger.debug('Performing element action:', { action: params.action });

            switch (params.action) {
                case 'click':
                    await element.click();
                    break;
                case 'type':
                    if (!params.value) {
                        throw new Error('Value is required for type action');
                    }
                    await element.setValue(params.value);
                    break;
                case 'clear':
                    await element.clearValue();
                    break;
                case 'submit':
                    await element.submit();
                    break;
                default:
                    throw new Error(`Unsupported action: ${params.action}`);
            }

            logger.debug('Element action completed successfully');
            return { success: true };
        }
    });
} 