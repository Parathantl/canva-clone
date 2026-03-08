import type { Plugin } from '@reactcanvas/core';
import { createShapeElement } from '@reactcanvas/core';

export function createShapesPlugin(): Plugin {
  return {
    name: 'shapes',
    version: '1.0.0',
    elementTypes: [
      {
        type: 'shape',
        displayName: 'Shape',
        icon: 'square',
        defaultProps: createShapeElement(),
        renderer: 'ShapeRenderer',
        inspector: 'ShapeInspector',
      },
    ],
    toolbar: [
      {
        id: 'shapes-tool',
        label: 'Shapes',
        icon: 'shapes',
        position: 'left',
        order: 10,
        component: 'ShapesToolbar',
      },
    ],
    shortcuts: [
      {
        id: 'shapes-rectangle',
        keys: 'r',
        label: 'Rectangle Tool',
        action: () => {
          // Connected via editor integration
        },
      },
      {
        id: 'shapes-circle',
        keys: 'c',
        label: 'Circle Tool',
        action: () => {
          // Connected via editor integration
        },
      },
    ],
  };
}
