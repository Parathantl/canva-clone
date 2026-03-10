/**
 * Shared constants for the editor canvas.
 *
 * These were extracted from EditorCanvas.tsx and DOMElementRenderer.tsx
 * so they can be referenced (and overridden) in one place.
 */

// ── Selection handles ──────────────────────────────────────────────
/** Size (px) of the resize handles rendered on a selected element. */
export const HANDLE_SIZE = 10;

/** Distance (px) the rotation handle sits above the element's top edge. */
export const ROTATE_OFFSET = 25;

// ── Nudge (arrow-key movement) ─────────────────────────────────────
/** Pixels to move per arrow-key press. */
export const NUDGE_AMOUNT = 1;

/** Pixels to move per arrow-key press while Shift is held. */
export const NUDGE_SHIFT_AMOUNT = 10;

// ── Zoom ───────────────────────────────────────────────────────────
/** Multiplicative factor applied on each zoom step (scroll wheel). */
export const ZOOM_FACTOR = 1.1;

/** Minimum allowed zoom level. */
export const ZOOM_MIN = 0.1;

/** Maximum allowed zoom level. */
export const ZOOM_MAX = 10;

// ── Rotation ───────────────────────────────────────────────────────
/** Angle (degrees) to snap to when Shift is held during rotation. */
export const ROTATION_SNAP_ANGLE = 15;

// ── Element constraints ────────────────────────────────────────────
/** Minimum width/height (px) an element can be resized to. */
export const MIN_ELEMENT_SIZE = 10;

// ── Smart guides ───────────────────────────────────────────────────
/**
 * Distance (px) within which a moving element snaps to a guide line.
 * Re-exported from smartGuides.ts for convenience.
 */
export const SMART_GUIDE_SNAP_THRESHOLD = 6;

// ── Rubber-band selection ──────────────────────────────────────────
/** Minimum drag distance (px) before a rubber-band selection is applied. */
export const RUBBERBAND_MIN_DRAG = 5;
