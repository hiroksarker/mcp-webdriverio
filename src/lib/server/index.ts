#!/usr/bin/env node

import { MCPServer } from '../mcp-server.js';
import { StdioServerTransport } from './transport.js';
import { registerBrowserTools } from './tools/browser.js';
import { registerElementTools } from './tools/elements.js';
import { registerNetworkTools } from './tools/network.js';
import { Config } from './config.js';
import { Logger } from './logger.js';
import { SessionManager } from './session.js';

// Initialize MCP Server with supported options
export const server = new MCPServer({
    name: "MCP WebdriverIO Server",
    version: "1.0.0"
});

// Initialize server components
const config = new Config();
const logger = new Logger(config.logLevel);
const transport = new StdioServerTransport(server, logger);
const sessionManager = new SessionManager(logger);

// Register all tools with the same session manager
registerBrowserTools(server, logger, sessionManager);
registerElementTools(server, logger, sessionManager);
registerNetworkTools(server, logger, sessionManager);

// Start server if run directly
if (import.meta.url === `file://${process.argv[1]}`) {
    transport.start().catch((error: unknown) => {
        console.error('Fatal error:', error);
        process.exit(1);
    });
} 