import { Logger } from '../logger.js';
import { EventEmitter } from 'events';
import { cpus, totalmem, freemem } from 'os';
import { BrowserType } from '../browser/types.js';

export interface PerformanceMetrics {
    timestamp: number;
    cpu: {
        usage: number;
        cores: number;
        loadAverage: number[];
    };
    memory: {
        total: number;
        free: number;
        used: number;
        usagePercent: number;
    };
    browser: {
        type: BrowserType;
        activeSessions: number;
        idleSessions: number;
        failedSessions: number;
        averageSessionAge: number;
        averageUseCount: number;
    }[];
    network: {
        requestsPerSecond: number;
        averageResponseTime: number;
        errorRate: number;
        cacheHitRate: number;
    };
    test: {
        totalTests: number;
        runningTests: number;
        completedTests: number;
        failedTests: number;
        averageTestDuration: number;
    };
}

export interface Alert {
    level: 'info' | 'warn' | 'error';
    message: string;
    timestamp: number;
    metrics: Partial<PerformanceMetrics>;
}

interface PerformanceMonitorEvents {
    'alert': (alert: Alert) => void;
    'metrics': (metrics: PerformanceMetrics) => void;
}

export class PerformanceMonitor extends EventEmitter {
    private logger: Logger;
    private metrics: PerformanceMetrics[] = [];
    private alerts: Alert[] = [];
    private monitoringInterval: NodeJS.Timeout | null = null;
    private readonly maxMetricsHistory = 1000; // Keep last 1000 metrics
    private readonly maxAlertsHistory = 100; // Keep last 100 alerts

    // Alert thresholds
    private readonly thresholds = {
        cpuUsage: 80, // 80% CPU usage
        memoryUsage: 85, // 85% memory usage
        errorRate: 5, // 5% error rate
        testFailureRate: 10, // 10% test failure rate
        responseTime: 5000, // 5 seconds
        sessionFailureRate: 10 // 10% session failure rate
    };

    constructor(logger: Logger) {
        super();
        this.logger = logger;
    }

    startMonitoring(intervalMs: number = 5000): void {
        if (this.monitoringInterval) {
            this.logger.warn('Performance monitoring is already running');
            return;
        }

        this.monitoringInterval = setInterval(() => {
            this.collectMetrics().catch(error => {
                this.logger.error('Failed to collect metrics:', error);
            });
        }, intervalMs);

        this.logger.info('Performance monitoring started');
    }

    stopMonitoring(): void {
        if (this.monitoringInterval) {
            clearInterval(this.monitoringInterval);
            this.monitoringInterval = null;
            this.logger.info('Performance monitoring stopped');
        }
    }

    private async collectMetrics(): Promise<void> {
        const metrics: PerformanceMetrics = {
            timestamp: Date.now(),
            cpu: await this.getCpuMetrics(),
            memory: this.getMemoryMetrics(),
            browser: [], // To be populated by browser managers
            network: {
                requestsPerSecond: 0, // To be updated by network monitoring
                averageResponseTime: 0,
                errorRate: 0,
                cacheHitRate: 0
            },
            test: {
                totalTests: 0,
                runningTests: 0,
                completedTests: 0,
                failedTests: 0,
                averageTestDuration: 0
            }
        };

        this.metrics.push(metrics);
        if (this.metrics.length > this.maxMetricsHistory) {
            this.metrics.shift();
        }

        this.checkAlerts(metrics);
        this.emit('metrics', metrics);
    }

    private async getCpuMetrics(): Promise<PerformanceMetrics['cpu']> {
        const startUsage = process.cpuUsage();
        await new Promise(resolve => setTimeout(resolve, 100));
        const endUsage = process.cpuUsage(startUsage);

        const totalUsage = (endUsage.user + endUsage.system) / 1000000; // Convert to percentage
        const cpuCount = cpus().length;
        const loadAverage = process.cpuUsage();

        return {
            usage: totalUsage,
            cores: cpuCount,
            loadAverage: [loadAverage.user, loadAverage.system, 0] // Simplified load average
        };
    }

    private getMemoryMetrics(): PerformanceMetrics['memory'] {
        const total = totalmem();
        const free = freemem();
        const used = total - free;
        const usagePercent = (used / total) * 100;

        return {
            total,
            free,
            used,
            usagePercent
        };
    }

