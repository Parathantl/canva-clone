import React, { useState, useCallback, useRef } from 'react';
import type { Document } from '@reactcanvas/core';
import { useEditor } from '@reactcanvas/react';
import { exportToJson, downloadString, downloadBlob } from '@reactcanvas/export';
import html2canvas from 'html2canvas';

export interface ExportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  canvasRef: React.RefObject<HTMLDivElement>;
  /** External image upload handler — receives a Blob, returns a URL string */
  onImageUpload?: (blob: Blob, filename: string) => Promise<string>;
  /** Callback when a JSON document is imported */
  onImport?: (document: Document) => void;
}

export function ExportDialog({ isOpen, onClose, canvasRef, onImageUpload, onImport }: ExportDialogProps) {
  const { document } = useEditor();
  const [format, setFormat] = useState('png');
  const [quality, setQuality] = useState(0.92);
  const [dpi, setDpi] = useState(72);
  const [isExporting, setIsExporting] = useState(false);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImportClick = useCallback(() => {
    setImportError(null);
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const parsed = JSON.parse(reader.result as string) as Document;
          if (!parsed.pages || !Array.isArray(parsed.pages)) {
            setImportError('Invalid document: missing pages array');
            return;
          }
          setImportError(null);
          onImport?.(parsed);
          onClose();
        } catch (err) {
          setImportError('Failed to parse JSON file');
        }
      };
      reader.readAsText(file);
      // Reset input so re-selecting same file triggers change
      e.target.value = '';
    },
    [onImport, onClose]
  );

  const handleExport = useCallback(async () => {
    setIsExporting(true);
    setUploadedUrl(null);
    try {
      if (format === 'json') {
        const json = exportToJson(document.pages);
        downloadString(json, `${document.name}.json`, 'application/json');
        onClose();
        return;
      }

      // Use html2canvas for reliable DOM-based rasterization
      const target = canvasRef.current;
      if (!target) {
        console.error('Canvas ref not available');
        return;
      }

      const scale = dpi / 72;
      const canvas = await html2canvas(target, {
        scale,
        useCORS: true,
        allowTaint: true,
        backgroundColor: null,
        logging: false,
      });

      if (format === 'svg') {
        // For SVG, create an SVG wrapper with embedded image
        const dataUrl = canvas.toDataURL('image/png');
        const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${canvas.width / scale}" height="${canvas.height / scale}" viewBox="0 0 ${canvas.width / scale} ${canvas.height / scale}">
  <image width="${canvas.width / scale}" height="${canvas.height / scale}" href="${dataUrl}" />
</svg>`;
        downloadString(svg, `${document.name}.svg`, 'image/svg+xml');
        onClose();
        return;
      }

      // PNG or JPG
      const mimeType = format === 'png' ? 'image/png' : 'image/jpeg';
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
          (b: Blob | null) => (b ? resolve(b) : reject(new Error('Failed to create image blob'))),
          mimeType,
          format === 'jpg' ? quality : undefined
        );
      });

      const filename = `${document.name}.${format}`;

      // If external upload handler is provided, use it
      if (onImageUpload) {
        const url = await onImageUpload(blob, filename);
        setUploadedUrl(url);
        setIsExporting(false);
        return; // Don't close — show the URL
      }

      // Otherwise download locally
      downloadBlob(blob, filename);
      onClose();
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setIsExporting(false);
    }
  }, [format, quality, dpi, canvasRef, document, onClose, onImageUpload]);

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
              <option value="svg">SVG (embedded raster)</option>
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

          {/* Import JSON */}
          <div style={styles.field}>
            <label style={styles.label}>Import</label>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              style={{ display: 'none' }}
              onChange={handleFileChange}
            />
            <button style={styles.importButton} onClick={handleImportClick}>
              Import JSON
            </button>
            {importError && (
              <span style={{ color: '#f38ba8', fontSize: 12, marginTop: 4, display: 'block' }}>
                {importError}
              </span>
            )}
          </div>

          {onImageUpload && (format === 'png' || format === 'jpg') && (
            <div style={styles.infoBox}>
              Export will upload to your server via the provided handler.
            </div>
          )}

          {uploadedUrl && (
            <div style={styles.field}>
              <label style={styles.label}>Uploaded URL</label>
              <input
                type="text"
                readOnly
                value={uploadedUrl}
                style={styles.urlInput}
                onClick={(e) => (e.target as HTMLInputElement).select()}
              />
            </div>
          )}
        </div>

        <div style={styles.footer}>
          <button style={styles.cancelButton} onClick={onClose}>
            {uploadedUrl ? 'Done' : 'Cancel'}
          </button>
          <button
            style={styles.exportButton}
            onClick={handleExport}
            disabled={isExporting}
          >
            {isExporting ? 'Exporting...' : onImageUpload && (format === 'png' || format === 'jpg') ? 'Upload' : 'Export'}
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
  infoBox: {
    padding: '10px 12px',
    backgroundColor: 'rgba(137, 180, 250, 0.1)',
    border: '1px solid rgba(137, 180, 250, 0.2)',
    borderRadius: 8,
    color: '#89b4fa',
    fontSize: 12,
    lineHeight: 1.4,
    marginBottom: 16,
  },
  urlInput: {
    width: '100%',
    height: 36,
    border: '1px solid #45475a',
    borderRadius: 6,
    backgroundColor: '#313244',
    color: '#50C878',
    fontSize: 12,
    padding: '0 8px',
    boxSizing: 'border-box' as const,
    fontFamily: 'monospace',
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
  importButton: {
    width: '100%',
    height: 36,
    border: '1px dashed #45475a',
    borderRadius: 6,
    backgroundColor: 'transparent',
    color: '#a6adc8',
    fontSize: 13,
    cursor: 'pointer',
    transition: 'border-color 0.15s, color 0.15s',
  },
};
