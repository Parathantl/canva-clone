import React, { useCallback } from 'react';
import type { TextElement, CanvasElement } from '@reactcanvas/core';

const FONTS = [
  'Inter', 'Roboto', 'Open Sans', 'Lato', 'Montserrat', 'Poppins',
  'Playfair Display', 'Merriweather', 'Bebas Neue', 'Pacifico',
  'Dancing Script', 'Fira Code', 'JetBrains Mono', 'Arial',
  'Times New Roman', 'Georgia', 'Courier New', 'Verdana',
  'Trebuchet MS', 'Impact',
];

const FONT_SIZES = [8, 10, 12, 14, 16, 18, 20, 24, 28, 32, 36, 42, 48, 56, 64, 72, 96, 128];

const COLORS = [
  '#000000', '#ffffff', '#ef4444', '#f97316', '#eab308', '#22c55e',
  '#3b82f6', '#8b5cf6', '#ec4899', '#6b7280', '#1e1e2e', '#cdd6f4',
];

interface TextToolbarProps {
  element: TextElement;
  isEditing: boolean;
  onUpdate: (id: string, attrs: Partial<CanvasElement>) => void;
  style?: React.CSSProperties;
}

// Get the active text editor element
function getEditorEl(): HTMLElement | null {
  return document.querySelector('[data-text-editor]');
}

// Check if there's a text selection inside the editor
function hasEditorSelection(): boolean {
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0) return false;
  const anchor = sel.anchorNode;
  if (!anchor) return false;
  const el = anchor.nodeType === 3 ? anchor.parentElement : anchor as HTMLElement;
  return !!el?.closest?.('[data-text-editor]');
}

// Wrap the current selection in a span with the given style
function applyInlineStyle(styleProp: string, value: string) {
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0 || sel.isCollapsed) return;

  const range = sel.getRangeAt(0);
  const span = document.createElement('span');
  span.style.setProperty(styleProp, value);

  try {
    range.surroundContents(span);
  } catch {
    // If surroundContents fails (partial node selection), use extractContents
    const fragment = range.extractContents();
    span.appendChild(fragment);
    range.insertNode(span);
  }

  // Re-select the wrapped content
  sel.removeAllRanges();
  const newRange = document.createRange();
  newRange.selectNodeContents(span);
  sel.addRange(newRange);

  // Notify the editor that content changed
  const editor = getEditorEl();
  if (editor) {
    editor.dispatchEvent(new Event('input', { bubbles: true }));
  }
}

// Apply a formatting command via execCommand (bold, italic, underline, strikethrough)
function execToggle(command: string) {
  document.execCommand(command, false);
  const editor = getEditorEl();
  if (editor) {
    editor.dispatchEvent(new Event('input', { bubbles: true }));
  }
}

