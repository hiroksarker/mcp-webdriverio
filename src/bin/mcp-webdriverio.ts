#!/usr/bin/env node

import { WebdriverioMCPServer } from '../lib/server.js';
import { MCPServerTransport } from '../lib/transport.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { MCPServer } from '../lib/mcp-server.js';
import { registerBrowserTools } from '../lib/server/tools/browser.js';
import { registerElementTools } from '../lib/server/tools/elements.js';
import { registerNetworkTools } from '../lib/server/tools/network.js';
import { Logger } from '../lib/server/logger.js';
import { SessionManager } from '../lib/server/session.js';
import * as http from 'http';

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

// Example config: could be loaded from mcp-config.json
const serverConfigs = [
  { name: "BrowserServer", port: 3001, tools: ['browser', 'elements'] },
  { name: "NetworkServer", port: 3002, tools: ['network'] }
];

for (const config of serverConfigs) {
  const server = new MCPServer({ name: config.name, version: "1.0.0" });
  const logger = new Logger();
  const sessionManager = new SessionManager(logger);

  // Dynamically register tools
  for (const tool of config.tools) {
    if (tool === 'browser') registerBrowserTools(server, logger, sessionManager);
    if (tool === 'elements') registerElementTools(server, logger, sessionManager);
    if (tool === 'network') registerNetworkTools(server, logger, sessionManager);
    // Add more tool types as needed
  }

  // Start HTTP server for this MCPServer
  const httpServer = http.createServer(async (req, res) => {
    // ...handle incoming MCP protocol messages, route to server.handleMessage()
  });
  httpServer.listen(config.port, () => {
    console.log(`${config.name} listening on port ${config.port}`);
  });
} 