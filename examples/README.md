# MCP WebdriverIO Examples

This directory contains examples demonstrating how to use the `mcp-webdriverio` package in different scenarios.

## Basic Usage Example

The `basic-usage.js` example shows how to:
1. Create and start an MCP server
2. Navigate to a webpage
3. Find and interact with elements
4. Take screenshots
5. Handle cleanup

### Running the Example

1. First, install the package:
```bash
npm install mcp-webdriverio
```

2. Create a new file (e.g., `my-script.js`) and copy the example code:
```javascript
import { MCPServer } from 'mcp-webdriverio';

async function main() {
    const server = new MCPServer({
        port: 3000,
        browserOptions: {
            headless: true,
            browserName: 'chrome'
        }
    });

    try {
        await server.listen();
        // ... rest of the example code
    } finally {
        await server.close();
    }
}

main().catch(console.error);
```

3. Run the script:
```bash
node my-script.js
```

## Available Commands

The MCP server supports various commands for browser automation:

### Navigation
- `navigate`: Navigate to a URL
```javascript
await server.handleMessage({
    type: 'command',
    name: 'navigate',
    args: { url: 'https://example.com' }
});
```

### Element Interaction
- `click`: Click an element
```javascript
await server.handleMessage({
    type: 'command',
    name: 'click',
    args: {
        selector: 'button.submit',
        strategy: 'css selector'
    }
});
```

- `type`: Type text into an element
```javascript
await server.handleMessage({
    type: 'command',
    name: 'type',
    args: {
        selector: 'input[name="username"]',
        text: 'myusername',
        strategy: 'css selector'
    }
});
```

### Browser Information
- `getTitle`: Get the page title
```javascript
await server.handleMessage({
    type: 'command',
    name: 'getTitle'
});
```

### Screenshots
- `takeScreenshot`: Capture a screenshot
```javascript
await server.handleMessage({
    type: 'command',
    name: 'takeScreenshot',
    args: { filename: 'screenshot.png' }
});
```

## Configuration Options

The `MCPServer` constructor accepts the following options:

```javascript
const server = new MCPServer({
    port: 3000,                    // Port to run the server on
    browserOptions: {              // WebdriverIO browser options
        headless: true,            // Run browser in headless mode
        browserName: 'chrome',     // Browser to use
        timeout: 10000,            // Command timeout in milliseconds
        // ... other WebdriverIO options
    }
});
```

## Error Handling

Always wrap server operations in try-catch blocks:

```javascript
try {
    await server.handleMessage({
        type: 'command',
        name: 'navigate',
        args: { url: 'https://example.com' }
    });
} catch (error) {
    console.error('Navigation failed:', error);
} finally {
    await server.close();  // Always clean up
}
```

## Best Practices

1. Always call `server.close()` in a finally block to ensure proper cleanup
2. Use appropriate timeouts for long-running operations
3. Handle errors appropriately for each command
4. Use meaningful selectors and strategies for element interaction
5. Consider using headless mode for automated environments 