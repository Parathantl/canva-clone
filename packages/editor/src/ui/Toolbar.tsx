import React, { useCallback } from 'react';
import {
  useEditor,
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
  type CanvasElement,
} from '@reactcanvas/core';

export function Toolbar({ onExport }: { onExport?: () => void }) {
  const { activeTool, setActiveTool } = useEditor();
  const { selectedElementIds, deselectAll } = useSelection();
  const { addElement, removeElements, duplicateElements, elements } = useElements();
  const { zoomIn, zoomOut, zoomPercent, zoomToFit } = useViewport();
  const { undo, redo } = useHistory();
  const { addPage, pageCount, activePage } = usePages();

  const handleAddShape = useCallback(
    (shapeType: string) => {
      const page = activePage;
      const cx = (page?.width ?? 1920) / 2;
      const cy = (page?.height ?? 1080) / 2;
      const element = createShapeElement({
        shapeType,
        x: cx - 100,
        y: cy - 100,
        layerOrder: elements.length,
        name: shapeType.charAt(0).toUpperCase() + shapeType.slice(1),
      });
      addElement(element);
    },
    [addElement, elements.length, activePage]
  );

  const handleAddText = useCallback(() => {
    const page = activePage;
    const cx = (page?.width ?? 1920) / 2;
    const cy = (page?.height ?? 1080) / 2;
    const element = createTextElement({
      x: cx - 150,
      y: cy - 30,
      layerOrder: elements.length,
    });
    addElement(element);
  }, [addElement, elements.length, activePage]);

  const handleDeleteSelected = useCallback(() => {
    if (selectedElementIds.length > 0) {
      removeElements(selectedElementIds);
    }
  }, [selectedElementIds, removeElements]);

  const handleDuplicate = useCallback(() => {
    if (selectedElementIds.length > 0) {
      duplicateElements(selectedElementIds);
    }
  }, [selectedElementIds, duplicateElements]);

  return (
    <div style={styles.toolbar}>
      {/* Left section - Tools */}
      <div style={styles.section}>
        <ToolButton
          icon="&#9654;"
          label="Select"
          active={activeTool === 'select'}
          onClick={() => setActiveTool('select')}
        />
        <div style={styles.divider} />

        {/* Shape tools */}
        <ToolButton icon="&#9632;" label="Rectangle" onClick={() => handleAddShape('rectangle')} />
        <ToolButton icon="&#9679;" label="Circle" onClick={() => handleAddShape('circle')} />
        <ToolButton icon="&#9650;" label="Triangle" onClick={() => handleAddShape('triangle')} />
        <ToolButton icon="&#9733;" label="Star" onClick={() => handleAddShape('star')} />

        <div style={styles.divider} />

        {/* Text tool */}
        <ToolButton icon="T" label="Text" onClick={handleAddText} />

        {/* Image upload */}
        <ImageUploadButton />

        <div style={styles.divider} />

        {/* Add page */}
        <ToolButton icon="&#10010;" label="Add Page" onClick={() => addPage()} />
      </div>

      {/* Center section - Edit actions */}
      <div style={styles.section}>
        <ToolButton icon="&#8617;" label="Undo" onClick={undo} />
        <ToolButton icon="&#8618;" label="Redo" onClick={redo} />

        <div style={styles.divider} />

        <ToolButton
          icon="&#128465;"
          label="Delete"
          onClick={handleDeleteSelected}
          disabled={selectedElementIds.length === 0}
        />
        <ToolButton
          icon="&#10697;"
          label="Duplicate"
          onClick={handleDuplicate}
          disabled={selectedElementIds.length === 0}
        />
      </div>

      {/* Right section - Zoom controls + Export */}
      <div style={styles.section}>
        <ToolButton icon="&#8722;" label="Zoom Out" onClick={zoomOut} />
        <span style={styles.zoomLabel}>{zoomPercent}%</span>
        <ToolButton icon="&#43;" label="Zoom In" onClick={zoomIn} />
        <ToolButton icon="&#8862;" label="Fit" onClick={zoomToFit} />
        {onExport && (
          <>
            <div style={styles.divider} />
            <button
              onClick={onExport}
              style={styles.exportButton}
            >
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
          let width = img.naturalWidth;
          let height = img.naturalHeight;
          if (width > maxDim || height > maxDim) {
            const ratio = Math.min(maxDim / width, maxDim / height);
            width *= ratio;
            height *= ratio;
          }
          const cx = (activePage?.width ?? 1920) / 2;
          const cy = (activePage?.height ?? 1080) / 2;
          const element = createImageElement({
            src,
            x: cx - width / 2,
            y: cy - height / 2,
            width,
            height,
            originalWidth: img.naturalWidth,
            originalHeight: img.naturalHeight,
            cropWidth: img.naturalWidth,
            cropHeight: img.naturalHeight,
            layerOrder: elements.length,
            name: file.name,
          });
          addElement(element);
        };
        img.src = src;
      };
      reader.readAsDataURL(file);
      // Reset input
      if (fileInputRef.current) fileInputRef.current.value = '';
    },
    [addElement, elements.length, activePage]
  );

  return (
    <>
      <ToolButton
        icon="&#128247;"
        label="Image"
        onClick={() => fileInputRef.current?.click()}
      />
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

interface ToolButtonProps {
  icon: string;
  label: string;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
}

function ToolButton({ icon, label, active, disabled, onClick }: ToolButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={label}
      style={{
        ...styles.button,
        ...(active ? styles.buttonActive : {}),
        ...(disabled ? styles.buttonDisabled : {}),
      }}
    >
      <span style={styles.buttonIcon}>{icon}</span>
    </button>
  );
}

const styles: Record<string, React.CSSProperties> = {
  toolbar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '8px 16px',
    backgroundColor: '#1e1e2e',
    borderBottom: '1px solid #313244',
    height: 52,
    gap: 8,
  },
  section: {
    display: 'flex',
    alignItems: 'center',
    gap: 4,
  },
  divider: {
    width: 1,
    height: 24,
    backgroundColor: '#45475a',
    margin: '0 8px',
  },
  button: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 36,
    height: 36,
    border: 'none',
    borderRadius: 6,
    backgroundColor: 'transparent',
    color: '#cdd6f4',
    cursor: 'pointer',
    fontSize: 16,
    transition: 'background-color 0.15s',
  },
  buttonActive: {
    backgroundColor: '#45475a',
    color: '#89b4fa',
  },
  buttonDisabled: {
    opacity: 0.4,
    cursor: 'not-allowed',
  },
  buttonIcon: {
    lineHeight: 1,
  },
  zoomLabel: {
    color: '#cdd6f4',
    fontSize: 12,
    minWidth: 40,
    textAlign: 'center' as const,
    fontFamily: 'monospace',
  },
  exportButton: {
    height: 32,
    padding: '0 16px',
    border: 'none',
    borderRadius: 6,
    backgroundColor: '#89b4fa',
    color: '#1e1e2e',
    fontSize: 12,
    fontWeight: 600,
    cursor: 'pointer',
  },
};
