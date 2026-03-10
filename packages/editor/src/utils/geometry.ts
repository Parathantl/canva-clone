import type { CanvasElement } from '@reactcanvas/core';

/** A 2D point. */
export interface Point {
  x: number;
  y: number;
}

/** Axis-aligned bounding box in screen (pixel) coordinates. */
export interface ScreenBounds {
  left: number;
  top: number;
  right: number;
  bottom: number;
  width: number;
  height: number;
}

/** Axis-aligned bounding box in document coordinates. */
export interface BoundingBox {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

/**
 * Compute the center point of an element in screen (pixel) coordinates.
 *
 * Mirrors the calculation used by EditorCanvas when initiating rotation:
 *   centerX = offsetX + (el.x + el.width / 2) * zoom
 *   centerY = offsetY + (el.y + el.height / 2) * zoom
 *
 * @param el       - The canvas element.
 * @param offsetX  - Horizontal viewport offset (includes pan + centering).
 * @param offsetY  - Vertical viewport offset (includes pan + centering).
 * @param zoom     - Current zoom scale factor.
 */
export function getElementCenter(
  el: Pick<CanvasElement, 'x' | 'y' | 'width' | 'height'>,
  offsetX: number,
  offsetY: number,
  zoom: number,
): Point {
  return {
    x: offsetX + (el.x + el.width / 2) * zoom,
    y: offsetY + (el.y + el.height / 2) * zoom,
  };
}

/**
 * Compute the screen-space (pixel) bounding rectangle of an element.
 *
 * Mirrors the bounds test used by rubber-band selection in EditorCanvas:
 *   elLeft   = offsetX + el.x * zoom
 *   elTop    = offsetY + el.y * zoom
 *   elRight  = elLeft + el.width * zoom
 *   elBottom = elTop  + el.height * zoom
 *
 * @param el       - The canvas element.
 * @param offsetX  - Horizontal viewport offset.
 * @param offsetY  - Vertical viewport offset.
 * @param zoom     - Current zoom scale factor.
 */
export function getElementScreenBounds(
  el: Pick<CanvasElement, 'x' | 'y' | 'width' | 'height'>,
  offsetX: number,
  offsetY: number,
  zoom: number,
): ScreenBounds {
  const left = offsetX + el.x * zoom;
  const top = offsetY + el.y * zoom;
  const width = el.width * zoom;
  const height = el.height * zoom;

  return {
    left,
    top,
    right: left + width,
    bottom: top + height,
    width,
    height,
  };
}

/**
 * Compute the document-space bounding box that encloses all given elements.
 *
 * Mirrors the multi-select resize logic in EditorCanvas:
 *   bx  = Math.min(...elements.map(e => e.x))
 *   by  = Math.min(...elements.map(e => e.y))
 *   bx2 = Math.max(...elements.map(e => e.x + e.width))
 *   by2 = Math.max(...elements.map(e => e.y + e.height))
 *
 * and the alignment calculations in Inspector's AlignmentTools.
 *
 * Returns `null` when the array is empty.
 *
 * @param elements - Array of canvas elements (or any objects with x/y/width/height).
 */
export function getBoundingBox(
  elements: ReadonlyArray<Pick<CanvasElement, 'x' | 'y' | 'width' | 'height'>>,
): BoundingBox | null {
  if (elements.length === 0) return null;

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const el of elements) {
    if (el.x < minX) minX = el.x;
    if (el.y < minY) minY = el.y;

    const right = el.x + el.width;
    const bottom = el.y + el.height;

    if (right > maxX) maxX = right;
    if (bottom > maxY) maxY = bottom;
  }

  return { minX, minY, maxX, maxY };
}

/**
 * Clamp a zoom scale value to the allowed range.
 *
 * Mirrors the wheel-zoom clamping in EditorCanvas:
 *   Math.min(10, Math.max(0.1, newScale))
 *
 * @param scale - The raw scale value to clamp.
 * @param min   - Minimum allowed zoom (default 0.1).
 * @param max   - Maximum allowed zoom (default 10).
 */
export function clampZoom(scale: number, min = 0.1, max = 10): number {
  return Math.min(max, Math.max(min, scale));
}
