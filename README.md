# MCP WebdriverIO

A Message Control Protocol (MCP) server implementation for WebdriverIO, enabling remote browser automation through a message-based interface.

## Overview

This project implements a Message Control Protocol server that wraps WebdriverIO functionality, allowing browser automation through a standardized message-based interface. It provides a set of tools for browser control, element interaction, and session management.

## Features

- Browser session management (start, close)
- Navigation control
- Element interaction (find, click, type, get text)
- Cross-browser support (Chrome, Firefox, Safari)
- Headless mode support
- Session-based architecture
- TypeScript support

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Chrome, Firefox, or Safari browser installed
- For Chrome/Firefox: WebDriver installed (ChromeDriver/geckodriver)

## Installation

1. Clone the repository:
```bash
git clone https://github.com/hiroksarker/mcp-webdriverio.git
cd mcp-webdriverio
```

2. Install dependencies:
```bash
npm install
```

## Project Structure

```
mcp-webdriverio/
├── src/
│   ├── lib/
│   │   ├── server/
│   │   │   ├── tools/
│   │   │   │   ├── browser.ts    # Browser control tools
│   │   │   │   ├── elements.ts   # Element interaction tools
│   │   │   │   └── navigation.ts # Navigation tools
│   │   │   └── server.ts         # MCP server implementation
│   │   └── types.ts              # TypeScript type definitions
│   └── index.ts                  # Main entry point
├── tests/
│   ├── pages/
│   │   └── LoginPage.ts          # Page object for login page
│   └── specs/
│       └── example.spec.ts       # Example test suite
├── package.json
└── README.md
```

## Available Tools

### Browser Tools
- `start_browser`: Start a new browser session
  ```typescript
  {
    type: 'tool',
    name: 'start_browser',
    params: {
      browserName: 'chrome' | 'firefox' | 'safari',
      headless?: boolean
    }
  }
  ```
- `close_browser`: Close an existing browser session
  ```typescript
  {
    type: 'tool',
    name: 'close_browser',
    params: {
      sessionId: string
    }
  }
  ```

### Navigation Tools
- `navigate`: Navigate to a URL
  ```typescript
  {
    type: 'tool',
    name: 'navigate',
    params: {
      sessionId: string,
      url: string
    }
  }
  ```
- `get_url`: Get current page URL
  ```typescript
  {
    type: 'tool',
    name: 'get_url',
    params: {
      sessionId: string
    }
  }
  ```

### Element Tools
- `find_element`: Find an element on the page
  ```typescript
  {
    type: 'tool',
    name: 'find_element',
    params: {
      sessionId: string,
      by: 'css selector' | 'xpath' | 'id',
      value: string,
      timeout?: number
    }
  }
  ```
- `element_action`: Perform actions on elements
  ```typescript
  {
    type: 'tool',
    name: 'element_action',
    params: {
      sessionId: string,
      elementId: string,
      action: 'click' | 'type' | 'clear' | 'submit',
      value?: string
    }
  }
  ```
- `getText`: Get text content of an element
  ```typescript
  {
    type: 'tool',
    name: 'getText',
    params: {
      sessionId: string,
      elementId: string
    }
  }
  ```

## Running Tests

1. Start the MCP server:
```bash
npm start
```

2. Run the test suite:
```bash
npm test
```

## Example Usage

Here's a simple example of using the MCP server to automate a login flow:

```typescript
// Start browser session
const startResponse = await server.mcpServer.handleMessage({
    type: 'tool',
    name: 'start_browser',
    params: {
        browserName: 'chrome',
        headless: true
    }
});
const sessionId = startResponse.content[0].sessionId;

// Navigate to login page
await server.mcpServer.handleMessage({
    type: 'tool',
    name: 'navigate',
    params: {
        sessionId,
        url: 'https://example.com/login'
    }
});

// Find and fill username
const usernameResponse = await server.mcpServer.handleMessage({
    type: 'tool',
    name: 'find_element',
    params: {
        sessionId,
        by: 'css selector',
        value: '#username'
    }
});
await server.mcpServer.handleMessage({
    type: 'tool',
    name: 'element_action',
    params: {
        sessionId,
        elementId: usernameResponse.content[0].elementId,
        action: 'type',
        value: 'testuser'
    }
});

// Close browser session
await server.mcpServer.handleMessage({
    type: 'tool',
    name: 'close_browser',
    params: { sessionId }
});
```

## Best Practices

1. **Session Management**
   - Always close browser sessions after use
   - Use unique session IDs for parallel test execution
   - Handle session cleanup in error cases

2. **Element Interaction**
   - Use appropriate selectors (prefer CSS selectors over XPath)
   - Add timeouts for dynamic elements
   - Implement proper error handling for element not found cases

3. **Page Objects**
   - Use page objects to encapsulate page-specific logic
   - Keep selectors in page objects
   - Implement reusable actions in page objects

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- WebdriverIO team for the excellent automation framework
- Selenium WebDriver for the WebDriver protocol
- All contributors who have helped improve this project