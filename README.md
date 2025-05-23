# MCP WebdriverIO

A Message Control Protocol (MCP) server implementation for WebdriverIO, enabling remote browser automation through a message-based interface with advanced testing capabilities.

## Overview

This project implements a Message Control Protocol server that wraps WebdriverIO functionality, allowing browser automation through a standardized message-based interface. It provides a comprehensive set of tools for browser control, element interaction, session management, and advanced testing features like visual regression testing and multi-user testing.

## Why MCP WebdriverIO?

MCP WebdriverIO offers several advantages over traditional WebdriverIO implementations:

1. **Message-Based Architecture**
   - Decoupled client-server architecture
   - Language-agnostic interface
   - Easy integration with any system that can send/receive messages
   - Perfect for microservices and distributed systems

2. **Advanced Testing Features**
   - Built-in visual regression testing
   - Multi-user testing support
   - Detailed Allure reporting
   - Automatic screenshot capture for failed tests
   - Cross-browser testing made easy

3. **Enhanced Test Management**
   - Centralized test execution
   - Better resource management
   - Improved test parallelization
   - Detailed test reporting and analytics

4. **Developer Experience**
   - TypeScript-first approach
   - Comprehensive type definitions
   - Intuitive API design
   - Extensive documentation
   - Built-in best practices

## Features

- Browser session management (start, close)
- Navigation control
- Element interaction (find, click, type, get text)
- Cross-browser support (Chrome, Firefox, Safari)
- Headless mode support
- Session-based architecture
- TypeScript support
- Visual regression testing
- Multi-user testing capabilities
- Detailed Allure reporting
- Automatic screenshot capture
- Test parallelization
- Page Object Model support

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
│   │   ├── user/
│   │   │   └── UserFlowManager.ts # Multi-user testing support
│   │   └── types.ts              # TypeScript type definitions
│   └── index.ts                  # Main entry point
├── tests/
│   ├── pages/
│   │   └── LoginPage.ts          # Page object for login page
│   ├── specs/
│   │   ├── example.spec.ts       # Example test suite
│   │   └── visual.spec.ts        # Visual regression tests
│   └── multi-user/
│       └── example.spec.ts       # Multi-user test examples
├── screenshots/
│   ├── baseline/                 # Baseline screenshots
│   ├── current/                  # Current test screenshots
│   └── diff/                     # Visual diff screenshots
├── allure-results/              # Allure test results
├── package.json
└── README.md
```

## Running Tests

### Basic Test Execution
```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests sequentially
npm run test:sequential
```

### Test Reporting
```bash
# Run tests and generate Allure report
npm run test:report

# Generate report from existing results
npm run report:generate

# Open the report
npm run report:open

# Clean test results and reports
npm run report:clean
```

## Visual Regression Testing

MCP WebdriverIO includes built-in visual regression testing capabilities:

```typescript
// Example visual regression test
it('should compare the login page', async () => {
    await browser.url('https://example.com/login');
    
    // Take and compare screenshots
    await browser.saveScreen('login-page', { 
        fullPage: true,
        hideElements: ['.ads']
    });
    
    const result = await browser.checkScreen('login-page', { 
        fullPage: true,
        hideElements: ['.ads']
    });
    
    expect(result.misMatchPercentage).to.be.lessThan(0.1);
});
```

## Multi-User Testing

Support for testing multiple user interactions simultaneously:

```typescript
const flowManager = new UserFlowManager({
    maxConcurrentUsers: 2,
    defaultBrowserOptions: {
        browserName: 'chrome',
        headless: true
    }
});

// Create user sessions
const user1 = await flowManager.createSession();
const user2 = await flowManager.createSession();

// Define and execute user flows
const steps: UserFlowStep[] = [
    {
        name: 'user1-login',
        execute: async (session) => {
            if (session.id === user1.id) {
                await session.browser.$('#username').setValue('user1');
                await session.browser.$('#password').setValue('pass1');
                await session.browser.$('#submit').click();
            }
        }
    },
    // ... more steps
];

await flowManager.executeFlow(steps);
```

## Test Reporting

MCP WebdriverIO uses Allure for detailed test reporting:

- Test execution details
- Step-by-step test actions
- Screenshots (including visual regression)
- Test metadata (feature, severity, test IDs)
- Console logs
- Test duration and status

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

4. **Visual Testing**
   - Maintain baseline screenshots
   - Use appropriate comparison settings
   - Handle dynamic content appropriately
   - Review visual diffs carefully

5. **Multi-User Testing**
   - Plan user interactions carefully
   - Use appropriate timeouts
   - Handle race conditions
   - Clean up resources properly

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
- Allure Framework for test reporting
- All contributors who have helped improve this project