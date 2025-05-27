import { MCPServer } from '../mcp-server.js';
import { Logger } from './logger.js';
import { SessionManager } from './session.js';
import { registerBrowserTools } from './tools/browser.js';
import { registerNetworkTools } from './tools/network.js';
import { registerElementTools } from './tools/elements.js';
import { WebdriverioMCPServer } from '../server.js';
import { globalSettings, type GlobalSettings } from './global-settings.js';

export class Server {
    private server: MCPServer;
    private logger: Logger;
    private sessionManager: SessionManager;
    private _webdriverServer: WebdriverioMCPServer;
    private settings: GlobalSettings;

    constructor(settings: Partial<GlobalSettings> = {}) {
        this.settings = {
            ...globalSettings,
            mcp: {
                ...globalSettings.mcp,
                ...settings.mcp
            }
        };
        
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

    get cursorConfig() {
        return this.settings.mcp.cursor;
    }

    get browserConfig() {
        return this.settings.mcp.browser;
    }

    get serverConfig() {
        return this.settings.mcp.server;
    }

    private initializeTools() {
        registerBrowserTools(this.server, this.logger, this.sessionManager);
        registerNetworkTools(this.server, this.logger, this.sessionManager);
        registerElementTools(this.server, this.logger, this.sessionManager);
    }

    async listen() {
        await this.server.listen();
        this.logger.info(`Server started on ${this.settings.mcp.server.host}:${this.settings.mcp.server.port}`);
        return this;
    }

    async close() {
        await this.server.close();
        this.logger.info('Server stopped');
    }
} 