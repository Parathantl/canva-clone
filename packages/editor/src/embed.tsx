import React, { createRef } from 'react';
import { createRoot } from 'react-dom/client';
import type { Document, DashboardFilter } from '@reactcanvas/core';
import { DashboardViewer } from './DashboardViewer';
import type { DashboardViewerRef } from './DashboardViewer';
import type { EditorTheme } from './ThemeContext';

export interface EmbedOptions {
  /** Target DOM element or CSS selector */
  target: string | HTMLElement;
  /** Inline document JSON */
  document?: Document;
  /** URL to fetch document JSON from (your backend) */
  documentUrl?: string;
  /** SSE stream URL for real-time updates (your backend) */
  streamUrl?: string;
  /** Auth token — sent as Authorization: Bearer header */
  token?: string;
  /** Polling interval in ms as fallback (default 0 = no polling) */
  pollInterval?: number;
  /** Page index to show */
  pageIndex?: number;
  /** Enable interactive filters */
  interactive?: boolean;
  /** Width (CSS value) */
  width?: string;
  /** Height (CSS value) */
  height?: string;
  /** Called when a filter is applied or removed */
  onFilterChange?: (filters: DashboardFilter[]) => void;
  /** Called when page changes */
  onPageChange?: (pageIndex: number, pageName: string) => void;
  /** Called when any widget is clicked */
  onWidgetClick?: (elementId: string, elementType: string, elementName: string) => void;
  /** Values for {{variable}} placeholders in the document */
  variables?: Record<string, string | number>;
  /** Mobile breakpoint in px — below this, widgets stack vertically (default 768) */
  mobileBreakpoint?: number;
  /** Theme customization — pass partial overrides to change colors, fonts, and styling */
  theme?: Partial<EditorTheme>;
}

interface EmbedInstance {
  unmount: () => void;
  update: (options: Partial<EmbedOptions>) => void;
  // Programmatic API
  setFilter: (field: string, value: string) => void;
  clearFilters: () => void;
  goToPage: (index: number) => void;
  refreshData: () => void;
}

function resolveTarget(target: string | HTMLElement): HTMLElement {
  if (typeof target === 'string') {
    const el = document.querySelector(target);
    if (!el) throw new Error(`DashboardEmbed: target "${target}" not found`);
    return el as HTMLElement;
  }
  return target;
}

async function fetchDocument(url: string, token?: string): Promise<Document> {
  const headers: Record<string, string> = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const response = await fetch(url, { headers });
  if (!response.ok) {
    throw new Error(`DashboardEmbed: failed to fetch document (${response.status})`);
  }
  return response.json();
}

/**
 * Renders a dashboard viewer into any DOM element.
 *
 * Static mode (inline document):
 * ```js
 * DashboardEmbed.render({
 *   target: '#dashboard',
 *   document: { ... },
 * });
 * ```
 *
 * Fetch from your backend:
 * ```js
 * DashboardEmbed.render({
 *   target: '#dashboard',
 *   documentUrl: 'https://your-api.com/dashboards/123',
 *   token: 'your-auth-token',
 * });
 * ```
 *
 * Real-time (SSE from your backend):
 * ```js
 * DashboardEmbed.render({
 *   target: '#dashboard',
 *   documentUrl: 'https://your-api.com/dashboards/123',
 *   streamUrl: 'https://your-api.com/dashboards/123/stream',
 *   token: 'your-auth-token',
 * });
 * ```
 */
async function render(options: EmbedOptions): Promise<EmbedInstance> {
  const container = resolveTarget(options.target);

  let doc: Document;
  if (options.document) {
    doc = options.document;
  } else if (options.documentUrl) {
    doc = await fetchDocument(options.documentUrl, options.token);
  } else {
    throw new Error('DashboardEmbed: provide "document" or "documentUrl"');
  }

  let currentOptions = { ...options };
  const root = createRoot(container);
  const viewerRef = createRef<DashboardViewerRef>();

  function renderViewer(viewerDoc: Document) {
    root.render(
      <DashboardViewer
        ref={viewerRef}
        document={viewerDoc}
        documentUrl={currentOptions.documentUrl}
        streamUrl={currentOptions.streamUrl}
        token={currentOptions.token}
        pollInterval={currentOptions.pollInterval}
        pageIndex={currentOptions.pageIndex}
        interactive={currentOptions.interactive ?? true}
        width={currentOptions.width ?? '100%'}
        height={currentOptions.height ?? '100%'}
        onFilterChange={currentOptions.onFilterChange}
        onPageChange={currentOptions.onPageChange}
        onWidgetClick={currentOptions.onWidgetClick}
        variables={currentOptions.variables}
        theme={currentOptions.theme}
        mobileBreakpoint={currentOptions.mobileBreakpoint}
      />
    );
  }

  renderViewer(doc);

  return {
    unmount() {
      root.unmount();
    },
    update(newOptions: Partial<EmbedOptions>) {
      currentOptions = { ...currentOptions, ...newOptions };
      if (newOptions.document) {
        renderViewer(newOptions.document);
      }
    },
    setFilter(field: string, value: string) {
      viewerRef.current?.setFilter(field, value);
    },
    clearFilters() {
      viewerRef.current?.clearFilters();
    },
    goToPage(index: number) {
      viewerRef.current?.goToPage(index);
    },
    refreshData() {
      viewerRef.current?.refreshData();
    },
  };
}

export { render };

if (typeof window !== 'undefined') {
  (window as unknown as Record<string, unknown>).DashboardEmbed = { render };
}
