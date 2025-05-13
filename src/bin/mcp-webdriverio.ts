#!/usr/bin/env node

import { Server } from '../lib/server/server.js';
import { StdioServerTransport } from '../lib/server/transport.js';
import { Logger } from '../lib/server/logger.js';
import { Config } from '../lib/server/config.js';

// Initialize server components
const config = new Config();
const logger = new Logger(config.logLevel);
const server = new Server();
const transport = new StdioServerTransport(server.mcpServer, logger);

// Start the server
server.listen().then(() => {
    transport.start().catch(error => {
        console.error('Fatal error:', error);
        process.exit(1);
    });
}).catch(error => {
    console.error('Failed to start server:', error);
    process.exit(1);
}); 