// src/lib/logger.ts
class Logger {
    info(message: string, meta?: any) {
        console.log(`[INFO] ${message}`, meta || '');
    }

    error(message: string, error?: any) {
        console.error(`[ERROR] ${message}`, error || '');
    }
}

const logger = new Logger();
export default logger;
export type { Logger };