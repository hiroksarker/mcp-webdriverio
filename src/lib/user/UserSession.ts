import { v4 as uuidv4 } from 'uuid';
import type { UserSession as IUserSession } from '../types';
import type { browser } from '@wdio/globals';

export class UserSession implements IUserSession {
    public id: string;
    public browser: typeof browser;
    public options: IUserSession['options'];
    public metadata: Record<string, any>;

    constructor(options: IUserSession['options'] = {}) {
        this.id = uuidv4();
        this.options = {
            browserName: options.browserName || 'chrome',
            headless: options.headless ?? true,
            userAgent: options.userAgent,
            viewport: options.viewport || { width: 1920, height: 1080 }
        };
        this.metadata = {};
    }

    async initialize(): Promise<void> {
        // Browser initialization will be handled by UserFlowManager
        this.metadata.startTime = Date.now();
    }

    async cleanup(): Promise<void> {
        if (this.browser) {
            await this.browser.deleteSession();
        }
    }

    async executeStep(step: (session: UserSession) => Promise<void>): Promise<void> {
        try {
            await step(this);
        } catch (error) {
            console.error(`Error executing step for session ${this.id}:`, error);
            throw error;
        }
    }

    setMetadata(key: string, value: any): void {
        this.metadata[key] = value;
    }

    getMetadata(key: string): any {
        return this.metadata[key];
    }
} 