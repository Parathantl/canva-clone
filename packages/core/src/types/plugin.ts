import type { CanvasElement } from './document';

// Plugin lifecycle hooks (Observer pattern)
export interface PluginLifecycleHooks {
  onInit?: () => void;
  onDestroy?: () => void;
  onElementAdd?: (element: CanvasElement) => void;
  onElementRemove?: (element: CanvasElement) => void;
  onElementUpdate?: (element: CanvasElement, prev: CanvasElement) => void;
  onBeforeExport?: (format: string, elements: CanvasElement[]) => CanvasElement[];
  onAfterExport?: (format: string, data: Blob | string) => void;
}

// Plugin element type registration
export interface ElementTypeRegistration {
  type: string;
  displayName: string;
  icon?: string;
  defaultProps: Partial<CanvasElement>;
  // React component type references as strings to avoid circular deps
  renderer: string;
  inspector?: string;
}

// Plugin toolbar registration
export interface ToolbarRegistration {
  id: string;
  label: string;
  icon: string;
  position: 'left' | 'top' | 'right';
  order: number;
  component: string;
  shortcut?: string;
}

// Keyboard shortcut registration
export interface ShortcutRegistration {
  id: string;
  keys: string; // e.g., 'ctrl+shift+z', 'delete'
  label: string;
  action: () => void;
  when?: () => boolean;
}

// Export handler registration (Strategy pattern)
export interface ExportHandlerRegistration {
  format: string;
  label: string;
  mimeType: string;
  extension: string;
  handler: (pages: any[], options: Record<string, any>) => Promise<Blob | string>;
}

// Panel registration
export interface PanelRegistration {
  id: string;
  label: string;
  position: 'sidebar' | 'inspector' | 'overlay';
  order: number;
  component: string;
  icon?: string;
}

// Main Plugin interface (Interface Segregation - optional capabilities)
export interface Plugin {
  name: string;
  version: string;
  dependencies?: string[];
  elementTypes?: ElementTypeRegistration[];
  toolbar?: ToolbarRegistration[];
  shortcuts?: ShortcutRegistration[];
  exportHandlers?: ExportHandlerRegistration[];
  panels?: PanelRegistration[];
  hooks?: PluginLifecycleHooks;
}
