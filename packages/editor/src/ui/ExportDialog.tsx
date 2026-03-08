import React, { useState, useCallback } from 'react';
import { useEditor } from '@reactcanvas/react';
import { exportToSvg, exportToJson, downloadString, downloadBlob } from '@reactcanvas/export';

interface ExportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  canvasRef: React.RefObject<HTMLDivElement>;
}

export function ExportDialog({ isOpen, onClose, canvasRef }: ExportDialogProps) {
  const { document } = useEditor();
  const [format, setFormat] = useState('png');
  const [quality, setQuality] = useState(0.92);
  const [dpi, setDpi] = useState(72);
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = useCallback(async () => {
    setIsExporting(true);
    try {
      switch (format) {
        case 'png':
        case 'jpg': {
          // Export as SVG and convert to raster
          const svg = exportToSvg(document.pages);
          const svgBlob = new Blob([svg], { type: 'image/svg+xml' });
          const url = URL.createObjectURL(svgBlob);
          const img = new Image();
          img.onload = () => {
            const scale = dpi / 72;
            const page = document.pages[0];
            const w = (page?.width ?? 1920) * scale;
            const h = (page?.height ?? 1080) * scale;
            const canvas = window.document.createElement('canvas');
            canvas.width = w;
            canvas.height = h;
            const ctx = canvas.getContext('2d');
            if (ctx) {
              if (format === 'jpg') {
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(0, 0, w, h);
              }
              ctx.drawImage(img, 0, 0, w, h);
              const mimeType = format === 'png' ? 'image/png' : 'image/jpeg';
              canvas.toBlob(
                (blob: Blob | null) => {
                  if (blob) downloadBlob(blob, `${document.name}.${format}`);
                },
                mimeType,
                format === 'jpg' ? quality : undefined
              );
            }
            URL.revokeObjectURL(url);
          };
          img.src = url;
          break;
        }
        case 'svg': {
          const svg = exportToSvg(document.pages);
          downloadString(svg, `${document.name}.svg`, 'image/svg+xml');
          break;
        }
        case 'json': {
          const json = exportToJson(document.pages);
          downloadString(json, `${document.name}.json`, 'application/json');
          break;
        }
      }
      onClose();
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setIsExporting(false);
    }
  }, [format, quality, dpi, canvasRef, document, onClose]);

  if (!isOpen) return null;

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.dialog} onClick={(e) => e.stopPropagation()}>
        <div style={styles.header}>
          <h3 style={styles.title}>Export Design</h3>
          <button style={styles.closeButton} onClick={onClose}>
            &#10005;
          </button>
        </div>

        <div style={styles.body}>
          <div style={styles.field}>
            <label style={styles.label}>Format</label>
            <select
              style={styles.select}
              value={format}
              onChange={(e) => setFormat(e.target.value)}
            >
              <option value="png">PNG Image</option>
              <option value="jpg">JPG Image</option>
              <option value="svg">SVG Vector</option>
              <option value="json">JSON Document</option>
            </select>
          </div>

          {(format === 'png' || format === 'jpg') && (
            <div style={styles.field}>
              <label style={styles.label}>DPI</label>
              <select
                style={styles.select}
                value={dpi}
                onChange={(e) => setDpi(Number(e.target.value))}
              >
                <option value={72}>72 DPI (Screen)</option>
                <option value={150}>150 DPI (Medium)</option>
                <option value={300}>300 DPI (Print)</option>
              </select>
            </div>
          )}

          {format === 'jpg' && (
            <div style={styles.field}>
              <label style={styles.label}>Quality</label>
              <input
                type="range"
                min={0.1}
                max={1}
                step={0.05}
                value={quality}
                onChange={(e) => setQuality(parseFloat(e.target.value))}
                style={{ width: '100%' }}
              />
              <span style={styles.qualityValue}>{Math.round(quality * 100)}%</span>
            </div>
          )}
        </div>

        <div style={styles.footer}>
          <button style={styles.cancelButton} onClick={onClose}>
            Cancel
          </button>
          <button
            style={styles.exportButton}
            onClick={handleExport}
            disabled={isExporting}
          >
            {isExporting ? 'Exporting...' : 'Export'}
          </button>
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  dialog: {
    backgroundColor: '#1e1e2e',
    borderRadius: 12,
    border: '1px solid #313244',
    width: 400,
    maxWidth: '90vw',
    overflow: 'hidden',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '16px 20px',
    borderBottom: '1px solid #313244',
  },
  title: {
    color: '#cdd6f4',
    fontSize: 16,
    fontWeight: 600,
    margin: 0,
  },
  closeButton: {
    background: 'none',
    border: 'none',
    color: '#6c7086',
    fontSize: 16,
    cursor: 'pointer',
  },
  body: {
    padding: '20px',
  },
  field: {
    marginBottom: 16,
  },
  label: {
    display: 'block',
    color: '#a6adc8',
    fontSize: 12,
    fontWeight: 500,
    marginBottom: 6,
  },
  select: {
    width: '100%',
    height: 36,
    border: '1px solid #45475a',
    borderRadius: 6,
    backgroundColor: '#313244',
    color: '#cdd6f4',
    fontSize: 13,
    padding: '0 8px',
  },
  qualityValue: {
    color: '#6c7086',
    fontSize: 12,
    marginTop: 4,
    display: 'block',
    textAlign: 'right' as const,
  },
  footer: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: 8,
    padding: '16px 20px',
    borderTop: '1px solid #313244',
  },
  cancelButton: {
    height: 36,
    padding: '0 16px',
    border: '1px solid #45475a',
    borderRadius: 6,
    backgroundColor: 'transparent',
    color: '#cdd6f4',
    fontSize: 13,
    cursor: 'pointer',
  },
  exportButton: {
    height: 36,
    padding: '0 20px',
    border: 'none',
    borderRadius: 6,
    backgroundColor: '#89b4fa',
    color: '#1e1e2e',
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
  },
};
