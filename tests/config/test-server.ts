import { Server } from '../../src/lib/server/server.js';
import type { GlobalSettings } from '../../src/lib/server/global-settings.js';
import { readFileSync } from 'fs';
import { join } from 'path';

// Load MCP configuration from .cursor/mcp.json
const loadMCPConfig = (): GlobalSettings => {
    try {
        const mcpConfigPath = join(process.cwd(), '.cursor', 'mcp.json');
        const mcpConfig = JSON.parse(readFileSync(mcpConfigPath, 'utf-8'));
        const testConfig = mcpConfig.mcpServers.test;
        
        return {
            mcp: {
                server: {
                    port: testConfig.port,
                    host: testConfig.host,
                    baseUrl: testConfig.baseUrl,
                    timeout: 30000,
                    retryAttempts: 3,
                    retryDelay: 1000
                },
                cursor: testConfig.cursor,
                browser: testConfig.browser
            }
        };
    } catch (error) {
        console.warn('Failed to load MCP config, using default settings:', error);
        return defaultTestConfig;
    }
};

// Default test server configuration (fallback)
const defaultTestConfig: GlobalSettings = {
    mcp: {
        server: {
            port: 3000,
            host: 'localhost',
            baseUrl: 'http://localhost:3000',
            timeout: 30000,
            retryAttempts: 3,
            retryDelay: 1000
        },
        cursor: {
            enabled: true,
            url: 'ws://localhost:3001',
            reconnectInterval: 5000,
            maxReconnectAttempts: 5,
            heartbeatInterval: 30000,
            debug: false
        },
        browser: {
            headless: true,
            browserName: 'chrome',
            timeout: 30000,
            windowSize: {
                width: 1920,
                height: 1080
            }
        }
    }
};

// Test server manager class
export class TestServerManager {
    private static instance: TestServerManager;
    private server: Server | null = null;
    private sessionId: string | null = null;
    private config: GlobalSettings;

    private constructor() {
        this.config = loadMCPConfig();
    }

    static getInstance(): TestServerManager {
        if (!TestServerManager.instance) {
            TestServerManager.instance = new TestServerManager();
        }
        return TestServerManager.instance;
    }

    async initialize(config: Partial<GlobalSettings> = {}) {
        if (!this.server) {
            this.server = new Server({
                mcp: {
                    ...this.config.mcp,
                    ...config.mcp
                }
            });
            await this.server.listen();
        }
        return this.server;
    }

    async startBrowser() {
        if (!this.server) {
            throw new Error('Server not initialized. Call initialize() first.');
        }

        const response = await this.server.mcpServer.handleMessage({
            type: 'tool',
            name: 'start_browser',
            params: { 
                browserName: this.server.browserConfig.browserName, 
                headless: this.server.browserConfig.headless 
            }
        });

        this.sessionId = response.content[0].sessionId;
        return this.sessionId;
    }

    async cleanup() {
        if (this.server) {
            if (this.sessionId) {
                await this.server.mcpServer.handleMessage({
                    type: 'tool',
                    name: 'close_browser',
                    params: { sessionId: this.sessionId }
                });
                this.sessionId = null;
            }
            await this.server.close();
            this.server = null;
        }
    }

    getServer(): Server {
        if (!this.server) {
            throw new Error('Server not initialized. Call initialize() first.');
        }
        return this.server;
    }

    getSessionId(): string {
        if (!this.sessionId) {
            throw new Error('Browser session not started. Call startBrowser() first.');
        }
        return this.sessionId;
    }
}

// Export a singleton instance
export const testServer = TestServerManager.getInstance(); 