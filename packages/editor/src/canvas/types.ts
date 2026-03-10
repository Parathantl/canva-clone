import type { CanvasElement } from '@reactcanvas/core';

/**
 * Discriminated union describing the current drag interaction on the canvas.
 *
 * Extracted from EditorCanvas.tsx so it can be shared across modules.
 */
export type DragState =
  | {
      type: 'move';
      ids: string[];
      startX: number;
      startY: number;
      origPositions: Array<{ id: string; x: number; y: number }>;
    }
  | {
      type: 'resize';
      id: string;
      handle: string;
      startX: number;
      startY: number;
      origX: number;
      origY: number;
      origW: number;
      origH: number;
      element: CanvasElement;
      origBounds?: { x: number; y: number; w: number; h: number };
      origElements?: Array<{ id: string; x: number; y: number; w: number; h: number }>;
    }
  | {
      type: 'rotate';
      id: string;
      centerX: number;
      centerY: number;
      startAngle: number;
      origRotation: number;
    }
  | {
      type: 'rubberband';
      startClientX: number;
      startClientY: number;
      currentClientX: number;
      currentClientY: number;
    }
  | {
      type: 'pan';
      startClientX: number;
      startClientY: number;
      origPanX: number;
      origPanY: number;
    };
