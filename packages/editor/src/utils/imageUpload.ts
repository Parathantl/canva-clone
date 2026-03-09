import { createImageElement } from '@reactcanvas/core';
import type { CanvasElement } from '@reactcanvas/core';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml', 'image/gif'];

export interface ImageUploadOptions {
  file: File;
  x: number;
  y: number;
  layerOrder: number;
  maxDim?: number;
  maxFileSize?: number;
}

export function processImageFile(
  options: ImageUploadOptions,
  onReady: (element: CanvasElement) => void,
  onError?: (message: string) => void,
) {
  const { file, x, y, layerOrder, maxDim = 600, maxFileSize = MAX_FILE_SIZE } = options;
  if (!ALLOWED_TYPES.includes(file.type)) {
    onError?.(`Unsupported file type: ${file.type}`);
    return;
  }
  if (file.size > maxFileSize) {
    onError?.(`File too large: ${(file.size / 1024 / 1024).toFixed(1)}MB (max ${(maxFileSize / 1024 / 1024).toFixed(0)}MB)`);
    return;
  }
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
