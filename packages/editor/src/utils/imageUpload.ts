import { createImageElement } from '@reactcanvas/core';
import type { CanvasElement } from '@reactcanvas/core';

export interface ImageUploadOptions {
  file: File;
  x: number;
  y: number;
  layerOrder: number;
  maxDim?: number;
}

export function processImageFile(
  options: ImageUploadOptions,
  onReady: (element: CanvasElement) => void,
) {
  const { file, x, y, layerOrder, maxDim = 600 } = options;
  if (!file.type.startsWith('image/')) return;
  const reader = new FileReader();
  reader.onerror = () => console.error('Failed to read image file');
  reader.onload = (ev) => {
    const src = ev.target?.result as string;
    if (!src) return;
    const img = new Image();
    img.onerror = () => console.error('Failed to load image');
    img.onload = () => {
      let w = img.naturalWidth;
      let h = img.naturalHeight;
      if (w > maxDim || h > maxDim) {
        const ratio = Math.min(maxDim / w, maxDim / h);
        w *= ratio;
        h *= ratio;
      }
      onReady(createImageElement({
        x: x - w / 2,
        y: y - h / 2,
        width: w,
        height: h,
        src,
        name: file.name,
        layerOrder,
        originalWidth: img.naturalWidth,
        originalHeight: img.naturalHeight,
        cropWidth: img.naturalWidth,
        cropHeight: img.naturalHeight,
      }));
    };
    img.src = src;
  };
  reader.readAsDataURL(file);
}
