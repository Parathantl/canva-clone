/**
 * Lightweight viewer-only entry point.
 *
 * Import from '@reactcanvas/editor/viewer' to get ONLY the viewer
 * without the full editor UI (toolbar, inspector, sidebar, AI, etc.)
 *
 * Usage:
 *   import { DashboardViewer } from '@reactcanvas/editor/viewer';
 *   import { populateDocument, createDefaultDocument } from '@reactcanvas/editor/viewer';
 */

// Viewer component
export { DashboardViewer } from './DashboardViewer';
export type { DashboardViewerProps, DashboardViewerRef } from './DashboardViewer';

// Theming
export { ThemeProvider, useTheme, defaultTheme, themeGradient } from './ThemeContext';
export type { EditorTheme } from './ThemeContext';

// Types consumers need
export type {
  Document,
  Page,
  CanvasElement,
  ChartElement,
  ChartDataPoint,
  KPIElement,
  TableElement,
  ProgressElement,
  DataSource,
  DashboardFilter,
  DashboardVariable,
} from '@reactcanvas/core';

// Factories for creating documents + elements
export {
  createDefaultDocument,
  createChartElement,
  createKPIElement,
  createTableElement,
  createProgressElement,
  createFilterControlElement,
} from '@reactcanvas/core';

// Backend utility for injecting data into templates
export {
  populateDocument,
  populateDocumentById,
  getWidgetNames,
} from '@reactcanvas/core';

// Dashboard variable utilities
export {
  resolveVariables,
  extractVariables,
  validateVariables,
} from '@reactcanvas/core';
