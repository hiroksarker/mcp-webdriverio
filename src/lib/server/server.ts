import { MCPServer } from '../mcp-server.js';
import { Logger } from './logger.js';
import { SessionManager } from './session.js';
import { registerBrowserTools } from './tools/browser.js';
import { registerNetworkTools } from './tools/network.js';
import { registerElementTools } from './tools/elements.js';
import { WebdriverioMCPServer } from '../server.js';

export class Server {
    private server: MCPServer;
    private logger: Logger;
    private sessionManager: SessionManager;
    private _webdriverServer: WebdriverioMCPServer;

    constructor(port: number = 3000) {
        this.logger = new Logger();
        this.server = new MCPServer({
            name: "MCP WebdriverIO Server",
            version: "1.0.0"
        });
        this.sessionManager = new SessionManager(this.logger);
        this._webdriverServer = new WebdriverioMCPServer();
        this.initializeTools();
    }

    get mcpServer(): MCPServer {
        return this.server;
    }

    get webdriverServer() {
        return this._webdriverServer;
    }

    private initializeTools() {
        registerBrowserTools(this.server, this.logger, this.sessionManager);
        registerNetworkTools(this.server, this.logger, this.sessionManager);
        registerElementTools(this.server, this.logger, this.sessionManager);
    }

    async listen() {
        await this.server.listen();
        this.logger.info('Server started');
        return this;
    }

    async close() {
        await this.server.close();
        this.logger.info('Server stopped');
    }
} 