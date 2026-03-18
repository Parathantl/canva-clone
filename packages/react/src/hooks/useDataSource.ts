import { useCallback, useEffect, useState } from 'react';
import type { DataSource, CanvasElement } from '@reactcanvas/core';
import {
  createDataSource,
  mapDataToChart,
  mapDataToTable,
  mapDataToKPI,
} from '@reactcanvas/core';
import type { FetchResult } from '@reactcanvas/core';
import { useEditorInstance } from '../context/EditorContext';

/**
 * Hook to manage data sources at the document level.
 * Provides CRUD operations and data fetching.
 */
export function useDataSources() {
  const { store, dataSourceManager } = useEditorInstance();
  const [sources, setSources] = useState<DataSource[]>(() => {
    return store.getState().document.dataSources ?? [];
  });

  // Keep in sync with document
  useEffect(() => {
    const unsub = store.subscribe((state) => {
      setSources(state.document.dataSources ?? []);
    });
    return unsub;
  }, [store]);

  const addDataSource = useCallback((overrides: Partial<DataSource> = {}) => {
    const ds = createDataSource(overrides);
    const state = store.getState();
    const doc = state.document;
    const updated = {
      ...doc,
      dataSources: [...(doc.dataSources ?? []), ds],
    };
    state.setDocument(updated);
    dataSourceManager.register(ds);
    return ds;
  }, [store, dataSourceManager]);

  const updateDataSource = useCallback((ds: DataSource) => {
    const state = store.getState();
    const doc = state.document;
    const updated = {
      ...doc,
      dataSources: (doc.dataSources ?? []).map((s: DataSource) => s.id === ds.id ? ds : s),
    };
    state.setDocument(updated);
    dataSourceManager.update(ds);
  }, [store, dataSourceManager]);

  const removeDataSource = useCallback((id: string) => {
    const state = store.getState();
    const doc = state.document;
    const updated = {
      ...doc,
      dataSources: (doc.dataSources ?? []).filter((s: DataSource) => s.id !== id),
    };
    state.setDocument(updated);
    dataSourceManager.remove(id);
  }, [store, dataSourceManager]);

  const fetchDataSource = useCallback(async (id: string) => {
    return dataSourceManager.fetch(id);
  }, [dataSourceManager]);

  const getCachedResult = useCallback((id: string): FetchResult | undefined => {
    return dataSourceManager.getCached(id);
  }, [dataSourceManager]);

  return {
    sources,
    addDataSource,
    updateDataSource,
    removeDataSource,
    fetchDataSource,
    getCachedResult,
    dataSourceManager,
  };
}

/**
 * Editor-level hook that subscribes to ALL data source updates and
 * automatically pushes transformed data into bound widget elements.
 *
 * Call this ONCE at the editor root — not per element.
 *
 * Data flow:
 *   1. DataSourceManager fetches API → gets raw JSON
 *   2. extractData() navigates to the data array via fieldMapping.dataPath
 *   3. This hook listens for fetch results via dataSourceManager.subscribe()
 *   4. For each element bound to that source (element.dataSource.dataSourceId):
 *      - Merges source-level fieldMapping with element-level overrides
 *      - Calls mapDataToChart / mapDataToTable / mapDataToKPI
 *      - Writes the transformed data into the element via store.updateElement()
 *   5. Chart.js / KPI / Table renderers re-render with new props
 */
export function useDataSourceSync() {
  const { store, dataSourceManager } = useEditorInstance();

  useEffect(() => {
    const unsub = dataSourceManager.subscribe((sourceId: string, fetchResult: FetchResult) => {
      if (fetchResult.error || !fetchResult.data) return;

      const state = store.getState();
      const source = dataSourceManager.getSource(sourceId);
      if (!source) return;

      // Find all elements across all pages that are bound to this source
      for (const page of state.document.pages) {
        for (const element of page.elements) {
          if (element.dataSource?.dataSourceId !== sourceId) continue;

          // Merge source-level mapping with element-level overrides
          const mapping = {
            ...source.fieldMapping,
            ...element.dataSource.fieldMapping,
          };

          switch (element.type) {
            case 'chart': {
              const chartData = mapDataToChart(fetchResult.data, mapping);
              state.updateElement(element.id, chartData as Partial<CanvasElement>);
              break;
            }
            case 'table': {
              const tableData = mapDataToTable(fetchResult.data, mapping);
              state.updateElement(element.id, tableData as Partial<CanvasElement>);
              break;
            }
            case 'kpi': {
              const kpiData = mapDataToKPI(fetchResult.data, mapping);
              state.updateElement(element.id, kpiData as Partial<CanvasElement>);
              break;
            }
          }
        }
      }
    });

    return unsub;
  }, [store, dataSourceManager]);
}

/**
 * Hook to subscribe to live data updates for a specific data source.
 * Returns the latest fetch result (data + error + timestamp).
 */
export function useDataSourceBinding(elementDataSourceId: string | undefined) {
  const { dataSourceManager } = useEditorInstance();
  const [result, setResult] = useState<FetchResult | undefined>(() => {
    if (!elementDataSourceId) return undefined;
    return dataSourceManager.getCached(elementDataSourceId);
  });

  useEffect(() => {
    if (!elementDataSourceId) return;
    const cached = dataSourceManager.getCached(elementDataSourceId);
    if (cached) setResult(cached);

    const unsub = dataSourceManager.subscribe((sourceId: string, fetchResult: FetchResult) => {
      if (sourceId === elementDataSourceId) {
        setResult(fetchResult);
      }
    });
    return unsub;
  }, [elementDataSourceId, dataSourceManager]);

  return result;
}
