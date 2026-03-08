import type { Plugin } from '@reactcanvas/core';
import { createImageElement } from '@reactcanvas/core';

export function createImagesPlugin(): Plugin {
  return {
    name: 'images',
    version: '1.0.0',
    elementTypes: [
      {
        type: 'image',
        displayName: 'Image',
        icon: 'image',
        defaultProps: createImageElement(),
        renderer: 'ImageRenderer',
        inspector: 'ImageInspector',
      },
      {
        type: 'framed-image',
        displayName: 'Framed Image',
        icon: 'frame',
        defaultProps: {},
        renderer: 'FramedImageRenderer',
        inspector: 'FramedImageInspector',
      },
    ],
    toolbar: [
      {
        id: 'images-upload',
        label: 'Upload Image',
        icon: 'image-plus',
        position: 'left',
        order: 20,
        component: 'ImageUploadToolbar',
      },
    ],
    shortcuts: [
      {
        id: 'images-paste',
        keys: 'ctrl+v',
        label: 'Paste Image',
        action: () => {
          // Connected via editor integration
        },
      },
    ],
  };
}
