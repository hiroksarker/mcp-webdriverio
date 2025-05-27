#!/usr/bin/env node

import { Server } from '../lib/server/server';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { config } from 'dotenv';

// Load environment variables
config();

// Get the directory name
const __dirname = dirname(fileURLToPath(import.meta.url));

async function startServer() {
    try {
        const server = new Server({
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
        });

        await server.listen();
        console.log('MCP Server started successfully');

        // Handle graceful shutdown
        process.on('SIGINT', async () => {
            console.log('\nShutting down server...');
            await server.close();
            process.exit(0);
        });

        process.on('SIGTERM', async () => {
            console.log('\nShutting down server...');
            await server.close();
            process.exit(0);
        });

    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
}

startServer(); 