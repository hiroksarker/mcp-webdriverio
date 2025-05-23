import type { browser } from '@wdio/globals';

export interface Tool {
    name: string;
    description: string;
    run: (params: any) => Promise<any>;
} 

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

export interface BrowserOptions {
    browserName?: string;
    headless?: boolean;
    chromeOptions?: {
        args?: string[];
    };
    userAgent?: string;
    viewport?: {
        width: number;
        height: number;
    };
}

export interface UserSession {
    id: string;
    browser: typeof browser;
    options: BrowserOptions;
    metadata?: Record<string, any>;
}

export interface UserFlowOptions {
    maxConcurrentUsers?: number;
    defaultBrowserOptions?: {
        browserName?: string;
        headless?: boolean;
    };
    sessionTimeout?: number;
}

export interface UserFlowContext {
    sessions: Map<string, UserSession>;
    sharedData: Map<string, any>;
    flowId: string;
}

export interface UserFlowStep {
    name: string;
    execute: (session: UserSession, context: UserFlowContext) => Promise<void>;
    dependencies?: string[];
} 