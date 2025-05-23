import { Browser } from 'webdriverio';
import { Logger } from './logger.js';
import crypto from 'crypto';

export interface SessionInfo {
    id: string;
    browser: Browser;
    createdAt: Date;
}

export class SessionManager {
    private sessions: Map<string, SessionInfo> = new Map();
    private currentSessionId: string | null = null;

    constructor(private logger: Logger) {}

    async createSession(browser: Browser): Promise<SessionInfo> {
        const id = crypto.randomUUID();
        const session: SessionInfo = {
            id,
            browser,
            createdAt: new Date()
        };

        this.sessions.set(id, session);
        this.currentSessionId = id;
        this.logger.debug('Created new session:', { sessionId: id });
        return session;
    }

    getSession(sessionId: string): SessionInfo | undefined {
        return this.sessions.get(sessionId);
    }

    getAllSessions(): SessionInfo[] {
        return Array.from(this.sessions.values());
    }

    async closeSession(sessionId: string): Promise<void> {
        const session = this.sessions.get(sessionId);
        if (session) {
            try {
                await session.browser.deleteSession();
                this.sessions.delete(sessionId);
                if (this.currentSessionId === sessionId) {
                    this.currentSessionId = null;
                }
                this.logger.debug('Closed session:', { sessionId });
            } catch (error) {
                this.logger.error('Error closing session:', error);
                throw error;
            }
        }
    }

    async closeAllSessions(): Promise<void> {
        const sessions = Array.from(this.sessions.values());
        for (const session of sessions) {
            await this.closeSession(session.id);
        }
    }
} 

export class BrowserFactory {
    // Basic implementation
}

export function registerBrowserTools() {
    // Basic implementation
} 