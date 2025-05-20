# MCP WebdriverIO Package Documentation

This document provides detailed information about using the MCP WebdriverIO package in your projects.

## Installation

```bash
npm install mcp-webdriverio
# or
yarn add mcp-webdriverio
```

## Quick Start

```typescript
import { Server } from 'mcp-webdriverio';

// Create and start the server
const server = new Server(3000);
await server.listen();

try {
    // Start a browser session
    const { content: [{ sessionId }] } = await server.mcpServer.handleMessage({
        type: 'tool',
        name: 'start_browser',
        params: {
            browserName: 'chrome',
            headless: true
        }
    });

    // Your automation code here...

} finally {
    // Always close the server when done
    await server.close();
}
```

## API Reference

### Server Class

```typescript
import { Server } from 'mcp-webdriverio';

const server = new Server(port: number);
```

#### Methods

- `listen(): Promise<void>` - Start the server
- `close(): Promise<void>` - Stop the server and cleanup resources

### Message Format

All interactions with the server are done through messages with the following structure:

```typescript
interface MCPMessage {
    type: 'tool';
    name: string;
    params: Record<string, any>;
}
```

### Response Format

Server responses follow this structure:

```typescript
interface MCPResponse {
    content: Array<{
        [key: string]: any;
    }>;
    error?: string;
}
```

## Usage Examples

### 1. Basic Browser Automation

```typescript
import { Server } from 'mcp-webdriverio';

async function runAutomation() {
    const server = new Server(3000);
    await server.listen();

    try {
        // Start browser
        const startResponse = await server.mcpServer.handleMessage({
            type: 'tool',
            name: 'start_browser',
            params: {
                browserName: 'chrome',
                headless: true
            }
        });
        const sessionId = startResponse.content[0].sessionId;

        // Navigate to a page
        await server.mcpServer.handleMessage({
            type: 'tool',
            name: 'navigate',
            params: {
                sessionId,
                url: 'https://example.com'
            }
        });

        // Get current URL
        const urlResponse = await server.mcpServer.handleMessage({
            type: 'tool',
            name: 'get_url',
            params: { sessionId }
        });
        console.log('Current URL:', urlResponse.content[0].url);

    } finally {
        await server.close();
    }
}
```

### 2. Form Interaction

```typescript
async function fillForm(server: Server, sessionId: string) {
    // Find and fill input field
    const inputResponse = await server.mcpServer.handleMessage({
        type: 'tool',
        name: 'find_element',
        params: {
            sessionId,
            by: 'css selector',
            value: '#search-input'
        }
    });

    await server.mcpServer.handleMessage({
        type: 'tool',
        name: 'element_action',
        params: {
            sessionId,
            elementId: inputResponse.content[0].elementId,
            action: 'type',
            value: 'search term'
        }
    });

    // Find and click submit button
    const buttonResponse = await server.mcpServer.handleMessage({
        type: 'tool',
        name: 'find_element',
        params: {
            sessionId,
            by: 'css selector',
            value: '#submit-button'
        }
    });

    await server.mcpServer.handleMessage({
        type: 'tool',
        name: 'element_action',
        params: {
            sessionId,
            elementId: buttonResponse.content[0].elementId,
            action: 'click'
        }
    });
}
```

### 3. Page Object Pattern

```typescript
// login.page.ts
export class LoginPage {
    constructor(private server: Server, private sessionId: string) {}

    async login(username: string, password: string) {
        // Find and fill username
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

        // Similar steps for password and submit...
    }

    async getErrorMessage() {
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
}

// Usage
const loginPage = new LoginPage(server, sessionId);
await loginPage.login('user', 'pass');
const error = await loginPage.getErrorMessage();
```

### 4. Error Handling

```typescript
async function safeElementAction(server: Server, sessionId: string) {
    try {
        const response = await server.mcpServer.handleMessage({
            type: 'tool',
            name: 'find_element',
            params: {
                sessionId,
                by: 'css selector',
                value: '#non-existent'
            }
        });

        // Process response...

    } catch (error) {
        if (error.message.includes('Element not found')) {
            console.log('Element not found, handling gracefully...');
            // Handle the error appropriately
        } else {
            throw error; // Re-throw unexpected errors
        }
    }
}
```

## TypeScript Support

The package includes TypeScript definitions. You can use the following types in your code:

```typescript
import { 
    Server,
    MCPMessage,
    MCPResponse,
    BrowserName,
    ElementAction,
    LocatorStrategy
} from 'mcp-webdriverio';

// Type definitions
type BrowserName = 'chrome' | 'firefox' | 'safari';
type ElementAction = 'click' | 'type' | 'clear' | 'submit';
type LocatorStrategy = 'css selector' | 'xpath' | 'id';
```

## Common Issues and Solutions

### 1. Element Not Found

**Problem**: Getting "Element not found" errors
**Solutions**:
- Add appropriate timeouts for dynamic elements
- Verify the selector is correct
- Check if the element is in an iframe
- Ensure the page is fully loaded

```typescript
// Add timeout to find_element
await server.mcpServer.handleMessage({
    type: 'tool',
    name: 'find_element',
    params: {
        sessionId,
        by: 'css selector',
        value: '#dynamic-element',
        timeout: 5000 // 5 seconds
    }
});
```

### 2. Session Management

**Problem**: Browser sessions not closing properly
**Solution**: Always use try/finally to ensure cleanup

```typescript
const server = new Server(3000);
await server.listen();

try {
    // Your automation code
} finally {
    // This will always run, even if there's an error
    await server.close();
}
```

### 3. Cross-Browser Testing

**Problem**: Tests failing in different browsers
**Solution**: Use appropriate selectors and handle browser-specific behavior

```typescript
// Use robust selectors
const selectors = {
    chrome: '#chrome-specific',
    firefox: '#firefox-specific',
    safari: '#safari-specific'
};

const selector = selectors[browserName] || '#fallback-selector';
```

## Best Practices

1. **Session Management**
   - Always close browser sessions
   - Use unique session IDs
   - Implement proper error handling

2. **Element Selection**
   - Prefer CSS selectors over XPath
   - Use unique, stable selectors
   - Add appropriate timeouts

3. **Code Organization**
   - Use page objects
   - Implement proper error handling
   - Keep selectors in a central location

4. **Performance**
   - Reuse browser sessions when possible
   - Implement proper cleanup
   - Use appropriate timeouts

## Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

## License

MIT License - see [LICENSE](LICENSE) for details. 