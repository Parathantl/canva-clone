import { useEffect, useState, useCallback } from 'react';
import type { FetchResult } from '@reactcanvas/core';
import { useEditorInstance } from '../context/EditorContext';

export interface DataSourceStatus {
  loading: boolean;
  error?: string;
}

/**
 * Returns loading/error status for all data sources.
 * Subscribes to dataSourceManager and tracks which sources are currently fetching.
 *
 * Returns a Map<sourceId, { loading: boolean, error?: string }>.
 */
export function useDataSourceStatus(): {
  statusMap: Map<string, DataSourceStatus>;
  retryFetch: (sourceId: string) => void;
} {
  const { dataSourceManager } = useEditorInstance();
  const [statusMap, setStatusMap] = useState<Map<string, DataSourceStatus>>(() => {
    const map = new Map<string, DataSourceStatus>();
    // Initialize from cached results
    for (const source of dataSourceManager.getAllSources()) {
      const cached = dataSourceManager.getCached(source.id);
      if (cached) {
        map.set(source.id, {
          loading: false,
          error: cached.error,
        });
      } else {
        // No cached result yet — assume loading
        map.set(source.id, { loading: true });
      }
    }
    return map;
  });

  useEffect(() => {
    // Listen for fetch results to update status
    const unsub = dataSourceManager.subscribe((sourceId: string, result: FetchResult) => {
      setStatusMap((prev) => {
        const next = new Map(prev);
        next.set(sourceId, {
          loading: false,
          error: result.error,
        });
        return next;
      });
    });

    return unsub;
  }, [dataSourceManager]);

  const retryFetch = useCallback((sourceId: string) => {
    // Mark as loading before fetching
    setStatusMap((prev) => {
      const next = new Map(prev);
      next.set(sourceId, { loading: true });
      return next;
    });
    dataSourceManager.fetch(sourceId);
  }, [dataSourceManager]);

  return { statusMap, retryFetch };
}
