import { Server } from '../../src/lib/server/server.js';

export class LoginPage {
    constructor(private server: Server, private sessionId: string) {}

    // Actions
    async login(username: string, password: string) {
        // Find and type username
        const usernameResponse = await this.server.mcpServer.handleMessage({
            type: 'tool',
            name: 'find_element',
            params: {
                sessionId: this.sessionId,
                by: 'css selector',
                value: '#username'
            }
        });
        await this.server.mcpServer.handleMessage({
            type: 'tool',
            name: 'element_action',
            params: {
                sessionId: this.sessionId,
                elementId: usernameResponse.content[0].elementId,
                action: 'type',
                value: username
            }
        });

        // Find and type password
        const passwordResponse = await this.server.mcpServer.handleMessage({
            type: 'tool',
            name: 'find_element',
            params: {
                sessionId: this.sessionId,
                by: 'css selector',
                value: '#password'
            }
        });
        await this.server.mcpServer.handleMessage({
            type: 'tool',
            name: 'element_action',
            params: {
                sessionId: this.sessionId,
                elementId: passwordResponse.content[0].elementId,
                action: 'type',
                value: password
            }
        });

        // Find and click submit button
        const submitResponse = await this.server.mcpServer.handleMessage({
            type: 'tool',
            name: 'find_element',
            params: {
                sessionId: this.sessionId,
                by: 'css selector',
                value: '#submit'
            }
        });
        await this.server.mcpServer.handleMessage({
            type: 'tool',
            name: 'element_action',
            params: {
                sessionId: this.sessionId,
                elementId: submitResponse.content[0].elementId,
                action: 'click'
            }
        });

        // Wait for navigation
        await new Promise(resolve => setTimeout(resolve, 1000));

        const browserInfo = await this.server.mcpServer.handleMessage({
            type: 'tool',
            name: 'get_browser_info',
            params: { sessionId: this.sessionId }
        });
        return { url: browserInfo.content[0].url };
    }

    async getErrorMessage(): Promise<string> {
        const errorResponse = await this.server.mcpServer.handleMessage({
            type: 'tool',
            name: 'find_element',
            params: {
                sessionId: this.sessionId,
                by: 'css selector',
                value: '#error'
            }
        });
        const textResponse = await this.server.mcpServer.handleMessage({
            type: 'tool',
            name: 'getText',
            params: {
                sessionId: this.sessionId,
                elementId: errorResponse.content[0].elementId
            }
        });
        return textResponse.content[0].text;
    }

    async getWelcomeMessage(): Promise<string> {
        const welcomeResponse = await this.server.mcpServer.handleMessage({
            type: 'tool',
            name: 'find_element',
            params: {
                sessionId: this.sessionId,
                by: 'css selector',
                value: '.post-title'
            }
        });
        const textResponse = await this.server.mcpServer.handleMessage({
            type: 'tool',
            name: 'getText',
            params: {
                sessionId: this.sessionId,
                elementId: welcomeResponse.content[0].elementId
            }
        });
        return textResponse.content[0].text;
    }

    async isLoggedIn(): Promise<boolean> {
        try {
            const welcomeResponse = await this.server.mcpServer.handleMessage({
                type: 'tool',
                name: 'find_element',
                params: {
                    sessionId: this.sessionId,
                    by: 'css selector',
                    value: '.post-title'
                }
            });
            return welcomeResponse.content[0].elementId !== undefined;
        } catch (error) {
            return false;
        }
    }
} 