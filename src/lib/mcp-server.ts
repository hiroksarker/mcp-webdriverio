import type { Tool } from './types.js';

export class MCPServer {
    private tools: Tool[] = [];
    private isRunning: boolean = false;

    constructor(private options: { name: string; version: string }) {}

    async start() {
        if (this.isRunning) {
            return;
        }
        this.isRunning = true;
        return this;
    }

    async stop() {
        if (!this.isRunning) {
            return;
        }
        this.isRunning = false;
        // Clean up any resources
        this.tools = [];
    }

    async handleMessage(message: any) {
        if (!this.isRunning) {
            throw new Error('Server is not running');
        }

        if (message.type === 'tool') {
            const tool = this.tools.find(t => t.name === message.name);
            if (!tool) {
                throw new Error(`Tool '${message.name}' not found`);
            }
            try {
                const result = await tool.run(message.params);
                return { type: 'response', content: [result] };
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : String(error);
                throw new Error(`Tool '${message.name}' failed: ${errorMessage}`);
            }
        }
        throw new Error(`Unsupported message type: ${message.type}`);
    }

    registerTool(tool: Tool) {
        if (this.tools.some(t => t.name === tool.name)) {
            throw new Error(`Tool '${tool.name}' is already registered`);
        }
        this.tools.push(tool);
    }

    getTool(name: string): Tool | undefined {
        return this.tools.find(t => t.name === name);
    }

    getTools(): Tool[] {
        return [...this.tools];
    }

    async listen() {
        return this.start();
    }

    async close() {
        return this.stop();
    }
} 