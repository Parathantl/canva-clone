import React, { useCallback } from 'react';
import { useSelection, useElements, usePages } from '@reactcanvas/react';
import type { CanvasElement, ShapeElement } from '@reactcanvas/core';

export function Inspector() {
  const { selectedElements, hasSelection } = useSelection();
  const { updateElement } = useElements();
  const { activePage, updatePage } = usePages();

  if (!hasSelection) {
    return <PageInspector />;
  }

  const element = selectedElements[0];
  if (!element) return null;

  return (
    <div style={styles.inspector}>
      <div style={styles.sectionHeader}>Properties</div>

      {/* Common properties */}
      <PropertyGroup label="Position & Size">
        <PropertyRow label="X">
          <NumberInput
            value={Math.round(element.x)}
            onChange={(v) => updateElement(element.id, { x: v } as Partial<CanvasElement>)}
          />
        </PropertyRow>
        <PropertyRow label="Y">
          <NumberInput
            value={Math.round(element.y)}
            onChange={(v) => updateElement(element.id, { y: v } as Partial<CanvasElement>)}
          />
        </PropertyRow>
        <PropertyRow label="W">
          <NumberInput
            value={Math.round(element.width)}
            onChange={(v) => updateElement(element.id, { width: v } as Partial<CanvasElement>)}
            min={1}
          />
        </PropertyRow>
        <PropertyRow label="H">
          <NumberInput
            value={Math.round(element.height)}
            onChange={(v) => updateElement(element.id, { height: v } as Partial<CanvasElement>)}
            min={1}
          />
        </PropertyRow>
        <PropertyRow label="Rotation">
          <NumberInput
            value={Math.round(element.rotation)}
            onChange={(v) => updateElement(element.id, { rotation: v } as Partial<CanvasElement>)}
            min={-360}
            max={360}
          />
        </PropertyRow>
      </PropertyGroup>

      <PropertyGroup label="Appearance">
        <PropertyRow label="Opacity">
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={element.opacity}
            onChange={(e) =>
              updateElement(element.id, {
                opacity: parseFloat(e.target.value),
              } as Partial<CanvasElement>)
            }
            style={styles.slider}
          />
          <span style={styles.sliderValue}>{Math.round(element.opacity * 100)}%</span>
        </PropertyRow>
      </PropertyGroup>

      {/* Shape-specific properties */}
      {element.type === 'shape' && <ShapeInspector element={element as ShapeElement} />}

      {/* Text formatting is handled by the floating TextToolbar */}

      {/* Element actions */}
      <PropertyGroup label="Actions">
        <PropertyRow label="Locked">
          <input
            type="checkbox"
            checked={element.locked}
            onChange={(e) =>
              updateElement(element.id, {
                locked: e.target.checked,
              } as Partial<CanvasElement>)
            }
          />
        </PropertyRow>
        <PropertyRow label="Visible">
          <input
            type="checkbox"
            checked={element.visible}
            onChange={(e) =>
              updateElement(element.id, {
                visible: e.target.checked,
              } as Partial<CanvasElement>)
            }
          />
        </PropertyRow>
      </PropertyGroup>
    </div>
  );
}

function PageInspector() {
  const { activePage, activePageId, updatePage } = usePages();

  if (!activePage) return null;

  return (
    <div style={styles.inspector}>
      <div style={styles.sectionHeader}>Page Properties</div>

      <PropertyGroup label="Dimensions">
        <PropertyRow label="Width">
          <NumberInput
            value={activePage.width}
            onChange={(v) =>
              updatePage(activePageId, (p) => {
                p.width = v;
              })
            }
            min={100}
            max={10000}
          />
        </PropertyRow>
        <PropertyRow label="Height">
          <NumberInput
            value={activePage.height}
            onChange={(v) =>
              updatePage(activePageId, (p) => {
                p.height = v;
              })
            }
            min={100}
            max={10000}
          />
        </PropertyRow>
      </PropertyGroup>

      <PropertyGroup label="Background">
        <PropertyRow label="Color">
          <input
            type="color"
            value={activePage.backgroundColor}
            onChange={(e) =>
              updatePage(activePageId, (p) => {
                p.backgroundColor = e.target.value;
              })
            }
            style={styles.colorInput}
          />
        </PropertyRow>
      </PropertyGroup>
    </div>
  );
}

