import { Worker } from 'worker_threads';
import { cpus } from 'os';
import { Logger } from '../logger.js';
import { BrowserType } from '../browser/types.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface TestConfig {
    testFile: string;
    browserType: BrowserType;
    options?: {
        headless?: boolean;
        timeout?: number;
        retries?: number;
    };
}

export interface TestResult {
    testFile: string;
    browserType: BrowserType;
    success: boolean;
    duration: number;
    error?: string;
    retryCount?: number;
}

export class ParallelTestRunner {
    private workers: Worker[] = [];
    private maxWorkers: number;
    private logger: Logger;
    private testQueue: TestConfig[] = [];
    private runningTests: Map<string, TestConfig> = new Map();
    private workerTests: Map<Worker, string> = new Map();
    private results: TestResult[] = [];

    constructor(logger: Logger, maxWorkers?: number) {
        this.logger = logger;
        // Use number of CPU cores minus 1 for workers, or specified max
        this.maxWorkers = maxWorkers ?? Math.max(1, cpus().length - 1);
    }

    async runTests(tests: TestConfig[]): Promise<TestResult[]> {
        this.testQueue = [...tests];
        this.results = [];
        this.runningTests.clear();

        // Create worker pool
        for (let i = 0; i < this.maxWorkers; i++) {
            const worker = new Worker(path.join(__dirname, 'test-worker.js'));
            worker.on('message', this.handleWorkerMessage.bind(this));
            worker.on('error', this.handleWorkerError.bind(this));
            this.workers.push(worker);
        }

        // Start initial batch of tests
        while (this.testQueue.length > 0 && this.runningTests.size < this.maxWorkers) {
            await this.startNextTest();
        }

        // Wait for all tests to complete
        await this.waitForCompletion();

        // Cleanup workers
        await Promise.all(this.workers.map(worker => worker.terminate()));
        this.workers = [];

        return this.results;
    }

    private async startNextTest(): Promise<void> {
        if (this.testQueue.length === 0) return;

        const test = this.testQueue.shift()!;
        const worker = this.getAvailableWorker();
        if (!worker) return;

        const testId = `${test.testFile}-${test.browserType}-${Date.now()}`;
        this.runningTests.set(testId, test);
        this.workerTests.set(worker, testId);

        worker.postMessage({
            type: 'START_TEST',
            testId,
            config: test
        });
    }

    private getAvailableWorker(): Worker | undefined {
        return this.workers.find(worker => !this.workerTests.has(worker));
    }

    private handleWorkerMessage(message: any): void {
        const { type, testId, result } = message;
        
        if (type === 'TEST_COMPLETE') {
            const test = this.runningTests.get(testId);
            if (!test) return;

            // Find and clear the worker's test
            for (const [worker, workerTestId] of this.workerTests.entries()) {
                if (workerTestId === testId) {
                    this.workerTests.delete(worker);
                    break;
                }
            }

            this.results.push(result);
            this.runningTests.delete(testId);

            // Start next test if available
            if (this.testQueue.length > 0) {
                this.startNextTest();
            }
        }
    }

    private handleWorkerError(error: Error): void {
        this.logger.error('Worker error:', error);
        // Handle worker errors and potentially restart tests
    }

    private async waitForCompletion(): Promise<void> {
        while (this.runningTests.size > 0 || this.testQueue.length > 0) {
            await new Promise(resolve => setTimeout(resolve, 100));
        }
    }

    getMetrics(): {
        totalTests: number;
        completedTests: number;
        failedTests: number;
        averageDuration: number;
        activeWorkers: number;
    } {
        const completedTests = this.results.length;
        const failedTests = this.results.filter(r => !r.success).length;
        const averageDuration = this.results.reduce((sum, r) => sum + r.duration, 0) / completedTests || 0;

        return {
            totalTests: completedTests + this.runningTests.size + this.testQueue.length,
            completedTests,
            failedTests,
            averageDuration,
            activeWorkers: this.runningTests.size
        };
    }
} 