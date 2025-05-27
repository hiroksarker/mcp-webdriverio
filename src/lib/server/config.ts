import { z } from 'zod';

// Configuration schema
const ServerConfigSchema = z.object({
    port: z.number().default(3000),
    host: z.string().default('localhost'),
    baseUrl: z.string().default('http://localhost:3000'),
    browserOptions: z.object({
        headless: z.boolean().default(true),
        browserName: z.enum(['chrome', 'firefox', 'safari']).default('chrome'),
        timeout: z.number().default(30000)
    }).default({}),
    cursor: z.object({
        enabled: z.boolean().default(true),
        url: z.string().default('ws://localhost:3001'),
        reconnectInterval: z.number().default(5000)
    }).default({})
});

export type ServerConfig = z.infer<typeof ServerConfigSchema>;

// Default configuration
export const defaultConfig: ServerConfig = {
    port: 3000,
    host: 'localhost',
    baseUrl: 'http://localhost:3000',
    browserOptions: {
        headless: true,
        browserName: 'chrome',
        timeout: 30000
    },
    cursor: {
        enabled: true,
        url: 'ws://localhost:3001',
        reconnectInterval: 5000
    }
};

// Load configuration from environment variables
export function loadConfig(): ServerConfig {
    const config = {
        port: process.env.MCP_PORT ? parseInt(process.env.MCP_PORT) : defaultConfig.port,
        host: process.env.MCP_HOST || defaultConfig.host,
        baseUrl: process.env.MCP_BASE_URL || defaultConfig.baseUrl,
        browserOptions: {
            headless: process.env.MCP_BROWSER_HEADLESS === 'true',
            browserName: process.env.MCP_BROWSER_NAME || defaultConfig.browserOptions.browserName,
            timeout: process.env.MCP_BROWSER_TIMEOUT ? parseInt(process.env.MCP_BROWSER_TIMEOUT) : defaultConfig.browserOptions.timeout
        },
        cursor: {
            enabled: process.env.MCP_CURSOR_ENABLED === 'true',
            url: process.env.MCP_CURSOR_URL || defaultConfig.cursor.url,
            reconnectInterval: process.env.MCP_CURSOR_RECONNECT_INTERVAL ? 
                parseInt(process.env.MCP_CURSOR_RECONNECT_INTERVAL) : 
                defaultConfig.cursor.reconnectInterval
        }
    };

    return ServerConfigSchema.parse(config);
} 