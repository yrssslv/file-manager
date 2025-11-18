import type { PluginEvent } from './types.mjs';

type EventHandler = (data: unknown) => void | Promise<void>;

export class PluginEventBus {
  private listeners = new Map<string, Set<EventHandler>>();
  private eventHistory: PluginEvent[] = [];
  private maxHistorySize = 100;

  on(eventName: string, handler: EventHandler): void {
    if (!this.listeners.has(eventName)) {
      this.listeners.set(eventName, new Set());
    }

    this.listeners.get(eventName)!.add(handler);
  }

  off(eventName: string, handler: EventHandler): void {
    const handlers = this.listeners.get(eventName);
    if (handlers) {
      handlers.delete(handler);
      if (handlers.size === 0) {
        this.listeners.delete(eventName);
      }
    }
  }

  once(eventName: string, handler: EventHandler): void {
    const wrappedHandler: EventHandler = async (data: unknown) => {
      this.off(eventName, wrappedHandler);
      await handler(data);
    };

    this.on(eventName, wrappedHandler);
  }

  async emit(eventName: string, data?: unknown, source?: string): Promise<void> {
    const event: PluginEvent = {
      name: eventName,
      data,
      timestamp: new Date(),
      ...(source && { source }),
    };

    this.eventHistory.push(event);

    if (this.eventHistory.length > this.maxHistorySize) {
      this.eventHistory.shift();
    }

    const handlers = this.listeners.get(eventName);
    if (!handlers || handlers.size === 0) {
      return;
    }

    const promises = Array.from(handlers).map(async (handler) => {
      try {
        await handler(data);
      } catch (err) {
        console.error(
          `Error in event handler for "${eventName}":`,
          err instanceof Error ? err.message : String(err)
        );
      }
    });

    await Promise.allSettled(promises);
  }

  removeAllListeners(eventName?: string): void {
    if (eventName) {
      this.listeners.delete(eventName);
    } else {
      this.listeners.clear();
    }
  }

  listenerCount(eventName: string): number {
    return this.listeners.get(eventName)?.size ?? 0;
  }

  eventNames(): string[] {
    return Array.from(this.listeners.keys());
  }

  getHistory(limit?: number): PluginEvent[] {
    if (limit) {
      return this.eventHistory.slice(-limit);
    }
    return [...this.eventHistory];
  }

  clearHistory(): void {
    this.eventHistory = [];
  }
}
