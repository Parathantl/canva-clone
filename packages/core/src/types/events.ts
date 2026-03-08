import type { CanvasElement, Page } from './document';

export type EditorEventType =
  | 'element:add'
  | 'element:remove'
  | 'element:update'
  | 'element:select'
  | 'element:deselect'
  | 'page:add'
  | 'page:remove'
  | 'page:switch'
  | 'page:update'
  | 'viewport:zoom'
  | 'viewport:pan'
  | 'history:undo'
  | 'history:redo'
  | 'export:start'
  | 'export:progress'
  | 'export:complete'
  | 'plugin:register'
  | 'plugin:unregister';

export interface EditorEvent<T = unknown> {
  type: EditorEventType;
  payload: T;
  timestamp: number;
}

export interface ElementEvent {
  element: CanvasElement;
  previousElement?: CanvasElement;
}

export interface SelectionEvent {
  selectedIds: string[];
  previousSelectedIds: string[];
}

export interface PageEvent {
  page: Page;
  previousPage?: Page;
}

export interface ViewportEvent {
  zoom: number;
  panX: number;
  panY: number;
}

export interface ExportEvent {
  format: string;
  progress: number;
  data?: Blob | string;
}

export type EventHandler<T = unknown> = (event: EditorEvent<T>) => void;
