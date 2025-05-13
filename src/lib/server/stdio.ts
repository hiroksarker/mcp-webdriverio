import { MCPServer } from '@modelcontextprotocol/sdk';

export class StdioServerTransport {
    constructor(private server: MCPServer) {}

    async start() {
        process.stdin.on('data', async (data) => {
            try {
                const message = JSON.parse(data.toString());
                // @ts-ignore - handleMessage exists at runtime
                const response = await this.server.handleMessage(message);
                process.stdout.write(JSON.stringify(response) + '\n');
            } catch (error: unknown) {
                const errorMessage = error instanceof Error ? error.message : String(error);
                process.stderr.write(JSON.stringify({ error: errorMessage }) + '\n');
            }
        });
    }

    async stop() {
        process.stdin.removeAllListeners('data');
    }
} 