    private checkAlerts(metrics: PerformanceMetrics): void {
        // CPU usage alert
        if (metrics.cpu.usage > this.thresholds.cpuUsage) {
            this.addAlert('warn', 'High CPU usage detected', {
                cpu: metrics.cpu
            });
        }

        // Memory usage alert
        if (metrics.memory.usagePercent > this.thresholds.memoryUsage) {
            this.addAlert('warn', 'High memory usage detected', {
                memory: metrics.memory
            });
        }

        // Network error rate alert
        if (metrics.network.errorRate > this.thresholds.errorRate) {
            this.addAlert('error', 'High network error rate detected', {
                network: metrics.network
            });
        }

        // Test failure rate alert
        const testFailureRate = metrics.test.failedTests / metrics.test.totalTests * 100;
        if (testFailureRate > this.thresholds.testFailureRate) {
            this.addAlert('error', 'High test failure rate detected', {
                test: metrics.test
            });
        }

        // Response time alert
        if (metrics.network.averageResponseTime > this.thresholds.responseTime) {
            this.addAlert('warn', 'High average response time detected', {
                network: metrics.network
            });
        }

        // Session failure rate alert
        for (const browser of metrics.browser) {
            const failureRate = browser.failedSessions / (browser.activeSessions + browser.idleSessions) * 100;
            if (failureRate > this.thresholds.sessionFailureRate) {
                this.addAlert('error', `High session failure rate detected for ${browser.type}`, {
                    browser: [browser]
                });
            }
        }
    }

    private addAlert(level: Alert['level'], message: string, metrics: Partial<PerformanceMetrics>): void {
        const alert: Alert = {
            level,
            message,
            timestamp: Date.now(),
            metrics
        };

        this.alerts.push(alert);
        if (this.alerts.length > this.maxAlertsHistory) {
            this.alerts.shift();
        }

        this.emit('alert', alert);
        this.logger[level](message, metrics);
    }

    updateBrowserMetrics(browserType: BrowserType, metrics: PerformanceMetrics['browser'][0]): void {
        const currentMetrics = this.metrics[this.metrics.length - 1];
        if (!currentMetrics) return;

        const browserIndex = currentMetrics.browser.findIndex(b => b.type === browserType);
        if (browserIndex >= 0) {
            currentMetrics.browser[browserIndex] = metrics;
        } else {
            currentMetrics.browser.push(metrics);
        }
    }

    updateNetworkMetrics(metrics: Partial<PerformanceMetrics['network']>): void {
        const currentMetrics = this.metrics[this.metrics.length - 1];
        if (!currentMetrics) return;

        currentMetrics.network = {
            ...currentMetrics.network,
            ...metrics
        };
    }

    updateTestMetrics(metrics: Partial<PerformanceMetrics['test']>): void {
        const currentMetrics = this.metrics[this.metrics.length - 1];
        if (!currentMetrics) return;

        currentMetrics.test = {
            ...currentMetrics.test,
            ...metrics
        };
    }

    getMetricsHistory(): PerformanceMetrics[] {
        return [...this.metrics];
    }

    getAlertsHistory(): Alert[] {
        return [...this.alerts];
    }

    getLatestMetrics(): PerformanceMetrics | null {
        return this.metrics[this.metrics.length - 1] || null;
    }

    getMetricsSummary(): {
        averageCpuUsage: number;
        averageMemoryUsage: number;
        averageErrorRate: number;
        averageTestDuration: number;
        totalAlerts: number;
    } {
        if (this.metrics.length === 0) {
            return {
                averageCpuUsage: 0,
                averageMemoryUsage: 0,
                averageErrorRate: 0,
                averageTestDuration: 0,
                totalAlerts: 0
            };
        }

        const cpuUsage = this.metrics.reduce((sum, m) => sum + m.cpu.usage, 0) / this.metrics.length;
        const memoryUsage = this.metrics.reduce((sum, m) => sum + m.memory.usagePercent, 0) / this.metrics.length;
        const errorRate = this.metrics.reduce((sum, m) => sum + m.network.errorRate, 0) / this.metrics.length;
        const testDuration = this.metrics.reduce((sum, m) => sum + m.test.averageTestDuration, 0) / this.metrics.length;

        return {
            averageCpuUsage: cpuUsage,
            averageMemoryUsage: memoryUsage,
            averageErrorRate: errorRate,
            averageTestDuration: testDuration,
            totalAlerts: this.alerts.length
        };
    }
}

// Add type augmentation for EventEmitter
declare module 'events' {
    interface EventEmitter {
        on<K extends keyof PerformanceMonitorEvents>(event: K, listener: PerformanceMonitorEvents[K]): this;
        emit<K extends keyof PerformanceMonitorEvents>(event: K, ...args: Parameters<PerformanceMonitorEvents[K]>): boolean;
    }
} 