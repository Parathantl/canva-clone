import React, { createContext, useContext, useRef, useEffect } from 'react';
import {
  createEditorStore,
  EventBus,
  PluginManager,
  type EditorStore,
  type EditorState,
  type Document,
  type Plugin,
} from '@reactcanvas/core';
import { useStoreWithEqualityFn } from 'zustand/traditional';
import { shallow } from 'zustand/shallow';

// Snapshot-based undo/redo manager
class HistoryManager {
  private undoStack: string[] = [];
  private redoStack: string[] = [];
  private maxDepth = 50;
  private lastSnapshot = '';
  private paused = false;

  snapshot(doc: Document): void {
    if (this.paused) return;
    const json = JSON.stringify(doc);
    // Don't push duplicate snapshots
    if (json === this.lastSnapshot) return;
    this.undoStack.push(this.lastSnapshot);
    this.lastSnapshot = json;
    this.redoStack = [];
    if (this.undoStack.length > this.maxDepth) {
      this.undoStack.shift();
    }
  }

  init(doc: Document): void {
    this.lastSnapshot = JSON.stringify(doc);
  }

  undo(): Document | null {
    if (this.undoStack.length === 0) return null;
    this.redoStack.push(this.lastSnapshot);
    this.lastSnapshot = this.undoStack.pop()!;
    return JSON.parse(this.lastSnapshot);
  }

  redo(): Document | null {
    if (this.redoStack.length === 0) return null;
    this.undoStack.push(this.lastSnapshot);
    this.lastSnapshot = this.redoStack.pop()!;
    return JSON.parse(this.lastSnapshot);
  }

  pause(): void { this.paused = true; }
  resume(): void { this.paused = false; }

  get canUndo(): boolean { return this.undoStack.length > 0; }
  get canRedo(): boolean { return this.redoStack.length > 0; }
}

// Editor instance combines store, event bus, plugin manager, and history
export interface EditorInstance {
  store: EditorStore;
  eventBus: EventBus;
  pluginManager: PluginManager;
  historyManager: HistoryManager;
}

const EditorContext = createContext<EditorInstance | null>(null);

export interface EditorProviderProps {
  children: React.ReactNode;
  initialDocument?: Document;
  plugins?: Plugin[];
  onChange?: (document: Document) => void;
}

export function EditorProvider({
  children,
  initialDocument,
  plugins = [],
  onChange,
}: EditorProviderProps) {
  const instanceRef = useRef<EditorInstance | null>(null);

  if (!instanceRef.current) {
    const eventBus = new EventBus();
    const store = createEditorStore(initialDocument);
    const pluginManager = new PluginManager(eventBus);
    const historyManager = new HistoryManager();

    // Initialize history with the initial document
    historyManager.init(store.getState().document);

    instanceRef.current = { store, eventBus, pluginManager, historyManager };

    // Register plugins
    for (const plugin of plugins) {
      pluginManager.register(plugin);
    }

    // Listen for undo/redo events from the event bus
    eventBus.on('history:undo', () => {
      const doc = historyManager.undo();
      if (doc) {
        historyManager.pause();
        store.getState().setDocument(doc);
        historyManager.resume();
      }
    });

    eventBus.on('history:redo', () => {
      const doc = historyManager.redo();
      if (doc) {
        historyManager.pause();
        store.getState().setDocument(doc);
        historyManager.resume();
      }
    });

    // Subscribe to store changes to auto-snapshot for undo/redo
    let debounceTimer: ReturnType<typeof setTimeout> | null = null;
    store.subscribe((state, prevState) => {
      if (state.document !== prevState.document) {
        // Debounce snapshots to avoid flooding during drag operations
        if (debounceTimer) clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
          historyManager.snapshot(state.document);
        }, 300);
      }
    });
  }

  const instance = instanceRef.current;

  // Subscribe to changes for onChange callback
  useEffect(() => {
    if (!onChange) return;
    const unsubscribe = instance.store.subscribe((state) => {
      onChange(state.document);
    });
    return unsubscribe;
  }, [onChange, instance]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      const pm = instanceRef.current?.pluginManager;
      if (pm) {
        for (const plugin of pm.getAllPlugins()) {
          pm.unregister(plugin.name);
        }
      }
      instanceRef.current?.eventBus.removeAll();
    };
  }, []);

  return (
    <EditorContext.Provider value={instance}>
      {children}
    </EditorContext.Provider>
  );
}

// Base hook to access the editor instance
export function useEditorInstance(): EditorInstance {
  const instance = useContext(EditorContext);
  if (!instance) {
    throw new Error('useEditorInstance must be used within an EditorProvider');
  }
  return instance;
}

// Hook to select state from the store with proper reactivity
export function useEditorStore<T>(selector: (state: EditorState) => T): T {
  const { store } = useEditorInstance();
  return useStoreWithEqualityFn(store, selector, shallow);
}
