import React, { useCallback, useRef } from 'react';
import {
  useSelection,
  useElements,
  useViewport,
  useHistory,
  usePages,
} from '@reactcanvas/react';
import {
  createShapeElement,
  createTextElement,
  createLineElement,
} from '@reactcanvas/core';
import { processImageFile } from '../utils/imageUpload';

export function Toolbar({ onExport, onPresent, onShortcuts, handTool, onHandToolToggle, canvasWidth, canvasHeight }: {
  onExport?: () => void;
  onPresent?: () => void;
  onShortcuts?: () => void;
  handTool?: boolean;
  onHandToolToggle?: () => void;
  canvasWidth?: number;
  canvasHeight?: number;
}) {
  const { selectedElementIds } = useSelection();
  const { addElement, removeElements, duplicateElements, elements } = useElements();
  const elementCountRef = useRef(elements.length);
  elementCountRef.current = elements.length;
  const { zoomIn, zoomOut, zoomPercent, zoomToFit, zoomToPercent } = useViewport();
  const { undo, redo } = useHistory();
  const { activePage } = usePages();

  const pageWidth = activePage?.width ?? 1920;
  const pageHeight = activePage?.height ?? 1080;
  const pageCenter = { x: pageWidth / 2, y: pageHeight / 2 };

  const handleZoomToFit = useCallback(() => {
    zoomToFit(canvasWidth ?? 1200, canvasHeight ?? 800, pageWidth, pageHeight);
  }, [zoomToFit, canvasWidth, canvasHeight, pageWidth, pageHeight]);

  const handleAddShape = useCallback(
    (shapeType: string) => {
      addElement(createShapeElement({
        shapeType,
        x: pageCenter.x - 100,
        y: pageCenter.y - 100,
        layerOrder: elementCountRef.current,
        name: shapeType.charAt(0).toUpperCase() + shapeType.slice(1),
      }));
    },
    [addElement, pageCenter.x, pageCenter.y]
  );

  const handleAddLine = useCallback((withArrow: boolean) => {
    addElement(createLineElement({
      x: pageCenter.x - 100,
      y: pageCenter.y,
      width: 200,
      height: 0,
      points: [0, 0, 200, 0],
      endArrow: withArrow,
      layerOrder: elementCountRef.current,
      name: withArrow ? 'Arrow' : 'Line',
    }));
  }, [addElement, pageCenter.x, pageCenter.y]);

  const handleAddText = useCallback(() => {
    addElement(createTextElement({ x: pageCenter.x - 150, y: pageCenter.y - 30, layerOrder: elementCountRef.current }));
  }, [addElement, pageCenter.x, pageCenter.y]);

  return (
    <div style={styles.toolbar}>
      {/* Left: Logo + Creation tools */}
      <div style={styles.section}>
        <div style={styles.logo}>RC</div>

        <div style={styles.toolGroup}>
          <ToolBtn icon={'\u25A2'} tip="Rectangle" onClick={() => handleAddShape('rectangle')} />
          <ToolBtn icon={'\u25EF'} tip="Circle" onClick={() => handleAddShape('circle')} />
          <ToolBtn icon={'\u25B3'} tip="Triangle" onClick={() => handleAddShape('triangle')} />
          <ToolBtn icon={'\u2606'} tip="Star" onClick={() => handleAddShape('star')} />
        </div>

        <div style={styles.divider} />

        <div style={styles.toolGroup}>
          <ToolBtn icon={'\u2571'} tip="Line" onClick={() => handleAddLine(false)} />
          <ToolBtn icon={'\u2794'} tip="Arrow" onClick={() => handleAddLine(true)} />
        </div>

        <div style={styles.divider} />

        <div style={styles.toolGroup}>
          <ToolBtn icon="T" tip="Add Text" onClick={handleAddText} />
          <ImageUploadButton />
        </div>
      </div>

      {/* Center: Edit actions */}
      <div style={styles.section}>
        <div style={styles.toolGroup}>
          <ToolBtn icon={'\u21B6'} tip="Undo" onClick={undo} />
          <ToolBtn icon={'\u21B7'} tip="Redo" onClick={redo} />
        </div>

        <div style={styles.divider} />

        <div style={styles.toolGroup}>
          <ToolBtn
            icon={'\uD83D\uDDD1'}
            tip="Delete"
            onClick={() => selectedElementIds.length > 0 && removeElements(selectedElementIds)}
            disabled={selectedElementIds.length === 0}
          />
          <ToolBtn
            icon={'\u2398'}
            tip="Duplicate"
            onClick={() => selectedElementIds.length > 0 && duplicateElements(selectedElementIds)}
            disabled={selectedElementIds.length === 0}
          />
        </div>
      </div>

      {/* Right: Zoom + Export */}
      <div style={styles.section}>
        {onHandToolToggle && (
          <>
            <ToolBtn icon={'\u270B'} tip="Hand Tool (hold Space)" onClick={onHandToolToggle} active={handTool} />
            <div style={styles.divider} />
          </>
        )}
        <div style={styles.zoomGroup}>
          <ToolBtn icon={'\u2212'} tip="Zoom Out" onClick={zoomOut} small />
          <select
            value={zoomPercent}
            onChange={(e) => zoomToPercent(Number(e.target.value))}
            style={styles.zoomSelect}
          >
            {(() => {
              const presets = [25, 50, 75, 100, 125, 150, 200, 300];
              const options = presets.includes(zoomPercent)
                ? presets
                : [...presets, zoomPercent].sort((a, b) => a - b);
              return options.map((p) => (
                <option key={p} value={p}>{p}%</option>
              ));
            })()}</select>
          <ToolBtn icon={'\u002B'} tip="Zoom In" onClick={zoomIn} small />
          <ToolBtn icon={'\u2B1C'} tip="Fit to Screen" onClick={handleZoomToFit} small />
        </div>

        {onShortcuts && (
          <>
            <div style={styles.divider} />
            <ToolBtn icon={'\u2328'} tip="Keyboard Shortcuts" onClick={onShortcuts} />
          </>
        )}

        {onPresent && (
          <>
            <div style={styles.divider} />
            <button onClick={onPresent} style={styles.presentButton}>
              {'\u25B6'} Present
            </button>
          </>
        )}
        {onExport && (
          <>
            <div style={styles.divider} />
            <button onClick={onExport} style={styles.exportButton}>
              Export
            </button>
          </>
        )}
      </div>
    </div>
  );
}

