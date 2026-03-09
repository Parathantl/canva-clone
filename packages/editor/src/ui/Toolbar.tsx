import React, { useCallback } from 'react';
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
  createImageElement,
} from '@reactcanvas/core';

export function Toolbar({ onExport, onPresent, onShortcuts }: { onExport?: () => void; onPresent?: () => void; onShortcuts?: () => void }) {
  const { selectedElementIds } = useSelection();
  const { addElement, removeElements, duplicateElements, elements } = useElements();
  const { zoomIn, zoomOut, zoomPercent, zoomToFit } = useViewport();
  const { undo, redo } = useHistory();
  const { addPage, activePage } = usePages();

  const handleAddShape = useCallback(
    (shapeType: string) => {
      const cx = (activePage?.width ?? 1920) / 2;
      const cy = (activePage?.height ?? 1080) / 2;
      addElement(createShapeElement({
        shapeType,
        x: cx - 100,
        y: cy - 100,
        layerOrder: elements.length,
        name: shapeType.charAt(0).toUpperCase() + shapeType.slice(1),
      }));
    },
    [addElement, elements.length, activePage]
  );

  const handleAddText = useCallback(() => {
    const cx = (activePage?.width ?? 1920) / 2;
    const cy = (activePage?.height ?? 1080) / 2;
    addElement(createTextElement({ x: cx - 150, y: cy - 30, layerOrder: elements.length }));
  }, [addElement, elements.length, activePage]);

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
          <ToolBtn icon="T" tip="Add Text" onClick={handleAddText} />
          <ImageUploadButton />
          <ToolBtn icon={'\u2795'} tip="Add Page" onClick={() => addPage()} />
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
        <div style={styles.zoomGroup}>
          <ToolBtn icon={'\u2212'} tip="Zoom Out" onClick={zoomOut} small />
          <span style={styles.zoomLabel}>{zoomPercent}%</span>
          <ToolBtn icon={'\u002B'} tip="Zoom In" onClick={zoomIn} small />
          <ToolBtn icon={'\u2B1C'} tip="Fit to Screen" onClick={zoomToFit} small />
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
  const { activePage } = usePages();
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        const src = ev.target?.result as string;
        const img = new Image();
        img.onload = () => {
          const maxDim = 600;
          let w = img.naturalWidth, h = img.naturalHeight;
          if (w > maxDim || h > maxDim) {
            const ratio = Math.min(maxDim / w, maxDim / h);
            w *= ratio; h *= ratio;
          }
          const cx = (activePage?.width ?? 1920) / 2;
          const cy = (activePage?.height ?? 1080) / 2;
          addElement(createImageElement({
            src, x: cx - w / 2, y: cy - h / 2, width: w, height: h,
            originalWidth: img.naturalWidth, originalHeight: img.naturalHeight,
            cropWidth: img.naturalWidth, cropHeight: img.naturalHeight,
            layerOrder: elements.length, name: file.name,
          }));
        };
        img.src = src;
      };
      reader.readAsDataURL(file);
      if (fileInputRef.current) fileInputRef.current.value = '';
    },
    [addElement, elements.length, activePage]
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
    backgroundColor: '#16161e',
    borderBottom: '1px solid #1e1e2e',
    height: 56,
    gap: 8,
    flexShrink: 0,
  },
  logo: {
    width: 32,
    height: 32,
    borderRadius: 8,
    background: 'linear-gradient(135deg, #89b4fa, #cba6f7)',
    color: '#16161e',
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
    backgroundColor: '#1e1e2e',
    borderRadius: 10,
    padding: '2px 3px',
  },
  divider: {
    width: 1,
    height: 28,
    backgroundColor: '#2a2a3a',
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
    color: '#8888a8',
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
    backgroundColor: '#2a2a44',
    color: '#89b4fa',
  },
  btnDisabled: {
    opacity: 0.3,
    cursor: 'not-allowed',
  },
  zoomGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: 2,
    backgroundColor: '#1e1e2e',
    borderRadius: 10,
    padding: '2px 3px',
  },
  zoomLabel: {
    color: '#8888a8',
    fontSize: 11,
    minWidth: 36,
    textAlign: 'center' as const,
    fontFamily: 'JetBrains Mono, monospace',
    fontWeight: 500,
  },
  presentButton: {
    height: 34,
    padding: '0 16px',
    border: '1px solid #2a2a3a',
    borderRadius: 10,
    backgroundColor: '#1e1e2e',
    color: '#cdd6f4',
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
    background: 'linear-gradient(135deg, #89b4fa, #cba6f7)',
    color: '#16161e',
    fontSize: 12,
    fontWeight: 700,
    cursor: 'pointer',
    letterSpacing: '0.3px',
    transition: 'opacity 0.12s',
  },
};
