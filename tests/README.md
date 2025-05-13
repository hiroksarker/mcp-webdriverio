# MCP WebdriverIO Tests

This directory contains the test suite for the MCP WebdriverIO server implementation.

## Test Structure

The test suite is organized into several test files:

- `element-finding-example.test.ts`: Tests for element finding and interaction
- More test files will be added as features are implemented

## Test Setup

The tests use Jest as the test runner with the following configuration:

- TypeScript support via `ts-jest`
- ESM module support
- 30-second timeout for browser operations
- Source maps for better debugging

## Running Tests

1. **Run all tests:**
   ```bash
   npm test
   ```

2. **Run tests in watch mode:**
   ```bash
   npm run test:watch
   ```

3. **Run a specific test file:**
   ```bash
   npm test -- element-finding-example.test.ts
   ```

## Test Examples

### Element Finding Example

The `element-finding-example.test.ts` file demonstrates how to:

1. Start a browser session
2. Navigate to a webpage
3. Find elements using different locator strategies
4. Interact with elements
5. Clean up browser sessions

Example test structure:

```typescript
describe('Element Finding Example', () => {
    let server: Server;

    beforeAll(async () => {
        server = new Server();
        await server.listen();
    });

    afterAll(async () => {
        await server.close();
    });

    it('should find elements using various locator strategies', async () => {
        // Start browser session
        const { content: [{ sessionId }] } = await server.mcpServer.handleMessage({
            type: 'tool',
            name: 'start_browser',
            params: { headless: true }
        });

        try {
            // Test element finding and interaction
            // ...
        } finally {
            // Clean up
            await server.mcpServer.handleMessage({
                type: 'tool',
                name: 'close_browser',
                params: { sessionId }
            });
        }
    });
});
```

## Writing New Tests

When writing new tests:

1. Create a new test file with the `.test.ts` extension
2. Import necessary dependencies:
   ```typescript
   import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
   import { Server } from '../src/lib/server/server.js';
   ```
3. Set up server in `beforeAll` and clean up in `afterAll`
4. Write test cases using Jest's `it` blocks
5. Use `try/finally` blocks to ensure proper cleanup
6. Test both success and error cases

## Best Practices

1. **Cleanup:**
   - Always clean up browser sessions in `finally` blocks
   - Close the server in `afterAll`

2. **Error Handling:**
   - Test error cases explicitly
   - Verify error messages and types

3. **Timeouts:**
   - Use appropriate timeouts for browser operations
   - Consider using `waitUntil` for asynchronous operations

4. **Assertions:**
   - Use specific assertions (e.g., `toBeDefined()`, `toBeGreaterThan()`)
   - Test both positive and negative cases

5. **Test Isolation:**
   - Each test should be independent
   - Don't rely on state from other tests

## Debugging Tests

1. **Watch Mode:**
   ```bash
   npm run test:watch
   ```

2. **Debug Logs:**
   - Set `logLevel` in browser options to 'debug'
   - Check server logs for detailed information

3. **Screenshots:**
   - Use `takeScreenshot()` for visual debugging
   - Save screenshots on test failure

4. **Network Logs:**
   - Enable network monitoring for debugging network issues
   - Check network logs in test failures 