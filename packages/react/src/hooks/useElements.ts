import { useCallback, useMemo } from 'react';
import type { CanvasElement } from '@reactcanvas/core';
import { useEditorInstance, useEditorStore } from '../context/EditorContext';

/** Creates a stable callback that delegates to a store method */
function useStoreAction<T extends (...args: any[]) => any>(
  store: { getState: () => Record<string, any> },
  method: string,
): T {
  return useCallback(
    (...args: any[]) => store.getState()[method](...args),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [store],
  ) as T;
}

export function useElements() {
  const { store, eventBus } = useEditorInstance();
  const activePageId = useEditorStore((s) => s.activePageId);
  const pages = useEditorStore((s) => s.document.pages);

  const elements = useMemo(() => {
    const page = pages.find((p) => p.id === activePageId);
    return page?.elements ?? [];
  }, [pages, activePageId]);

  // Methods that emit events need custom wrappers
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

  // Simple store delegations — use factory to eliminate boilerplate
  const removeElements = useStoreAction<(ids: string[]) => void>(store, 'removeElements');
  const updateElements = useStoreAction<(updates: Array<{ id: string; changes: Partial<CanvasElement> }>) => void>(store, 'updateElements');
  const duplicateElements = useStoreAction<(ids: string[]) => string[]>(store, 'duplicateElements');
  const getElement = useStoreAction<(id: string) => CanvasElement | undefined>(store, 'getElement');
  const reorderElement = useStoreAction<(id: string, order: number) => void>(store, 'reorderElement');
  const bringToFront = useStoreAction<(ids: string[]) => void>(store, 'bringToFront');
  const sendToBack = useStoreAction<(ids: string[]) => void>(store, 'sendToBack');
  const bringForward = useStoreAction<(ids: string[]) => void>(store, 'bringForward');
  const sendBackward = useStoreAction<(ids: string[]) => void>(store, 'sendBackward');
  const groupElements = useStoreAction<(ids: string[]) => string>(store, 'groupElements');
  const ungroupElement = useStoreAction<(id: string) => void>(store, 'ungroupElement');

  return {
    elements,
    addElement,
    removeElement,
    removeElements,
    updateElement,
    updateElements,
    duplicateElements,
    getElement,
    reorderElement,
    bringToFront,
    sendToBack,
    bringForward,
    sendBackward,
    groupElements,
    ungroupElement,
  };
}
