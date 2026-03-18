import React, { useState, useEffect, useRef, useMemo, useCallback, useImperativeHandle, forwardRef } from 'react';
import type { Document, CanvasElement, DashboardFilter } from '@reactcanvas/core';
import { resolveVariables } from '@reactcanvas/core';
import { EditorProvider, usePages, useViewport, useFilters, useDataSourceStatus } from '@reactcanvas/react';
import { createDefaultPlugins } from '@reactcanvas/plugins';
import { DOMElementRenderer } from './renderers/DOMElementRenderer';
import { FilterBar } from './ui/FilterBar';
import type { ChartFilterEvent } from './renderers/WidgetRenderers';
import { ThemeProvider, useTheme } from './ThemeContext';
import type { EditorTheme } from './ThemeContext';

export interface DashboardViewerRef {
  /** Set a filter programmatically */
  setFilter: (field: string, value: string, label?: string) => void;
  /** Clear all filters */
  clearFilters: () => void;
  /** Navigate to a specific page */
  goToPage: (index: number) => void;
  /** Refresh all data sources */
  refreshData: () => void;
  /** Get current filters */
  getFilters: () => DashboardFilter[];
  /** Get current page index */
  getCurrentPage: () => number;
}

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

  // ─── Event callbacks ─────────
  /** Called when a filter is applied or removed */
  onFilterChange?: (filters: DashboardFilter[]) => void;
  /** Called when page changes */
  onPageChange?: (pageIndex: number, pageName: string) => void;
  /** Called when any widget is clicked */
  onWidgetClick?: (elementId: string, elementType: string, elementName: string) => void;

  // ─── Dashboard Variables ─────────
  /** Values for {{variable}} placeholders in the document */
  variables?: Record<string, string | number>;

  // ─── Theming ─────────
  /** Theme customization — pass partial overrides to change colors, fonts, and styling */
  theme?: Partial<EditorTheme>;
}

/** Read-only dashboard viewer — no editing, no toolbar, no inspector.
 *  Supports real-time sync via documentUrl + streamUrl props. */
export const DashboardViewer = forwardRef<DashboardViewerRef, DashboardViewerProps>(function DashboardViewer(props, ref) {
  const plugins = useMemo(() => createDefaultPlugins(), []);
  const [liveDoc, setLiveDoc] = useState<Document>(props.document);
  const innerRef = useRef<DashboardViewerRef>(null);

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

  // Forward the ref: delegate to inner component's imperative handle
  useImperativeHandle(ref, () => ({
    setFilter: (field, value, label) => innerRef.current?.setFilter(field, value, label),
    clearFilters: () => innerRef.current?.clearFilters(),
    goToPage: (index) => innerRef.current?.goToPage(index),
    refreshData: () => {
      // Re-fetch from documentUrl if available
      if (props.documentUrl) {
        fetch(props.documentUrl, { headers: fetchHeaders })
          .then((r) => r.ok ? r.json() : null)
          .then((doc) => { if (doc) { setLiveDoc(doc); props.onDocumentUpdate?.(doc); } })
          .catch(() => {});
      }
    },
    getFilters: () => innerRef.current?.getFilters() ?? [],
    getCurrentPage: () => innerRef.current?.getCurrentPage() ?? 0,
  }), [props.documentUrl, fetchHeaders]);

  // Resolve {{variable}} placeholders before passing to the provider
  const resolvedDoc = useMemo(() => {
    return props.variables ? resolveVariables(liveDoc, props.variables) : liveDoc;
  }, [liveDoc, props.variables]);

  return (
    <ThemeProvider theme={props.theme}>
      <EditorProvider initialDocument={resolvedDoc} plugins={plugins} key={resolvedDoc.id + (resolvedDoc.updatedAt || '')}>
        <DashboardViewerInner ref={innerRef} {...props} document={resolvedDoc} />
      </EditorProvider>
    </ThemeProvider>
  );
});

// No-op handlers for DOMElementRenderer (read-only mode)
const noopStr = (_id: string) => {};
const noopStrBool = (_id: string, _b: boolean) => {};
const noopStrStr = (_id: string, _h: string, _e: React.MouseEvent) => {};
const noopStrMouse = (_id: string, _e: React.MouseEvent) => {};

const DashboardViewerInner = forwardRef<DashboardViewerRef, DashboardViewerProps>(function DashboardViewerInner({
  document: _doc,
  pageIndex = 0,
  interactive = true,
  width = '100%',
  height = '100%',
  backgroundColor,
  showPageNav = true,
  className,
  style,
  onFilterChange,
  onPageChange,
  onWidgetClick,
}, ref) {
  const { pages, setActivePage } = usePages();
  const { zoom, panX, panY, zoomToFit } = useViewport();
  const { filters, toggleFilter, addFilter, removeFilter, clearAll, filterManager } = useFilters();
  const theme = useTheme();
  const { statusMap: dataSourceStatusMap, retryFetch: retryDataSourceFetch } = useDataSourceStatus();

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

  // Fire onPageChange callback when page changes
  useEffect(() => {
    const page = pages[currentPageIndex];
    if (page) {
      onPageChange?.(currentPageIndex, page.name || `Page ${currentPageIndex + 1}`);
    }
  }, [currentPageIndex, pages, onPageChange]);

  // Fire onFilterChange callback when filters change
  useEffect(() => {
    onFilterChange?.(filters);
  }, [filters, onFilterChange]);

  // Expose imperative API via ref
  useImperativeHandle(ref, () => ({
    setFilter: (field: string, value: string, label?: string) => {
      addFilter({
        sourceElementId: 'programmatic',
        label: label ?? `${field}: ${value}`,
        field,
        value,
      });
    },
    clearFilters: () => {
      clearAll();
    },
    goToPage: (index: number) => {
      if (index >= 0 && index < pages.length) {
        setCurrentPageIndex(index);
      }
    },
    refreshData: () => {
      // Handled by the outer component
    },
    getFilters: () => filters,
    getCurrentPage: () => currentPageIndex,
  }), [addFilter, clearAll, pages.length, filters, currentPageIndex]);

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
    // Always fire onWidgetClick when a chart element is clicked
    onWidgetClick?.(event.elementId, 'chart', event.label);
    if (!interactive) return;
    toggleFilter({
      sourceElementId: event.elementId,
      label: event.label,
      field: event.field,
      value: event.value,
    });
  }, [interactive, toggleFilter, onWidgetClick]);

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

  // Handle drill-down navigation: navigate to target page and apply filter
  const handleDrillDown = useCallback((targetPageId: string, field: string, value: string) => {
    // 1. Navigate to the target page
    const targetIndex = pages.findIndex((p) => p.id === targetPageId);
    if (targetIndex >= 0) {
      setCurrentPageIndex(targetIndex);
    }
    // 2. Apply filter on the target page
    filterManager.clearPageFilters(targetPageId);
    filterManager.addFilter({
      sourceElementId: 'drill-down',
      label: `${field}: ${value}`,
      field,
      value,
      pageId: targetPageId,
    });
  }, [pages, filterManager]);

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
        backgroundColor: backgroundColor ?? theme.canvasBg,
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
            {sortedElements.map((element) => {
              const dsId = element.dataSource?.dataSourceId;
              const dsStatus = dsId ? dataSourceStatusMap.get(dsId) : undefined;
              return (
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
                  onDrillDown={interactive ? handleDrillDown : undefined}
                  dataLoading={dsStatus?.loading}
                  dataError={dsStatus?.error}
                  onDataRetry={dsId ? () => retryDataSourceFetch(dsId) : undefined}
                />
              );
            })}
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
});

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
