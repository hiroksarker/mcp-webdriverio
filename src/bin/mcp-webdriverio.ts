#!/usr/bin/env node

import { WebdriverioMCPServer } from '../lib/server.js';
import { MCPServerTransport } from '../lib/transport.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PID_FILE = path.join(__dirname, '..', '..', 'mcp-server.pid');

function isServerRunning(): boolean {
    if (fs.existsSync(PID_FILE)) {
        const pid = parseInt(fs.readFileSync(PID_FILE, 'utf-8'), 10);
        try {
            process.kill(pid, 0); // Check if process exists
            return true;
        } catch {
            // Process does not exist
            fs.unlinkSync(PID_FILE);
            return false;
        }
    }
    return false;
}

async function main() {
    try {
        // Check if server is already running
        if (isServerRunning()) {
            console.error('MCP server is already running.');
            process.exit(1);
        }

        // Create server instance
        const server = new WebdriverioMCPServer();
        const transport = new MCPServerTransport(server);

        // Write PID file
        fs.writeFileSync(PID_FILE, process.pid.toString());

        // Handle process signals
        process.on('SIGINT', () => {
            console.log('\nShutting down...');
            transport.stop();
            if (fs.existsSync(PID_FILE)) {
                fs.unlinkSync(PID_FILE);
            }
            process.exit(0);
        });

        process.on('SIGTERM', () => {
            console.log('\nShutting down...');
            transport.stop();
            if (fs.existsSync(PID_FILE)) {
                fs.unlinkSync(PID_FILE);
            }
            process.exit(0);
        });

        // Clean up PID file on exit
        process.on('exit', () => {
            if (fs.existsSync(PID_FILE)) {
                fs.unlinkSync(PID_FILE);
            }
        });

        // Start the transport layer
        transport.start();
        console.log('MCP WebdriverIO Server started');

    } catch (error) {
        console.error('Failed to start server:', error);
        if (fs.existsSync(PID_FILE)) {
            fs.unlinkSync(PID_FILE);
        }
        process.exit(1);
    }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
    main().catch(error => {
        console.error('Fatal error:', error);
        if (fs.existsSync(PID_FILE)) {
            fs.unlinkSync(PID_FILE);
        }
        process.exit(1);
    });
}

export { main }; 