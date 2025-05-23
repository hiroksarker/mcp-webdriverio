import { describe, it, before, after, beforeEach } from 'mocha';
import { expect } from 'chai';
import { browser } from '@wdio/globals';
import { addFeature, addSeverity, addDescription, addStep, addIssue, addTestId, Status } from '@wdio/allure-reporter';
import { Server } from '../../src/lib/server/server.js';
import { LoginPage } from '../pages/LoginPage.js';
import { buildCapabilities } from '../../src/lib/server.js';
import type { MCPServer } from '../../src/lib/mcp-server.js';

// Add type for visual regression commands
type VisualBrowser = import('webdriverio').Browser & {
    saveScreen: (name: string, opts?: any) => Promise<void>;
    checkScreen: (name: string, opts?: any) => Promise<{ misMatchPercentage: number }>;
};

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
    // Add feature and severity to the test suite
    addFeature('Login Functionality');
    addSeverity('critical');
    addDescription('Tests for the login functionality of the practice test automation website', 'text');

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

        // Initialize WebdriverIO server
        await server.webdriverServer.connect({
            capabilities: buildCapabilities('chrome', { headless: true })
        });

        const response = await server.mcpServer.handleMessage({
            type: 'tool',
            name: 'start_browser',
            params: {
                browserName: 'chrome',
                headless: true
            }
        });

        if (!response.content || !response.content[0]?.sessionId) {
            throw new Error('Failed to start browser session');
        }
        sessionId = response.content[0].sessionId;
        console.log('Started browser session:', sessionId);
        loginPage = new LoginPage(server.mcpServer, sessionId);
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
        await server.webdriverServer.disconnect();
        await server.close();
    });

    describe('Login Flow', () => {
        beforeEach(async () => {
            await browser.url('https://practicetestautomation.com/practice-test-login/');
        });

        it('should successfully login with valid credentials', async () => {
            addTestId('LOGIN-001');
            addIssue('LOGIN-123');
            
            // Enter valid credentials
            await browser.$('#username').setValue('student');
            await browser.$('#password').setValue('Password123');
            await browser.$('#submit').click();
            
            // Verify successful login
            const successElement = await browser.$('.post-title');
            await successElement.waitForDisplayed();
            const successText = await successElement.getText();
            expect(successText).to.equal('Logged In Successfully');
        });

        it('should show error message with invalid credentials', async () => {
            addTestId('LOGIN-002');
            addIssue('LOGIN-124');
            
            // Enter invalid credentials
            await browser.$('#username').setValue('invalid');
            await browser.$('#password').setValue('wrong');
            await browser.$('#submit').click();

            // Verify error message
            const errorElement = await browser.$('#error');
            await errorElement.waitForDisplayed();
            const errorMessage = await errorElement.getText();
            expect(errorMessage).to.equal('Your username is invalid!');
        });
    });

    describe('Visual regression', () => {
        it('should compare the login page', async () => {
            addTestId('VISUAL-001');
            addIssue('VISUAL-123');
            addDescription('Visual regression test for the login page', 'text');
            
            // Navigate and take screenshot
            await browser.url('https://practicetestautomation.com/practice-test-login/');
            await browser.saveScreen('login-page', { 
                fullPage: true,
                hideElements: ['.ads']
            });
            
            // Compare screenshot
            const result = await browser.checkScreen('login-page', { 
                fullPage: true,
                hideElements: ['.ads']
            });
            expect(result.misMatchPercentage).to.be.lessThan(0.1);
        });
    });
});