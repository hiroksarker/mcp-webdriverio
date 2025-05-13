import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { Server } from '../src/lib/server/server.js';

describe('Element Finding Example', () => {
    let server: Server;

    beforeAll(async () => {
        server = new Server();
        await server.listen();
    });

    afterAll(async () => {
        await server.close();
    });

    it('should find elements using various locator strategies', async () => {
        // Start a browser session
        const { content: [{ sessionId }] } = await server.mcpServer.handleMessage({
            type: 'tool',
            name: 'start_browser',
            params: { headless: true }
        });
        expect(sessionId).toBeDefined();

        try {
            // Navigate to a test page
            await server.mcpServer.handleMessage({
                type: 'tool',
                name: 'navigate',
                params: {
                    sessionId,
                    url: 'https://example.com'
                }
            });

            // Find element by CSS selector
            const { content: [element] } = await server.mcpServer.handleMessage({
                type: 'tool',
                name: 'find_element',
                params: {
                    sessionId,
                    by: 'css selector',
                    value: 'h1'
                }
            });
            expect(element).toBeDefined();

            // Find elements by tag name
            const { content: [elements] } = await server.mcpServer.handleMessage({
                type: 'tool',
                name: 'find_elements',
                params: {
                    sessionId,
                    by: 'tag name',
                    value: 'p'
                }
            });
            expect(elements.length).toBeGreaterThan(0);

        } finally {
            // Close the browser session
            await server.mcpServer.handleMessage({
                type: 'tool',
                name: 'close_browser',
                params: { sessionId }
            });
        }
    });
}); 