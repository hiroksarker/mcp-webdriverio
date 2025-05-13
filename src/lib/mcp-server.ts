import { z } from "zod";

type Tool = {
    name: string;
    description: string;
    run: (params: any) => Promise<any>;
};

export class MCPServer {
    private tools: Tool[] = [];

    constructor(private options: { name: string; version: string }) {}

    async handleMessage(message: any) {
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

    async listen() {
        // Initialize server
        return this;
    }

    async close() {
        // Cleanup server
    }

    registerTool(tool: Tool) {
        this.tools.push(tool);
    }
} 