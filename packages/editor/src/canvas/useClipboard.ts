import type { CanvasElement } from '@reactcanvas/core';
import { createId } from '@reactcanvas/core';

// Module-level clipboard persists across re-renders
let clipboard: CanvasElement[] = [];

export function getClipboard(): CanvasElement[] {
  return clipboard;
}

export function copyElements(elements: CanvasElement[], selectedIds: string[]) {
  clipboard = elements
    .filter((el) => selectedIds.includes(el.id))
    .map((el) => JSON.parse(JSON.stringify(el)));
}

export function pasteElements(
  addElement: (el: CanvasElement) => void,
  selectMultiple: (ids: string[]) => void,
) {
  if (clipboard.length === 0) return;
  const newIds: string[] = [];
  for (const el of clipboard) {
    const newEl = {
      ...JSON.parse(JSON.stringify(el)),
      id: createId(),
      x: el.x + 20,
      y: el.y + 20,
      name: `${el.name} (Copy)`,
    };
    addElement(newEl);
    newIds.push(newEl.id);
  }
  // Offset clipboard for subsequent pastes
  clipboard = clipboard.map((el) => ({ ...el, x: el.x + 20, y: el.y + 20 }));
  selectMultiple(newIds);
}

export function flipElements(
  selectedIds: string[],
  elements: CanvasElement[],
  updateElement: (id: string, updates: Partial<CanvasElement>) => void,
  axis: 'x' | 'y',
) {
  for (const id of selectedIds) {
    const el = elements.find((e) => e.id === id);
    if (!el) continue;
    if (axis === 'x') {
      updateElement(id, { flipX: !el.flipX } as Partial<CanvasElement>);
    } else {
      updateElement(id, { flipY: !el.flipY } as Partial<CanvasElement>);
    }
  }
}
