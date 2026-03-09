import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import type { Document, Plugin, TextElement } from '@reactcanvas/core';
import { EditorProvider, useShortcuts, useSelection, useElements, useEditor } from '@reactcanvas/react';
import { createDefaultPlugins } from '@reactcanvas/plugins';
import { EditorCanvas } from './canvas/EditorCanvas';
import { Toolbar } from './ui/Toolbar';
import { TextToolbar } from './ui/TextToolbar';
import { Sidebar } from './ui/Sidebar';
import { Inspector } from './ui/Inspector';
import { ExportDialog } from './ui/ExportDialog';
import { WidgetLibrary } from './ui/WidgetLibrary';
import { Templates } from './ui/Templates';
import { PresentationMode } from './ui/PresentationMode';
import { ShortcutHelp } from './ui/ShortcutHelp';
import { ErrorBoundary } from './ui/ErrorBoundary';
import { useFontLoader } from './hooks/useFontLoader';

export interface DesignEditorProps {
  initialDocument?: Document;
  plugins?: Plugin[];
  width?: number;
  height?: number;
  onChange?: (document: Document) => void;
  /** External image upload handler for export — receives blob + filename, returns URL */
  onImageUpload?: (blob: Blob, filename: string) => Promise<string>;
  /** Auto-save callback — called with debounced document state. Use to persist to localStorage, DB, etc. */
  onAutoSave?: (document: Document) => void;
  /** Auto-save debounce interval in ms (default 2000) */
  autoSaveInterval?: number;
  showToolbar?: boolean;
  showSidebar?: boolean;
  showInspector?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export function DesignEditor({
  initialDocument,
  plugins,
  width,
  height,
  onChange,
  onImageUpload,
  onAutoSave,
  autoSaveInterval = 2000,
  showToolbar = true,
  showSidebar = true,
  showInspector = true,
  className,
  style,
}: DesignEditorProps) {
  const allPlugins = useMemo(() => plugins ?? createDefaultPlugins(), [plugins]);
  const [containerSize, setContainerSize] = useState({ width: width ?? 1200, height: height ?? 800 });
  const containerRef = useRef<HTMLDivElement>(null);
  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onAutoSaveRef = useRef(onAutoSave);
  onAutoSaveRef.current = onAutoSave;

  // Clear auto-save timer on unmount
  useEffect(() => {
    return () => {
      if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    };
  }, []);

  // Combined onChange: call user's onChange immediately + debounce onAutoSave
  const handleChange = useCallback(
    (doc: Document) => {
      onChange?.(doc);
      if (onAutoSaveRef.current) {
        if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
        autoSaveTimerRef.current = setTimeout(() => onAutoSaveRef.current?.(doc), autoSaveInterval);
      }
    },
    [onChange, autoSaveInterval]
  );

  useEffect(() => {
    if (width !== undefined && height !== undefined) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width: w, height: h } = entry.contentRect;
        setContainerSize({ width: width ?? w, height: height ?? h });
      }
    });
    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [width, height]);

  return (
    <EditorProvider initialDocument={initialDocument} plugins={allPlugins} onChange={handleChange}>
      <EditorInner
        containerRef={containerRef}
        containerSize={containerSize}
        showToolbar={showToolbar}
        showSidebar={showSidebar}
        showInspector={showInspector}
        onImageUpload={onImageUpload}
        className={className}
        style={style}
      />
    </EditorProvider>
  );
}

type SidePanel = 'pages' | 'widgets' | 'templates' | null;

// Icon rail items
const RAIL_ITEMS: { id: SidePanel; icon: string; label: string }[] = [
  { id: 'pages', icon: '\u25A3', label: 'Pages & Layers' },
  { id: 'widgets', icon: '\u2B1A', label: 'Widgets' },
  { id: 'templates', icon: '\u2B13', label: 'Templates' },
];

