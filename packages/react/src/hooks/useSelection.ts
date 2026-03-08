import { useCallback, useMemo } from 'react';
import type { CanvasElement } from '@reactcanvas/core';
import { useEditorInstance, useEditorStore } from '../context/EditorContext';

export function useSelection() {
  const { store } = useEditorInstance();
  const selectedElementIds = useEditorStore((s) => s.selectedElementIds);
  const activePageId = useEditorStore((s) => s.activePageId);
  const pages = useEditorStore((s) => s.document.pages);

  const selectedElements = useMemo(() => {
    const page = pages.find((p) => p.id === activePageId);
    if (!page) return [];
    const idSet = new Set(selectedElementIds);
    return page.elements.filter((el) => idSet.has(el.id));
  }, [pages, activePageId, selectedElementIds]);

  const select = useCallback(
    (elementId: string, addToSelection = false) => {
      store.getState().selectElement(elementId, addToSelection);
    },
    [store]
  );

  const selectMultiple = useCallback(
    (elementIds: string[]) => {
      store.getState().selectElements(elementIds);
    },
    [store]
  );

  const deselect = useCallback(
    (elementId: string) => {
      store.getState().deselectElement(elementId);
    },
    [store]
  );

  const deselectAll = useCallback(() => {
    store.getState().deselectAll();
  }, [store]);

  const selectAll = useCallback(() => {
    store.getState().selectAll();
  }, [store]);

  const isSelected = useCallback(
    (elementId: string) => {
      return selectedElementIds.includes(elementId);
    },
    [selectedElementIds]
  );

  return {
    selectedElementIds,
    selectedElements,
    select,
    selectMultiple,
    deselect,
    deselectAll,
    selectAll,
    isSelected,
    hasSelection: selectedElementIds.length > 0,
    selectionCount: selectedElementIds.length,
  };
}
