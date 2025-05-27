import { z } from 'zod';
import { config } from 'dotenv';

// Load environment variables
config();

// Global MCP Server Settings Schema
export const GlobalSettingsSchema = z.object({
    mcp: z.object({
        server: z.object({
            port: z.number().default(3000),
            host: z.string().default('localhost'),
            baseUrl: z.string().default('http://localhost:3000'),
            timeout: z.number().default(30000),
            retryAttempts: z.number().default(3),
            retryDelay: z.number().default(1000)
        }),
        cursor: z.object({
            enabled: z.boolean().default(true),
            url: z.string().default('ws://localhost:3001'),
            reconnectInterval: z.number().default(5000),
            maxReconnectAttempts: z.number().default(5),
            heartbeatInterval: z.number().default(30000),
            debug: z.boolean().default(false)
        }),
        browser: z.object({
            headless: z.boolean().default(true),
            browserName: z.enum(['chrome', 'firefox', 'safari']).default('chrome'),
            timeout: z.number().default(30000),
            windowSize: z.object({
                width: z.number().default(1920),
                height: z.number().default(1080)
            }),
            userAgent: z.string().optional(),
            proxy: z.object({
                enabled: z.boolean().default(false),
                host: z.string().optional(),
                port: z.number().optional(),
                username: z.string().optional(),
                password: z.string().optional()
            }).optional()
        })
    })
});

export type GlobalSettings = z.infer<typeof GlobalSettingsSchema>;

// Default global settings
export const defaultGlobalSettings: GlobalSettings = {
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

// Load settings from environment variables
export function loadGlobalSettings(): GlobalSettings {
    const settings = {
        mcp: {
            server: {
                port: process.env.MCP_SERVER_PORT ? parseInt(process.env.MCP_SERVER_PORT) : defaultGlobalSettings.mcp.server.port,
                host: process.env.MCP_SERVER_HOST || defaultGlobalSettings.mcp.server.host,
                baseUrl: process.env.MCP_SERVER_BASE_URL || defaultGlobalSettings.mcp.server.baseUrl,
                timeout: process.env.MCP_SERVER_TIMEOUT ? parseInt(process.env.MCP_SERVER_TIMEOUT) : defaultGlobalSettings.mcp.server.timeout,
                retryAttempts: process.env.MCP_SERVER_RETRY_ATTEMPTS ? parseInt(process.env.MCP_SERVER_RETRY_ATTEMPTS) : defaultGlobalSettings.mcp.server.retryAttempts,
                retryDelay: process.env.MCP_SERVER_RETRY_DELAY ? parseInt(process.env.MCP_SERVER_RETRY_DELAY) : defaultGlobalSettings.mcp.server.retryDelay
            },
            cursor: {
                enabled: process.env.MCP_CURSOR_ENABLED === 'true',
                url: process.env.MCP_CURSOR_URL || defaultGlobalSettings.mcp.cursor.url,
                reconnectInterval: process.env.MCP_CURSOR_RECONNECT_INTERVAL ? 
                    parseInt(process.env.MCP_CURSOR_RECONNECT_INTERVAL) : 
                    defaultGlobalSettings.mcp.cursor.reconnectInterval,
                maxReconnectAttempts: process.env.MCP_CURSOR_MAX_RECONNECT_ATTEMPTS ? 
                    parseInt(process.env.MCP_CURSOR_MAX_RECONNECT_ATTEMPTS) : 
                    defaultGlobalSettings.mcp.cursor.maxReconnectAttempts,
                heartbeatInterval: process.env.MCP_CURSOR_HEARTBEAT_INTERVAL ? 
                    parseInt(process.env.MCP_CURSOR_HEARTBEAT_INTERVAL) : 
                    defaultGlobalSettings.mcp.cursor.heartbeatInterval,
                debug: process.env.MCP_CURSOR_DEBUG === 'true'
            },
            browser: {
                headless: process.env.MCP_BROWSER_HEADLESS === 'true',
                browserName: process.env.MCP_BROWSER_NAME || defaultGlobalSettings.mcp.browser.browserName,
                timeout: process.env.MCP_BROWSER_TIMEOUT ? parseInt(process.env.MCP_BROWSER_TIMEOUT) : defaultGlobalSettings.mcp.browser.timeout,
                windowSize: {
                    width: process.env.MCP_BROWSER_WIDTH ? parseInt(process.env.MCP_BROWSER_WIDTH) : defaultGlobalSettings.mcp.browser.windowSize.width,
                    height: process.env.MCP_BROWSER_HEIGHT ? parseInt(process.env.MCP_BROWSER_HEIGHT) : defaultGlobalSettings.mcp.browser.windowSize.height
                },
                userAgent: process.env.MCP_BROWSER_USER_AGENT,
                proxy: process.env.MCP_BROWSER_PROXY_ENABLED === 'true' ? {
                    enabled: true,
                    host: process.env.MCP_BROWSER_PROXY_HOST,
                    port: process.env.MCP_BROWSER_PROXY_PORT ? parseInt(process.env.MCP_BROWSER_PROXY_PORT) : undefined,
                    username: process.env.MCP_BROWSER_PROXY_USERNAME,
                    password: process.env.MCP_BROWSER_PROXY_PASSWORD
                } : undefined
            }
        }
    };

    return GlobalSettingsSchema.parse(settings);
}

// Global settings instance
export const globalSettings = loadGlobalSettings(); 