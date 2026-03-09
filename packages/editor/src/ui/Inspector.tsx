import React, { useCallback } from 'react';
import { useSelection, useElements, usePages } from '@reactcanvas/react';
import type { CanvasElement, ShapeElement, ChartElement, KPIElement, TableElement, ProgressElement, EmbedElement } from '@reactcanvas/core';
import { ColorPicker } from './ColorPicker';

export function Inspector() {
  const { selectedElements, hasSelection, selectionCount } = useSelection();
  const { updateElement, updateElements } = useElements();
  const { activePage, updatePage } = usePages();

  if (!hasSelection) {
    return <PageInspector />;
  }

  const element = selectedElements[0];
  if (!element) return null;

  return (
    <div style={styles.inspector}>
      <div style={styles.sectionHeader}>Properties</div>

      {/* Alignment tools — show when multiple elements selected */}
      {selectionCount >= 2 && (
        <AlignmentTools elements={selectedElements} updateElements={updateElements} />
      )}

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
        <PropertyRow label="Flip">
          <div style={{ display: 'flex', gap: 4 }}>
            <button
              style={{
                ...styles.flipBtn,
                ...(element.flipX ? styles.flipBtnActive : {}),
              }}
              onClick={() => updateElement(element.id, { flipX: !element.flipX } as Partial<CanvasElement>)}
              title="Flip Horizontal"
            >
              {'\u2194'}
            </button>
            <button
              style={{
                ...styles.flipBtn,
                ...(element.flipY ? styles.flipBtnActive : {}),
              }}
              onClick={() => updateElement(element.id, { flipY: !element.flipY } as Partial<CanvasElement>)}
              title="Flip Vertical"
            >
              {'\u2195'}
            </button>
          </div>
        </PropertyRow>
      </PropertyGroup>

      {/* Type-specific properties — registry pattern for extensibility */}
      <TypeSpecificInspector element={element} />

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

// Registry pattern: maps element types to their inspector components
const INSPECTOR_REGISTRY: Record<string, React.FC<{ element: any }>> = {
  shape: ({ element }) => <ShapeInspector element={element as ShapeElement} />,
  chart: ({ element }) => <ChartInspector element={element as ChartElement} />,
  kpi: ({ element }) => <KPIInspector element={element as KPIElement} />,
  table: ({ element }) => <TableInspector element={element as TableElement} />,
  progress: ({ element }) => <ProgressInspector element={element as ProgressElement} />,
  embed: ({ element }) => <EmbedInspector element={element as EmbedElement} />,
};

function TypeSpecificInspector({ element }: { element: CanvasElement }) {
  const Inspector = INSPECTOR_REGISTRY[element.type];
  return Inspector ? <Inspector element={element} /> : null;
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
        <ColorPicker
          color={activePage.backgroundColor}
          label="Color"
          onChange={(c) =>
            updatePage(activePageId, (p) => {
              p.backgroundColor = c;
            })
          }
        />
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
        <ColorPicker
          color={fillColor}
          label="Color"
          onChange={(c) =>
            updateElement(element.id, {
              fill: { type: 'solid', color: c },
            } as Partial<CanvasElement>)
          }
        />
      </PropertyGroup>

      <PropertyGroup label="Stroke">
        <ColorPicker
          color={element.stroke.color}
          label="Color"
          onChange={(c) =>
            updateElement(element.id, {
              stroke: { ...element.stroke, color: c },
            } as Partial<CanvasElement>)
          }
        />
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

function ChartInspector({ element }: { element: ChartElement }) {
  const { updateElement } = useElements();
  return (
    <>
      <PropertyGroup label="Chart">
        <PropertyRow label="Type">
          <select
            value={element.chartType}
            onChange={(e) => updateElement(element.id, { chartType: e.target.value } as Partial<CanvasElement>)}
            style={styles.select}
          >
            <option value="bar">Bar</option>
            <option value="line">Line</option>
            <option value="area">Area</option>
            <option value="pie">Pie</option>
            <option value="donut">Donut</option>
          </select>
        </PropertyRow>
        <PropertyRow label="Title">
          <input
            type="text"
            value={element.title}
            onChange={(e) => updateElement(element.id, { title: e.target.value } as Partial<CanvasElement>)}
            style={styles.numberInput}
          />
        </PropertyRow>
        <PropertyRow label="Labels">
          <input
            type="checkbox"
            checked={element.showLabels}
            onChange={(e) => updateElement(element.id, { showLabels: e.target.checked } as Partial<CanvasElement>)}
          />
        </PropertyRow>
        <PropertyRow label="Grid">
          <input
            type="checkbox"
            checked={element.showGrid}
            onChange={(e) => updateElement(element.id, { showGrid: e.target.checked } as Partial<CanvasElement>)}
          />
        </PropertyRow>
      </PropertyGroup>
      <PropertyGroup label="Background">
        <ColorPicker
          color={element.backgroundColor}
          label="Color"
          onChange={(c) => updateElement(element.id, { backgroundColor: c } as Partial<CanvasElement>)}
        />
        <PropertyRow label="Radius">
          <NumberInput
            value={element.borderRadius}
            onChange={(v) => updateElement(element.id, { borderRadius: v } as Partial<CanvasElement>)}
            min={0}
            max={50}
          />
        </PropertyRow>
      </PropertyGroup>
    </>
  );
}

function KPIInspector({ element }: { element: KPIElement }) {
  const { updateElement } = useElements();
  return (
    <>
      <PropertyGroup label="KPI Data">
        <PropertyRow label="Value">
          <input
            type="text"
            value={element.value}
            onChange={(e) => updateElement(element.id, { value: e.target.value } as Partial<CanvasElement>)}
            style={styles.numberInput}
          />
        </PropertyRow>
        <PropertyRow label="Label">
          <input
            type="text"
            value={element.label}
            onChange={(e) => updateElement(element.id, { label: e.target.value } as Partial<CanvasElement>)}
            style={styles.numberInput}
          />
        </PropertyRow>
        <PropertyRow label="Prefix">
          <input
            type="text"
            value={element.prefix}
            onChange={(e) => updateElement(element.id, { prefix: e.target.value } as Partial<CanvasElement>)}
            style={styles.numberInput}
          />
        </PropertyRow>
        <PropertyRow label="Suffix">
          <input
            type="text"
            value={element.suffix}
            onChange={(e) => updateElement(element.id, { suffix: e.target.value } as Partial<CanvasElement>)}
            style={styles.numberInput}
          />
        </PropertyRow>
        <PropertyRow label="Trend">
          <select
            value={element.trend}
            onChange={(e) => updateElement(element.id, { trend: e.target.value } as Partial<CanvasElement>)}
            style={styles.select}
          >
            <option value="up">Up</option>
            <option value="down">Down</option>
            <option value="neutral">Neutral</option>
          </select>
        </PropertyRow>
        <PropertyRow label="Trend Val">
          <input
            type="text"
            value={element.trendValue}
            onChange={(e) => updateElement(element.id, { trendValue: e.target.value } as Partial<CanvasElement>)}
            style={styles.numberInput}
          />
        </PropertyRow>
      </PropertyGroup>
      <PropertyGroup label="Colors">
        <ColorPicker color={element.backgroundColor} label="Bg" onChange={(c) => updateElement(element.id, { backgroundColor: c } as Partial<CanvasElement>)} />
        <ColorPicker color={element.valueColor} label="Value" onChange={(c) => updateElement(element.id, { valueColor: c } as Partial<CanvasElement>)} />
        <ColorPicker color={element.labelColor} label="Label" onChange={(c) => updateElement(element.id, { labelColor: c } as Partial<CanvasElement>)} />
      </PropertyGroup>
    </>
  );
}

function TableInspector({ element }: { element: TableElement }) {
  const { updateElement } = useElements();
  return (
    <>
      <PropertyGroup label="Table Style">
        <PropertyRow label="Font Size">
          <NumberInput
            value={element.fontSize}
            onChange={(v) => updateElement(element.id, { fontSize: v } as Partial<CanvasElement>)}
            min={8}
            max={24}
          />
        </PropertyRow>
        <PropertyRow label="Radius">
          <NumberInput
            value={element.borderRadius}
            onChange={(v) => updateElement(element.id, { borderRadius: v } as Partial<CanvasElement>)}
            min={0}
            max={50}
          />
        </PropertyRow>
        <ColorPicker color={element.headerBg} label="Header Bg" onChange={(c) => updateElement(element.id, { headerBg: c } as Partial<CanvasElement>)} />
        <ColorPicker color={element.headerColor} label="Header Txt" onChange={(c) => updateElement(element.id, { headerColor: c } as Partial<CanvasElement>)} />
        <ColorPicker color={element.rowBg} label="Row Bg" onChange={(c) => updateElement(element.id, { rowBg: c } as Partial<CanvasElement>)} />
        <ColorPicker color={element.altRowBg} label="Alt Row" onChange={(c) => updateElement(element.id, { altRowBg: c } as Partial<CanvasElement>)} />
      </PropertyGroup>
    </>
  );
}

function ProgressInspector({ element }: { element: ProgressElement }) {
  const { updateElement } = useElements();
  return (
    <>
      <PropertyGroup label="Progress">
        <PropertyRow label="Style">
          <select
            value={element.progressStyle}
            onChange={(e) => updateElement(element.id, { progressStyle: e.target.value } as Partial<CanvasElement>)}
            style={styles.select}
          >
            <option value="bar">Bar</option>
            <option value="circle">Circle</option>
            <option value="semicircle">Semicircle</option>
          </select>
        </PropertyRow>
        <PropertyRow label="Value">
          <NumberInput
            value={element.value}
            onChange={(v) => updateElement(element.id, { value: v } as Partial<CanvasElement>)}
            min={0}
            max={element.maxValue}
          />
        </PropertyRow>
        <PropertyRow label="Max">
          <NumberInput
            value={element.maxValue}
            onChange={(v) => updateElement(element.id, { maxValue: v } as Partial<CanvasElement>)}
            min={1}
          />
        </PropertyRow>
        <PropertyRow label="Label">
          <input
            type="text"
            value={element.label}
            onChange={(e) => updateElement(element.id, { label: e.target.value } as Partial<CanvasElement>)}
            style={styles.numberInput}
          />
        </PropertyRow>
        <PropertyRow label="Show %">
          <input
            type="checkbox"
            checked={element.showValue}
            onChange={(e) => updateElement(element.id, { showValue: e.target.checked } as Partial<CanvasElement>)}
          />
        </PropertyRow>
        <PropertyRow label="Thickness">
          <NumberInput
            value={element.thickness}
            onChange={(v) => updateElement(element.id, { thickness: v } as Partial<CanvasElement>)}
            min={2}
            max={30}
          />
        </PropertyRow>
      </PropertyGroup>
      <PropertyGroup label="Colors">
        <ColorPicker color={element.fillColor} label="Fill" onChange={(c) => updateElement(element.id, { fillColor: c } as Partial<CanvasElement>)} />
        <ColorPicker color={element.trackColor} label="Track" onChange={(c) => updateElement(element.id, { trackColor: c } as Partial<CanvasElement>)} />
        <ColorPicker color={element.backgroundColor} label="Bg" onChange={(c) => updateElement(element.id, { backgroundColor: c } as Partial<CanvasElement>)} />
      </PropertyGroup>
    </>
  );
}

function EmbedInspector({ element }: { element: EmbedElement }) {
  const { updateElement } = useElements();
  return (
    <>
      <PropertyGroup label="Embed">
        <PropertyRow label="Type">
          <select
            value={element.embedType}
            onChange={(e) => updateElement(element.id, { embedType: e.target.value } as Partial<CanvasElement>)}
            style={styles.select}
          >
            <option value="website">Website</option>
            <option value="video">Video</option>
            <option value="map">Map</option>
          </select>
        </PropertyRow>
        <PropertyRow label="URL">
          <input
            type="text"
            value={element.url}
            onChange={(e) => updateElement(element.id, { url: e.target.value } as Partial<CanvasElement>)}
            style={styles.numberInput}
            placeholder="https://..."
          />
        </PropertyRow>
        <PropertyRow label="Radius">
          <NumberInput
            value={element.borderRadius}
            onChange={(v) => updateElement(element.id, { borderRadius: v } as Partial<CanvasElement>)}
            min={0}
            max={50}
          />
        </PropertyRow>
        <PropertyRow label="Border">
          <input
            type="checkbox"
            checked={element.showBorder}
            onChange={(e) => updateElement(element.id, { showBorder: e.target.checked } as Partial<CanvasElement>)}
          />
        </PropertyRow>
      </PropertyGroup>
    </>
  );
}

const styles: Record<string, React.CSSProperties> = {
  inspector: {
    width: 280,
    backgroundColor: '#16161e',
    borderLeft: '1px solid #1e1e2e',
    overflow: 'auto',
    height: '100%',
  },
  sectionHeader: {
    padding: '14px 16px 10px',
    color: '#cdd6f4',
    fontSize: 13,
    fontWeight: 600,
    borderBottom: '1px solid #1e1e2e',
  },
  propertyGroup: {
    padding: '12px 16px',
    borderBottom: '1px solid #1e1e2e',
  },
  groupLabel: {
    color: '#585878',
    fontSize: 10,
    fontWeight: 700,
    textTransform: 'uppercase' as const,
    letterSpacing: '1px',
    marginBottom: 10,
  },
  propertyRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
    gap: 8,
  },
  propertyLabel: {
    color: '#585878',
    fontSize: 11,
    fontWeight: 500,
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
    height: 30,
    border: '1px solid #2a2a3a',
    borderRadius: 8,
    backgroundColor: '#1e1e2e',
    color: '#cdd6f4',
    fontSize: 12,
    padding: '0 10px',
    outline: 'none',
    transition: 'border-color 0.12s',
    boxSizing: 'border-box' as const,
  },
  flipBtn: {
    width: 30,
    height: 26,
    border: '1px solid #2a2a3a',
    borderRadius: 6,
    backgroundColor: '#1e1e2e',
    color: '#8888a8',
    fontSize: 14,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 0,
  },
  flipBtnActive: {
    backgroundColor: '#2a2a44',
    color: '#89b4fa',
    borderColor: '#89b4fa',
  },
  colorInput: {
    width: 34,
    height: 30,
    border: '1px solid #2a2a3a',
    borderRadius: 8,
    backgroundColor: '#1e1e2e',
    cursor: 'pointer',
    padding: 3,
  },
  select: {
    width: '100%',
    height: 30,
    border: '1px solid #2a2a3a',
    borderRadius: 8,
    backgroundColor: '#1e1e2e',
    color: '#cdd6f4',
    fontSize: 12,
    padding: '0 8px',
    outline: 'none',
    boxSizing: 'border-box' as const,
  },
  slider: {
    flex: 1,
    accentColor: '#89b4fa',
  },
  sliderValue: {
    color: '#585878',
    fontSize: 11,
    fontWeight: 500,
    minWidth: 30,
    textAlign: 'right' as const,
  },
};

// Alignment tools for multi-select
function AlignmentTools({ elements, updateElements }: {
  elements: CanvasElement[];
  updateElements: (updates: Array<{ id: string; changes: Partial<CanvasElement> }>) => void;
}) {
  const alignLeft = () => {
    const minX = Math.min(...elements.map((e) => e.x));
    updateElements(elements.map((el) => ({ id: el.id, changes: { x: minX } as Partial<CanvasElement> })));
  };
  const alignCenterH = () => {
    const minX = Math.min(...elements.map((e) => e.x));
    const maxX = Math.max(...elements.map((e) => e.x + e.width));
    const center = (minX + maxX) / 2;
    updateElements(elements.map((el) => ({ id: el.id, changes: { x: center - el.width / 2 } as Partial<CanvasElement> })));
  };
  const alignRight = () => {
    const maxX = Math.max(...elements.map((e) => e.x + e.width));
    updateElements(elements.map((el) => ({ id: el.id, changes: { x: maxX - el.width } as Partial<CanvasElement> })));
  };
  const alignTop = () => {
    const minY = Math.min(...elements.map((e) => e.y));
    updateElements(elements.map((el) => ({ id: el.id, changes: { y: minY } as Partial<CanvasElement> })));
  };
  const alignMiddle = () => {
    const minY = Math.min(...elements.map((e) => e.y));
    const maxY = Math.max(...elements.map((e) => e.y + e.height));
    const center = (minY + maxY) / 2;
    updateElements(elements.map((el) => ({ id: el.id, changes: { y: center - el.height / 2 } as Partial<CanvasElement> })));
  };
  const alignBottom = () => {
    const maxY = Math.max(...elements.map((e) => e.y + e.height));
    updateElements(elements.map((el) => ({ id: el.id, changes: { y: maxY - el.height } as Partial<CanvasElement> })));
  };
  const distributeH = () => {
    if (elements.length < 3) return;
    const sorted = [...elements].sort((a, b) => a.x - b.x);
    const first = sorted[0], last = sorted[sorted.length - 1];
    const totalSpace = (last.x + last.width) - first.x;
    const totalWidth = sorted.reduce((s, e) => s + e.width, 0);
    const gap = (totalSpace - totalWidth) / (sorted.length - 1);
    const updates: Array<{ id: string; changes: Partial<CanvasElement> }> = [];
    let cx = first.x + first.width + gap;
    for (let i = 1; i < sorted.length - 1; i++) {
      updates.push({ id: sorted[i].id, changes: { x: cx } as Partial<CanvasElement> });
      cx += sorted[i].width + gap;
    }
    updateElements(updates);
  };
  const distributeV = () => {
    if (elements.length < 3) return;
    const sorted = [...elements].sort((a, b) => a.y - b.y);
    const first = sorted[0], last = sorted[sorted.length - 1];
    const totalSpace = (last.y + last.height) - first.y;
    const totalHeight = sorted.reduce((s, e) => s + e.height, 0);
    const gap = (totalSpace - totalHeight) / (sorted.length - 1);
    const updates: Array<{ id: string; changes: Partial<CanvasElement> }> = [];
    let cy = first.y + first.height + gap;
    for (let i = 1; i < sorted.length - 1; i++) {
      updates.push({ id: sorted[i].id, changes: { y: cy } as Partial<CanvasElement> });
      cy += sorted[i].height + gap;
    }
    updateElements(updates);
  };

  const btnStyle: React.CSSProperties = {
    width: 30,
    height: 28,
    border: '1px solid #2a2a3a',
    borderRadius: 6,
    backgroundColor: '#1e1e2e',
    color: '#8888a8',
    fontSize: 13,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 0,
  };

  return (
    <div style={{ padding: '0 14px 10px' }}>
      <div style={{ color: '#585878', fontSize: 10, fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '1px', marginBottom: 6 }}>
        Align
      </div>
      <div style={{ display: 'flex', gap: 4, marginBottom: 6 }}>
        <button style={btnStyle} onClick={alignLeft} title="Align Left">{'\u258C'}</button>
        <button style={btnStyle} onClick={alignCenterH} title="Align Center H">{'\u2503'}</button>
        <button style={btnStyle} onClick={alignRight} title="Align Right">{'\u2590'}</button>
        <button style={btnStyle} onClick={alignTop} title="Align Top">{'\u2580'}</button>
        <button style={btnStyle} onClick={alignMiddle} title="Align Middle">{'\u2501'}</button>
        <button style={btnStyle} onClick={alignBottom} title="Align Bottom">{'\u2584'}</button>
      </div>
      {elements.length >= 3 && (
        <div style={{ display: 'flex', gap: 4 }}>
          <button style={{ ...btnStyle, flex: 1, fontSize: 10, width: 'auto' }} onClick={distributeH} title="Distribute Horizontally">
            Distribute H
          </button>
          <button style={{ ...btnStyle, flex: 1, fontSize: 10, width: 'auto' }} onClick={distributeV} title="Distribute Vertically">
            Distribute V
          </button>
        </div>
      )}
    </div>
  );
}
