# MCP WebdriverIO

A Model Context Protocol (MCP) server implementation for WebdriverIO, enabling AI models to interact with web browsers through natural language commands.

## Overview

This package provides a bridge between AI models and WebdriverIO, allowing AI assistants to control web browsers using natural language. It implements the Model Context Protocol (MCP) to enable AI models to perform web automation tasks like:

- Navigating to URLs
- Clicking elements
- Typing text
- Getting element attributes
- Drag and drop operations
- File uploads
- And more...

## Features

- Start browser sessions with customizable options
- Navigate to URLs
- Find elements using various locator strategies
- Click, type, and interact with elements
- Perform mouse actions (hover, drag and drop)
- Handle keyboard input
- Take screenshots
- Upload files
- Support for headless mode

## Requirements

- Node.js >= 18
- A modern web browser (Chrome, Firefox, Safari, etc.)

## Installation

### Option 1: Using npm
```bash
npm install mcp-webdriverio
```

### Option 2: Using npx
```bash
npx -y mcp-webdriverio
```

### Option 3: Using Docker
```bash
# Build the Docker image
docker build -t mcp-webdriverio .

# Run the container
docker run -it --rm \
  -v $(pwd)/mcp-config.json:/usr/src/app/mcp-config.json \
  -v $(pwd)/uploads:/usr/src/app/uploads \
  -v $(pwd)/screenshots:/usr/src/app/screenshots \
  mcp-webdriverio
```

For development with hot-reload:
```bash
docker run -it --rm \
  -v $(pwd):/usr/src/app \
  -v /usr/src/app/node_modules \
  mcp-webdriverio npm run dev
```

### Option 4: Global Installation
```bash
npm install -g mcp-webdriverio
```

## Usage

### Basic Setup

1. Create a configuration file (e.g., `mcp-config.json`):
```json
{
  "browser": {
    "capabilities": {
      "browserName": "chrome"
    }
  }
}
```

2. Start the MCP server:
```bash
mcp-webdriverio
```

### Use with MCP Clients

#### Goose Desktop
Copy and paste this link into your browser to add the extension to Goose desktop:
```
goose://extension?cmd=npx&arg=-y&arg=mcp-webdriverio&id=webdriverio-mcp&name=WebdriverIO%20MCP&description=automates%20browser%20interactions
```

#### Other MCP Clients (e.g., Claude Desktop)
Add to your MCP configuration:
```json
{
  "mcpServers": {
    "webdriverio": {
      "command": "npx",
      "args": ["-y", "mcp-webdriverio"]
    }
  }
}
```

## Development

1. Clone the repository:
```bash
git clone https://github.com/hiroksarker/mcp-webdriverio.git
cd mcp-webdriverio
```

2. Install dependencies:
```bash
npm install
```

3. Build the project:
```bash
npm run build
```

4. Start in development mode:
```bash
npm run dev
```

## Project Structure

```
mcp-webdriverio/
├── dist/               # Compiled JavaScript files
├── src/
│   ├── bin/           # CLI entry point
│   ├── lib/           # Core library code
│   │   ├── server.ts  # MCP server implementation
│   │   └── driver.ts  # WebdriverIO driver setup
│   └── types/         # TypeScript type definitions
├── package.json
└── tsconfig.json
```

## Implementation Differences

| Feature | WebdriverIO Approach |
|---------|---------------------|
| Finding Elements | `browser.$('#foo')` |
| Waiting for Elements | `element.waitForExist()` |
| Clicking | `element.click()` |
| Entering Text | `element.setValue('text')` |
| Handling Dropdowns | Direct element interaction |
| Taking Screenshots | `browser.takeScreenshot()` |

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License - see the [LICENSE](LICENSE) file for details.

## Keywords

- mcp
- webdriverio
- automation
- testing
- browser
- selenium
- ai
- natural language
- browser automation
