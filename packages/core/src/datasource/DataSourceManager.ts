import { nanoid } from 'nanoid';
import type { DataSource, DataSourceAuth, DataSourceHeader, FieldMapping } from '../types/document';

export interface FetchResult {
  data: any;
  raw: any;
  error?: string;
  timestamp: string;
}

type Listener = (sourceId: string, result: FetchResult) => void;

/**
 * DataSourceManager — fetches, caches, and polls external APIs.
 * Runs entirely client-side. Tokens/keys are stored in the document
 * (the user controls where their document is persisted).
 */
export class DataSourceManager {
  private cache = new Map<string, FetchResult>();
  private timers = new Map<string, ReturnType<typeof setInterval>>();
  private listeners = new Set<Listener>();
  private sources = new Map<string, DataSource>();

  /** Register a data source and optionally start polling */
  register(source: DataSource): void {
    this.sources.set(source.id, source);
    // Auto-fetch on register
    this.fetch(source.id);
    // Start polling if interval > 0
    if (source.refreshInterval > 0) {
      this.startPolling(source.id, source.refreshInterval);
    }
  }

  /** Update a data source config (e.g., URL or auth changed) */
  update(source: DataSource): void {
    this.stopPolling(source.id);
    this.sources.set(source.id, source);
    this.fetch(source.id);
    if (source.refreshInterval > 0) {
      this.startPolling(source.id, source.refreshInterval);
    }
  }

  /** Remove a data source */
  remove(id: string): void {
    this.stopPolling(id);
    this.sources.delete(id);
    this.cache.delete(id);
  }

  /** Get cached result for a data source */
  getCached(id: string): FetchResult | undefined {
    return this.cache.get(id);
  }

  /** Get a registered data source */
  getSource(id: string): DataSource | undefined {
    return this.sources.get(id);
  }

  /** Get all registered sources */
  getAllSources(): DataSource[] {
    return Array.from(this.sources.values());
  }

  /** Subscribe to data updates */
  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /** Manually trigger a fetch */
  async fetch(id: string): Promise<FetchResult> {
    const source = this.sources.get(id);
    if (!source) {
      const err: FetchResult = {
        data: null,
        raw: null,
        error: `Data source "${id}" not found`,
        timestamp: new Date().toISOString(),
      };
      return err;
    }

    try {
      const headers = buildHeaders(source.auth, source.headers);
      const fetchOpts: RequestInit = {
        method: source.method,
        headers,
      };
      if (source.method === 'POST' && source.body) {
        fetchOpts.body = source.body;
      }

      const resp = await fetch(source.url, fetchOpts);
      if (!resp.ok) {
        throw new Error(`HTTP ${resp.status}: ${resp.statusText}`);
      }

      const contentType = resp.headers.get('content-type') || '';
      if (!contentType.includes('application/json') && !contentType.includes('+json')) {
        throw new Error(`Expected JSON response but got content-type: ${contentType}`);
      }

      let raw: any;
      try {
        raw = await resp.json();
      } catch {
        throw new Error('Failed to parse response as JSON');
      }
      const data = extractData(raw, source.fieldMapping);

      const result: FetchResult = {
        data,
        raw,
        timestamp: new Date().toISOString(),
      };

      this.cache.set(id, result);
      this.notifyListeners(id, result);
      return result;
    } catch (e: any) {
      const result: FetchResult = {
        data: null,
        raw: null,
        error: e.message || 'Fetch failed',
        timestamp: new Date().toISOString(),
      };
      this.cache.set(id, result);
      this.notifyListeners(id, result);
      return result;
    }
  }

  /** Stop all polling and clear cache */
  destroy(): void {
    for (const id of this.timers.keys()) {
      this.stopPolling(id);
    }
    this.cache.clear();
    this.sources.clear();
    this.listeners.clear();
  }

  private startPolling(id: string, intervalSec: number): void {
    this.stopPolling(id);
    const timer = setInterval(() => this.fetch(id), intervalSec * 1000);
    this.timers.set(id, timer);
  }

  private stopPolling(id: string): void {
    const timer = this.timers.get(id);
    if (timer) {
      clearInterval(timer);
      this.timers.delete(id);
    }
  }

