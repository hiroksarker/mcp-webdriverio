import { describe, it, before, after, beforeEach } from 'mocha';
import { expect } from 'chai';
import { addFeature, addSeverity, addDescription, addStep, addIssue, addTestId, Status } from '@wdio/allure-reporter';
import { LoginPage } from '../pages/LoginPage.js';
import { buildCapabilities } from '../../src/lib/server.js';
import { testServer } from '../config/test-server.js';
import type { Browser, Element } from 'webdriverio';

// Add type for visual regression commands
type VisualBrowser = Browser & {
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

// Helper function to get and wait for element
async function getElement(driver: Browser, selector: string): Promise<Element> {
    const element = await driver.$(selector);
    await element.waitForDisplayed();
    return element;
}

// Set timeout for all tests in this suite
describe('MCP Login Test Suite', function() {
    // Add feature and severity to the test suite
    addFeature('Login Functionality');
    addSeverity('critical');
    addDescription('Tests for the login functionality of the practice test automation website', 'text');

    // Increase timeout for this suite
    this.timeout(30000);  // 30 seconds

    let loginPage: LoginPage;

    before(async () => {
        // Initialize server with default configuration
        await testServer.initialize();

        // Initialize WebdriverIO server
        await testServer.getServer().webdriverServer.connect({
            capabilities: buildCapabilities('chrome', { headless: true })
        });

        const response = await testServer.getServer().mcpServer.handleMessage({
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
        console.log('Started browser session:', response.content[0].sessionId);
        loginPage = new LoginPage(testServer.getServer().mcpServer, response.content[0].sessionId);
    });

    after(async () => {
        await testServer.cleanup();
    });

    describe('Login Flow', () => {
        beforeEach(async () => {
            const driver = testServer.getServer().webdriverServer.getDriver() as unknown as Browser;
            await driver.url('https://practicetestautomation.com/practice-test-login/');
        });

        it('should successfully login with valid credentials', async () => {
            addTestId('LOGIN-001');
            addIssue('LOGIN-123');
            
            const driver = testServer.getServer().webdriverServer.getDriver() as unknown as Browser;
            
            // Get and interact with elements
            const usernameInput = await getElement(driver, '#username');
            const passwordInput = await getElement(driver, '#password');
            const submitButton = await getElement(driver, '#submit');
            
            await usernameInput.setValue('student');
            await passwordInput.setValue('Password123');
            await submitButton.click();
            
            // Verify successful login
            const successElement = await getElement(driver, '.post-title');
            const successText = await successElement.getText();
            expect(successText).to.equal('Logged In Successfully');
        });

        it('should show error message with invalid credentials', async () => {
            addTestId('LOGIN-002');
            addIssue('LOGIN-124');
            
            const driver = testServer.getServer().webdriverServer.getDriver() as unknown as Browser;
            
            // Get and interact with elements
            const usernameInput = await getElement(driver, '#username');
            const passwordInput = await getElement(driver, '#password');
            const submitButton = await getElement(driver, '#submit');
            
            await usernameInput.setValue('invalid');
            await passwordInput.setValue('wrong');
            await submitButton.click();

            // Verify error message
            const errorElement = await getElement(driver, '#error');
            const errorMessage = await errorElement.getText();
            expect(errorMessage).to.equal('Your username is invalid!');
        });
    });

    describe('Visual regression', () => {
        it('should compare the login page', async () => {
            addTestId('VISUAL-001');
            addIssue('VISUAL-123');
            addDescription('Visual regression test for the login page', 'text');
            
            const driver = testServer.getServer().webdriverServer.getDriver();
            const testRunner = testServer.getServer().webdriverServer.getTestRunner();
            
            // Navigate to the page
            await driver.url('https://practicetestautomation.com/practice-test-login/');
            
            // Hide ads before taking screenshot
            await driver.execute(() => {
                const ads = document.querySelectorAll('.ads');
                ads.forEach(ad => {
                    (ad as HTMLElement).style.display = 'none';
                });
            });
            
            // Save baseline if it doesn't exist
            try {
                await testRunner.saveVisualBaseline('login-page');
            } catch (error) {
                console.log('Baseline already exists, proceeding with comparison');
            }
            
            // Compare screenshot
            const result = await testRunner.compareVisual('login-page', 0.1);
            expect(result.match).to.be.true;
            expect(result.diffPercentage).to.be.lessThan(0.1);
            
            if (!result.match) {
                console.log(`Visual regression failed with ${result.diffPercentage}% difference`);
                console.log(`Diff image saved at: ${result.diffPath}`);
            }
        });
    });
});