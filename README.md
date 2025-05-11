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
- Taking screenshots
- Checking element state (displayed/enabled)
- Keyboard and mouse actions

## Features

- Start browser sessions with customizable options (headless, arguments)
- Navigate to URLs
- Find elements using various locator strategies (`id`, `css`, `xpath`, etc.)
- Click, type, and interact with elements
- Perform mouse actions (hover, drag and drop, double/right click)
- Handle keyboard input
- Take screenshots (to file or as base64)
- Upload files
- Check if elements are displayed or enabled
- Clear input fields

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
   npm run dev
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
│   ├── lib/           # Core library code (server.ts is the main entry)
│   └── types/         # TypeScript type definitions
├── package.json
├── tsconfig.json
└── README.md
```

## Example Supported Commands

- **Start browser session:**  
  `start_browser` (with options for browser type, headless, arguments)
- **Navigate:**  
  `navigate` (to a URL)
- **Element actions:**  
  `find_element`, `click_element`, `type_text`, `send_keys`, `get_element_text`, `get_attribute`, `clear_text`
- **Mouse actions:**  
  `hover`, `drag_and_drop`, `double_click`, `right_click`
- **Keyboard actions:**  
  `press_key`
- **File upload:**  
  `upload_file`
- **Screenshot:**  
  `take_screenshot`
- **Element state:**  
  `is_displayed`, `is_enabled`
- **Wait for element:**  
  `wait_for_element`
- **Close session:**  
  `close_session`

## Element Locator Strategies

The server supports the following locator strategies (as defined in `server.ts`):

- **id:**  
  Use the element's id (e.g., `{ by: "id", value: "myElement" }`).
- **css:**  
  Use a CSS selector (e.g., `{ by: "css", value: ".myClass" }`).
- **xpath:**  
  Use an XPath expression (e.g., `{ by: "xpath", value: "//div[contains(@class, 'myClass')]" }`).
- **name:**  
  Use the element's name attribute (e.g., `{ by: "name", value: "myName" }`).
- **tag:**  
  Use the tag name (e.g., `{ by: "tag", value: "div" }`).
- **class:**  
  Use the element's class (e.g., `{ by: "class", value: "myClass" }`).
- **linkText:**  
  Use the exact text of a link (e.g., `{ by: "linkText", value: "Click Me" }`).
- **partialLinkText:**  
  Use a substring of a link's text (e.g., `{ by: "partialLinkText", value: "Click" }`).
- **shadow:**  
  Use a shadow DOM selector (e.g., `{ by: "shadow", value: "shadowSelector" }`).

### Example Usage

For example, to find an element using its id, you can call the `find_element` tool as follows:

```json
{
  "by": "id",
  "value": "myElement",
  "timeout": 10000
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

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License – see the [LICENSE](LICENSE) file for details.

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