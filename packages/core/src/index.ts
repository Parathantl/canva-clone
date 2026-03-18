// Types
export * from './types/document';
export * from './types/plugin';
export * from './types/events';

// Event Bus (Observer Pattern)
export { EventBus } from './events/EventBus';

// State Management
export { createEditorStore } from './state/EditorStore';
export type { EditorState, EditorStore, ViewportState } from './state/EditorStore';

// Factories (Factory Pattern)
export {
  createId,
  createDefaultDocument,
  createPage,
  createDefaultFill,
  createDefaultStroke,
  createDefaultImageFilters,
  createShapeElement,
  createTextElement,
  createImageElement,
  createFramedImageElement,
  createLineElement,
  createChartElement,
  createKPIElement,
  createTableElement,
  createProgressElement,
  createEmbedElement,
  createFilterControlElement,
  DEFAULT_CHART_COLORS,
} from './factories/DocumentFactory';

// Plugin System (Strategy Pattern)
export { PluginManager } from './plugins/PluginManager';

// Type Guards
export {
  isSolidFill,
  isLinearGradient,
  isRadialGradient,
  isGradientFill,
} from './utils/typeGuards';

// Document Population (for backend data injection)
export { populateDocument, populateDocumentById, getWidgetNames } from './utils/populateDocument';

// Dashboard Variables
export { resolveVariables, extractVariables, validateVariables } from './utils/resolveVariables';

// Filters
export { FilterManager } from './filters/FilterManager';

// Data Sources
export {
  DataSourceManager,
  createDataSource,
  extractData,
  mapDataToChart,
  mapDataToTable,
  mapDataToKPI,
} from './datasource/DataSourceManager';
export type { FetchResult } from './datasource/DataSourceManager';
export { applyCalculatedFields, computeAggregateValue } from './datasource/CalculatedFields';
