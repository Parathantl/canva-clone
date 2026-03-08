import type { Plugin } from '@reactcanvas/core';
import { exportToSvg, exportToJson } from './exportHandlers';

export function createExportPlugin(): Plugin {
  return {
    name: 'export',
    version: '1.0.0',
    exportHandlers: [
      {
        format: 'png',
        label: 'PNG Image',
        mimeType: 'image/png',
        extension: '.png',
        handler: async (pages, options) => {
          // PNG export requires canvas stage ref, handled by editor integration
          return new Blob();
        },
      },
      {
        format: 'jpg',
        label: 'JPG Image',
        mimeType: 'image/jpeg',
        extension: '.jpg',
        handler: async (pages, options) => {
          return new Blob();
        },
      },
      {
        format: 'svg',
        label: 'SVG Vector',
        mimeType: 'image/svg+xml',
        extension: '.svg',
        handler: async (pages, options) => {
          return exportToSvg(pages, options as any);
        },
      },
      {
        format: 'json',
        label: 'JSON Document',
        mimeType: 'application/json',
        extension: '.json',
        handler: async (pages) => {
          return exportToJson(pages);
        },
      },
    ],
    toolbar: [
      {
        id: 'export-menu',
        label: 'Export',
        icon: 'download',
        position: 'right',
        order: 100,
        component: 'ExportMenu',
      },
    ],
    shortcuts: [
      {
        id: 'export-save',
        keys: 'ctrl+s',
        label: 'Save',
        action: () => {
          // Connected via editor
        },
      },
      {
        id: 'export-download',
        keys: 'ctrl+shift+e',
        label: 'Export',
        action: () => {
          // Connected via editor
        },
      },
    ],
  };
}
