import { remote, Browser } from 'webdriverio';
import type { Options } from '@wdio/types';
import { SessionManager } from '../session.js';
import { Logger } from '../logger.js';

// Define Chrome capabilities type
type ChromeOptions = {
    args?: string[];
    binary?: string;
    extensions?: string[];
    localState?: Record<string, any>;
    prefs?: Record<string, any>;
    debuggerAddress?: string;
};

type ChromeCapabilities = {
    browserName: string;
    'goog:chromeOptions': ChromeOptions;
};

export function registerBrowserTools(server: any, logger: Logger, sessionManager: SessionManager) {
    server.registerTool({
        name: 'start_browser',
        description: 'Start a new browser session',
        run: async (params: { headless?: boolean; arguments?: string[] }) => {
            const capabilities: ChromeCapabilities = {
                browserName: 'chrome',
                'goog:chromeOptions': {
                    args: params?.arguments || ['--headless=new']
                }
            };

            const browser = await remote({
                logLevel: 'error',
                capabilities
            });

            const sessionId = await sessionManager.createSession(browser);
            return { sessionId };
        }
    });

    server.registerTool({
        name: 'navigate',
        description: 'Navigate to a URL in the browser',
        run: async (params: { sessionId: string; url: string }) => {
            const session = sessionManager.getSession(params.sessionId);
            if (!session) {
                throw new Error('No active browser session');
            }
            await session.browser.url(params.url);
            return { success: true };
        }
    });

    server.registerTool({
        name: 'close_browser',
        description: 'Close a browser session',
        run: async (params: { sessionId: string }) => {
            await sessionManager.closeSession(params.sessionId);
            return { success: true };
        }
    });

    server.registerTool({
        name: 'get_browser_info',
        description: 'Get information about the current browser session',
        run: async (params: { sessionId: string }) => {
            const session = sessionManager.getSession(params.sessionId);
            if (!session) {
                throw new Error('No active browser session');
            }
            return {
                sessionId: session.id,
                createdAt: session.createdAt
            };
        }
    });
} 