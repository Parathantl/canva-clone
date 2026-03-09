import { useCallback, useMemo } from 'react';
import { useEditorInstance, useEditorStore } from '../context/EditorContext';
import { useActivePage } from './useActivePage';

export function useSelection() {
  const { store } = useEditorInstance();
  const selectedElementIds = useEditorStore((s) => s.selectedElementIds);
  const activePage = useActivePage();

  const selectedElements = useMemo(() => {
    if (!activePage) return [];
    const idSet = new Set(selectedElementIds);
    return activePage.elements.filter((el) => idSet.has(el.id));
  }, [activePage, selectedElementIds]);

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
