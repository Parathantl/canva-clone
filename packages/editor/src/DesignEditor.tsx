import React, { useState, useRef, useCallback, useEffect } from 'react';
import type { Document, Plugin } from '@reactcanvas/core';
import { EditorProvider, useShortcuts } from '@reactcanvas/react';
import { createDefaultPlugins } from '@reactcanvas/plugins';
import { EditorCanvas } from './canvas/EditorCanvas';
import { Toolbar } from './ui/Toolbar';
import { Sidebar } from './ui/Sidebar';
import { Inspector } from './ui/Inspector';
import { ExportDialog } from './ui/ExportDialog';

export interface DesignEditorProps {
  initialDocument?: Document;
  plugins?: Plugin[];
  width?: number;
  height?: number;
  onChange?: (document: Document) => void;
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
  showToolbar = true,
  showSidebar = true,
  showInspector = true,
  className,
  style,
}: DesignEditorProps) {
  const allPlugins = plugins ?? createDefaultPlugins();
  const [containerSize, setContainerSize] = useState({ width: width ?? 1200, height: height ?? 800 });
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-resize to fill container
  useEffect(() => {
    if (width && height) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width: w, height: h } = entry.contentRect;
        setContainerSize({
          width: width ?? w,
          height: height ?? h,
        });
      }
    });

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, [width, height]);

  return (
    <EditorProvider
      initialDocument={initialDocument}
      plugins={allPlugins}
      onChange={onChange}
    >
      <EditorInner
        containerRef={containerRef}
        containerSize={containerSize}
        showToolbar={showToolbar}
        showSidebar={showSidebar}
        showInspector={showInspector}
        className={className}
        style={style}
      />
    </EditorProvider>
  );
}

function EditorInner({
  containerRef,
  containerSize,
  showToolbar,
  showSidebar,
  showInspector,
  className,
  style,
}: {
  containerRef: React.RefObject<HTMLDivElement>;
  containerSize: { width: number; height: number };
  showToolbar: boolean;
  showSidebar: boolean;
  showInspector: boolean;
  className?: string;
  style?: React.CSSProperties;
}) {
  const [showExport, setShowExport] = useState(false);
  const canvasRef = useRef<HTMLDivElement>(null);

  // Register keyboard shortcuts
  useShortcuts();

  // Calculate canvas dimensions
  const sidebarWidth = showSidebar ? 240 : 0;
  const inspectorWidth = showInspector ? 260 : 0;
  const toolbarHeight = showToolbar ? 52 : 0;

  const canvasWidth = containerSize.width - sidebarWidth - inspectorWidth;
  const canvasHeight = containerSize.height - toolbarHeight;

  return (
    <div
      ref={containerRef}
      className={className}
      style={{
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        height: '100vh',
        overflow: 'hidden',
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        ...style,
      }}
    >
      {showToolbar && (
        <Toolbar onExport={() => setShowExport(true)} />
      )}

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {showSidebar && <Sidebar />}

        <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
          <EditorCanvas
            width={Math.max(100, canvasWidth)}
            height={Math.max(100, canvasHeight)}
            canvasRef={canvasRef}
          />
        </div>

        {showInspector && <Inspector />}
      </div>

      <ExportDialog
        isOpen={showExport}
        onClose={() => setShowExport(false)}
        canvasRef={canvasRef}
      />
    </div>
  );
}
