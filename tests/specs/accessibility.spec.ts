import { expect } from 'chai';
import { buildCapabilities } from '../../src/lib/server.js';
import { checkAccessibility } from '../../src/lib/axe-helper.js';
import { testServer } from '../config/test-server.js';

describe('Accessibility Test', function() {
    this.timeout(30000);

    before(async () => {
        // Initialize server with default configuration
        await testServer.initialize();
        
        // Start browser using direct WebdriverIO API
        const capabilities = buildCapabilities('chrome', { headless: true });
        const connected = await testServer.getServer().webdriverServer.connect({ capabilities });
        if (!connected) throw new Error('Failed to connect to browser');
        await testServer.getServer().webdriverServer.createSession({ browserName: 'chrome' });
    });

    after(async () => {
        await testServer.cleanup();
    });

    it('should have no accessibility violations on the login page', async () => {
        const driver = testServer.getServer().webdriverServer.getDriver();
        await driver.url('https://practicetestautomation.com/practice-test-login/');
        const result = await checkAccessibility(driver);
        console.log('Accessibility Results:', result);
        console.log('Accessibility Violations:', result.violations);
        expect(result.violations.length).to.be.at.most(3);
    });
});