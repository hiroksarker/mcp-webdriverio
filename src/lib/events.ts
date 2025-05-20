// Define our event types
export type CommandEvent = { command: any };
export type DisconnectEvent = void;
export type ConnectedEvent = void;
export type ErrorEvent = { error: string };
export type ResultEvent = { type: string; value: any };
export type CommandCompleteEvent = { success: boolean; error?: string };
export type AccessibilityTreeEvent = { tree: any };

// Define event names as constants
export const EVENTS = {
    COMMAND: 'command',
    DISCONNECT: 'disconnect',
    CONNECTED: 'connected',
    ERROR: 'error',
    RESULT: 'result',
    COMMAND_COMPLETE: 'commandComplete',
    ACCESSIBILITY_TREE: 'accessibilityTree'
} as const;

type EventName = typeof EVENTS[keyof typeof EVENTS];
type EventListener = (...args: any[]) => void;

export class CustomEventEmitter {
    private listeners: Map<string, Set<EventListener>>;

    constructor() {
        this.listeners = new Map();
    }

    private getListeners(event: string): Set<EventListener> {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, new Set());
        }
        return this.listeners.get(event)!;
    }

    // Type-safe event emission methods
    emitCommand(command: any): boolean {
        return this.emit(EVENTS.COMMAND, command);
    }

    emitDisconnect(): boolean {
        return this.emit(EVENTS.DISCONNECT);
    }

    emitConnected(): boolean {
        return this.emit(EVENTS.CONNECTED);
    }

    emitError(error: string): boolean {
        return this.emit(EVENTS.ERROR, error);
    }

    emitResult(result: { type: string; value: any }): boolean {
        return this.emit(EVENTS.RESULT, result);
    }

    emitCommandComplete(result: { success: boolean; error?: string }): boolean {
        return this.emit(EVENTS.COMMAND_COMPLETE, result);
    }

    emitAccessibilityTree(tree: any): boolean {
        return this.emit(EVENTS.ACCESSIBILITY_TREE, tree);
    }

    // Type-safe event listener methods
    onCommand(listener: (command: any) => void): this {
        this.on(EVENTS.COMMAND, listener);
        return this;
    }

    onDisconnect(listener: () => void): this {
        this.on(EVENTS.DISCONNECT, listener);
        return this;
    }

    onConnected(listener: () => void): this {
        this.on(EVENTS.CONNECTED, listener);
        return this;
    }

    onError(listener: (error: string) => void): this {
        this.on(EVENTS.ERROR, listener);
        return this;
    }

    onResult(listener: (result: { type: string; value: any }) => void): this {
        this.on(EVENTS.RESULT, listener);
        return this;
    }

    onCommandComplete(listener: (result: { success: boolean; error?: string }) => void): this {
        this.on(EVENTS.COMMAND_COMPLETE, listener);
        return this;
    }

    onAccessibilityTree(listener: (tree: any) => void): this {
        this.on(EVENTS.ACCESSIBILITY_TREE, listener);
        return this;
    }

    // Base event methods
    on(event: string, listener: EventListener): this {
        this.getListeners(event).add(listener);
        return this;
    }

    emit(event: string, ...args: any[]): boolean {
        const listeners = this.getListeners(event);
        if (listeners.size === 0) return false;
        
        for (const listener of listeners) {
            try {
                listener(...args);
            } catch (error) {
                console.error(`Error in event listener for ${event}:`, error);
            }
        }
        return true;
    }

    removeListener(event: string, listener: EventListener): this {
        const listeners = this.getListeners(event);
        listeners.delete(listener);
        return this;
    }

    removeAllListeners(event?: string): this {
        if (event) {
            this.listeners.delete(event);
        } else {
            this.listeners.clear();
        }
        return this;
    }
}

export default CustomEventEmitter; 