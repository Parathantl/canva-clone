import { useCallback, useMemo } from 'react';
import type { CanvasElement } from '@reactcanvas/core';
import { useEditorInstance, useEditorStore } from '../context/EditorContext';

export function useElements() {
  const { store, eventBus } = useEditorInstance();
  const activePageId = useEditorStore((s) => s.activePageId);
  const pages = useEditorStore((s) => s.document.pages);

  const elements = useMemo(() => {
    const page = pages.find((p) => p.id === activePageId);
    return page?.elements ?? [];
  }, [pages, activePageId]);

  const addElement = useCallback(
    (element: CanvasElement) => {
      store.getState().addElement(element);
      eventBus.emit('element:add', { element });
    },
    [store, eventBus]
  );

  const removeElement = useCallback(
    (elementId: string) => {
      const element = store.getState().getElement(elementId);
      store.getState().removeElement(elementId);
      if (element) {
        eventBus.emit('element:remove', { element });
      }
    },
    [store, eventBus]
  );

  const removeElements = useCallback(
    (elementIds: string[]) => {
      store.getState().removeElements(elementIds);
    },
    [store]
  );

  const updateElement = useCallback(
    (elementId: string, updates: Partial<CanvasElement>) => {
      const prev = store.getState().getElement(elementId);
      store.getState().updateElement(elementId, updates);
      const current = store.getState().getElement(elementId);
      if (prev && current) {
        eventBus.emit('element:update', { element: current, previousElement: prev });
      }
    },
    [store, eventBus]
  );

  const duplicateElements = useCallback(
    (elementIds: string[]) => {
      return store.getState().duplicateElements(elementIds);
    },
    [store]
  );

  const getElement = useCallback(
    (elementId: string) => {
      return store.getState().getElement(elementId);
    },
    [store]
  );

  const reorderElement = useCallback(
    (elementId: string, newOrder: number) => {
      store.getState().reorderElement(elementId, newOrder);
    },
    [store]
  );

  return {
    elements,
    addElement,
    removeElement,
    removeElements,
    updateElement,
    duplicateElements,
    getElement,
    reorderElement,
  };
}
