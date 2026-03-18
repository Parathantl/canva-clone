import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import type { Document, CanvasElement } from '@reactcanvas/core';
import { EditorProvider, usePages, useViewport, useFilters } from '@reactcanvas/react';
import { createDefaultPlugins } from '@reactcanvas/plugins';
import { DOMElementRenderer } from './renderers/DOMElementRenderer';
import { FilterBar } from './ui/FilterBar';
import type { ChartFilterEvent } from './renderers/WidgetRenderers';

export interface DashboardViewerProps {
  /** The document to display (static mode) */
  document: Document;
  /** Page index to show (default 0) */
  pageIndex?: number;
  /** Enable interactive filters (default true) */
  interactive?: boolean;
  /** Width — defaults to 100% */
  width?: number | string;
  /** Height — defaults to 100% */
  height?: number | string;
  /** Background color */
  backgroundColor?: string;
  /** Show page navigation if multi-page (default true) */
  showPageNav?: boolean;
  /** CSS class */
  className?: string;
  /** Inline styles */
  style?: React.CSSProperties;

  // ─── Real-time options (bring your own backend) ─────────
  /** URL to fetch the document JSON from (your backend endpoint) */
  documentUrl?: string;
  /** SSE stream URL for real-time updates (your backend endpoint) */
  streamUrl?: string;
  /** Auth token — sent as Authorization: Bearer header */
  token?: string;
  /** Polling interval in ms as SSE fallback (default 0 = no polling) */
  pollInterval?: number;
  /** Called when document updates from server */
  onDocumentUpdate?: (doc: Document) => void;
  /** Called on connection status change */
  onConnectionChange?: (status: 'connected' | 'disconnected' | 'error') => void;
}

/** Read-only dashboard viewer — no editing, no toolbar, no inspector.
 *  Supports real-time sync via documentUrl + streamUrl props. */
export function DashboardViewer(props: DashboardViewerProps) {
  const plugins = useMemo(() => createDefaultPlugins(), []);
  const [liveDoc, setLiveDoc] = useState<Document>(props.document);

  const fetchHeaders = useMemo(() => {
    const h: Record<string, string> = { 'Accept': 'application/json' };
    if (props.token) h['Authorization'] = `Bearer ${props.token}`;
    return h;
  }, [props.token]);

  // Fetch initial document from URL if provided
  useEffect(() => {
    if (!props.documentUrl) return;
    fetch(props.documentUrl, { headers: fetchHeaders })
      .then((r) => { if (r.ok) return r.json(); throw new Error(`HTTP ${r.status}`); })
      .then((doc) => { setLiveDoc(doc); props.onDocumentUpdate?.(doc); })
      .catch((err) => { console.warn('Failed to fetch dashboard:', err); props.onConnectionChange?.('error'); });
  }, [props.documentUrl, fetchHeaders]);

  // SSE real-time updates (if streamUrl provided)
  useEffect(() => {
    if (!props.streamUrl) return;

    let eventSource: EventSource | null = null;
    let reconnectTimer: ReturnType<typeof setTimeout>;

    function connect() {
      // EventSource doesn't support custom headers, so append token as query param
      const url = props.token
        ? `${props.streamUrl}${props.streamUrl!.includes('?') ? '&' : '?'}token=${props.token}`
        : props.streamUrl!;
      eventSource = new EventSource(url);

      eventSource.onopen = () => {
        props.onConnectionChange?.('connected');
      };

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'document:update' && data.document) {
            setLiveDoc(data.document);
            props.onDocumentUpdate?.(data.document);
          }
        } catch { /* ignore parse errors */ }
      };

      eventSource.onerror = () => {
        props.onConnectionChange?.('disconnected');
        eventSource?.close();
        reconnectTimer = setTimeout(connect, 5000);
      };
    }

    connect();
    return () => { clearTimeout(reconnectTimer); eventSource?.close(); };
  }, [props.streamUrl, props.token]);

  // Polling fallback
  useEffect(() => {
    if (!props.documentUrl || !props.pollInterval) return;
    const timer = setInterval(() => {
      fetch(props.documentUrl!, { headers: fetchHeaders })
        .then((r) => r.ok ? r.json() : null)
        .then((doc) => { if (doc) { setLiveDoc(doc); props.onDocumentUpdate?.(doc); } })
        .catch(() => {});
    }, props.pollInterval);
    return () => clearInterval(timer);
  }, [props.documentUrl, props.pollInterval, fetchHeaders]);

  // Update from props if no remote URL
  useEffect(() => {
    if (!props.documentUrl) setLiveDoc(props.document);
  }, [props.document, props.documentUrl]);

  return (
    <EditorProvider initialDocument={liveDoc} plugins={plugins} key={liveDoc.id + (liveDoc.updatedAt || '')}>
      <DashboardViewerInner {...props} document={liveDoc} />
    </EditorProvider>
  );
}

// No-op handlers for DOMElementRenderer (read-only mode)
const noop = () => {};
const noopStr = (_id: string) => {};
const noopStrBool = (_id: string, _b: boolean) => {};
const noopStrStr = (_id: string, _h: string, _e: React.MouseEvent) => {};
const noopStrMouse = (_id: string, _e: React.MouseEvent) => {};

