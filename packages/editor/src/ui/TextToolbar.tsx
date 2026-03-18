import React, { useCallback, useState, useEffect, useRef } from 'react';
import type { TextElement, CanvasElement } from '@reactcanvas/core';
import { DEFAULT_FONTS } from '@reactcanvas/text';
import {
  hasEditorSelection,
  execFormatting,
  applyInlineStyle,
  getComputedSelectionStyles,
  type SelectionStyles,
} from '../utils/textFormatting';

const FONT_NAMES = DEFAULT_FONTS.map((f) => f.family);

const FONT_SIZES = [8, 10, 12, 14, 16, 18, 20, 24, 28, 32, 36, 42, 48, 56, 64, 72, 96, 128];

const MIN_FONT_SIZE = 8;
const MAX_FONT_SIZE = 400;

const COLORS = [
  '#000000', '#ffffff', '#ef4444', '#f97316', '#eab308', '#22c55e',
  '#3b82f6', '#8b5cf6', '#ec4899', '#6b7280', '#f8f9fa', '#212529',
];

const TEXT_ALIGNMENTS: { value: string; label: string; icon: string }[] = [
  { value: 'left', label: 'Align Left', icon: '\u2630' },
  { value: 'center', label: 'Align Center', icon: '\u2261' },
  { value: 'right', label: 'Align Right', icon: '\u2263' },
];

interface TextToolbarProps {
  element: TextElement;
  isEditing: boolean;
  onUpdate: (id: string, attrs: Partial<CanvasElement>) => void;
  style?: React.CSSProperties;
}

// Save and restore text selection across focus-stealing interactions (e.g. <select> dropdowns)
function saveSelection(ref: React.MutableRefObject<Range | null>): void {
  const sel = window.getSelection();
  if (sel && sel.rangeCount > 0) {
    const range = sel.getRangeAt(0);
    const node = range.startContainer;
    const el = node.nodeType === 3 ? (node as Text).parentElement : (node as HTMLElement);
    if (el?.closest?.('[data-text-editor]')) {
      ref.current = range.cloneRange();
    }
  }
}

function restoreSelection(ref: React.MutableRefObject<Range | null>): boolean {
  if (!ref.current) return false;
  const sel = window.getSelection();
  if (!sel) return false;
  sel.removeAllRanges();
  sel.addRange(ref.current);
  ref.current = null;
  return true;
}

