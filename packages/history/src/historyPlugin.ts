import type { Plugin } from '@reactcanvas/core';

export function createHistoryPlugin(options: { maxDepth?: number } = {}): Plugin {
  return {
    name: 'history',
    version: '1.0.0',
    shortcuts: [
      {
        id: 'history-undo',
        keys: 'ctrl+z',
        label: 'Undo',
        action: () => {
          // Action connected via event bus in the editor
        },
      },
      {
        id: 'history-redo',
        keys: 'ctrl+shift+z',
        label: 'Redo',
        action: () => {
          // Action connected via event bus in the editor
        },
      },
    ],
    hooks: {
      onInit: () => {
        // History stack initialization handled by editor integration
      },
    },
  };
}