function ShapeInspector({ element }: { element: ShapeElement }) {
  const { updateElement } = useElements();

  const fillColor = element.fill.type === 'solid' ? element.fill.color : '#cccccc';

  return (
    <>
      <PropertyGroup label="Fill">
        <PropertyRow label="Color">
          <input
            type="color"
            value={fillColor}
            onChange={(e) =>
              updateElement(element.id, {
                fill: { type: 'solid', color: e.target.value },
              } as Partial<CanvasElement>)
            }
            style={styles.colorInput}
          />
        </PropertyRow>
      </PropertyGroup>

      <PropertyGroup label="Stroke">
        <PropertyRow label="Color">
          <input
            type="color"
            value={element.stroke.color}
            onChange={(e) =>
              updateElement(element.id, {
                stroke: { ...element.stroke, color: e.target.value },
              } as Partial<CanvasElement>)
            }
            style={styles.colorInput}
          />
        </PropertyRow>
        <PropertyRow label="Width">
          <NumberInput
            value={element.stroke.width}
            onChange={(v) =>
              updateElement(element.id, {
                stroke: { ...element.stroke, width: v },
              } as Partial<CanvasElement>)
            }
            min={0}
            max={20}
          />
        </PropertyRow>
      </PropertyGroup>

      {element.shapeType === 'rectangle' && (
        <PropertyGroup label="Corner Radius">
          <PropertyRow label="Radius">
            <NumberInput
              value={typeof element.cornerRadius === 'number' ? element.cornerRadius : 0}
              onChange={(v) =>
                updateElement(element.id, {
                  cornerRadius: v,
                } as Partial<CanvasElement>)
              }
              min={0}
              max={200}
            />
          </PropertyRow>
        </PropertyGroup>
      )}
    </>
  );
}


function PropertyGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={styles.propertyGroup}>
      <div style={styles.groupLabel}>{label}</div>
      {children}
    </div>
  );
}

function PropertyRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={styles.propertyRow}>
      <span style={styles.propertyLabel}>{label}</span>
      <div style={styles.propertyValue}>{children}</div>
    </div>
  );
}

function NumberInput({
  value,
  onChange,
  min,
  max,
  step = 1,
}: {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  step?: number;
}) {
  return (
    <input
      type="number"
      value={value}
      onChange={(e) => {
        const v = parseFloat(e.target.value);
        if (!isNaN(v)) onChange(v);
      }}
      min={min}
      max={max}
      step={step}
      style={styles.numberInput}
    />
  );
}

const styles: Record<string, React.CSSProperties> = {
  inspector: {
    width: 260,
    backgroundColor: '#1e1e2e',
    borderLeft: '1px solid #313244',
    overflow: 'auto',
    height: '100%',
  },
  sectionHeader: {
    padding: '12px 16px',
    color: '#a6adc8',
    fontSize: 11,
    fontWeight: 600,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px',
    borderBottom: '1px solid #313244',
  },
  propertyGroup: {
    padding: '12px 16px',
    borderBottom: '1px solid #313244',
  },
  groupLabel: {
    color: '#a6adc8',
    fontSize: 11,
    fontWeight: 600,
    marginBottom: 8,
  },
  propertyRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
    gap: 8,
  },
  propertyLabel: {
    color: '#6c7086',
    fontSize: 12,
    minWidth: 60,
  },
  propertyValue: {
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    flex: 1,
  },
  numberInput: {
    width: '100%',
    height: 28,
    border: '1px solid #45475a',
    borderRadius: 4,
    backgroundColor: '#313244',
    color: '#cdd6f4',
    fontSize: 12,
    padding: '0 8px',
    outline: 'none',
  },
  colorInput: {
    width: 32,
    height: 28,
    border: '1px solid #45475a',
    borderRadius: 4,
    backgroundColor: '#313244',
    cursor: 'pointer',
    padding: 2,
  },
  select: {
    width: '100%',
    height: 28,
    border: '1px solid #45475a',
    borderRadius: 4,
    backgroundColor: '#313244',
    color: '#cdd6f4',
    fontSize: 12,
    padding: '0 4px',
    outline: 'none',
  },
  slider: {
    flex: 1,
    accentColor: '#89b4fa',
  },
  sliderValue: {
    color: '#6c7086',
    fontSize: 11,
    minWidth: 30,
    textAlign: 'right' as const,
  },
};
