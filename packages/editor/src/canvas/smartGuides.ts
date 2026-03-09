import type { CanvasElement } from '@reactcanvas/core';

export interface Guide {
  type: 'h' | 'v';
  pos: number;
}

export const SNAP_THRESHOLD = 8;
export const GRID_SIZE = 20;
export const GUIDE_THRESHOLD = 6;

/**
 * Compute smart alignment guides and snap offsets for a moving element
 * relative to other stationary elements.
 */
export function computeSmartGuides(
  movingBounds: { left: number; top: number; width: number; height: number },
  stationaryElements: CanvasElement[],
): { dx: number; dy: number; guides: Guide[] } {
  const guides: Guide[] = [];
  let dx = 0, dy = 0;
  let snappedX = false, snappedY = false;

  const { left, top, width, height } = movingBounds;
  const centerX = left + width / 2;
  const centerY = top + height / 2;
  const right = left + width;
  const bottom = top + height;

  for (const other of stationaryElements) {
    const oLeft = other.x;
    const oTop = other.y;
    const oCenterX = oLeft + other.width / 2;
    const oCenterY = oTop + other.height / 2;
    const oRight = oLeft + other.width;
    const oBottom = oTop + other.height;

    if (!snappedX) {
      const xChecks = [
        { moving: left, target: oLeft },
        { moving: left, target: oRight },
        { moving: left, target: oCenterX },
        { moving: right, target: oLeft },
        { moving: right, target: oRight },
        { moving: centerX, target: oCenterX },
      ];
      for (const { moving, target } of xChecks) {
        if (Math.abs(moving - target) < GUIDE_THRESHOLD) {
          dx = target - moving;
          guides.push({ type: 'v', pos: target });
          snappedX = true;
          break;
        }
      }
    }

    if (!snappedY) {
      const yChecks = [
        { moving: top, target: oTop },
        { moving: top, target: oBottom },
        { moving: top, target: oCenterY },
        { moving: bottom, target: oTop },
        { moving: bottom, target: oBottom },
        { moving: centerY, target: oCenterY },
      ];
      for (const { moving, target } of yChecks) {
        if (Math.abs(moving - target) < GUIDE_THRESHOLD) {
          dy = target - moving;
          guides.push({ type: 'h', pos: target });
          snappedY = true;
          break;
        }
      }
    }

    if (snappedX && snappedY) break;
  }

  // Fallback: grid snap for unsnapped axes
  if (!snappedX) {
    const snapX = Math.round(left / GRID_SIZE) * GRID_SIZE;
    if (Math.abs(left - snapX) < SNAP_THRESHOLD) dx = snapX - left;
  }
  if (!snappedY) {
    const snapY = Math.round(top / GRID_SIZE) * GRID_SIZE;
    if (Math.abs(top - snapY) < SNAP_THRESHOLD) dy = snapY - top;
  }

  return { dx, dy, guides };
}
