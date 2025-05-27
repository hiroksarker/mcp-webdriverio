import type { Browser } from 'webdriverio';

// Define extended browser interface with our custom methods
export interface ExtendedBrowser extends Browser {
    action: (type: string, params?: any) => any;
    actions: (actions: any[]) => Promise<void>;
    downloadFile: (fileUrl: string, targetDir: string) => Promise<string>;
    switchToFrame: (frame: WebdriverIO.Element) => Promise<void>;
}

// Action types and parameters
export interface ActionParams {
    type: 'key' | 'pointer' | 'wheel';
    parameters?: {
        pointerType?: 'mouse' | 'pen' | 'touch';
    };
}

export interface PointerActionParams {
    x: number;
    y: number;
    duration?: number;
    origin?: WebdriverIO.Element | 'pointer' | 'viewport';
}

export interface WheelActionParams {
    deltaX: number;
    deltaY: number;
    duration?: number;
}

// Action builder class for fluent API
export class ActionBuilder {
    private actions: any[] = [];
    private type: string;
    private params?: any;
    private browser: ExtendedBrowser;

    constructor(browser: ExtendedBrowser, type: string, params?: any) {
        this.browser = browser;
        this.type = type;
        this.params = params;
    }

    down(value?: string | { button: 'left' | 'middle' | 'right' } | { key: string }) {
        this.actions.push({ type: 'down', value });
        return this;
    }

    up(value?: string | { button: 'left' | 'middle' | 'right' } | { key: string }) {
        this.actions.push({ type: 'up', value });
        return this;
    }

    move(params: PointerActionParams) {
        this.actions.push({ type: 'move', ...params });
        return this;
    }

    scroll(params: WheelActionParams) {
        this.actions.push({ type: 'scroll', ...params });
        return this;
    }

    pause(duration: number) {
        this.actions.push({ type: 'pause', duration });
        return this;
    }

    async perform(release = false) {
        if (!this.browser) throw new Error('Browser not connected');

        const action = this.browser.action(this.type, this.params);
        for (const act of this.actions) {
            switch (act.type) {
                case 'down':
                    action.down(act.value);
                    break;
                case 'up':
                    action.up(act.value);
                    break;
                case 'move':
                    action.move(act);
                    break;
                case 'scroll':
                    action.scroll(act);
                    break;
                case 'pause':
                    action.pause(act.duration);
                    break;
            }
        }
        await action.perform(release);
    }
}

// File download manager
export class DownloadManager {
    private downloadDir: string;

    constructor(downloadDir: string) {
        this.downloadDir = downloadDir;
    }

    async downloadFile(browser: ExtendedBrowser, fileUrl: string): Promise<string> {
        if (!browser.downloadFile) {
            throw new Error('Download capability not enabled');
        }

        return browser.downloadFile(fileUrl, this.downloadDir);
    }

    async verifyDownload(filePath: string): Promise<boolean> {
        const { existsSync } = await import('fs');
        return existsSync(filePath);
    }

    async getFileSize(filePath: string): Promise<number> {
        const { statSync } = await import('fs');
        const stats = statSync(filePath);
        return stats.size;
    }

    async cleanup(): Promise<void> {
        const { existsSync, readdirSync, unlinkSync } = await import('fs');
        if (existsSync(this.downloadDir)) {
            const files = readdirSync(this.downloadDir);
            for (const file of files) {
                unlinkSync(`${this.downloadDir}/${file}`);
            }
        }
    }
}

// Action manager for handling multiple actions
export class ActionManager {
    private browser: ExtendedBrowser;

    constructor(browser: ExtendedBrowser) {
        this.browser = browser;
    }

    async performActions(actions: ActionBuilder[]): Promise<void> {
        const actionPromises = actions.map(action => action.perform());
        await Promise.all(actionPromises);
    }

    async performKeyboardAction(keys: string[]): Promise<void> {
        const action = new ActionBuilder(this.browser, 'key');
        for (const key of keys) {
            action.down(key).up(key);
        }
        await action.perform();
    }

    async performPointerAction(
        type: 'mouse' | 'pen' | 'touch',
        moves: PointerActionParams[]
    ): Promise<void> {
        const action = new ActionBuilder(this.browser, 'pointer', { parameters: { pointerType: type } });
        for (const move of moves) {
            action.move(move);
        }
        await action.perform();
    }

    async performWheelAction(params: WheelActionParams): Promise<void> {
        const action = new ActionBuilder(this.browser, 'wheel');
        action.scroll(params);
        await action.perform();
    }
}

// Define capabilities type
type BrowserCapabilities = {
    browserName: string;
    'goog:chromeOptions'?: {
        args?: string[];
        prefs?: {
            [key: string]: any;
        };
    };
    'se:downloadsEnabled'?: boolean;
    [key: string]: any;
};

// Export default capabilities for actions and downloads
export const defaultCapabilities: BrowserCapabilities = {
    browserName: 'chrome',
    'goog:chromeOptions': {
        args: [
            '--headless=new',
            '--no-sandbox',
            '--disable-dev-shm-usage',
            '--silent-downloads',  // Suppress download notifications
            '--disable-logging',   // Disable logging
            '--log-level=3'        // Only show fatal errors
        ],
        prefs: {
            'download.default_directory': process.cwd() + '/downloads',
            'download.prompt_for_download': false,
            'download.directory_upgrade': true,
            'safebrowsing.enabled': false,
            'profile.default_content_settings.popups': 0,
            'profile.content_settings.exceptions.automatic_downloads.*.setting': 1
        }
    },
    'se:downloadsEnabled': true
}; 