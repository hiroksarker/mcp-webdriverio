#!/usr/bin/env node

import { Server } from './server/server.js';
import { StdioServerTransport } from './server/transport.js';
import { Logger } from './server/logger.js';
import { Config } from './server/config.js';

// Initialize server components
const config = new Config();
const logger = new Logger(config.logLevel);
const serverInstance = new Server();
const transport = new StdioServerTransport(serverInstance.mcpServer, logger);

// Start server if run directly
if (import.meta.url === `file://${process.argv[1]}`) {
    serverInstance.listen().then(() => {
        transport.start().catch(error => {
            console.error('Fatal error:', error);
            process.exit(1);
        });
    }).catch(error => {
        console.error('Failed to start server:', error);
        process.exit(1);
    });
}

// Export the MCPServer instance for testing
export const server = serverInstance.mcpServer;