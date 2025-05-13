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
  - Find elements using various locator strategies
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
npm install
```

## Usage

1. **Start the MCP WebdriverIO server:**
   ```bash
   npm start
   ```
   or
   ```bash
   npm run build
   node dist/lib/server.js
   ```

2. **Configure your MCP client** to connect to this server.

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
│   └── types/         # TypeScript type definitions
├── tests/             # Test suite
│   ├── element-finding-example.test.ts
│   └── ...           # Other test files
├── package.json
├── tsconfig.json
└── README.md
```

## Element Locator Strategies

The server supports the following locator strategies:

- **css selector:** Use CSS selectors (e.g., `#id`, `.class`, `[attr=value]`)
- **xpath:** Use XPath expressions
- **id:** Use element ID
- **name:** Use element name attribute
- **tag name:** Use HTML tag name
- **class name:** Use element class name

## Development

1. **Build the project:**
   ```bash
   npm run build
   ```

2. **Run tests:**
   ```bash
   npm test
   ```

3. **Run tests in watch mode:**
   ```bash
   npm run test:watch
   ```

## Testing

The project uses Jest for testing. Tests are located in the `tests/` directory and can be run using:

```bash
npm test
```

See the [tests README](./tests/README.md) for more details about testing.

## License

MIT