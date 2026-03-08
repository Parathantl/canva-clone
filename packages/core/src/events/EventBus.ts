import type { EditorEventType, EventHandler, EditorEvent } from '../types/events';

// Observer Pattern: Decoupled event-driven communication
export class EventBus {
  private listeners: Map<EditorEventType, Set<EventHandler<any>>> = new Map();
  private wildcardListeners: Set<EventHandler<any>> = new Set();

  on<T = unknown>(type: EditorEventType, handler: EventHandler<T>): () => void {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, new Set());
    }
    this.listeners.get(type)!.add(handler);

    // Return unsubscribe function
    return () => {
      this.listeners.get(type)?.delete(handler);
    };
  }

  onAny(handler: EventHandler<any>): () => void {
    this.wildcardListeners.add(handler);
    return () => {
      this.wildcardListeners.delete(handler);
    };
  }

  emit<T = unknown>(type: EditorEventType, payload: T): void {
    const event: EditorEvent<T> = {
      type,
      payload,
      timestamp: Date.now(),
    };

    this.listeners.get(type)?.forEach((handler) => {
      try {
        handler(event);
      } catch (error) {
        console.error(`[EventBus] Error in handler for "${type}":`, error);
      }
    });

    this.wildcardListeners.forEach((handler) => {
      try {
        handler(event);
      } catch (error) {
        console.error(`[EventBus] Error in wildcard handler:`, error);
      }
    });
  }

  off<T = unknown>(type: EditorEventType, handler: EventHandler<T>): void {
    this.listeners.get(type)?.delete(handler);
  }

  removeAll(type?: EditorEventType): void {
    if (type) {
      this.listeners.delete(type);
    } else {
      this.listeners.clear();
      this.wildcardListeners.clear();
    }
  }
}
