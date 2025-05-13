import { Browser } from 'webdriverio';
import { Logger } from './logger.js';
import crypto from 'crypto';

export interface SessionInfo {
    browser: Browser;
    id: string;
    createdAt: Date;
}

export class SessionManager {
    private sessions: Map<string, SessionInfo> = new Map();
    private currentSessionId: string | null = null;

    constructor(private logger: Logger) {}

    async createSession(browser: Browser): Promise<string> {
        const sessionId = crypto.randomUUID();
        const session: SessionInfo = {
            browser,
            id: sessionId,
            createdAt: new Date()
        };

        this.sessions.set(sessionId, session);
        this.currentSessionId = sessionId;
        this.logger.debug('Created new session:', { sessionId });
        
        return sessionId;
    }

    async closeSession(sessionId: string): Promise<void> {
        const session = this.sessions.get(sessionId);
        if (!session) {
            throw new Error(`No browser session found with ID: ${sessionId}`);
        }

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

    getSession(sessionId: string): SessionInfo | undefined {
        return this.sessions.get(sessionId);
    }

    removeSession(sessionId: string): void {
        this.sessions.delete(sessionId);
        if (this.currentSessionId === sessionId) {
            this.currentSessionId = null;
        }
        this.logger.debug('Removed session:', { sessionId });
    }

    getCurrentSession(): SessionInfo | undefined {
        if (!this.currentSessionId) {
            return undefined;
        }
        return this.sessions.get(this.currentSessionId);
    }

    getAllSessions(): SessionInfo[] {
        return Array.from(this.sessions.values());
    }

    async closeAllSessions(): Promise<void> {
        const sessionIds = Array.from(this.sessions.keys());
        for (const sessionId of sessionIds) {
            await this.closeSession(sessionId);
        }
    }
} 