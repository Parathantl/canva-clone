import type { Plugin } from '@reactcanvas/core';
import { createTextElement } from '@reactcanvas/core';

export function createTextPlugin(): Plugin {
  return {
    name: 'text',
    version: '1.0.0',
    elementTypes: [
      {
        type: 'text',
        displayName: 'Text',
        icon: 'type',
        defaultProps: createTextElement(),
        renderer: 'TextRenderer',
        inspector: 'TextInspector',
      },
    ],
    toolbar: [
      {
        id: 'text-tool',
        label: 'Text',
        icon: 'type',
        position: 'left',
        order: 5,
        component: 'TextToolbar',
      },
    ],
    shortcuts: [
      {
        id: 'text-add',
        keys: 't',
        label: 'Text Tool',
        action: () => {
          // Connected via editor
        },
      },
    ],
  };
}
