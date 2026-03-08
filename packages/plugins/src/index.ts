// Official plugin registry - bundles all default plugins for convenience
import type { Plugin } from '@reactcanvas/core';
import { createShapesPlugin } from '@reactcanvas/shapes';
import { createImagesPlugin } from '@reactcanvas/images';
import { createTextPlugin } from '@reactcanvas/text';
import { createPagesPlugin } from '@reactcanvas/pages';
import { createExportPlugin } from '@reactcanvas/export';
import { createHistoryPlugin } from '@reactcanvas/history';

export interface DefaultPluginOptions {
  shapes?: boolean;
  images?: boolean;
  text?: boolean;
  pages?: boolean;
  export?: boolean;
  history?: boolean | { maxDepth?: number };
}

export function createDefaultPlugins(options: DefaultPluginOptions = {}): Plugin[] {
  const {
    shapes = true,
    images = true,
    text = true,
    pages = true,
    export: exportPlugin = true,
    history = true,
  } = options;

  const plugins: Plugin[] = [];

  if (history) {
    const historyOpts = typeof history === 'object' ? history : {};
    plugins.push(createHistoryPlugin(historyOpts));
  }
  if (shapes) plugins.push(createShapesPlugin());
  if (images) plugins.push(createImagesPlugin());
  if (text) plugins.push(createTextPlugin());
  if (pages) plugins.push(createPagesPlugin());
  if (exportPlugin) plugins.push(createExportPlugin());

  return plugins;
}

// Re-export all plugin creators for individual use
export { createShapesPlugin } from '@reactcanvas/shapes';
export { createImagesPlugin } from '@reactcanvas/images';
export { createTextPlugin } from '@reactcanvas/text';
export { createPagesPlugin } from '@reactcanvas/pages';
export { createExportPlugin } from '@reactcanvas/export';
export { createHistoryPlugin } from '@reactcanvas/history';
