import { UserFlowManager } from '../../src/lib/user/UserFlowManager';
import type { UserFlowStep, UserSession, UserFlowContext } from '../../src/lib/types';
import { expect } from 'chai';

describe('Multi-User Flow Example', function() {
    this.timeout(30000); // Increase timeout to 30 seconds

    let flowManager: UserFlowManager;

    beforeEach(async () => {
        flowManager = new UserFlowManager({
            maxConcurrentUsers: 2,
            defaultBrowserOptions: {
                browserName: 'chrome',
                headless: true
            }
        });
    });

    afterEach(async () => {
        await flowManager.cleanup();
    });

    it('should execute a multi-user flow', async () => {
        // Create two user sessions
        const user1 = await flowManager.createSession({
            browserName: 'chrome',
            headless: true,
            viewport: { width: 1920, height: 1080 }
        });

        const user2 = await flowManager.createSession({
            browserName: 'chrome',
            headless: true,
            viewport: { width: 1920, height: 1080 }
        });

        // Define flow steps
        const steps: UserFlowStep[] = [
            {
                name: 'navigate-to-home',
                execute: async (session: UserSession) => {
                    await session.browser.url('https://example.com');
                    await session.browser.$('h1').waitForDisplayed();
                    const title = await session.browser.getTitle();
                    expect(title).to.equal('Example Domain');
                }
            },
            {
                name: 'user1-clicks-link',
                dependencies: ['navigate-to-home'],
                execute: async (session: UserSession, context: UserFlowContext) => {
                    if (session.id === user1.id) {
                        const link = await session.browser.$('a');
                        await link.click();
                        await session.browser.waitUntil(
                            async () => {
                                const title = await session.browser.getTitle();
                                return title !== 'Example Domain';
                            },
                            { timeout: 5000, timeoutMsg: 'Page title did not change after clicking link' }
                        );
                        context.sharedData.set('clickedLink', true);
                    }
                }
            },
            {
                name: 'user2-verifies-change',
                dependencies: ['user1-clicks-link'],
                execute: async (session: UserSession, context: UserFlowContext) => {
                    if (session.id === user2.id) {
                        await session.browser.waitUntil(
                            async () => context.sharedData.get('clickedLink') === true,
                            { timeout: 5000, timeoutMsg: 'User1 did not complete link click' }
                        );
                        await session.browser.waitUntil(
                            async () => {
                                const title = await session.browser.getTitle();
                                return title !== 'Example Domain';
                            },
                            { timeout: 5000, timeoutMsg: 'Page title did not change for user2' }
                        );
                    }
                }
            }
        ];

        // Execute the flow
        await flowManager.executeFlow(steps);
    });
}); 