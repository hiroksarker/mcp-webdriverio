import { MCPServer } from '../../mcp-server.js';
import { Logger } from '../logger.js';
import { SessionManager } from '../session.js';

interface NetworkLog {
    url: string;
    method: string;
    status: number;
    duration: number;
    timestamp: number;
    error?: string;
}

interface NetworkMonitorParams {
    clear?: boolean;
}

export function registerNetworkTools(
    server: MCPServer,
    logger: Logger,
    sessionManager: SessionManager
) {
    server.registerTool({
        name: 'monitor_network',
        description: 'Start monitoring network requests',
        run: async (params: { sessionId: string }) => {
            const session = sessionManager.getSession(params.sessionId);
            if (!session) {
                throw new Error(`No browser session found with ID: ${params.sessionId}`);
            }

            const browser = session.browser;
            logger.debug('Starting network monitoring');

            await browser.execute(() => {
                // @ts-ignore - Adding custom properties to window
                window.networkLogs = [];
                
                // @ts-ignore
                window.monitorNetwork = () => {
                    const originalFetch = window.fetch;
                    // @ts-ignore
                    window.fetch = async (...args) => {
                        const [resource, config] = args;
                        const startTime = Date.now();
                        try {
                            const response = await originalFetch(resource, config);
                            const endTime = Date.now();
                            // @ts-ignore
                            window.networkLogs.push({
                                url: resource instanceof Request ? resource.url : resource.toString(),
                                method: config?.method || 'GET',
                                status: response.status,
                                duration: endTime - startTime,
                                timestamp: startTime
                            });
                            return response;
                        } catch (error) {
                            const endTime = Date.now();
                            // @ts-ignore
                            window.networkLogs.push({
                                url: resource instanceof Request ? resource.url : resource.toString(),
                                method: config?.method || 'GET',
                                status: 0,
                                error: error instanceof Error ? error.message : String(error),
                                duration: endTime - startTime,
                                timestamp: startTime
                            });
                            throw error;
                        }
                    };
                };
            });

            logger.debug('Network monitoring started successfully');
            return { success: true };
        }
    });

    server.registerTool({
        name: 'get_network_logs',
        description: 'Get network request logs',
        run: async (params: { 
            sessionId: string;
            clear?: boolean;
        }) => {
            const session = sessionManager.getSession(params.sessionId);
            if (!session) {
                throw new Error(`No browser session found with ID: ${params.sessionId}`);
            }

            const browser = session.browser;
            logger.debug('Getting network logs');

            const logs = await browser.execute(() => {
                // @ts-ignore
                const logs = window.networkLogs || [];
                if (params.clear) {
                    // @ts-ignore
                    window.networkLogs = [];
                }
                return logs;
            });

            logger.debug('Retrieved network logs:', { count: logs.length });
            return { logs };
        }
    });

    server.registerTool({
        name: 'clear_network_logs',
        description: 'Clear network request logs',
        run: async (params: { sessionId: string }) => {
            const session = sessionManager.getSession(params.sessionId);
            if (!session) {
                throw new Error(`No browser session found with ID: ${params.sessionId}`);
            }

            const browser = session.browser;
            logger.debug('Clearing network logs');

            await browser.execute(() => {
                // @ts-ignore
                window.networkLogs = [];
            });

            logger.debug('Network logs cleared successfully');
            return { success: true };
        }
    });
} 