  private notifyListeners(id: string, result: FetchResult): void {
    for (const listener of this.listeners) {
      try {
        listener(id, result);
      } catch {
        // Don't let listener errors break the manager
      }
    }
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────

function buildHeaders(auth: DataSourceAuth, customHeaders: DataSourceHeader[]): Record<string, string> {
  const headers: Record<string, string> = {
    'Accept': 'application/json',
  };
  const validHeaderName = /^[a-zA-Z0-9\-_]+$/;

  // Auth
  switch (auth.type) {
    case 'bearer':
      if (auth.token) {
        headers['Authorization'] = `Bearer ${auth.token}`;
      }
      break;
    case 'apiKey':
      if (auth.headerName && auth.headerValue && validHeaderName.test(auth.headerName)) {
        headers[auth.headerName] = auth.headerValue;
      }
      break;
    case 'basic':
      if (auth.username) {
        const encoded = btoa(`${auth.username}:${auth.password || ''}`);
        headers['Authorization'] = `Basic ${encoded}`;
      }
      break;
  }

  // Custom headers
  for (const h of customHeaders) {
    if (h.enabled && h.key && validHeaderName.test(h.key)) {
      headers[h.key] = h.value;
    }
  }

  return headers;
}

/**
 * Extract data array from a JSON response using a dot-path accessor.
 * e.g., dataPath = "results.data" will navigate to response.results.data
 */
export function extractData(raw: any, mapping: FieldMapping): any {
  if (!raw) return null;

  let data = raw;
  if (mapping.dataPath) {
    const parts = mapping.dataPath.split('.');
    for (const part of parts) {
      if (data == null) break;
      // Support array index like "items[0]"
      const arrayMatch = part.match(/^(\w+)\[(\d+)\]$/);
      if (arrayMatch) {
        data = data[arrayMatch[1]]?.[parseInt(arrayMatch[2])];
      } else {
        data = data[part];
      }
    }
  }

  return data;
}

/**
 * Transform fetched data into chart-compatible format using field mapping.
 */
export function mapDataToChart(
  rawData: any,
  mapping: FieldMapping,
): { data: Array<{ label: string; value: number }>; labels?: string[]; series?: Array<{ name: string; data: number[] }> } {
  if (!Array.isArray(rawData)) {
    return { data: [] };
  }

  const { labelField, valueField, seriesField } = mapping;

  // Multi-series grouping
  if (seriesField && labelField) {
    const groups = new Map<string, Map<string, number>>();
    const allLabels = new Set<string>();

    for (const row of rawData) {
      const seriesName = String(row[seriesField] ?? '');
      const label = String(row[labelField] ?? '');
      const value = parseFloat(row[valueField || 'value']) || 0;

      allLabels.add(label);
      if (!groups.has(seriesName)) groups.set(seriesName, new Map());
      groups.get(seriesName)!.set(label, value);
    }

    const labels = Array.from(allLabels);
    const series = Array.from(groups.entries()).map(([name, dataMap]) => ({
      name,
      data: labels.map((l) => dataMap.get(l) || 0),
    }));

    return { data: [], labels, series };
  }

  // Single series
  const data = rawData.map((row: any) => ({
    label: String(row[labelField || 'label'] ?? ''),
    value: parseFloat(row[valueField || 'value']) || 0,
  }));

  return { data };
}

/**
 * Transform fetched data into table-compatible format.
 */
export function mapDataToTable(
  rawData: any,
  mapping: FieldMapping,
): { headers: string[]; rows: string[][] } {
  if (!Array.isArray(rawData) || rawData.length === 0) {
    return { headers: [], rows: [] };
  }

  const columnFields = mapping.columnFields;
  const headers = columnFields && columnFields.length > 0
    ? columnFields
    : Object.keys(rawData[0]);

  const rows = rawData.map((row: any) =>
    headers.map((field) => String(row[field] ?? ''))
  );

  return { headers, rows };
}

/**
 * Transform fetched data into KPI-compatible format.
 */
export function mapDataToKPI(
  rawData: any,
  mapping: FieldMapping,
): { value: string } {
  if (rawData == null) return { value: '--' };

  const field = mapping.metricField || 'value';

  // If it's an array, take first item
  const source = Array.isArray(rawData) ? rawData[0] : rawData;
  const val = source?.[field];

  return { value: val != null ? String(val) : '--' };
}

/** Create a default (empty) DataSource */
export function createDataSource(overrides: Partial<DataSource> = {}): DataSource {
  return {
    id: nanoid(),
    name: 'New Data Source',
    url: '',
    method: 'GET',
    headers: [],
    auth: { type: 'none' },
    body: undefined,
    refreshInterval: 0,
    fieldMapping: {},
    ...overrides,
  };
}