export function TextToolbar({ element, isEditing, onUpdate, style }: TextToolbarProps) {
  const elementColor = element.fill.type === 'solid' ? element.fill.color : '#000000';
  const savedRangeRef = useRef<Range | null>(null);

  // Track computed styles at the cursor position when editing
  const [selStyles, setSelStyles] = useState<SelectionStyles | null>(null);

  useEffect(() => {
    if (!isEditing) {
      setSelStyles(null);
      return;
    }
    let rafId: number | null = null;
    const handleSelectionChange = () => {
      if (rafId !== null) return;
      rafId = requestAnimationFrame(() => {
        rafId = null;
        setSelStyles(getComputedSelectionStyles());
      });
    };
    handleSelectionChange();
    document.addEventListener('selectionchange', handleSelectionChange);
    return () => {
      document.removeEventListener('selectionchange', handleSelectionChange);
      if (rafId !== null) cancelAnimationFrame(rafId);
    };
  }, [isEditing]);

  // Use computed styles when editing, fall back to element-level properties
  const cs = isEditing ? selStyles : null;
  const displayFamily = cs?.fontFamily ?? element.fontFamily;
  const displaySize = cs?.fontSize ?? element.fontSize;
  const displayWeight = cs?.fontWeight ?? element.fontWeight;
  const displayStyle = cs?.fontStyle ?? element.fontStyle;
  const displayDecoration = cs?.textDecoration ?? element.textDecoration;
  const displayColor = cs?.color ?? elementColor;

  const update = useCallback(
    (attrs: Partial<CanvasElement>) => {
      onUpdate(element.id, attrs);
    },
    [element.id, onUpdate]
  );

  // Check for editor selection, falling back to saved selection if needed
  const checkSelection = useCallback(() => {
    if (hasEditorSelection()) return true;
    if (savedRangeRef.current) {
      restoreSelection(savedRangeRef);
      return hasEditorSelection();
    }
    return false;
  }, []);

  // Formatting handler that applies inline when editing with selection, else updates element
  const applyFormat = useCallback(
    (inlineFn: () => void, elementAttrs: Partial<CanvasElement>) => {
      if (isEditing && checkSelection()) {
        inlineFn();
      } else {
        update(elementAttrs);
      }
    },
    [isEditing, checkSelection, update]
  );

  const handleBold = useCallback(() => {
    applyFormat(
      () => execFormatting('bold'),
      { fontWeight: element.fontWeight >= 700 ? 400 : 700 } as Partial<CanvasElement>,
    );
  }, [applyFormat, element.fontWeight]);

  const handleItalic = useCallback(() => {
    applyFormat(
      () => execFormatting('italic'),
      { fontStyle: element.fontStyle === 'italic' ? 'normal' : 'italic' } as Partial<CanvasElement>,
    );
  }, [applyFormat, element.fontStyle]);

  const handleUnderline = useCallback(() => {
    applyFormat(
      () => execFormatting('underline'),
      { textDecoration: element.textDecoration === 'underline' ? 'none' : 'underline' } as Partial<CanvasElement>,
    );
  }, [applyFormat, element.textDecoration]);

  const handleStrikethrough = useCallback(() => {
    applyFormat(
      () => execFormatting('strikeThrough'),
      { textDecoration: element.textDecoration === 'line-through' ? 'none' : 'line-through' } as Partial<CanvasElement>,
    );
  }, [applyFormat, element.textDecoration]);

  const handleFontSize = useCallback((size: number) => {
    applyFormat(
      () => applyInlineStyle('font-size', `${size}px`),
      { fontSize: size } as Partial<CanvasElement>,
    );
  }, [applyFormat]);

  const handleFontFamily = useCallback((family: string) => {
    applyFormat(
      () => applyInlineStyle('font-family', family),
      { fontFamily: family } as Partial<CanvasElement>,
    );
  }, [applyFormat]);

  const handleColor = useCallback((color: string) => {
    applyFormat(
      () => execFormatting('foreColor', color),
      { fill: { type: 'solid', color } } as Partial<CanvasElement>,
    );
  }, [applyFormat]);

  return (
    <div
      data-text-toolbar
      style={{ ...styles.container, ...style }}
      onMouseDown={(e) => {
        e.stopPropagation();
        const tag = (e.target as HTMLElement)?.tagName;
        if (tag === 'SELECT' || tag === 'INPUT' || tag === 'OPTION') {
          saveSelection(savedRangeRef);
        } else {
          e.preventDefault();
        }
      }}
    >
      {/* Font family */}
      <select
        value={FONT_NAMES.includes(displayFamily) ? displayFamily : element.fontFamily}
        onChange={(e) => handleFontFamily(e.target.value)}
        style={{ ...styles.select, width: 120 }}
        title="Font Family"
      >
        {FONT_NAMES.map((font) => (
          <option key={font} value={font} style={{ fontFamily: font }}>
            {font}
          </option>
        ))}
      </select>

      <div style={styles.divider} />

      {/* Font size */}
      <select
        value={FONT_SIZES.includes(displaySize) ? displaySize : ''}
        onChange={(e) => {
          const v = parseInt(e.target.value);
          if (!isNaN(v)) handleFontSize(v);
        }}
        style={{ ...styles.select, width: 54 }}
        title="Font Size"
      >
        {!FONT_SIZES.includes(displaySize) && (
          <option value="">{displaySize}</option>
        )}
        {FONT_SIZES.map((size) => (
          <option key={size} value={size}>{size}</option>
        ))}
      </select>
      <button
        style={styles.smallBtn}
        title="Decrease Font Size"
        onClick={() => handleFontSize(Math.max(MIN_FONT_SIZE, displaySize - 1))}
      >{'\u2212'}</button>
      <button
        style={styles.smallBtn}
        title="Increase Font Size"
        onClick={() => handleFontSize(Math.min(MAX_FONT_SIZE, displaySize + 1))}
      >+</button>

      <div style={styles.divider} />

      {/* Bold */}
      <button
        style={{ ...styles.btn, ...(displayWeight >= 700 ? styles.btnActive : {}), fontWeight: 700 }}
        title="Bold"
        onClick={handleBold}
      >B</button>

      {/* Italic */}
      <button
        style={{ ...styles.btn, ...(displayStyle === 'italic' ? styles.btnActive : {}), fontStyle: 'italic' }}
        title="Italic"
        onClick={handleItalic}
      >I</button>

      {/* Underline */}
      <button
        style={{ ...styles.btn, ...(displayDecoration === 'underline' ? styles.btnActive : {}), textDecoration: 'underline' }}
        title="Underline"
        onClick={handleUnderline}
      >U</button>

      {/* Strikethrough */}
      <button
        style={{ ...styles.btn, ...(displayDecoration === 'line-through' ? styles.btnActive : {}), textDecoration: 'line-through' }}
        title="Strikethrough"
        onClick={handleStrikethrough}
      >S</button>

      <div style={styles.divider} />

      {/* Text alignment */}
      {TEXT_ALIGNMENTS.map((align) => (
        <button
          key={align.value}
          style={{ ...styles.btn, ...(element.textAlign === align.value ? styles.btnActive : {}) }}
          title={align.label}
          onClick={() => update({ textAlign: align.value } as Partial<CanvasElement>)}
        >{align.icon}</button>
      ))}

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
              border: color.toLowerCase() === displayColor.toLowerCase() ? '2px solid #4A90D9' : '1px solid #e9ecef',
              boxSizing: 'border-box' as const,
            }}
            onMouseDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleColor(color);
            }}
          />
        ))}
        <div style={{ ...styles.colorWrap, width: 18, height: 18 }} title="Custom Color">
          <span style={{ ...styles.colorPreview, backgroundColor: displayColor }} />
          <input
            type="color"
            value={displayColor}
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
    gap: 4,
    padding: '6px 16px',
    backgroundColor: '#ffffff',
    borderBottom: '1px solid #f8f9fa',
    flexWrap: 'wrap',
    flexShrink: 0,
  },
  divider: {
    width: 1,
    height: 22,
    backgroundColor: '#e9ecef',
    margin: '0 3px',
    flexShrink: 0,
  },
  select: {
    height: 28,
    border: '1px solid #e9ecef',
    borderRadius: 4,
    backgroundColor: '#f1f3f5',
    color: '#212529',
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
    color: '#212529',
    fontSize: 14,
    cursor: 'pointer',
    fontFamily: 'Georgia, serif',
    padding: 0,
    lineHeight: 1,
  },
  btnActive: {
    backgroundColor: '#e9ecef',
    color: '#4A90D9',
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
    color: '#212529',
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
    border: '1px solid #e9ecef',
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
    color: '#adb5bd',
    fontSize: 10,
    fontWeight: 600,
    userSelect: 'none',
  },
  miniInput: {
    height: 24,
    border: '1px solid #e9ecef',
    borderRadius: 4,
    backgroundColor: '#f1f3f5',
    color: '#212529',
    fontSize: 11,
    padding: '0 4px',
    outline: 'none',
  },
};
