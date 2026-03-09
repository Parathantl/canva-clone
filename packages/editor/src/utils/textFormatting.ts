// Shared utilities for text editing — selection management, inline formatting, computed styles

const TEXT_EDITOR_SELECTOR = '[data-text-editor]';

/** Get the active text editor element */
export function getEditorEl(): HTMLElement | null {
  return document.querySelector(TEXT_EDITOR_SELECTOR);
}

/** Check if there's a text selection/cursor inside the editor */
export function hasEditorSelection(): boolean {
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0) return false;
  const anchor = sel.anchorNode;
  if (!anchor) return false;
  const el = anchor.nodeType === 3 ? anchor.parentElement : (anchor as HTMLElement);
  return !!el?.closest?.(TEXT_EDITOR_SELECTOR);
}

/** Notify the text editor that its content changed (so React state stays in sync) */
export function notifyEditor(): void {
  const editor = getEditorEl();
  if (editor) {
    editor.dispatchEvent(new Event('input', { bubbles: true }));
  }
}

/** Apply a formatting command via execCommand (bold, italic, underline, strikethrough, color) */
export function execFormatting(command: string, value?: string): void {
  document.execCommand(command, false, value);
  notifyEditor();
}

/** Apply inline style to the current selection by wrapping in spans */
export function applyInlineStyle(styleProp: string, value: string): boolean {
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0 || sel.isCollapsed) return false;

  const range = sel.getRangeAt(0);

  const ancestor = range.commonAncestorContainer;
  const walkerRoot = ancestor.nodeType === 3 ? ancestor.parentElement : ancestor;
  if (!walkerRoot) return false;

  const walker = document.createTreeWalker(walkerRoot, NodeFilter.SHOW_TEXT);

  // Collect all text nodes and their offsets BEFORE any DOM mutations
  const entries: Array<{ node: Text; startOffset: number; endOffset: number }> = [];
  while (walker.nextNode()) {
    const node = walker.currentNode as Text;
    if (range.intersectsNode(node)) {
      let startOffset = 0;
      let endOffset = node.length;
      if (node === range.startContainer) startOffset = range.startOffset;
      if (node === range.endContainer) endOffset = range.endOffset;
      if (startOffset !== endOffset) {
        entries.push({ node, startOffset, endOffset });
      }
    }
  }

  if (entries.length === 0) return false;

  // Now mutate the DOM — offsets are already cached
  for (const { node, startOffset, endOffset } of entries) {
    let targetNode: Text = node;
    let adjustedEnd = endOffset;

    if (startOffset > 0) {
      targetNode = node.splitText(startOffset);
      adjustedEnd -= startOffset;
    }
    if (adjustedEnd < targetNode.length) {
      targetNode.splitText(adjustedEnd);
    }

    const parent = targetNode.parentElement;
    if (parent && parent.tagName === 'SPAN' && parent.childNodes.length === 1) {
      parent.style.setProperty(styleProp, value);
    } else if (targetNode.parentNode) {
      const span = document.createElement('span');
      span.style.setProperty(styleProp, value);
      targetNode.parentNode.insertBefore(span, targetNode);
      span.appendChild(targetNode);
    }
  }

  notifyEditor();
  return true;
}

// --- Computed style reading at cursor ---

export interface SelectionStyles {
  fontFamily: string;
  fontSize: number;
  fontWeight: number;
  fontStyle: string;
  textDecoration: string;
  color: string;
}

/** Read computed styles at the current selection/cursor position inside the text editor */
export function getComputedSelectionStyles(): SelectionStyles | null {
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0) return null;
  const anchor = sel.anchorNode;
  if (!anchor) return null;

  const el = anchor.nodeType === 3 ? anchor.parentElement : (anchor as HTMLElement);
  if (!el?.closest?.(TEXT_EDITOR_SELECTOR)) return null;

  const computed = window.getComputedStyle(el);

  const rawSize = parseFloat(computed.fontSize);
  const fontSize = isNaN(rawSize) ? 0 : Math.round(rawSize);

  const rawWeight = computed.fontWeight;
  const fontWeight =
    rawWeight === 'bold' ? 700 :
    rawWeight === 'normal' ? 400 :
    rawWeight === 'lighter' ? 300 :
    rawWeight === 'bolder' ? 800 :
    parseInt(rawWeight) || 400;

  const color = rgbToHex(computed.color);

  const fontFamily = computed.fontFamily.split(',')[0].replace(/['"]/g, '').trim();

  const decRaw = computed.textDecorationLine || computed.textDecoration || 'none';
  let textDecoration = 'none';
  if (decRaw.includes('line-through')) textDecoration = 'line-through';
  else if (decRaw.includes('underline')) textDecoration = 'underline';

  return {
    fontFamily,
    fontSize,
    fontWeight,
    fontStyle: computed.fontStyle || 'normal',
    textDecoration,
    color,
  };
}

/** Convert rgb()/rgba() color string to hex */
export function rgbToHex(color: string): string {
  const match = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (!match) return color;
  const r = parseInt(match[1]);
  const g = parseInt(match[2]);
  const b = parseInt(match[3]);
  return '#' + [r, g, b].map((c) => c.toString(16).padStart(2, '0')).join('');
}
