import { remote } from 'webdriverio';
import type { UserFlowOptions, UserFlowContext, UserFlowStep, UserSession as IUserSession } from '../types';
import { UserSession } from './UserSession';

export class UserFlowManager {
    private options: UserFlowOptions;
    private context: UserFlowContext;
    private activeSessions: Map<string, UserSession>;

    constructor(options: UserFlowOptions = {}) {
        this.options = {
            maxConcurrentUsers: options.maxConcurrentUsers || 5,
            defaultBrowserOptions: options.defaultBrowserOptions || {
                browserName: 'chrome',
                headless: true
            },
            sessionTimeout: options.sessionTimeout || 30000
        };

        this.context = {
            sessions: new Map(),
            sharedData: new Map(),
            flowId: Date.now().toString()
        };

        this.activeSessions = new Map();
    }

    async createSession(options: IUserSession['options'] = {}): Promise<UserSession> {
        if (this.activeSessions.size >= (this.options.maxConcurrentUsers || 5)) {
            throw new Error('Maximum number of concurrent sessions reached');
        }

        const session = new UserSession({
            ...this.options.defaultBrowserOptions,
            ...options
        });

        const browser = await remote({
            capabilities: {
                browserName: session.options.browserName,
                'goog:chromeOptions': {
                    args: session.options.headless ? ['--headless'] : []
                }
            },
            logLevel: 'error'
        });

        session.browser = browser;
        await session.initialize();
        
        this.activeSessions.set(session.id, session);
        this.context.sessions.set(session.id, session);

        return session;
    }

    async executeFlow(steps: UserFlowStep[]): Promise<void> {
        const executedSteps = new Set<string>();

        for (const step of steps) {
            if (step.dependencies) {
                for (const dep of step.dependencies) {
                    if (!executedSteps.has(dep)) {
                        throw new Error(`Dependency step "${dep}" not executed before "${step.name}"`);
                    }
                }
            }

            for (const session of this.activeSessions.values()) {
                await session.executeStep(async (s) => {
                    await step.execute(s, this.context);
                });
            }

            executedSteps.add(step.name);
        }
    }

    async cleanup(): Promise<void> {
        const cleanupPromises = Array.from(this.activeSessions.values()).map(session => session.cleanup());
        await Promise.all(cleanupPromises);
        this.activeSessions.clear();
        this.context.sessions.clear();
        this.context.sharedData.clear();
    }

    getContext(): UserFlowContext {
        return this.context;
    }

    getSession(sessionId: string): UserSession | undefined {
        return this.activeSessions.get(sessionId);
    }

    setSharedData(key: string, value: any): void {
        this.context.sharedData.set(key, value);
    }

    getSharedData(key: string): any {
        return this.context.sharedData.get(key);
    }
} 