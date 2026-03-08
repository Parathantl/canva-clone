import { createStore } from 'zustand/vanilla';
import { immer } from 'zustand/middleware/immer';
import type { Document, Page, CanvasElement } from '../types/document';
import { createDefaultDocument, createId } from '../factories/DocumentFactory';

export interface ViewportState {
  zoom: number;
  panX: number;
  panY: number;
}

export interface EditorState {
  // Document
  document: Document;
  activePageId: string;

  // Selection
  selectedElementIds: string[];

  // Viewport
  viewport: ViewportState;

  // UI
  activeTool: string;
  isEditing: boolean;

  // Document actions
  setDocument: (doc: Document) => void;
  updateDocument: (updater: (doc: Document) => void) => void;

  // Page actions
  addPage: (page: Page) => void;
  removePage: (pageId: string) => void;
  setActivePage: (pageId: string) => void;
  updatePage: (pageId: string, updater: (page: Page) => void) => void;
  reorderPages: (fromIndex: number, toIndex: number) => void;
  duplicatePage: (pageId: string) => string;

  // Element actions
  addElement: (element: CanvasElement) => void;
  removeElement: (elementId: string) => void;
  removeElements: (elementIds: string[]) => void;
  updateElement: (elementId: string, updates: Partial<CanvasElement>) => void;
  updateElements: (updates: Array<{ id: string; changes: Partial<CanvasElement> }>) => void;
  duplicateElements: (elementIds: string[]) => string[];
  reorderElement: (elementId: string, newOrder: number) => void;

  // Selection actions
  selectElement: (elementId: string, addToSelection?: boolean) => void;
  selectElements: (elementIds: string[]) => void;
  deselectElement: (elementId: string) => void;
  deselectAll: () => void;
  selectAll: () => void;

  // Viewport actions
  setZoom: (zoom: number) => void;
  setPan: (panX: number, panY: number) => void;
  setViewport: (viewport: Partial<ViewportState>) => void;

  // Tool actions
  setActiveTool: (tool: string) => void;
  setIsEditing: (editing: boolean) => void;

  // Helpers
  getActivePage: () => Page | undefined;
  getElement: (elementId: string) => CanvasElement | undefined;
  getSelectedElements: () => CanvasElement[];
}

