import { describe } from 'mocha';
import { MCPServer } from '../src/lib/mcp-server.js';
import { run as runValidCredentials } from './specs/valid_credentials.spec.js';
import { expect } from 'chai';

describe('MCP WebdriverIO Tests', () => {
    let server: MCPServer;
    let sessionId: string;

    before(async () => {
        server = new MCPServer({ name: 'Test', version: '1.0.0' });
        await server.start();
        const response = await server.handleMessage({
            type: 'tool',
            name: 'start_browser',
            params: { browserName: 'chrome', headless: true }
        });
        sessionId = response.content[0].sessionId;
    });

    after(async () => {
        if (sessionId) {
            await server.handleMessage({
                type: 'tool',
                name: 'close_browser',
                params: { sessionId }
            });
        }
        // If you have a stop or shutdown method, use it here
        // await server.stop();
    });

    describe('Valid Credentials Test', () => {
        it('should login successfully', async () => {
            const result = await runValidCredentials(server, sessionId);
            expect(result).to.be.true;
        });
    });
});