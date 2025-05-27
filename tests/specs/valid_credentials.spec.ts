import { Server } from '../../src/lib/server/server.js';

export async function runValidCredentials(server: Server, sessionId: string): Promise<boolean> {
    try {
        const response = await server.mcpServer.handleMessage({
            type: 'tool',
            name: 'navigate',
            params: {
                url: 'https://example.com/login',
                sessionId
            }
        });

        // Add your login test steps here
        // For example:
        await server.mcpServer.handleMessage({
            type: 'tool',
            name: 'type',
            params: {
                selector: '#username',
                value: 'testuser',
                sessionId
            }
        });

        await server.mcpServer.handleMessage({
            type: 'tool',
            name: 'type',
            params: {
                selector: '#password',
                value: 'password123',
                sessionId
            }
        });

        await server.mcpServer.handleMessage({
            type: 'tool',
            name: 'click',
            params: {
                selector: '#login-button',
                sessionId
            }
        });

        return true;
    } catch (error) {
        console.error('Login test failed:', error);
        return false;
    }
}
