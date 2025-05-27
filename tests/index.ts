import { describe } from 'mocha';
import { runValidCredentials } from './specs/valid_credentials.spec.js';
import { expect } from 'chai';
import { testServer } from './config/test-server.ts';

describe('MCP WebdriverIO Tests', () => {
    before(async () => {
        // Initialize server with default configuration
        await testServer.initialize();
        await testServer.startBrowser();
    });

    after(async () => {
        await testServer.cleanup();
    });

    describe('Valid Credentials Test', () => {
        it('should login successfully', async () => {
            const result = await runValidCredentials(testServer.getServer(), testServer.getSessionId());
            expect(result).to.be.true;
        });
    });
});