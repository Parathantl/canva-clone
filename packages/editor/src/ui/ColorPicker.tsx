import React, { useState, useCallback, useRef, useEffect } from 'react';

const PRESET_COLORS = [
  '#ef4444', '#f97316', '#eab308', '#22c55e', '#06b6d4',
  '#3b82f6', '#8b5cf6', '#ec4899', '#f43f5e', '#14b8a6',
  '#ffffff', '#d4d4d8', '#a1a1aa', '#71717a', '#52525b',
  '#3f3f46', '#27272a', '#18181b', '#000000', 'transparent',
];

const MAX_RECENT = 8;
let recentColors: string[] = [];

function addRecentColor(color: string) {
  if (color === 'transparent' || !color) return;
  recentColors = [color, ...recentColors.filter((c) => c.toLowerCase() !== color.toLowerCase())].slice(0, MAX_RECENT);
}

export function ColorPicker({
  color,
  onChange,
  label,
}: {
  color: string;
  onChange: (color: string) => void;
  label?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [hexInput, setHexInput] = useState(color);
  const [, setTick] = useState(0);
  const pickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => setHexInput(color), [color]);

  const handleColorChange = useCallback((c: string) => {
    onChange(c);
    addRecentColor(c);
    setTick((t) => t + 1); // Force re-render so other pickers see the new color
  }, [onChange]);

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [isOpen]);

  const handleHexChange = useCallback((val: string) => {
    setHexInput(val);
    if (/^#[0-9a-fA-F]{6}$/.test(val) || val === 'transparent') {
      handleColorChange(val);
    }
  }, [handleColorChange]);

  const handleNativeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    handleColorChange(e.target.value);
    setHexInput(e.target.value);
  }, [handleColorChange]);

  return (
    <div ref={pickerRef} style={{ position: 'relative' }}>
      <div style={styles.trigger}>
        {label && <span style={styles.label}>{label}</span>}
        <button
          onClick={() => setIsOpen(!isOpen)}
          style={styles.swatchBtn}
        >
          <div style={{
            ...styles.swatch,
            backgroundColor: color === 'transparent' ? undefined : color,
            backgroundImage: color === 'transparent'
              ? 'linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%)'
              : undefined,
            backgroundSize: '8px 8px',
            backgroundPosition: '0 0, 0 4px, 4px -4px, -4px 0',
          }} />
        </button>
        <input
          type="text"
          value={hexInput}
          onChange={(e) => handleHexChange(e.target.value)}
          style={styles.hexInput}
          spellCheck={false}
        />
      </div>

      {isOpen && (
        <div style={styles.dropdown}>
          {/* Native color input for full picker */}
          <div style={styles.nativeRow}>
            <input
              type="color"
              value={color === 'transparent' ? '#000000' : color}
              onChange={handleNativeChange}
              style={styles.nativeInput}
            />
            <span style={styles.nativeLabel}>Custom color</span>
            {'EyeDropper' in window && (
              <button
                onClick={async () => {
                  try {
                    const eyeDropper = new (window as any).EyeDropper();
                    const result = await eyeDropper.open();
                    handleColorChange(result.sRGBHex);
                    setHexInput(result.sRGBHex);
                  } catch {
                    // User cancelled
                  }
                }}
                style={styles.eyedropperBtn}
                title="Pick color from screen"
              >
                {'\uD83D\uDCA7'}
              </button>
            )}
          </div>
          {/* Recent colors */}
          {recentColors.length > 0 && (
            <>
              <div style={styles.sectionLabel}>Recent</div>
              <div style={{ ...styles.grid, marginBottom: 8 }}>
                {recentColors.map((c) => (
                  <button
                    key={c}
                    onClick={() => { handleColorChange(c); setHexInput(c); setIsOpen(false); }}
                    title={c}
                    style={{
                      ...styles.gridSwatch,
                      backgroundColor: c,
                      outline: color.toLowerCase() === c.toLowerCase() ? '2px solid #4A90D9' : 'none',
                      outlineOffset: 1,
                    }}
                  />
                ))}
              </div>
            </>
          )}
          {/* Preset swatches */}
          <div style={styles.sectionLabel}>Presets</div>
          <div style={styles.grid}>
            {PRESET_COLORS.map((c) => (
              <button
                key={c}
                onClick={() => { handleColorChange(c); setHexInput(c); setIsOpen(false); }}
                title={c}
                style={{
                  ...styles.gridSwatch,
                  backgroundColor: c === 'transparent' ? undefined : c,
                  backgroundImage: c === 'transparent'
                    ? 'linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%)'
                    : undefined,
                  backgroundSize: '6px 6px',
                  backgroundPosition: '0 0, 0 3px, 3px -3px, -3px 0',
                  outline: color === c ? '2px solid #4A90D9' : 'none',
                  outlineOffset: 1,
                }}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  trigger: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
  },
  label: {
    color: '#495057',
    fontSize: 11,
    fontWeight: 500,
    minWidth: 40,
  },
  swatchBtn: {
    width: 24,
    height: 24,
    border: '1px solid #dee2e6',
    borderRadius: 6,
    padding: 2,
    backgroundColor: '#f8f9fa',
    cursor: 'pointer',
    flexShrink: 0,
  },
  swatch: {
    width: '100%',
    height: '100%',
    borderRadius: 4,
  },
  hexInput: {
    flex: 1,
    height: 24,
    border: '1px solid #dee2e6',
    borderRadius: 6,
    backgroundColor: '#f8f9fa',
    color: '#212529',
    fontSize: 11,
    fontFamily: 'JetBrains Mono, monospace',
    padding: '0 6px',
    outline: 'none',
    minWidth: 0,
  },
  dropdown: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    marginTop: 4,
    backgroundColor: '#f8f9fa',
    border: '1px solid #f1f3f5',
    borderRadius: 10,
    padding: 8,
    zIndex: 100,
    boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
  },
  nativeRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
    paddingBottom: 8,
    borderBottom: '1px solid #f1f3f5',
  },
  nativeInput: {
    width: 32,
    height: 24,
    border: 'none',
    borderRadius: 4,
    padding: 0,
    cursor: 'pointer',
    backgroundColor: 'transparent',
  },
  nativeLabel: {
    color: '#495057',
    fontSize: 11,
  },
  eyedropperBtn: {
    width: 24,
    height: 24,
    border: '1px solid #dee2e6',
    borderRadius: 6,
    backgroundColor: '#f8f9fa',
    color: '#495057',
    fontSize: 12,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 0,
    marginLeft: 'auto',
  },
  sectionLabel: {
    color: '#868e96',
    fontSize: 9,
    fontWeight: 700,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px',
    marginBottom: 4,
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(5, 1fr)',
    gap: 4,
  },
  gridSwatch: {
    width: '100%',
    aspectRatio: '1',
    border: '1px solid #dee2e6',
    borderRadius: 4,
    cursor: 'pointer',
    padding: 0,
  },
};
