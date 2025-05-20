import { remote, Browser } from 'webdriverio';
import type { Options } from '@wdio/types';
import { SessionManager } from '../session.js';
import { Logger } from '../logger.js';
import { MCPServer } from '../../mcp-server.js';
import { BrowserFactory } from '../browser/factory.js';
import type { BrowserType, BrowserOptions } from '../browser/types.js';

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

export function registerBrowserTools(
    server: MCPServer,
    logger: Logger,
    sessionManager: SessionManager
) {
    const browserFactory = new BrowserFactory(logger);

    server.registerTool({
        name: 'start_browser',
        description: 'Start a new browser session',
        run: async (params: BrowserOptions & { browserName: BrowserType }) => {
            logger.debug('Starting browser session:', params);

            try {
                const capabilities = await browserFactory.getCapabilities(
                    params.browserName,
                    {
                        headless: params.headless,
                        version: params.version,
                        profile: params.profile,
                        args: params.args
                    }
                );

                const browser = await remote(capabilities);
                const session = await sessionManager.createSession(browser);
                logger.info('Browser session started:', { sessionId: session.id });
                return { sessionId: session.id };
            } catch (error) {
                logger.error('Failed to start browser session:', error);
                throw error;
            }
        }
    });

    server.registerTool({
        name: 'get_available_browsers',
        description: 'Get list of available browsers',
        run: async () => {
            const browsers = await browserFactory.getAvailableBrowsers();
            return { browsers };
        }
    });

    server.registerTool({
        name: 'validate_browser',
        description: 'Validate browser installation',
        run: async (params: { browserName: BrowserType }) => {
            const isValid = await browserFactory.validateBrowser(params.browserName);
            return { isValid };
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