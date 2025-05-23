import { expect } from 'chai';
import { browser } from '@wdio/globals';
import { UserFlowManager } from '../../src/lib/user/UserFlowManager';
import { UserFlowStep, UserSession, UserFlowContext } from '../../src/lib/types';
import '../../src/types/webdriverio-visual';

interface VisualUserSession extends Omit<UserSession, 'browser'> {
    browser: typeof browser;
}

interface VisualFlowStep extends Omit<UserFlowStep, 'execute'> {
    execute: (session: UserSession & { browser: typeof browser }, context: UserFlowContext) => Promise<void>;
}

describe('Visual regression', function() {
    this.timeout(30000);

    let flowManager: UserFlowManager;
    let user1: UserSession;
    let user2: UserSession;

    before(async () => {
        if (typeof browser.saveScreen !== 'function' || typeof browser.checkScreen !== 'function') {
            throw new Error('Browser driver does not support visual testing. Make sure @wdio/visual-service is properly configured.');
        }

        flowManager = new UserFlowManager({
            maxConcurrentUsers: 2,
            defaultBrowserOptions: {
                browserName: 'chrome',
                headless: true
            }
        });

        user1 = await flowManager.createSession();
        user2 = await flowManager.createSession();
    });

    after(async () => {
        await flowManager.cleanup();
    });

    it('should compare the login page', async () => {
        await browser.url('https://practicetestautomation.com/practice-test-login/');
        await browser.saveScreen('login-page', { 
            fullPage: true,
            hideElements: ['.ads']
        });
        const result = await browser.checkScreen('login-page', { 
            fullPage: true,
            hideElements: ['.ads']
        });
        expect(result.misMatchPercentage).to.be.lessThan(0.1);
    });

    it('should execute a user flow', async () => {
        const steps: VisualFlowStep[] = [
            {
                name: 'navigate-to-login',
                execute: async (session) => {
                    if (typeof session.browser.saveScreen !== 'function' || typeof session.browser.checkScreen !== 'function') {
                        throw new Error('Browser does not support visual testing');
                    }
                    await session.browser.url('https://practicetestautomation.com/practice-test-login/');
                    await session.browser.$('form').waitForDisplayed();
                    await session.browser.saveScreen('login-form', { 
                        fullPage: true,
                        hideElements: ['.ads']
                    });
                }
            },
            {
                name: 'user1-login',
                dependencies: ['navigate-to-login'],
                execute: async (session, context) => {
                    if (typeof session.browser.saveScreen !== 'function' || typeof session.browser.checkScreen !== 'function') {
                        throw new Error('Browser does not support visual testing');
                    }
                    if (session.id === user1.id) {
                        await session.browser.$('#username').setValue('student');
                        await session.browser.$('#password').setValue('Password123');
                        await session.browser.$('#submit').click();
                        await session.browser.$('.post-title').waitForDisplayed();
                        context.sharedData.set('user1LoggedIn', true);
                    }
                }
            },
            {
                name: 'user2-verify-success',
                dependencies: ['user1-login'],
                execute: async (session, context) => {
                    if (typeof session.browser.saveScreen !== 'function' || typeof session.browser.checkScreen !== 'function') {
                        throw new Error('Browser does not support visual testing');
                    }
                    if (session.id === user2.id) {
                        await session.browser.waitUntil(
                            async () => context.sharedData.get('user1LoggedIn') === true,
                            { timeout: 5000 }
                        );
                        await session.browser.saveScreen('success-page', {
                            fullPage: true,
                            hideElements: ['.ads']
                        });
                        const result = await session.browser.checkScreen('success-page', {
                            fullPage: true,
                            hideElements: ['.ads']
                        });
                        if (result.misMatchPercentage > 0.1) {
                            throw new Error(`Visual regression detected: ${result.misMatchPercentage}% mismatch`);
                        }
                    }
                }
            }
        ];

        await flowManager.executeFlow(steps as UserFlowStep[]);
    });
});
