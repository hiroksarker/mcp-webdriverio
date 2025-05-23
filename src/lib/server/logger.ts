export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export class Logger {
    constructor(private level: LogLevel = 'info') {}

    private shouldLog(messageLevel: LogLevel): boolean {
        const levels: LogLevel[] = ['debug', 'info', 'warn', 'error'];
        return levels.indexOf(messageLevel) >= levels.indexOf(this.level);
    }

    private formatMessage(level: LogLevel, message: string, ...args: any[]): string {
        const timestamp = new Date().toISOString();
        const formattedArgs = args.map(arg => 
            typeof arg === 'object' ? JSON.stringify(arg, null, 2) : arg
        ).join(' ');
        return `[${timestamp}] ${level.toUpperCase()}: ${message} ${formattedArgs}`.trim();
    }

    debug(message: string, ...args: any[]) {
        if (this.shouldLog('debug')) {
            console.debug(this.formatMessage('debug', message, ...args));
        }
    }

    info(message: string, ...args: any[]) {
        if (this.shouldLog('info')) {
            console.info(this.formatMessage('info', message, ...args));
        }
    }

    warn(message: string, ...args: any[]) {
        if (this.shouldLog('warn')) {
            console.warn(this.formatMessage('warn', message, ...args));
        }
    }

    error(message: string, error?: unknown, ...args: any[]) {
        if (this.shouldLog('error')) {
            const errorMessage = error instanceof Error ? error.stack || error.message : String(error);
            console.error(this.formatMessage('error', message, errorMessage, ...args));
        }
    }
} 

export default new Logger();  // Export a singleton instance 