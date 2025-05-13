// Example: Using MCP WebdriverIO package
import { MCPServer } from 'mcp-webdriverio';

async function main() {
    // Create an MCP server instance
    const server = new MCPServer({
        port: 3000,
        // Optional: Configure browser options
        browserOptions: {
            headless: true,
            browserName: 'chrome'
        }
    });

    try {
        // Start the server
        await server.listen();
        console.log('MCP Server started on port 3000');

        // Example: Handle a navigation command
        const response = await server.handleMessage({
            type: 'command',
            name: 'navigate',
            args: {
                url: 'https://example.com'
            }
        });
        console.log('Navigation response:', response);

        // Example: Find and click an element
        const clickResponse = await server.handleMessage({
            type: 'command',
            name: 'click',
            args: {
                selector: 'a[href="/about"]',
                strategy: 'css selector'
            }
        });
        console.log('Click response:', clickResponse);

        // Example: Get page title
        const titleResponse = await server.handleMessage({
            type: 'command',
            name: 'getTitle'
        });
        console.log('Page title:', titleResponse);

        // Example: Take a screenshot
        const screenshotResponse = await server.handleMessage({
            type: 'command',
            name: 'takeScreenshot',
            args: {
                filename: 'example-screenshot.png'
            }
        });
        console.log('Screenshot saved:', screenshotResponse);

    } catch (error) {
        console.error('Error:', error);
    } finally {
        // Clean up: Close the browser and stop the server
        await server.close();
        console.log('Server stopped');
    }
}

// Run the example
main().catch(console.error); 