export function TextToolbar({ element, isEditing, onUpdate, style }: TextToolbarProps) {
  const fillColor = element.fill.type === 'solid' ? element.fill.color : '#000000';

  const update = useCallback(
    (attrs: Partial<CanvasElement>) => {
      onUpdate(element.id, attrs);
    },
    [element.id, onUpdate]
  );

  const handleBold = useCallback(() => {
    if (isEditing && hasEditorSelection()) {
      execToggle('bold');
    } else {
      update({ fontWeight: element.fontWeight >= 700 ? 400 : 700 } as Partial<CanvasElement>);
    }
  }, [isEditing, element.fontWeight, update]);

  const handleItalic = useCallback(() => {
    if (isEditing && hasEditorSelection()) {
      execToggle('italic');
    } else {
      update({ fontStyle: element.fontStyle === 'italic' ? 'normal' : 'italic' } as Partial<CanvasElement>);
    }
  }, [isEditing, element.fontStyle, update]);

  const handleUnderline = useCallback(() => {
    if (isEditing && hasEditorSelection()) {
      execToggle('underline');
    } else {
      update({ textDecoration: element.textDecoration === 'underline' ? 'none' : 'underline' } as Partial<CanvasElement>);
    }
  }, [isEditing, element.textDecoration, update]);

  const handleStrikethrough = useCallback(() => {
    if (isEditing && hasEditorSelection()) {
      execToggle('strikeThrough');
    } else {
      update({ textDecoration: element.textDecoration === 'line-through' ? 'none' : 'line-through' } as Partial<CanvasElement>);
    }
  }, [isEditing, element.textDecoration, update]);

  const handleFontSize = useCallback((size: number) => {
    if (isEditing && hasEditorSelection()) {
      applyInlineStyle('font-size', `${size}px`);
    }
    // Always update element property so toolbar stays in sync
    update({ fontSize: size } as Partial<CanvasElement>);
  }, [isEditing, update]);

  const handleFontFamily = useCallback((family: string) => {
    if (isEditing && hasEditorSelection()) {
      applyInlineStyle('font-family', family);
    }
    update({ fontFamily: family } as Partial<CanvasElement>);
  }, [isEditing, update]);

  const handleColor = useCallback((color: string) => {
    if (isEditing && hasEditorSelection()) {
      applyInlineStyle('color', color);
    }
    update({ fill: { type: 'solid', color } } as Partial<CanvasElement>);
  }, [isEditing, update]);

  return (
    <div
      data-text-toolbar
      style={{
        ...styles.container,
        ...style,
      }}
      onMouseDown={(e) => {
        e.stopPropagation();
        // Don't preventDefault — it blocks native select dropdowns and inputs
      }}
    >
      {/* Font family */}
      <select
        value={element.fontFamily}
        onChange={(e) => handleFontFamily(e.target.value)}
        style={{ ...styles.select, width: 120 }}
        title="Font Family"
      >
        {FONTS.map((font) => (
          <option key={font} value={font} style={{ fontFamily: font }}>
            {font}
          </option>
        ))}
      </select>

      <div style={styles.divider} />

      {/* Font size */}
      <select
        value={FONT_SIZES.includes(element.fontSize) ? element.fontSize : ''}
        onChange={(e) => {
          const v = parseInt(e.target.value);
          if (!isNaN(v)) handleFontSize(v);
        }}
        style={{ ...styles.select, width: 54 }}
        title="Font Size"
      >
        {!FONT_SIZES.includes(element.fontSize) && (
          <option value="">{element.fontSize}</option>
        )}
        {FONT_SIZES.map((size) => (
          <option key={size} value={size}>{size}</option>
        ))}
      </select>
      <button
        style={styles.smallBtn}
        title="Decrease Font Size"
        onClick={() => handleFontSize(Math.max(8, element.fontSize - 1))}
      >−</button>
      <button
        style={styles.smallBtn}
        title="Increase Font Size"
        onClick={() => handleFontSize(Math.min(400, element.fontSize + 1))}
      >+</button>

      <div style={styles.divider} />

      {/* Bold */}
      <button
        style={{ ...styles.btn, ...(element.fontWeight >= 700 ? styles.btnActive : {}), fontWeight: 700 }}
        title="Bold"
        onClick={handleBold}
      >B</button>

      {/* Italic */}
      <button
        style={{ ...styles.btn, ...(element.fontStyle === 'italic' ? styles.btnActive : {}), fontStyle: 'italic' }}
        title="Italic"
        onClick={handleItalic}
      >I</button>

      {/* Underline */}
      <button
        style={{ ...styles.btn, ...(element.textDecoration === 'underline' ? styles.btnActive : {}), textDecoration: 'underline' }}
        title="Underline"
        onClick={handleUnderline}
      >U</button>

      {/* Strikethrough */}
      <button
        style={{ ...styles.btn, ...(element.textDecoration === 'line-through' ? styles.btnActive : {}), textDecoration: 'line-through' }}
        title="Strikethrough"
        onClick={handleStrikethrough}
      >S</button>

      <div style={styles.divider} />

      {/* Text alignment */}
      <button
        style={{ ...styles.btn, ...(element.textAlign === 'left' ? styles.btnActive : {}) }}
        title="Align Left"
        onClick={() => update({ textAlign: 'left' } as Partial<CanvasElement>)}
      >&#9776;</button>
      <button
        style={{ ...styles.btn, ...(element.textAlign === 'center' ? styles.btnActive : {}) }}
        title="Align Center"
        onClick={() => update({ textAlign: 'center' } as Partial<CanvasElement>)}
      >&#8801;</button>
      <button
        style={{ ...styles.btn, ...(element.textAlign === 'right' ? styles.btnActive : {}) }}
        title="Align Right"
        onClick={() => update({ textAlign: 'right' } as Partial<CanvasElement>)}
      >&#8803;</button>

      <div style={styles.divider} />

      {/* Color swatches */}
      <div style={styles.colorRow}>
        {COLORS.map((color) => (
          <div
            key={color}
            title={color}
            style={{
              width: 18,
              height: 18,
              backgroundColor: color,
              borderRadius: 3,
              cursor: 'pointer',
              border: color === fillColor ? '2px solid #89b4fa' : '1px solid #45475a',
              boxSizing: 'border-box',
            }}
            onMouseDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleColor(color);
            }}
          />
        ))}
        <div style={{ ...styles.colorWrap, width: 18, height: 18 }} title="Custom Color">
          <span style={{ ...styles.colorPreview, backgroundColor: fillColor }} />
          <input
            type="color"
            value={fillColor}
            onChange={(e) => handleColor(e.target.value)}
            style={styles.colorInput}
          />
        </div>
      </div>

      <div style={styles.divider} />

      {/* Line height & letter spacing */}
      <div style={styles.miniGroup} title="Line Height">
        <span style={styles.miniLabel}>LH</span>
        <input
          type="number"
          value={element.lineHeight}
          onChange={(e) => {
            const v = parseFloat(e.target.value);
            if (!isNaN(v) && v >= 0.5 && v <= 4) update({ lineHeight: v } as Partial<CanvasElement>);
          }}
          min={0.5} max={4} step={0.1}
          style={{ ...styles.miniInput, width: 42 }}
        />
      </div>
      <div style={styles.miniGroup} title="Letter Spacing">
        <span style={styles.miniLabel}>LS</span>
        <input
          type="number"
          value={element.letterSpacing}
          onChange={(e) => {
            const v = parseFloat(e.target.value);
            if (!isNaN(v)) update({ letterSpacing: v } as Partial<CanvasElement>);
          }}
          min={-5} max={20} step={0.5}
          style={{ ...styles.miniInput, width: 42 }}
        />
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    alignItems: 'center',
    gap: 3,
    padding: '6px 10px',
    backgroundColor: '#1e1e2e',
    border: '1px solid #45475a',
    borderRadius: 8,
    boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
    zIndex: 100,
    flexWrap: 'wrap',
  },
  divider: {
    width: 1,
    height: 22,
    backgroundColor: '#45475a',
    margin: '0 3px',
    flexShrink: 0,
  },
  select: {
    height: 28,
    border: '1px solid #45475a',
    borderRadius: 4,
    backgroundColor: '#313244',
    color: '#cdd6f4',
    fontSize: 12,
    padding: '0 4px',
    outline: 'none',
    cursor: 'pointer',
  },
  btn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 28,
    height: 28,
    border: 'none',
    borderRadius: 4,
    backgroundColor: 'transparent',
    color: '#cdd6f4',
    fontSize: 14,
    cursor: 'pointer',
    fontFamily: 'Georgia, serif',
    padding: 0,
    lineHeight: 1,
  },
  btnActive: {
    backgroundColor: '#45475a',
    color: '#89b4fa',
  },
  smallBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 22,
    height: 28,
    border: 'none',
    borderRadius: 4,
    backgroundColor: 'transparent',
    color: '#cdd6f4',
    fontSize: 14,
    cursor: 'pointer',
    padding: 0,
  },
  colorRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 3,
    flexWrap: 'wrap',
  },
  colorWrap: {
    position: 'relative',
    borderRadius: 3,
    overflow: 'hidden',
    cursor: 'pointer',
    border: '1px solid #45475a',
  },
  colorPreview: {
    position: 'absolute',
    inset: 2,
    borderRadius: 2,
    pointerEvents: 'none',
  },
  colorInput: {
    position: 'absolute',
    inset: 0,
    width: '100%',
    height: '100%',
    opacity: 0,
    cursor: 'pointer',
    border: 'none',
    padding: 0,
  },
  miniGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: 3,
  },
  miniLabel: {
    color: '#6c7086',
    fontSize: 10,
    fontWeight: 600,
    userSelect: 'none',
  },
  miniInput: {
    height: 24,
    border: '1px solid #45475a',
    borderRadius: 4,
    backgroundColor: '#313244',
    color: '#cdd6f4',
    fontSize: 11,
    padding: '0 4px',
    outline: 'none',
  },
};