function ImageUploadButton() {
  const { addElement, elements } = useElements();
  const elementCountRef = useRef(elements.length);
  elementCountRef.current = elements.length;
  const { activePage } = usePages();
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const cx = (activePage?.width ?? 1920) / 2;
  const cy = (activePage?.height ?? 1080) / 2;

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      processImageFile(
        { file, x: cx, y: cy, layerOrder: elementCountRef.current },
        (el) => addElement(el),
      );
      if (fileInputRef.current) fileInputRef.current.value = '';
    },
    [addElement, cx, cy]
  );

  return (
    <>
      <ToolBtn icon={'\uD83D\uDCF7'} tip="Upload Image" onClick={() => fileInputRef.current?.click()} />
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/svg+xml,image/gif"
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />
    </>
  );
}

function ToolBtn({
  icon,
  tip,
  active,
  disabled,
  small,
  onClick,
}: {
  icon: string;
  tip: string;
  active?: boolean;
  disabled?: boolean;
  small?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={tip}
      style={{
        ...styles.btn,
        ...(small ? styles.btnSmall : {}),
        ...(active ? styles.btnActive : {}),
        ...(disabled ? styles.btnDisabled : {}),
      }}
    >
      {icon}
    </button>
  );
}

const styles: Record<string, React.CSSProperties> = {
  toolbar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 16px',
    backgroundColor: '#ffffff',
    borderBottom: '1px solid #f8f9fa',
    height: 56,
    gap: 8,
    flexShrink: 0,
  },
  logo: {
    width: 32,
    height: 32,
    borderRadius: 8,
    background: 'linear-gradient(135deg, #4A90D9, #7c5cbf)',
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 800,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    flexShrink: 0,
  },
  section: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
  },
  toolGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: 2,
    backgroundColor: '#f8f9fa',
    borderRadius: 10,
    padding: '2px 3px',
  },
  divider: {
    width: 1,
    height: 28,
    backgroundColor: '#dee2e6',
    margin: '0 6px',
    flexShrink: 0,
  },
  btn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 34,
    height: 34,
    border: 'none',
    borderRadius: 8,
    backgroundColor: 'transparent',
    color: '#495057',
    cursor: 'pointer',
    fontSize: 15,
    transition: 'all 0.12s',
    padding: 0,
    lineHeight: 1,
  },
  btnSmall: {
    width: 28,
    height: 28,
    fontSize: 13,
  },
  btnActive: {
    backgroundColor: '#e7f0ff',
    color: '#4A90D9',
  },
  btnDisabled: {
    opacity: 0.3,
    cursor: 'not-allowed',
  },
  zoomGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: 2,
    backgroundColor: '#f8f9fa',
    borderRadius: 10,
    padding: '2px 3px',
  },
  zoomSelect: {
    color: '#495057',
    fontSize: 11,
    minWidth: 52,
    textAlign: 'center' as const,
    fontFamily: 'JetBrains Mono, monospace',
    fontWeight: 500,
    backgroundColor: 'transparent',
    border: 'none',
    outline: 'none',
    cursor: 'pointer',
    appearance: 'none' as const,
    WebkitAppearance: 'none' as const,
    padding: '2px 4px',
    borderRadius: 4,
  },
  presentButton: {
    height: 34,
    padding: '0 16px',
    border: '1px solid #dee2e6',
    borderRadius: 10,
    backgroundColor: '#f8f9fa',
    color: '#212529',
    fontSize: 12,
    fontWeight: 600,
    cursor: 'pointer',
    letterSpacing: '0.3px',
    transition: 'all 0.12s',
    display: 'flex',
    alignItems: 'center',
    gap: 6,
  },
  exportButton: {
    height: 34,
    padding: '0 18px',
    border: 'none',
    borderRadius: 10,
    background: 'linear-gradient(135deg, #4A90D9, #7c5cbf)',
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 700,
    cursor: 'pointer',
    letterSpacing: '0.3px',
    transition: 'opacity 0.12s',
  },
};
