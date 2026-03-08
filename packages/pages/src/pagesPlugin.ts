import type { Plugin } from '@reactcanvas/core';

export function createPagesPlugin(): Plugin {
  return {
    name: 'pages',
    version: '1.0.0',
    toolbar: [
      {
        id: 'pages-sidebar',
        label: 'Pages',
        icon: 'layers',
        position: 'left',
        order: 30,
        component: 'PagesSidebar',
      },
    ],
    panels: [
      {
        id: 'pages-panel',
        label: 'Pages',
        position: 'sidebar',
        order: 0,
        component: 'PagesSidebarPanel',
        icon: 'layers',
      },
    ],
    shortcuts: [
      {
        id: 'pages-next',
        keys: 'ctrl+]',
        label: 'Next Page',
        action: () => {},
      },
      {
        id: 'pages-prev',
        keys: 'ctrl+[',
        label: 'Previous Page',
        action: () => {},
      },
      {
        id: 'pages-new',
        keys: 'ctrl+shift+n',
        label: 'New Page',
        action: () => {},
      },
    ],
  };
}
