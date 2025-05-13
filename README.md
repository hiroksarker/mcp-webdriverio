# MCP WebdriverIO

A Model Context Protocol (MCP) server implementation for WebdriverIO, enabling AI models to interact with web browsers through natural language commands.

## Overview

This package provides a bridge between AI models and WebdriverIO, allowing AI assistants to control web browsers using natural language. It implements the Model Context Protocol (MCP) to enable AI models to perform web automation tasks.

## Features

- **Browser Management:**
  - Start browser sessions with customizable options (headless, arguments)
  - Navigate to URLs
  - Close browser sessions
  - Get browser session information

- **Element Interaction:**
  - Find elements using various locator strategies (CSS, XPath, ID, Name, Tag, Class)
  - Find multiple elements
  - Click elements
  - Type text
  - Clear input fields
  - Submit forms
  - Wait for elements with timeout
  - Check element state (displayed/enabled)

- **Network Monitoring:**
  - Monitor network requests
  - Get network request logs
  - Clear network logs

## Requirements

- Node.js >= 18
- Chrome or Firefox browser

## Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/mcp-webdriverio.git
cd mcp-webdriverio

# Install dependencies
npm install

# Build the project
npm run build
```

## Usage

### As a Package

1. Install the package:
```bash
npm install mcp-webdriverio
```

2. Use in your code:
```javascript
import { Server } from 'mcp-webdriverio';

const server = new Server({
    port: 3000,
    browserOptions: {
        headless: true,
        browserName: 'chrome'
    }
});

// Start the server
await server.listen();

// Use the server
try {
    // Start a browser session
    const { content: [{ sessionId }] } = await server.mcpServer.handleMessage({
        type: 'tool',
        name: 'start_browser',
        params: { headless: true }
    });

    // Navigate to a page
    await server.mcpServer.handleMessage({
        type: 'tool',
        name: 'navigate',
        params: {
            sessionId,
            url: 'https://example.com'
        }
    });

    // Find an element
    const { content: [element] } = await server.mcpServer.handleMessage({
        type: 'tool',
        name: 'find_element',
        params: {
            sessionId,
            by: 'css selector',
            value: 'h1'
        }
    });
} finally {
    // Clean up
    await server.close();
}
```

### As a CLI Tool

1. Start the server:
```bash
npm start
```

2. The server will listen on port 3000 by default.

## Project Structure

```
mcp-webdriverio/
├── dist/               # Compiled JavaScript files
├── src/
│   ├── lib/           # Core library code
│   │   ├── server/    # Server implementation
│   │   │   ├── tools/ # Browser, element, and network tools
│   │   │   └── ...    # Server utilities (logger, session, etc.)
│   │   └── ...        # Core server classes
│   ├── types/         # TypeScript type definitions
│   └── bin/           # CLI entry point
├── tests/             # Test suite
│   └── element-finding-example.test.ts
├── examples/          # Usage examples
│   ├── basic-usage.js
│   └── README.md
├── package.json
└── tsconfig.json
```

## Development

1. Install dependencies:
```bash
npm install
```

2. Build the project:
```bash
npm run build
```

3. Run tests:
```bash
npm test
```

4. Watch mode for development:
```bash
npm run dev
```

## Testing

The project uses Jest for testing. Tests are located in the `tests/` directory.

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

## License

MIT