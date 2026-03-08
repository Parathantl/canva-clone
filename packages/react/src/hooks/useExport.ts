import { useCallback, useState } from 'react';
import { useEditorInstance, useEditorStore } from '../context/EditorContext';

export interface ExportOptions {
  format: string;
  quality?: number;
  dpi?: number;
  pageIds?: string[];
  backgroundColor?: string;
  transparentBackground?: boolean;
}

export function useExport() {
  const { store, eventBus, pluginManager } = useEditorInstance();
  const [isExporting, setIsExporting] = useState(false);
  const [progress, setProgress] = useState(0);

  const exportDocument = useCallback(
    async (options: ExportOptions): Promise<Blob | string | null> => {
      const handler = pluginManager.getExportHandler(options.format);
      if (!handler) {
        throw new Error(`No export handler registered for format "${options.format}"`);
      }

      setIsExporting(true);
      setProgress(0);
      eventBus.emit('export:start', { format: options.format });

      try {
        const state = store.getState();
        const pages = options.pageIds
          ? state.document.pages.filter((p) => options.pageIds!.includes(p.id))
          : state.document.pages;

        const result = await handler.handler(pages, options);
        setProgress(100);
        eventBus.emit('export:complete', { format: options.format, data: result });
        return result;
      } catch (error) {
        throw error;
      } finally {
        setIsExporting(false);
      }
    },
    [store, eventBus, pluginManager]
  );

  const getAvailableFormats = useCallback(() => {
    const plugins = pluginManager.getAllPlugins();
    const formats: Array<{ format: string; label: string; extension: string }> = [];
    for (const plugin of plugins) {
      if (plugin.exportHandlers) {
        for (const handler of plugin.exportHandlers) {
          formats.push({
            format: handler.format,
            label: handler.label,
            extension: handler.extension,
          });
        }
      }
    }
    return formats;
  }, [pluginManager]);

  return {
    exportDocument,
    getAvailableFormats,
    isExporting,
    progress,
  };
}
