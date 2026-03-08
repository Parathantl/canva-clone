import React, { createContext, useContext, useRef, useEffect, useMemo } from 'react';
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

// Editor instance combines store, event bus, and plugin manager
export interface EditorInstance {
  store: EditorStore;
  eventBus: EventBus;
  pluginManager: PluginManager;
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

    instanceRef.current = { store, eventBus, pluginManager };

    // Register plugins
    for (const plugin of plugins) {
      pluginManager.register(plugin);
    }
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
// Uses shallow equality by default to prevent infinite re-renders from derived objects/arrays
export function useEditorStore<T>(selector: (state: EditorState) => T): T {
  const { store } = useEditorInstance();
  return useStoreWithEqualityFn(store, selector, shallow);
}
