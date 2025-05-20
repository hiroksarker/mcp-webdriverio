import { describe, it, before, after, beforeEach } from 'mocha';
import { expect } from 'chai';
import { Server } from '../../src/lib/server/server.js';
import { LoginPage } from '../pages/LoginPage.js';

// Add type declarations
declare global {
  namespace Mocha {
    interface Context {
      timeout(ms: number): void;
    }
  }
}

// Set timeout for all tests in this suite
describe('MCP Login Test Suite', function() {
    // Increase timeout for this suite
    this.timeout(30000);  // 30 seconds

    // Explicitly declare types following the MCP protocol
    let server: Server;
    let sessionId: string;
    let loginPage: LoginPage;

    before(async () => {
        // Create and start server
        server = new Server(3000);
        await server.listen();

        // Start a browser session using the MCP protocol
        const response = await server.mcpServer.handleMessage({
            type: 'tool',
            name: 'start_browser',
            params: {
                browserName: 'chrome',
                headless: true
            }
        });
        sessionId = response.content[0].sessionId;
        loginPage = new LoginPage(server, sessionId);
    });

    after(async () => {
        // Cleanup: close browser session and stop server
        if (sessionId) {
            await server.mcpServer.handleMessage({
                type: 'tool',
                name: 'close_browser',
                params: { sessionId }
            });
        }
        await server.close();
    });

    describe('Login Flow', () => {
        beforeEach(async () => {
            // Navigate to login page before each test
            await server.mcpServer.handleMessage({
                type: 'tool',
                name: 'navigate',
                params: {
                    sessionId,
                    url: 'https://practicetestautomation.com/practice-test-login/'
                }
            });
        });

        it('should successfully login with valid credentials', async () => {
            await loginPage.login('student', 'Password123');
            
            // Verify successful login
            const successElementResponse = await server.mcpServer.handleMessage({
                type: 'tool',
                name: 'find_element',
                params: {
                    sessionId,
                    by: 'css selector',
                    value: '.post-title'
                }
            });
            const successTextResponse = await server.mcpServer.handleMessage({
                type: 'tool',
                name: 'getText',
                params: {
                    sessionId,
                    elementId: successElementResponse.content[0].elementId
                }
            });
            expect(successTextResponse.content[0].text).to.equal('Logged In Successfully');
        });

        it('should show error message with invalid credentials', async () => {
            await loginPage.login('invalid', 'wrong');

            // Wait for error message to appear
            await new Promise(resolve => setTimeout(resolve, 1000));

            const errorMessage = await loginPage.getErrorMessage();
            expect(errorMessage).to.equal('Your username is invalid!');
        });
    });
}); 