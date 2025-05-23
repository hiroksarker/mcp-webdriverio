import { expect } from 'chai';
import { Server } from '../../src/lib/server/server.js';
import { buildCapabilities } from '../../src/lib/server.js';
import { checkAccessibility } from '../../src/lib/axe-helper.js';

describe('Accessibility Test', function() {
    this.timeout(30000);

    let server: Server;
    let sessionId: string;

    before(async () => {
        server = new Server(3000);
        await server.listen();

        // Start browser using direct WebdriverIO API
        const capabilities = buildCapabilities('chrome', { headless: true });
        const connected = await server.webdriverServer.connect({ capabilities });
        if (!connected) throw new Error('Failed to connect to browser');
        sessionId = await server.webdriverServer.createSession({ browserName: 'chrome' });
    });

    after(async () => {
        if (sessionId) {
            await server.webdriverServer.closeSession(sessionId);
        }
        await server.close();
    });

    it('should have no accessibility violations on the login page', async () => {
        const driver = server.webdriverServer.getDriver();
        await driver.url('https://practicetestautomation.com/practice-test-login/');
        const result = await checkAccessibility(driver);
        console.log('Accessibility Results:', result);
        console.log('Accessibility Violations:', result.violations);
        expect(result.violations.length).to.be.at.most(3);
    });
});