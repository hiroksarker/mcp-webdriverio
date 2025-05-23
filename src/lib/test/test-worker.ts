import { parentPort } from 'worker_threads';
import WebdriverioMCPServer from '../server.js';
import logger from '../logger.js';
import type { TestConfig, TestResult } from './parallel-runner.js';

if (!parentPort) {
    throw new Error('This module must be run as a worker thread');
}

let server: WebdriverioMCPServer;

async function initialize() {
    server = new WebdriverioMCPServer();
    await server.connect();
}

async function runTest(config: TestConfig): Promise<TestResult> {
    const startTime = Date.now();
    let success = false;
    let error: string | undefined;

    try {
        await initialize();
        if (!server.isBrowserConnected()) throw new Error('Browser not connected');

        // Start browser session using createSession
        const sessionId = await server.createSession({
                browserName: config.browserType,
            headless: config.options?.headless ?? true
        });

        try {
            // Run the test file
            const testModule = await import(config.testFile);
            await testModule.default(sessionId);
            success = true;
        } finally {
            // Cleanup session
            await server.closeSession(sessionId);
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