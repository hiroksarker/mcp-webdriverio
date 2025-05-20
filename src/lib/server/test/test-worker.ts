import { parentPort } from 'worker_threads';
import { MCPServer } from '../../mcp-server.js';
import { Logger } from '../logger.js';
import { SessionManager } from '../session.js';
import { BrowserFactory } from '../browser/factory.js';
import { registerBrowserTools } from '../tools/browser.js';
import type { TestConfig, TestResult } from './parallel-runner.js';

if (!parentPort) {
    throw new Error('This module must be run as a worker thread');
}

let server: MCPServer;
let logger: Logger;
let sessionManager: SessionManager;
let browserFactory: BrowserFactory;

async function setupTestEnvironment(): Promise<void> {
    if (!server) {
        logger = new Logger();
        server = new MCPServer({ name: 'Test Worker', version: '1.0.0' });
        sessionManager = new SessionManager(logger);
        browserFactory = new BrowserFactory(logger);
        
        // Register browser tools
        registerBrowserTools(server, logger, sessionManager);
        
        await server.start();
    }
}

async function runTest(config: TestConfig): Promise<TestResult> {
    const startTime = Date.now();
    let success = false;
    let error: string | undefined;

    try {
        await setupTestEnvironment();

        // Start browser session
        const { content: [sessionResult] } = await server.handleMessage({
            type: 'tool',
            name: 'start_browser',
            params: {
                browserName: config.browserType,
                options: {
                    headless: config.options?.headless ?? true,
                    timeout: config.options?.timeout
                }
            }
        });

        if (!sessionResult.success) {
            throw new Error(`Failed to start browser session: ${sessionResult.error}`);
        }

        const sessionId = sessionResult.sessionId;

        try {
            // Run the test file
            const testModule = await import(config.testFile);
            await testModule.default(sessionId);

            success = true;
        } finally {
            // Cleanup session
            await server.handleMessage({
                type: 'tool',
                name: 'close_browser',
                params: { sessionId }
            });
        }
    } catch (err) {
        error = err instanceof Error ? err.message : String(err);
        success = false;
    }

    return {
        testFile: config.testFile,
        browserType: config.browserType,
        success,
        duration: Date.now() - startTime,
        error
    };
}

// Handle messages from the main thread
parentPort.on('message', async (message: { type: string; testId: string; config: TestConfig }) => {
    if (message.type === 'START_TEST') {
        const result = await runTest(message.config);
        parentPort?.postMessage({
            type: 'TEST_COMPLETE',
            testId: message.testId,
            result
        });
    }
}); 