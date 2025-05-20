import { CustomEventEmitter } from './events.js';
import { WebdriverioMCPServer } from './server.js';

interface CommandCompleteResult {
    success: boolean;
    error?: string;
}

interface TransportEvents {
    commandComplete: (result: CommandCompleteResult) => void;
    error: (error: string) => void;
    accessibilityTree: (tree: any) => void;
}

export class MCPServerTransport extends CustomEventEmitter {
    private server: WebdriverioMCPServer;
    private isRunning: boolean = false;

    constructor(server: WebdriverioMCPServer) {
        super();
        this.server = server;
        this.setupEventHandlers();
    }

    private setupEventHandlers() {
        // Handle incoming messages from stdin
        process.stdin.on('data', (data) => {
            try {
                const message = JSON.parse(data.toString());
                this.handleMessage(message);
            } catch (error) {
                this.sendError('Invalid message format');
            }
        });

        // Handle server events
        this.server.on('commandComplete', (result: CommandCompleteResult) => {
            this.sendMessage({ type: 'commandComplete', ...result });
        });

        this.server.on('error', (error: string) => {
            this.sendError(error);
        });

        this.server.on('accessibilityTree', (tree: any) => {
            this.sendMessage({ type: 'accessibilityTree', tree });
        });
    }

    private handleMessage(message: any) {
        switch (message.type) {
            case 'connect':
                this.server.connect(message.options)
                    .then(() => this.sendMessage({ type: 'connected' }))
                    .catch((error: Error) => this.sendError(error.message));
                break;

            case 'command':
                this.server.emit('command', message.command);
                break;

            case 'getAccessibilityTree':
                this.server.getAccessibilityTree()
                    .catch((error: Error) => this.sendError(error.message));
                break;

            case 'disconnect':
                this.server.emit('disconnect');
                this.sendMessage({ type: 'disconnected' });
                break;

            default:
                this.sendError(`Unknown message type: ${message.type}`);
        }
    }

    private sendMessage(message: any) {
        if (!this.isRunning) return;
        process.stdout.write(JSON.stringify(message) + '\n');
    }

    private sendError(error: string) {
        this.sendMessage({ type: 'error', error });
    }

    start() {
        this.isRunning = true;
        process.stdin.setEncoding('utf8');
        this.sendMessage({ type: 'ready' });
    }

    stop() {
        this.isRunning = false;
        this.server.emit('disconnect');
    }
}

export default MCPServerTransport; 