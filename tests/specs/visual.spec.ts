import { describe, it, before, after } from 'mocha';
import { expect } from 'chai';
import { addFeature, addSeverity, addDescription, addTestId } from '@wdio/allure-reporter';
import { testServer } from '../config/test-server.js';
import type { Browser } from 'webdriverio';

describe('Visual Regression Test Suite', function() {
    addFeature('Visual Testing');
    addSeverity('critical');
    addDescription('Visual regression tests for the practice test automation website', 'text');

    // Increase timeout for visual tests
    this.timeout(60000);  // 60 seconds

    before(async () => {
        // Initialize server with default configuration
        await testServer.initialize();

        // Initialize WebdriverIO server
        await testServer.getServer().webdriverServer.connect({
            capabilities: {
                browserName: 'chrome',
                'goog:chromeOptions': {
                    args: ['--headless=new', '--no-sandbox', '--disable-dev-shm-usage']
                }
            }
        });
    });

    after(async () => {
        await testServer.cleanup();
    });

    describe('Login Page Visual Tests', () => {
        it('should match login page baseline', async () => {
            addTestId('VISUAL-001');
            
            const driver = testServer.getServer().webdriverServer.getDriver();
            const testRunner = testServer.getServer().webdriverServer.getTestRunner();
            
            // Navigate to the login page
            await driver.url('https://practicetestautomation.com/practice-test-login/');
            
            // Hide dynamic elements
            await driver.execute(() => {
                const elements = document.querySelectorAll('.ads, .notifications, .cookies-banner');
                elements.forEach(el => {
                    (el as HTMLElement).style.display = 'none';
                });
            });
            
            // Save baseline if it doesn't exist
            try {
                await testRunner.saveVisualBaseline('login-page');
                console.log('Created new baseline for login page');
            } catch (error) {
                console.log('Using existing baseline for login page');
            }
            
            // Compare with baseline
            const result = await testRunner.compareVisual('login-page', 0.1);
            
            // Assertions
            expect(result.match).to.be.true;
            expect(result.diffPercentage).to.be.lessThan(0.1);
            
            if (!result.match) {
                console.log(`Visual regression failed with ${result.diffPercentage}% difference`);
                console.log(`Diff image saved at: ${result.diffPath}`);
            }
        });

        it('should detect visual changes in login form', async () => {
            addTestId('VISUAL-002');
            
            const driver = testServer.getServer().webdriverServer.getDriver();
            const testRunner = testServer.getServer().webdriverServer.getTestRunner();
            
            // Navigate to the login page
            await driver.url('https://practicetestautomation.com/practice-test-login/');
            
            // Hide dynamic elements
            await driver.execute(() => {
                const elements = document.querySelectorAll('.ads, .notifications, .cookies-banner');
                elements.forEach(el => {
                    (el as HTMLElement).style.display = 'none';
                });
            });
            
            // Modify the page to simulate a visual change
            await driver.execute(() => {
                const form = document.querySelector('form');
                if (form) {
                    (form as HTMLElement).style.backgroundColor = '#f0f0f0';
                    (form as HTMLElement).style.padding = '20px';
                }
            });
            
            // Compare with baseline
            const result = await testRunner.compareVisual('login-page', 0.1);
            
            // This test should fail because we modified the page
            expect(result.match).to.be.false;
            expect(result.diffPercentage).to.be.greaterThan(0.1);
            
            if (!result.match) {
                console.log(`Visual regression detected changes: ${result.diffPercentage}% difference`);
                console.log(`Diff image saved at: ${result.diffPath}`);
            }
        });
    });
});
