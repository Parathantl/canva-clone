import { useCallback } from 'react';
import type { Page } from '@reactcanvas/core';
import { createPage } from '@reactcanvas/core';
import { useEditorInstance, useEditorStore } from '../context/EditorContext';
import { useActivePage } from './useActivePage';

export function usePages() {
  const { store, eventBus } = useEditorInstance();

  const pages = useEditorStore((s) => s.document.pages);
  const activePageId = useEditorStore((s) => s.activePageId);

  const activePage = useActivePage();

  const addPage = useCallback(
    (overrides?: Partial<Page>) => {
      const page = createPage(overrides);
      store.getState().addPage(page);
      eventBus.emit('page:add', { page });
      return page;
    },
    [store, eventBus]
  );

  const removePage = useCallback(
    (pageId: string) => {
      const page = store.getState().document.pages.find((p) => p.id === pageId);
      store.getState().removePage(pageId);
      if (page) {
        eventBus.emit('page:remove', { page });
      }
    },
    [store, eventBus]
  );

  const setActivePage = useCallback(
    (pageId: string) => {
      const prev = store.getState().activePageId;
      store.getState().setActivePage(pageId);
      eventBus.emit('page:switch', { pageId, previousPageId: prev });
    },
    [store, eventBus]
  );

  const updatePage = useCallback(
    (pageId: string, updater: (page: Page) => void) => {
      store.getState().updatePage(pageId, updater);
    },
    [store]
  );

  const duplicatePage = useCallback(
    (pageId: string) => {
      return store.getState().duplicatePage(pageId);
    },
    [store]
  );

  const reorderPages = useCallback(
    (fromIndex: number, toIndex: number) => {
      store.getState().reorderPages(fromIndex, toIndex);
    },
    [store]
  );

  return {
    pages,
    activePage,
    activePageId,
    addPage,
    removePage,
    setActivePage,
    updatePage,
    duplicatePage,
    reorderPages,
    pageCount: pages.length,
  };
}
