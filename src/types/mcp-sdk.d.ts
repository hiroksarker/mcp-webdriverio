declare module '@modelcontextprotocol/sdk' {
    export class MCPServer {
        constructor(options?: { name?: string; version?: string });
        listen(): Promise<any>;
        connect(transport: any): Promise<void>;
        tool(name: string, description: string, schema: any, handler: Function): void;
        resource(name: string, template: any, handler: Function): void;
    }

    export class StdioServerTransport {
        constructor();
    }
}

declare module '@modelcontextprotocol/sdk/server/mcp.js' {
    export class McpServer {
        constructor(options?: { name?: string; version?: string });
        tool(name: string, description: string, schema: any, handler: Function): void;
        resource(name: string, template: any, handler: Function): void;
    }

    export class ResourceTemplate {
        constructor(uri: string, options: { list?: undefined });
    }
}

declare module '@modelcontextprotocol/sdk/server/stdio.js' {
    export class StdioServerTransport {
        constructor();
    }
} 