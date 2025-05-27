# MCP WebdriverIO

A modern, type-safe WebdriverIO-based test automation framework with visual regression testing capabilities.

## Features

- TypeScript support with strict type checking
- Visual regression testing with pixel-perfect comparisons
- Cross-browser testing support (Chrome, Firefox, Safari, Edge)
- Allure reporting integration
- Page Object Model support
- Custom event handling
- Browser session management
- Accessibility testing support

## Installation

```bash
npm install
```

## Configuration

The framework uses WebdriverIO v8 with the following key configurations:

- Visual regression testing service
- Allure reporting
- Mocha test runner
- TypeScript compilation

See `wdio.conf.ts` for detailed configuration options.

## Visual Regression Testing

The framework includes built-in visual regression testing capabilities:

```typescript
// Example test
describe('Visual regression', () => {
    it('should compare the login page', async () => {
        const driver = testServer.getServer().webdriverServer.getDriver();
        const testRunner = testServer.getServer().webdriverServer.getTestRunner();
        
        // Navigate to the page
        await driver.url('https://example.com/login');
        
        // Save baseline if it doesn't exist
        try {
            await testRunner.saveVisualBaseline('login-page');
        } catch (error) {
            console.log('Baseline already exists, proceeding with comparison');
        }
        
        // Compare screenshot with baseline
        const result = await testRunner.compareVisual('login-page', 0.1);
        expect(result.match).to.be.true;
        expect(result.diffPercentage).to.be.lessThan(0.1);
        
        if (!result.match) {
            console.log(`Visual regression failed with ${result.diffPercentage}% difference`);
            console.log(`Diff image saved at: ${result.diffPath}`);
        }
    });
});
```

### Visual Regression Features

- Automatic baseline management
- Pixel-perfect comparison
- Configurable tolerance for differences
- Diff image generation
- Support for hiding dynamic elements (ads, notifications, etc.)
- Cross-browser visual testing

## Running Tests

```bash
# Run all tests
npm test

# Run specific test file
npm test -- --spec tests/specs/example.spec.ts

# Run tests with specific browser
npm test -- --browser chrome

# Generate Allure report
npm run report
```

## Project Structure

```
├── src/
│   ├── lib/
│   │   ├── server/           # Server implementation
│   │   ├── test/            # Test runner and utilities
│   │   └── types/           # TypeScript type definitions
│   └── pages/               # Page Object Models
├── tests/
│   ├── specs/               # Test specifications
│   ├── pages/               # Page objects
│   └── config/              # Test configuration
├── screenshots/             # Visual regression screenshots
│   ├── baseline/            # Baseline images
│   ├── current/             # Current test screenshots
│   └── diff/                # Diff images
└── allure-results/          # Allure report data
```

## Visual Regression Best Practices

1. **Baseline Management**
   - Store baseline images in version control
   - Review baseline updates carefully
   - Use meaningful names for screenshots

2. **Test Stability**
   - Hide dynamic elements before taking screenshots
   - Use appropriate tolerance values
   - Consider viewport size variations

3. **Maintenance**
   - Regularly update baselines
   - Clean up old screenshots
   - Monitor test execution time

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

MIT