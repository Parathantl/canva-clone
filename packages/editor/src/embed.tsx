import React from 'react';
import { createRoot } from 'react-dom/client';
import type { Document } from '@reactcanvas/core';
import { DashboardViewer } from './DashboardViewer';

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
}

interface EmbedInstance {
  unmount: () => void;
  update: (options: Partial<EmbedOptions>) => void;
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

  function renderViewer(viewerDoc: Document) {
    root.render(
      <DashboardViewer
        document={viewerDoc}
        documentUrl={currentOptions.documentUrl}
        streamUrl={currentOptions.streamUrl}
        token={currentOptions.token}
        pollInterval={currentOptions.pollInterval}
        pageIndex={currentOptions.pageIndex}
        interactive={currentOptions.interactive ?? true}
        width={currentOptions.width ?? '100%'}
        height={currentOptions.height ?? '100%'}
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
  };
}

export { render };

if (typeof window !== 'undefined') {
  (window as any).DashboardEmbed = { render };
}
