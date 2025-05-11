#!/usr/bin/env node

import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { MCPServer } from '@modelcontextprotocol/sdk';

// Handle ESM modules in TypeScript
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export async function startWebdriverIO(server: MCPServer) {
    // Register WebdriverIO tools with the MCP server
    // Note: The actual tool registration is done in server.ts
    console.log('WebdriverIO tools registered with MCP server');
}