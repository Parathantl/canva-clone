import { createStore } from 'zustand/vanilla';
import { immer } from 'zustand/middleware/immer';
import type { Document, Page, CanvasElement, GroupElement } from '../types/document';
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
  bringToFront: (elementIds: string[]) => void;
  sendToBack: (elementIds: string[]) => void;
  bringForward: (elementIds: string[]) => void;
  sendBackward: (elementIds: string[]) => void;
  groupElements: (elementIds: string[]) => string;
  ungroupElement: (groupId: string) => void;

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

/** Shared helper: shift selected elements one step forward or backward in layer order */
function shiftLayerOrder(
  elements: CanvasElement[],
  elementIds: string[],
  direction: 'forward' | 'backward',
) {
  const idSet = new Set(elementIds);
  const sorted = [...elements].sort((a, b) => a.layerOrder - b.layerOrder);
  if (sorted.length === 0) return;
  const isForward = direction === 'forward';
  const start = isForward ? sorted.length - 1 : 0;
  const end = isForward ? -1 : sorted.length;
  const step = isForward ? -1 : 1;
  const neighborStep = isForward ? 1 : -1;

  for (let i = start; i !== end; i += step) {
    if (!idSet.has(sorted[i].id)) continue;
    for (let j = i + neighborStep; j >= 0 && j < sorted.length; j += neighborStep) {
      if (!idSet.has(sorted[j].id)) {
        const tmp = sorted[i].layerOrder;
        sorted[i].layerOrder = sorted[j].layerOrder;
        sorted[j].layerOrder = tmp;
        break;
      }
    }
  }
}

export const createEditorStore = (initialDocument?: Document) => {
  const doc = initialDocument ?? createDefaultDocument();

  /** Helper: find the active page inside an immer draft */
  function activePage(state: EditorState): Page | undefined {
    return state.document.pages.find((p) => p.id === state.activePageId);
  }

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
            state.activePageId = state.document.pages[Math.max(0, index - 1)]?.id ?? '';
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
          const page = activePage(state);
          if (page) {
            page.elements.push(element);
            state.document.updatedAt = new Date().toISOString();
          }
        }),

      removeElement: (elementId) =>
        set((state) => {
          const page = activePage(state);
          if (page) {
            page.elements = page.elements.filter((el) => el.id !== elementId);
            state.selectedElementIds = state.selectedElementIds.filter((id) => id !== elementId);
            state.document.updatedAt = new Date().toISOString();
          }
        }),

      removeElements: (elementIds) =>
        set((state) => {
          const page = activePage(state);
          if (page) {
            const idSet = new Set(elementIds);
            page.elements = page.elements.filter((el) => !idSet.has(el.id));
            state.selectedElementIds = state.selectedElementIds.filter((id) => !idSet.has(id));
            state.document.updatedAt = new Date().toISOString();
          }
        }),

      updateElement: (elementId, updates) =>
        set((state) => {
          const page = activePage(state);
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
          const page = activePage(state);
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
          const page = activePage(state);
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
          const page = activePage(state);
          if (page) {
            const element = page.elements.find((el) => el.id === elementId);
            if (element) {
              element.layerOrder = newOrder;
              state.document.updatedAt = new Date().toISOString();
            }
          }
        }),

      bringToFront: (elementIds) =>
        set((state) => {
          const page = activePage(state);
          if (!page) return;
          const maxOrder = page.elements.length === 0 ? 0 : Math.max(...page.elements.map((el) => el.layerOrder));
          const idSet = new Set(elementIds);
          let nextOrder = maxOrder + 1;
          for (const el of page.elements) {
            if (idSet.has(el.id)) {
              el.layerOrder = nextOrder++;
            }
          }
          state.document.updatedAt = new Date().toISOString();
        }),

      sendToBack: (elementIds) =>
        set((state) => {
          const page = activePage(state);
          if (!page) return;
          const idSet = new Set(elementIds);
          // Assign selected elements to order 0..n-1, then shift others up
          let nextOrder = 0;
          for (const el of page.elements) {
            if (idSet.has(el.id)) {
              el.layerOrder = nextOrder++;
            }
          }
          // Shift non-selected elements above the selected ones
          const nonSelected = page.elements
            .filter((el) => !idSet.has(el.id))
            .sort((a, b) => a.layerOrder - b.layerOrder);
          for (const el of nonSelected) {
            el.layerOrder = nextOrder++;
          }
          state.document.updatedAt = new Date().toISOString();
        }),

      bringForward: (elementIds) =>
        set((state) => {
          const page = activePage(state);
          if (!page) return;
          shiftLayerOrder(page.elements, elementIds, 'forward');
          state.document.updatedAt = new Date().toISOString();
        }),

      sendBackward: (elementIds) =>
        set((state) => {
          const page = activePage(state);
          if (!page) return;
          shiftLayerOrder(page.elements, elementIds, 'backward');
          state.document.updatedAt = new Date().toISOString();
        }),

      groupElements: (elementIds) => {
        const groupId = createId();
        set((state) => {
          const page = activePage(state);
          if (!page || elementIds.length < 2) return;

          const children = page.elements.filter((el) => elementIds.includes(el.id));
          if (children.length < 2) return;

          // Calculate bounding box
          let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
          for (const c of children) {
            minX = Math.min(minX, c.x);
            minY = Math.min(minY, c.y);
            maxX = Math.max(maxX, c.x + c.width);
            maxY = Math.max(maxY, c.y + c.height);
          }

          const maxOrder = children.length === 0 ? 0 : Math.max(...children.map((c) => c.layerOrder));

          const group: GroupElement = {
            id: groupId,
            type: 'group',
            name: 'Group',
            x: minX,
            y: minY,
            width: maxX - minX,
            height: maxY - minY,
            rotation: 0,
            opacity: 1,
            locked: false,
            visible: true,
            layerOrder: maxOrder,
            children: elementIds,
          };

          // Adjust child positions to be relative to group
          for (const c of children) {
            c.x -= minX;
            c.y -= minY;
          }

          page.elements.push(group);
          state.selectedElementIds = [groupId];
          state.document.updatedAt = new Date().toISOString();
        });
        return groupId;
      },

      ungroupElement: (groupId) =>
        set((state) => {
          const page = activePage(state);
          if (!page) return;

          const group = page.elements.find((el) => el.id === groupId);
          if (!group || group.type !== 'group') return;

          const childIds = (group as GroupElement).children;

          // Restore child positions to absolute
          for (const childId of childIds) {
            const child = page.elements.find((el) => el.id === childId);
            if (child) {
              child.x += group.x;
              child.y += group.y;
            }
          }

          // Remove group element
          page.elements = page.elements.filter((el) => el.id !== groupId);
          state.selectedElementIds = childIds;
          state.document.updatedAt = new Date().toISOString();
        }),

      // Selection actions
      selectElement: (elementId, addToSelection = false) =>
        set((state) => {
          const page = activePage(state);
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
          const page = activePage(state);
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
        return activePage(state);
      },

      getElement: (elementId) => {
        const state = get();
        const page = activePage(state);
        return page?.elements.find((el) => el.id === elementId);
      },

      getSelectedElements: () => {
        const state = get();
        const page = activePage(state);
        if (!page) return [];
        const idSet = new Set(state.selectedElementIds);
        return page.elements.filter((el) => idSet.has(el.id));
      },
    }))
  );
};

export type EditorStore = ReturnType<typeof createEditorStore>;
