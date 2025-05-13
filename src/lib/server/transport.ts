import { MCPServer } from '../mcp-server.js';
import { Logger } from './logger.js';

export class StdioServerTransport {
    constructor(
        private server: MCPServer,
        private logger: Logger
    ) {}

    async start() {
        this.logger.debug('Starting STDIO transport...');
        
        process.stdin.on('data', async (data) => {
            try {
                const message = JSON.parse(data.toString());
                this.logger.debug('Received message:', message);
                
                // @ts-ignore - handleMessage exists at runtime
                const response = await this.server.handleMessage(message);
                this.logger.debug('Sending response:', response);
                
                process.stdout.write(JSON.stringify(response) + '\n');
            } catch (error: unknown) {
                const errorMessage = error instanceof Error ? error.message : String(error);
                this.logger.error('Error handling message:', error);
                process.stderr.write(JSON.stringify({ error: errorMessage }) + '\n');
            }
        });

        // Handle process termination
        process.on('SIGTERM', () => this.stop());
        process.on('SIGINT', () => this.stop());
    }

    async stop() {
        this.logger.debug('Stopping STDIO transport...');
        process.stdin.removeAllListeners('data');
        process.removeAllListeners('SIGTERM');
        process.removeAllListeners('SIGINT');
    }
} 