import { cpus } from 'os';
import type { BaseServer, TestRunnerOptions } from '../types.js';
import logger from '../logger.js';

export class TestRunner {
    private server: BaseServer;
    private logger: typeof logger;
    private maxWorkers: number;

    constructor(server: BaseServer, options: TestRunnerOptions = {}) {
        this.server = server;
        this.logger = logger;
        this.maxWorkers = options.maxWorkers || cpus().length;
    }

    async runTests(specs: string[]): Promise<any[]> {
        return [];  // Basic implementation
    }

    async compareVisual(name: string, tolerance: number = 0.1): Promise<{
        match: boolean;
        diffPercentage: number;
        diffPath?: string;
    }> {
        if (!('compareScreenshots' in this.server)) {
            throw new Error('Server does not support visual regression testing');
        }

        // @ts-ignore - We know the server has this method
        return await this.server.compareScreenshots(name, tolerance);
    }

    async saveVisualBaseline(name: string): Promise<string> {
        if (!('saveScreenshot' in this.server)) {
            throw new Error('Server does not support visual regression testing');
        }

        // @ts-ignore - We know the server has this method
        return await this.server.saveScreenshot(name, true);
    }
}
