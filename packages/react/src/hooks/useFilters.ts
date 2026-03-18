import { useCallback, useEffect, useState } from 'react';
import type { DashboardFilter } from '@reactcanvas/core';
import { useEditorInstance, useEditorStore } from '../context/EditorContext';

/**
 * Hook to manage cross-widget dashboard filters.
 * Provides filter state + actions for the current active page.
 */
export function useFilters() {
  const { filterManager } = useEditorInstance();
  const activePageId = useEditorStore((s) => s.activePageId);
  const [filters, setFilters] = useState<DashboardFilter[]>([]);

  // Subscribe to filter changes
  useEffect(() => {
    // Initial state
    setFilters(filterManager.getPageFilters(activePageId));

    const unsub = filterManager.subscribe((allFilters) => {
      const pageFilters = allFilters.filter((f) => f.pageId === activePageId);
      setFilters((prev) => {
        if (prev.length === pageFilters.length && prev.every((f, i) => f === pageFilters[i])) {
          return prev;
        }
        return pageFilters;
      });
    });
    return unsub;
  }, [filterManager, activePageId]);

  const toggleFilter = useCallback(
    (filter: Omit<DashboardFilter, 'id' | 'pageId'>) => {
      filterManager.toggleFilter({ ...filter, pageId: activePageId });
    },
    [filterManager, activePageId]
  );

  const addFilter = useCallback(
    (filter: Omit<DashboardFilter, 'id' | 'pageId'>) => {
      filterManager.addFilter({ ...filter, pageId: activePageId });
    },
    [filterManager, activePageId]
  );

  const removeFilter = useCallback(
    (filterId: string) => {
      filterManager.removeFilter(filterId);
    },
    [filterManager]
  );

  const clearAll = useCallback(() => {
    filterManager.clearPageFilters(activePageId);
  }, [filterManager, activePageId]);

  const isValueFiltered = useCallback(
    (field: string, value: string) => {
      return filterManager.isValueFiltered(activePageId, field, value);
    },
    [filterManager, activePageId]
  );

  const hasActiveFilters = filters.length > 0;

  return {
    filters,
    hasActiveFilters,
    toggleFilter,
    addFilter,
    removeFilter,
    clearAll,
    isValueFiltered,
    filterManager,
  };
}