function EditorInner({
  containerRef,
  containerSize,
  showToolbar,
  showSidebar,
  showInspector,
  onImageUpload,
  className,
  style,
}: {
  containerRef: React.RefObject<HTMLDivElement>;
  containerSize: { width: number; height: number };
  showToolbar: boolean;
  showSidebar: boolean;
  showInspector: boolean;
  onImageUpload?: (blob: Blob, filename: string) => Promise<string>;
  className?: string;
  style?: React.CSSProperties;
}) {
  const [showExport, setShowExport] = useState(false);
  const [showPresentation, setShowPresentation] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [activePanel, setActivePanel] = useState<SidePanel>('pages');
  const [handTool, setHandTool] = useState(false);
  const [isEditingText, setIsEditingText] = useState(false);
  const canvasRef = useRef<HTMLDivElement>(null);
  const { loadDocument } = useEditor();

  const handleImport = useCallback(
    (doc: Document) => {
      loadDocument(doc);
    },
    [loadDocument]
  );

  useShortcuts();

  // Detect selected text element for the top text toolbar
  const { selectedElementIds } = useSelection();
  const { elements, updateElement } = useElements();

  // Auto-load fonts used by text elements
  useFontLoader(elements);
  const selectedTextElement = useMemo(() => {
    if (selectedElementIds.length !== 1) return null;
    const el = elements.find((e) => e.id === selectedElementIds[0]);
    return el?.type === 'text' ? (el as TextElement) : null;
  }, [selectedElementIds, elements]);

  const textToolbarHeight = selectedTextElement ? 44 : 0;

  const layout = useMemo(() => {
    const railWidth = showSidebar ? 56 : 0;
    const panelWidth = showSidebar && activePanel ? 260 : 0;
    const inspectorWidth = showInspector ? 280 : 0;
    const toolbarHeight = showToolbar ? 56 : 0;
    return {
      railWidth,
      panelWidth,
      inspectorWidth,
      toolbarHeight,
      canvasWidth: containerSize.width - railWidth - panelWidth - inspectorWidth,
      canvasHeight: containerSize.height - toolbarHeight - textToolbarHeight,
    };
  }, [showSidebar, activePanel, showInspector, showToolbar, containerSize, textToolbarHeight]);

  const togglePanel = useCallback((panel: SidePanel) => {
    setActivePanel((prev) => (prev === panel ? null : panel));
  }, []);

  return (
    <ErrorBoundary>
    <div
      ref={containerRef}
      className={className}
      style={{
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        height: '100vh',
        overflow: 'hidden',
        fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        backgroundColor: '#0f0f14',
        ...style,
      }}
    >
      {/* Top toolbar */}
      {showToolbar && (
        <Toolbar
          onExport={() => setShowExport(true)}
          onPresent={() => setShowPresentation(true)}
          onShortcuts={() => setShowShortcuts(true)}
          handTool={handTool}
          onHandToolToggle={() => setHandTool((h) => !h)}
          canvasWidth={layout.canvasWidth}
          canvasHeight={layout.canvasHeight}
        />
      )}

      {/* Text formatting toolbar — shown when a text element is selected */}
      {selectedTextElement && (
        <TextToolbar
          element={selectedTextElement}
          isEditing={isEditingText}
          onUpdate={(id, attrs) => updateElement(id, attrs)}
          style={{
            borderRadius: 0,
            border: 'none',
            borderBottom: '1px solid #2a2a3a',
            boxShadow: 'none',
            width: '100%',
            flexShrink: 0,
          }}
        />
      )}

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Icon rail */}
        {showSidebar && (
          <div style={railStyles.rail}>
            {RAIL_ITEMS.map((item) => (
              <button
                key={item.id}
                onClick={() => togglePanel(item.id)}
                title={item.label}
                style={{
                  ...railStyles.railButton,
                  ...(activePanel === item.id ? railStyles.railButtonActive : {}),
                }}
              >
                <span style={railStyles.railIcon}>{item.icon}</span>
                <span style={railStyles.railLabel}>{item.label}</span>
              </button>
            ))}
          </div>
        )}

        {/* Expandable side panel */}
        {showSidebar && activePanel && (
          <div style={railStyles.panel}>
            <div style={railStyles.panelHeader}>
              <span style={railStyles.panelTitle}>
                {RAIL_ITEMS.find((r) => r.id === activePanel)?.label ?? ''}
              </span>
              <button
                onClick={() => setActivePanel(null)}
                style={railStyles.panelClose}
                title="Close panel"
              >
                {'\u2715'}
              </button>
            </div>
            <div style={railStyles.panelBody}>
              {activePanel === 'pages' && <Sidebar />}
              {activePanel === 'widgets' && <WidgetLibrary />}
              {activePanel === 'templates' && <Templates />}
            </div>
          </div>
        )}

        {/* Canvas */}
        <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
          <EditorCanvas
            width={Math.max(100, layout.canvasWidth)}
            height={Math.max(100, layout.canvasHeight)}
            canvasRef={canvasRef}
            handTool={handTool}
            onEditingTextChange={setIsEditingText}
          />
        </div>

        {/* Inspector */}
        {showInspector && <Inspector />}
      </div>

      <ExportDialog
        isOpen={showExport}
        onClose={() => setShowExport(false)}
        canvasRef={canvasRef}
        onImageUpload={onImageUpload}
        onImport={handleImport}
      />
      <PresentationMode
        isOpen={showPresentation}
        onClose={() => setShowPresentation(false)}
      />
      <ShortcutHelp
        isOpen={showShortcuts}
        onClose={() => setShowShortcuts(false)}
      />
    </div>
    </ErrorBoundary>
  );
}

const railStyles: Record<string, React.CSSProperties> = {
  rail: {
    width: 56,
    backgroundColor: '#16161e',
    borderRight: '1px solid #1e1e2e',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    paddingTop: 8,
    gap: 4,
    flexShrink: 0,
  },
  railButton: {
    width: 44,
    height: 44,
    border: 'none',
    borderRadius: 10,
    backgroundColor: 'transparent',
    color: '#585878',
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    transition: 'all 0.15s',
    padding: 0,
  },
  railButtonActive: {
    backgroundColor: '#1e1e2e',
    color: '#89b4fa',
  },
  railIcon: {
    fontSize: 18,
    lineHeight: 1,
  },
  railLabel: {
    fontSize: 8,
    fontWeight: 500,
    letterSpacing: '0.3px',
    lineHeight: 1,
  },
  panel: {
    width: 260,
    backgroundColor: '#16161e',
    borderRight: '1px solid #1e1e2e',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    flexShrink: 0,
  },
  panelHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '14px 16px 10px',
    borderBottom: '1px solid #1e1e2e',
    flexShrink: 0,
  },
  panelTitle: {
    color: '#cdd6f4',
    fontSize: 13,
    fontWeight: 600,
  },
  panelClose: {
    width: 24,
    height: 24,
    border: 'none',
    borderRadius: 6,
    backgroundColor: 'transparent',
    color: '#585878',
    cursor: 'pointer',
    fontSize: 12,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  panelBody: {
    flex: 1,
    overflow: 'hidden',
  },
};
