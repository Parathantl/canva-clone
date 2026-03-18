import React, { useState, useCallback, useRef, useMemo } from 'react';
import type { Document } from '@reactcanvas/core';
import { useEditor, usePages } from '@reactcanvas/react';
import { exportToJson, downloadString, downloadBlob } from '@reactcanvas/export';
import html2canvas from 'html2canvas';
import { pageDataToCSV, downloadCSV, downloadExcel } from '../utils/dataExport';

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
  const { activePage } = usePages();
  const [format, setFormat] = useState('png');
  const [quality, setQuality] = useState(0.92);
  const [dpi, setDpi] = useState(72);
  const [isExporting, setIsExporting] = useState(false);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [embedExpanded, setEmbedExpanded] = useState(false);
  const [embedTab, setEmbedTab] = useState<'react' | 'html'>('react');
  const [embedCopied, setEmbedCopied] = useState(false);
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
          const parsed = JSON.parse(reader.result as string);
          if (!parsed || typeof parsed !== 'object') {
            setImportError('Invalid JSON format');
            return;
          }
          if (!Array.isArray(parsed.pages) || parsed.pages.length === 0) {
            setImportError('Invalid document: missing or empty pages array');
            return;
          }
          for (const page of parsed.pages) {
            if (!page || typeof page !== 'object' || !Array.isArray(page.elements)) {
              setImportError('Invalid document: pages must contain elements arrays');
              return;
            }
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

      if (format === 'csv') {
        const elements = activePage?.elements ?? [];
        const csvContent = pageDataToCSV(elements);
        downloadCSV(csvContent, `${document.name}.csv`);
        onClose();
        return;
      }

      if (format === 'excel') {
        const elements = activePage?.elements ?? [];
        const csvContent = pageDataToCSV(elements);
        downloadExcel(csvContent, `${document.name}.csv`);
        onClose();
        return;
      }

      if (format === 'pdf') {
        const target = canvasRef.current;
        if (!target) {
          console.error('Canvas ref not available');
          return;
        }
        const pdfScale = dpi / 72;
        const pdfCanvas = await html2canvas(target, {
          scale: pdfScale,
          useCORS: true,
          allowTaint: true,
          backgroundColor: null,
          logging: false,
        });
        const imgDataUrl = pdfCanvas.toDataURL('image/png');
        const printWindow = window.open('', '_blank');
        if (printWindow) {
          printWindow.document.write(`<!DOCTYPE html>
<html>
<head><title>${document.name}</title>
<style>
  @media print { body { margin: 0; } img { width: 100%; height: auto; } }
  body { margin: 0; display: flex; justify-content: center; align-items: flex-start; }
  img { max-width: 100%; height: auto; }
</style>
</head>
<body>
  <img src="${imgDataUrl}" />
  <script>window.onload = function() { window.print(); }</script>
</body>
</html>`);
          printWindow.document.close();
        }
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
        try {
          const url = await onImageUpload(blob, filename);
          setUploadedUrl(url);
        } catch (uploadErr) {
          console.error('Upload failed:', uploadErr);
          setImportError(`Upload failed: ${uploadErr instanceof Error ? uploadErr.message : 'Unknown error'}`);
        }
        return; // Don't close — show the URL or error (finally block handles setIsExporting)
      }

      // Otherwise download locally
      downloadBlob(blob, filename);
      onClose();
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setIsExporting(false);
    }
  }, [format, quality, dpi, canvasRef, document, onClose, onImageUpload, activePage]);

  const reactEmbedCode = useMemo(() => {
    return `import { DashboardViewer } from '@reactcanvas/editor';

// Option 1: Static (pass document directly)
<DashboardViewer document={dashboardDoc} interactive width="100%" height="600px" />

// Option 2: Fetch from your API
<DashboardViewer
  document={fallbackDoc}
  documentUrl="https://your-api.com/dashboards/${document.id}"
  token="your-auth-token"
  interactive={true}
  width="100%"
  height="600px"
/>

// Option 3: Real-time (SSE from your API)
<DashboardViewer
  document={fallbackDoc}
  documentUrl="https://your-api.com/dashboards/${document.id}"
  streamUrl="https://your-api.com/dashboards/${document.id}/stream"
  token="your-auth-token"
  interactive={true}
  width="100%"
  height="600px"
/>`;
  }, [document]);

  const htmlEmbedCode = useMemo(() => {
    return `<div id="dashboard" style="width:100%;height:600px;"></div>
<script src="https://unpkg.com/@reactcanvas/editor/dist/embed.js"></script>
<script>
  DashboardEmbed.render({
    target: '#dashboard',
    documentUrl: 'https://your-api.com/dashboards/${document.id}',
    // streamUrl: 'https://your-api.com/dashboards/${document.id}/stream', // for real-time
    // token: 'your-auth-token', // if authenticated
    interactive: true,
  });
</script>`;
  }, [document]);

  const handleCopyEmbed = useCallback(() => {
    const code = embedTab === 'react' ? reactEmbedCode : htmlEmbedCode;
    navigator.clipboard.writeText(code).then(() => {
      setEmbedCopied(true);
      setTimeout(() => setEmbedCopied(false), 2000);
    });
  }, [embedTab, reactEmbedCode, htmlEmbedCode]);

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
              <option value="pdf">PDF (print)</option>
              <option value="json">JSON Document</option>
              <option value="csv">CSV Data (all widgets)</option>
              <option value="excel">Excel Data (.csv)</option>
            </select>
          </div>

          {format !== 'json' && format !== 'csv' && format !== 'excel' && (
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
              <span style={{ color: '#e03131', fontSize: 12, marginTop: 4, display: 'block' }}>
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

          {/* Get Embed Code */}
          <div style={styles.embedSection}>
            <button
              style={styles.embedToggle}
              onClick={() => setEmbedExpanded(!embedExpanded)}
            >
              <span>{embedExpanded ? '\u25BC' : '\u25B6'} Get Embed Code</span>
            </button>
            {embedExpanded && (
              <div style={styles.embedBody}>
                <div style={styles.embedTabs}>
                  <button
                    style={{
                      ...styles.embedTabBtn,
                      ...(embedTab === 'react' ? styles.embedTabBtnActive : {}),
                    }}
                    onClick={() => { setEmbedTab('react'); setEmbedCopied(false); }}
                  >
                    React
                  </button>
                  <button
                    style={{
                      ...styles.embedTabBtn,
                      ...(embedTab === 'html' ? styles.embedTabBtnActive : {}),
                    }}
                    onClick={() => { setEmbedTab('html'); setEmbedCopied(false); }}
                  >
                    HTML
                  </button>
                </div>
                <pre style={styles.embedCode}>
                  {embedTab === 'react' ? reactEmbedCode : htmlEmbedCode}
                </pre>
                <button style={styles.embedCopyBtn} onClick={handleCopyEmbed}>
                  {embedCopied ? 'Copied!' : 'Copy'}
                </button>
              </div>
            )}
          </div>
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
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    border: '1px solid #f1f3f5',
    width: 400,
    maxWidth: '90vw',
    overflow: 'hidden',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '16px 20px',
    borderBottom: '1px solid #f1f3f5',
  },
  title: {
    color: '#212529',
    fontSize: 16,
    fontWeight: 600,
    margin: 0,
  },
  closeButton: {
    background: 'none',
    border: 'none',
    color: '#adb5bd',
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
    color: '#6c757d',
    fontSize: 12,
    fontWeight: 500,
    marginBottom: 6,
  },
  select: {
    width: '100%',
    height: 36,
    border: '1px solid #e9ecef',
    borderRadius: 6,
    backgroundColor: '#f1f3f5',
    color: '#212529',
    fontSize: 13,
    padding: '0 8px',
  },
  qualityValue: {
    color: '#adb5bd',
    fontSize: 12,
    marginTop: 4,
    display: 'block',
    textAlign: 'right' as const,
  },
  infoBox: {
    padding: '10px 12px',
    backgroundColor: 'rgba(74, 144, 217, 0.1)',
    border: '1px solid rgba(74, 144, 217, 0.2)',
    borderRadius: 8,
    color: '#4A90D9',
    fontSize: 12,
    lineHeight: 1.4,
    marginBottom: 16,
  },
  urlInput: {
    width: '100%',
    height: 36,
    border: '1px solid #e9ecef',
    borderRadius: 6,
    backgroundColor: '#f1f3f5',
    color: '#2b8a3e',
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
    borderTop: '1px solid #f1f3f5',
  },
  cancelButton: {
    height: 36,
    padding: '0 16px',
    border: '1px solid #e9ecef',
    borderRadius: 6,
    backgroundColor: 'transparent',
    color: '#212529',
    fontSize: 13,
    cursor: 'pointer',
  },
  exportButton: {
    height: 36,
    padding: '0 20px',
    border: 'none',
    borderRadius: 6,
    backgroundColor: '#4A90D9',
    color: '#ffffff',
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
  },
  importButton: {
    width: '100%',
    height: 36,
    border: '1px dashed #e9ecef',
    borderRadius: 6,
    backgroundColor: 'transparent',
    color: '#6c757d',
    fontSize: 13,
    cursor: 'pointer',
    transition: 'border-color 0.15s, color 0.15s',
  },
  embedSection: {
    borderTop: '1px solid #e9ecef',
    paddingTop: 12,
    marginTop: 4,
  },
  embedToggle: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    background: 'none',
    border: 'none',
    color: '#495057',
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
    padding: '4px 0',
    width: '100%',
    textAlign: 'left' as const,
  },
  embedBody: {
    marginTop: 10,
  },
  embedTabs: {
    display: 'flex',
    gap: 0,
    marginBottom: 8,
  },
  embedTabBtn: {
    flex: 1,
    height: 30,
    border: '1px solid #dee2e6',
    backgroundColor: '#f1f3f5',
    color: '#6c757d',
    fontSize: 12,
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'all 0.15s',
  },
  embedTabBtnActive: {
    backgroundColor: '#4A90D9',
    borderColor: '#4A90D9',
    color: '#ffffff',
    fontWeight: 600,
  },
  embedCode: {
    backgroundColor: '#1e1e1e',
    color: '#d4d4d4',
    padding: 12,
    borderRadius: 6,
    fontSize: 10,
    lineHeight: 1.5,
    overflow: 'auto',
    maxHeight: 180,
    whiteSpace: 'pre-wrap' as const,
    wordBreak: 'break-all' as const,
    margin: 0,
    fontFamily: 'Menlo, Monaco, Consolas, monospace',
  },
  embedCopyBtn: {
    marginTop: 8,
    width: '100%',
    height: 32,
    border: '1px solid #dee2e6',
    borderRadius: 6,
    backgroundColor: '#ffffff',
    color: '#495057',
    fontSize: 12,
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.15s',
  },
};