function DashboardViewerInner({
  document: _doc,
  pageIndex = 0,
  interactive = true,
  width = '100%',
  height = '100%',
  backgroundColor,
  showPageNav = true,
  className,
  style,
}: DashboardViewerProps) {
  const { pages, setActivePage } = usePages();
  const { zoom, panX, panY, setZoom, setPan, zoomToFit } = useViewport();
  const { filters, toggleFilter, addFilter, removeFilter, clearAll, filterManager } = useFilters();

  const containerRef = useRef<HTMLDivElement>(null);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });

  // Set active page based on pageIndex
  const [currentPageIndex, setCurrentPageIndex] = useState(pageIndex);
  useEffect(() => {
    setCurrentPageIndex(pageIndex);
  }, [pageIndex]);

  useEffect(() => {
    if (pages.length > 0 && currentPageIndex < pages.length) {
      setActivePage(pages[currentPageIndex].id);
    }
  }, [currentPageIndex, pages, setActivePage]);

  const activePage = pages[currentPageIndex] ?? pages[0];

  // ResizeObserver for auto-fit
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      const { width: w, height: h } = entry.contentRect;
      setContainerSize({ width: w, height: h });
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Auto-fit page into container
  const pageWidth = activePage?.width ?? 1920;
  const pageHeight = activePage?.height ?? 1080;

  useEffect(() => {
    if (containerSize.width > 0 && containerSize.height > 0) {
      zoomToFit(containerSize.width, containerSize.height, pageWidth, pageHeight);
    }
  }, [containerSize.width, containerSize.height, pageWidth, pageHeight, zoomToFit]);

  // Sorted elements
  const sortedElements = useMemo(
    () => [...(activePage?.elements ?? [])].sort((a, b) => a.layerOrder - b.layerOrder),
    [activePage?.elements]
  );

  // Filter state for cross-widget filtering
  const activeFilterValues = useMemo(() => {
    const values = new Set<string>();
    for (const f of filters) values.add(f.value);
    return values;
  }, [filters]);

  const handleFilterClick = useCallback((event: ChartFilterEvent) => {
    if (!interactive) return;
    toggleFilter({
      sourceElementId: event.elementId,
      label: event.label,
      field: event.field,
      value: event.value,
    });
  }, [interactive, toggleFilter]);

  const handleFilterControlChange = useCallback((elementId: string, field: string, values: string[], label: string) => {
    if (!interactive) return;
    filterManager.removeSourceFilters(elementId);
    if (values.length > 0 && label) {
      addFilter({
        sourceElementId: elementId,
        label,
        field,
        value: values[0],
      });
    }
  }, [interactive, filterManager, addFilter]);

  const handleRemoveFilter = useCallback((filterId: string) => {
    removeFilter(filterId);
  }, [removeFilter]);

  // Compute offsets to center the page
  const cw = containerSize.width;
  const ch = containerSize.height - (showPageNav && pages.length > 1 ? 48 : 0);
  const offsetX = (cw - pageWidth * zoom) / 2 + panX;
  const offsetY = (ch - pageHeight * zoom) / 2 + panY;

  return (
    <div
      ref={containerRef}
      className={className}
      style={{
        position: 'relative',
        width,
        height,
        overflow: 'hidden',
        backgroundColor: backgroundColor ?? '#e9ecef',
        display: 'flex',
        flexDirection: 'column',
        ...style,
      }}
    >
      {/* Filter bar */}
      {interactive && filters.length > 0 && (
        <FilterBar
          filters={filters}
          onRemoveFilter={handleRemoveFilter}
          onClearAll={clearAll}
        />
      )}

      {/* Canvas area */}
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        <div
          style={{
            position: 'absolute',
            left: offsetX,
            top: offsetY,
            width: pageWidth,
            height: pageHeight,
            transform: `scale(${zoom})`,
            transformOrigin: '0 0',
          }}
        >
          {/* Page background */}
          <div
            style={{
              position: 'absolute',
              width: pageWidth,
              height: pageHeight,
              backgroundColor: activePage?.backgroundColor ?? '#ffffff',
              boxShadow: '0 4px 24px rgba(0,0,0,0.15), 0 0 0 1px rgba(0,0,0,0.03)',
            }}
          >
            {sortedElements.map((element) => (
              <DOMElementRenderer
                key={element.id}
                element={element}
                isSelected={false}
                isEditing={false}
                zoom={zoom}
                onSelect={noopStrBool}
                onDragStart={noopStrMouse}
                onResizeStart={noopStrStr}
                onRotateStart={noopStrMouse}
                onDblClick={noopStr}
                activeFilterValues={interactive && activeFilterValues.size > 0 ? activeFilterValues : undefined}
                onFilterClick={interactive ? handleFilterClick : undefined}
                onFilterControlChange={interactive ? handleFilterControlChange : undefined}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Page navigation */}
      {showPageNav && pages.length > 1 && (
        <div style={viewerStyles.pageNav}>
          {pages.map((page, index) => (
            <button
              key={page.id}
              style={{
                ...viewerStyles.pageButton,
                ...(index === currentPageIndex ? viewerStyles.pageButtonActive : {}),
              }}
              onClick={() => setCurrentPageIndex(index)}
            >
              {page.name || `Page ${index + 1}`}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

const viewerStyles: Record<string, React.CSSProperties> = {
  pageNav: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    padding: '8px 16px',
    backgroundColor: 'rgba(0,0,0,0.04)',
    borderTop: '1px solid rgba(0,0,0,0.08)',
    flexShrink: 0,
    height: 48,
    boxSizing: 'border-box',
  },
  pageButton: {
    height: 32,
    padding: '0 14px',
    border: '1px solid #dee2e6',
    borderRadius: 6,
    backgroundColor: '#ffffff',
    color: '#495057',
    fontSize: 12,
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'all 0.15s',
  },
  pageButtonActive: {
    backgroundColor: '#4A90D9',
    borderColor: '#4A90D9',
    color: '#ffffff',
    fontWeight: 600,
  },
};
