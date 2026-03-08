import { useCallback } from 'react';
import type { Document } from '@reactcanvas/core';
import { useEditorInstance, useEditorStore } from '../context/EditorContext';

export function useEditor() {
  const { store, eventBus, pluginManager } = useEditorInstance();
  const document = useEditorStore((s) => s.document);
  const activeTool = useEditorStore((s) => s.activeTool);
  const isEditing = useEditorStore((s) => s.isEditing);

  const loadDocument = useCallback(
    (doc: Document) => {
      store.getState().setDocument(doc);
    },
    [store]
  );

  const saveDocument = useCallback((): Document => {
    return JSON.parse(JSON.stringify(store.getState().document));
  }, [store]);

  const setActiveTool = useCallback(
    (tool: string) => {
      store.getState().setActiveTool(tool);
    },
    [store]
  );

  return {
    document,
    activeTool,
    isEditing,
    loadDocument,
    saveDocument,
    setActiveTool,
    eventBus,
    pluginManager,
  };
}
