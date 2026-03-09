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
  DEFAULT_CHART_COLORS,
} from './factories/DocumentFactory';

// Plugin System (Strategy Pattern)
export { PluginManager } from './plugins/PluginManager';
