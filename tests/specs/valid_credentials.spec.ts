import type { MCPServer } from '../../src/lib/mcp-server.js';
import { LoginPage } from '../pages/LoginPage.js';

export async function run(server: MCPServer, sessionId: string): Promise<boolean> {
    const loginPage = new LoginPage(server, sessionId);
    await loginPage.login('student', 'Password123');
    const welcomeMessage = await loginPage.getWelcomeMessage();
    return welcomeMessage === 'Logged In Successfully';
}
