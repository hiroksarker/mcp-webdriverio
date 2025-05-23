import type { MCPServer } from '../../src/lib/mcp-server.js';

export class LoginPage {
    constructor(private server: MCPServer, private sessionId: string) {}

    // Actions
    async login(username: string, password: string) {
        // Find username field
        const usernameElement = await this.server.handleMessage({
            type: 'tool',
            name: 'find_element',
            params: { 
                sessionId: this.sessionId, 
                by: 'css selector', 
                value: '#username' 
            }
        });

        // Find password field
        const passwordElement = await this.server.handleMessage({
            type: 'tool',
            name: 'find_element',
            params: { 
                sessionId: this.sessionId, 
                by: 'css selector', 
                value: '#password' 
            }
        });

        // Find submit button
        const submitElement = await this.server.handleMessage({
            type: 'tool',
            name: 'find_element',
            params: { 
                sessionId: this.sessionId, 
                by: 'css selector', 
                value: '#submit' 
            }
        });

        // Type username
        await this.server.handleMessage({
            type: 'tool',
            name: 'element_action',
            params: { 
                sessionId: this.sessionId, 
                elementId: usernameElement.content[0].elementId,
                action: 'type',
                value: username
            }
        });

        // Type password
        await this.server.handleMessage({
            type: 'tool',
            name: 'element_action',
            params: { 
                sessionId: this.sessionId, 
                elementId: passwordElement.content[0].elementId,
                action: 'type',
                value: password
            }
        });

        // Click submit
        await this.server.handleMessage({
            type: 'tool',
            name: 'element_action',
            params: { 
                sessionId: this.sessionId, 
                elementId: submitElement.content[0].elementId,
                action: 'click'
            }
        });
    }

    async getErrorMessage(): Promise<string> {
        const element = await this.server.handleMessage({
            type: 'tool',
            name: 'find_element',
            params: { 
                sessionId: this.sessionId, 
                by: 'css selector', 
                value: '#error' 
            }
        });

        const response = await this.server.handleMessage({
            type: 'tool',
            name: 'getText',
            params: { 
                sessionId: this.sessionId, 
                elementId: element.content[0].elementId
            }
        });
        return response.content[0].text;
    }

    async getWelcomeMessage(): Promise<string> {
        const element = await this.server.handleMessage({
            type: 'tool',
            name: 'find_element',
            params: { 
                sessionId: this.sessionId, 
                by: 'css selector', 
                value: '.post-title' 
            }
        });

        const response = await this.server.handleMessage({
            type: 'tool',
            name: 'getText',
            params: { 
                sessionId: this.sessionId, 
                elementId: element.content[0].elementId
            }
        });
        return response.content[0].text;
    }

    async isLoggedIn(): Promise<boolean> {
        try {
            await this.server.handleMessage({
                type: 'tool',
                name: 'find_element',
                params: { 
                    sessionId: this.sessionId, 
                    by: 'css selector', 
                    value: '.post-title' 
                }
            });
            return true;
        } catch (error) {
            return false;
        }
    }
} 