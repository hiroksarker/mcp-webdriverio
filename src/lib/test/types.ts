export interface BaseServer {
    connect(options: any): Promise<boolean>;
    disconnect(): Promise<void>;
    emit(event: string, ...args: any[]): void;
}

export interface TestRunnerOptions {
    maxWorkers?: number;
    defaultRetries?: number;
    defaultTimeout?: number;
    defaultPriority?: number;
    browserOptions?: {
        headless?: boolean;
        defaultBrowser?: 'chrome' | 'firefox' | 'safari';
    };
}

export interface TestConfig {
    spec: string;
    retries?: number;
    priority?: number;
    timeout?: number;
    browserName?: string;
    headless?: boolean;
}

export interface TestResult {
    spec: string;
    passed: boolean;
    duration: number;
    error?: string;
    retries?: number;
    browserInfo?: {
        name: string;
        version: string;
    };
}