export const createEditorStore = (initialDocument?: Document) => {
  const doc = initialDocument ?? createDefaultDocument();

  return createStore<EditorState>()(
    immer((set, get) => ({
      document: doc,
      activePageId: doc.pages[0]?.id ?? '',
      selectedElementIds: [],
      viewport: { zoom: 1, panX: 0, panY: 0 },
      activeTool: 'select',
      isEditing: false,

      // Document actions
      setDocument: (doc) =>
        set((state) => {
          state.document = doc;
          state.activePageId = doc.pages[0]?.id ?? '';
          state.selectedElementIds = [];
        }),

      updateDocument: (updater) =>
        set((state) => {
          updater(state.document);
          state.document.updatedAt = new Date().toISOString();
        }),

      // Page actions
      addPage: (page) =>
        set((state) => {
          state.document.pages.push(page);
          state.document.updatedAt = new Date().toISOString();
        }),

      removePage: (pageId) =>
        set((state) => {
          const index = state.document.pages.findIndex((p) => p.id === pageId);
          if (index === -1 || state.document.pages.length <= 1) return;
          state.document.pages.splice(index, 1);
          if (state.activePageId === pageId) {
            state.activePageId = state.document.pages[Math.max(0, index - 1)].id;
          }
          state.selectedElementIds = [];
          state.document.updatedAt = new Date().toISOString();
        }),

      setActivePage: (pageId) =>
        set((state) => {
          if (state.document.pages.some((p) => p.id === pageId)) {
            state.activePageId = pageId;
            state.selectedElementIds = [];
          }
        }),

      updatePage: (pageId, updater) =>
        set((state) => {
          const page = state.document.pages.find((p) => p.id === pageId);
          if (page) {
            updater(page);
            state.document.updatedAt = new Date().toISOString();
          }
        }),

      reorderPages: (fromIndex, toIndex) =>
        set((state) => {
          const pages = state.document.pages;
          const [moved] = pages.splice(fromIndex, 1);
          pages.splice(toIndex, 0, moved);
          state.document.updatedAt = new Date().toISOString();
        }),

      duplicatePage: (pageId) => {
        const newPageId = createId();
        set((state) => {
          const page = state.document.pages.find((p) => p.id === pageId);
          if (!page) return;
          const index = state.document.pages.findIndex((p) => p.id === pageId);
          const newPage: Page = JSON.parse(JSON.stringify(page));
          newPage.id = newPageId;
          newPage.name = `${page.name} (Copy)`;
          newPage.elements = newPage.elements.map((el) => ({ ...el, id: createId() }));
          state.document.pages.splice(index + 1, 0, newPage);
          state.document.updatedAt = new Date().toISOString();
        });
        return newPageId;
      },

      // Element actions
      addElement: (element) =>
        set((state) => {
          const page = state.document.pages.find((p) => p.id === state.activePageId);
          if (page) {
            page.elements.push(element);
            state.document.updatedAt = new Date().toISOString();
          }
        }),

      removeElement: (elementId) =>
        set((state) => {
          const page = state.document.pages.find((p) => p.id === state.activePageId);
          if (page) {
            page.elements = page.elements.filter((el) => el.id !== elementId);
            state.selectedElementIds = state.selectedElementIds.filter((id) => id !== elementId);
            state.document.updatedAt = new Date().toISOString();
          }
        }),

      removeElements: (elementIds) =>
        set((state) => {
          const page = state.document.pages.find((p) => p.id === state.activePageId);
          if (page) {
            const idSet = new Set(elementIds);
            page.elements = page.elements.filter((el) => !idSet.has(el.id));
            state.selectedElementIds = state.selectedElementIds.filter((id) => !idSet.has(id));
            state.document.updatedAt = new Date().toISOString();
          }
        }),

      updateElement: (elementId, updates) =>
        set((state) => {
          const page = state.document.pages.find((p) => p.id === state.activePageId);
          if (page) {
            const element = page.elements.find((el) => el.id === elementId);
            if (element) {
              Object.assign(element, updates);
              state.document.updatedAt = new Date().toISOString();
            }
          }
        }),

      updateElements: (updates) =>
        set((state) => {
          const page = state.document.pages.find((p) => p.id === state.activePageId);
          if (page) {
            for (const { id, changes } of updates) {
              const element = page.elements.find((el) => el.id === id);
              if (element) {
                Object.assign(element, changes);
              }
            }
            state.document.updatedAt = new Date().toISOString();
          }
        }),

      duplicateElements: (elementIds) => {
        const newIds: string[] = [];
        set((state) => {
          const page = state.document.pages.find((p) => p.id === state.activePageId);
          if (page) {
            for (const id of elementIds) {
              const element = page.elements.find((el) => el.id === id);
              if (element) {
                const newElement: CanvasElement = JSON.parse(JSON.stringify(element));
                newElement.id = createId();
                newElement.x += 20;
                newElement.y += 20;
                newElement.name = `${element.name} (Copy)`;
                newElement.layerOrder = page.elements.length;
                page.elements.push(newElement);
                newIds.push(newElement.id);
              }
            }
            state.selectedElementIds = newIds;
            state.document.updatedAt = new Date().toISOString();
          }
        });
        return newIds;
      },

      reorderElement: (elementId, newOrder) =>
        set((state) => {
          const page = state.document.pages.find((p) => p.id === state.activePageId);
          if (page) {
            const element = page.elements.find((el) => el.id === elementId);
            if (element) {
              element.layerOrder = newOrder;
              state.document.updatedAt = new Date().toISOString();
            }
          }
        }),

      // Selection actions
      selectElement: (elementId, addToSelection = false) =>
        set((state) => {
          const page = state.document.pages.find((p) => p.id === state.activePageId);
          const element = page?.elements.find((el) => el.id === elementId);
          if (!element || element.locked) return;

          if (addToSelection) {
            if (!state.selectedElementIds.includes(elementId)) {
              state.selectedElementIds.push(elementId);
            }
          } else {
            state.selectedElementIds = [elementId];
          }
        }),

      selectElements: (elementIds) =>
        set((state) => {
          state.selectedElementIds = elementIds;
        }),

      deselectElement: (elementId) =>
        set((state) => {
          state.selectedElementIds = state.selectedElementIds.filter((id) => id !== elementId);
        }),

      deselectAll: () =>
        set((state) => {
          state.selectedElementIds = [];
        }),

      selectAll: () =>
        set((state) => {
          const page = state.document.pages.find((p) => p.id === state.activePageId);
          if (page) {
            state.selectedElementIds = page.elements.filter((el) => !el.locked).map((el) => el.id);
          }
        }),

      // Viewport actions
      setZoom: (zoom) =>
        set((state) => {
          state.viewport.zoom = Math.min(10, Math.max(0.1, zoom));
        }),

      setPan: (panX, panY) =>
        set((state) => {
          state.viewport.panX = panX;
          state.viewport.panY = panY;
        }),

      setViewport: (viewport) =>
        set((state) => {
          Object.assign(state.viewport, viewport);
        }),

      // Tool actions
      setActiveTool: (tool) =>
        set((state) => {
          state.activeTool = tool;
        }),

      setIsEditing: (editing) =>
        set((state) => {
          state.isEditing = editing;
        }),

      // Helpers
      getActivePage: () => {
        const state = get();
        return state.document.pages.find((p) => p.id === state.activePageId);
      },

      getElement: (elementId) => {
        const state = get();
        const page = state.document.pages.find((p) => p.id === state.activePageId);
        return page?.elements.find((el) => el.id === elementId);
      },

      getSelectedElements: () => {
        const state = get();
        const page = state.document.pages.find((p) => p.id === state.activePageId);
        if (!page) return [];
        const idSet = new Set(state.selectedElementIds);
        return page.elements.filter((el) => idSet.has(el.id));
      },
    }))
  );
};

export type EditorStore = ReturnType<typeof createEditorStore>;
