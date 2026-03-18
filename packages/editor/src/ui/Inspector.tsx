import React, { useCallback, useState } from 'react';
import { useSelection, useElements, usePages, useDataSources } from '@reactcanvas/react';
import type { CanvasElement, ShapeElement, LineElement, ChartElement, KPIElement, TableElement, ProgressElement, EmbedElement, ImageElement, Fill, Shadow } from '@reactcanvas/core';
import { isSolidFill, isLinearGradient, isRadialGradient, isGradientFill } from '@reactcanvas/core';
import { FILTER_PRESETS, applyFilterPreset } from '@reactcanvas/images';
import { ColorPicker } from './ColorPicker';

const DEFAULT_SHADOW: Shadow = { color: 'rgba(0,0,0,0.3)', blur: 10, offsetX: 0, offsetY: 4, spread: 0 };

export function Inspector() {
  const { selectedElements, hasSelection, selectionCount } = useSelection();
  const { updateElement, updateElements } = useElements();
  const { activePage } = usePages();

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

      {activePage && (
        <PropertyGroup label="Page Alignment">
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            <PageAlignButton
              label="Center H"
              icon={'\u2503'}
              onClick={() => updateElement(element.id, {
                x: (activePage.width - element.width) / 2,
              } as Partial<CanvasElement>)}
            />
            <PageAlignButton
              label="Center V"
              icon={'\u2501'}
              onClick={() => updateElement(element.id, {
                y: (activePage.height - element.height) / 2,
              } as Partial<CanvasElement>)}
            />
            <PageAlignButton
              label="Center"
              icon={'\u29BE'}
              onClick={() => updateElement(element.id, {
                x: (activePage.width - element.width) / 2,
                y: (activePage.height - element.height) / 2,
              } as Partial<CanvasElement>)}
            />
            <PageAlignButton
              label="Left"
              icon={'\u258C'}
              onClick={() => updateElement(element.id, { x: 0 } as Partial<CanvasElement>)}
            />
            <PageAlignButton
              label="Right"
              icon={'\u2590'}
              onClick={() => updateElement(element.id, {
                x: activePage.width - element.width,
              } as Partial<CanvasElement>)}
            />
            <PageAlignButton
              label="Top"
              icon={'\u2580'}
              onClick={() => updateElement(element.id, { y: 0 } as Partial<CanvasElement>)}
            />
            <PageAlignButton
              label="Bottom"
              icon={'\u2584'}
              onClick={() => updateElement(element.id, {
                y: activePage.height - element.height,
              } as Partial<CanvasElement>)}
            />
          </div>
        </PropertyGroup>
      )}

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
  shape: ShapeInspector as React.FC<{ element: any }>,
  chart: ChartInspector as React.FC<{ element: any }>,
  kpi: KPIInspector as React.FC<{ element: any }>,
  table: TableInspector as React.FC<{ element: any }>,
  progress: ProgressInspector as React.FC<{ element: any }>,
  embed: EmbedInspector as React.FC<{ element: any }>,
  image: ImageInspector as React.FC<{ element: any }>,
  line: LineInspector as React.FC<{ element: any }>,
  filterControl: FilterControlInspector as React.FC<{ element: any }>,
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

function GradientStopEditor({ stops, labels, onColorChange, onOffsetChange }: {
  stops: Array<{ offset: number; color: string }>;
  labels: [string, string];
  onColorChange: (index: number, color: string) => void;
  onOffsetChange: (index: number, offset: number) => void;
}) {
  return (
    <>
      {stops.map((stop, i) => (
        <div key={i} style={{ marginBottom: 6 }}>
          <PropertyRow label={labels[i] ?? `Stop ${i}`}>
            <input
              type="color"
              value={stop.color}
              onChange={(e) => onColorChange(i, e.target.value)}
              style={styles.colorInput}
            />
            <NumberInput
              value={Math.round(stop.offset * 100)}
              onChange={(v) => onOffsetChange(i, v / 100)}
              min={0}
              max={100}
            />
            <span style={styles.sliderValue}>%</span>
          </PropertyRow>
        </div>
      ))}
    </>
  );
}

function StrokeEditor({ element, minWidth = 0 }: { element: { id: string; stroke: { color: string; width: number; dashPattern?: number[] } }; minWidth?: number }) {
  const { updateElement } = useElements();
  return (
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
          min={minWidth}
          max={20}
        />
      </PropertyRow>
    </PropertyGroup>
  );
}

function ShapeInspector({ element }: { element: ShapeElement }) {
  const { updateElement } = useElements();

  const fillType = element.fill.type;
  const fillColor = isSolidFill(element.fill) ? element.fill.color : '#cccccc';

  const handleFillTypeChange = (newType: string) => {
    let newFill: Fill;
    if (newType === 'solid') {
      newFill = { type: 'solid', color: '#4A90D9' };
    } else if (newType === 'linear-gradient') {
      newFill = {
        type: 'linear-gradient',
        angle: 135,
        stops: [
          { offset: 0, color: '#4A90D9' },
          { offset: 1, color: '#7c5cbf' },
        ],
      };
    } else {
      newFill = {
        type: 'radial-gradient',
        centerX: 0.5,
        centerY: 0.5,
        radius: 0.5,
        stops: [
          { offset: 0, color: '#4A90D9' },
          { offset: 1, color: '#7c5cbf' },
        ],
      };
    }
    updateElement(element.id, { fill: newFill } as Partial<CanvasElement>);
  };

  const updateGradientStopProp = (index: number, updates: Partial<{ offset: number; color: string }>) => {
    if (!isGradientFill(element.fill)) return;
    const grad = element.fill;
    const newStops = grad.stops.map((s: { offset: number; color: string }, i: number) =>
      i === index ? { ...s, ...updates } : s
    );
    updateElement(element.id, {
      fill: { ...grad, stops: newStops },
    } as Partial<CanvasElement>);
  };

  const hasShadow = !!element.shadow;
  const shadow = element.shadow ?? DEFAULT_SHADOW;

  const handleToggleShadow = (enabled: boolean) => {
    if (enabled) {
      updateElement(element.id, {
        shadow: { ...DEFAULT_SHADOW },
      } as Partial<CanvasElement>);
    } else {
      updateElement(element.id, {
        shadow: undefined,
      } as Partial<CanvasElement>);
    }
  };

  const updateShadow = (updates: Partial<Shadow>) => {
    updateElement(element.id, {
      shadow: { ...shadow, ...updates },
    } as Partial<CanvasElement>);
  };

  return (
    <>
      <PropertyGroup label="Fill">
        <PropertyRow label="Type">
          <select
            value={fillType}
            onChange={(e) => handleFillTypeChange(e.target.value)}
            style={styles.select}
          >
            <option value="solid">Solid</option>
            <option value="linear-gradient">Linear Gradient</option>
            <option value="radial-gradient">Radial Gradient</option>
          </select>
        </PropertyRow>

        {isSolidFill(element.fill) && (
          <ColorPicker
            color={fillColor}
            label="Color"
            onChange={(c) =>
              updateElement(element.id, {
                fill: { type: 'solid', color: c },
              } as Partial<CanvasElement>)
            }
          />
        )}

        {isLinearGradient(element.fill) && (() => {
          const grad = element.fill;
          return (
            <>
              <PropertyRow label="Angle">
                <NumberInput
                  value={grad.angle}
                  onChange={(v) =>
                    updateElement(element.id, {
                      fill: { ...grad, angle: v },
                    } as Partial<CanvasElement>)
                  }
                  min={0}
                  max={360}
                />
              </PropertyRow>
              <GradientStopEditor
                stops={grad.stops}
                labels={['Start', 'End']}
                onColorChange={(i, color) => updateGradientStopProp(i, { color })}
                onOffsetChange={(i, offset) => updateGradientStopProp(i, { offset })}
              />
            </>
          );
        })()}

        {isRadialGradient(element.fill) && (() => {
          const grad = element.fill;
          return (
            <GradientStopEditor
              stops={grad.stops}
              labels={['Center', 'Edge']}
              onColorChange={(i, color) => updateGradientStopProp(i, { color })}
              onOffsetChange={(i, offset) => updateGradientStopProp(i, { offset })}
            />
          );
        })()}
      </PropertyGroup>

      <StrokeEditor element={element} minWidth={0} />

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

      <PropertyGroup label="Shadow">
        <PropertyRow label="Enable">
          <input
            type="checkbox"
            checked={hasShadow}
            onChange={(e) => handleToggleShadow(e.target.checked)}
          />
        </PropertyRow>
        {hasShadow && (
          <>
            <ColorPicker
              color={shadow.color}
              label="Color"
              onChange={(c) => updateShadow({ color: c })}
            />
            <PropertyRow label="Blur">
              <NumberInput
                value={shadow.blur}
                onChange={(v) => updateShadow({ blur: v })}
                min={0}
                max={50}
              />
            </PropertyRow>
            <PropertyRow label="Offset X">
              <NumberInput
                value={shadow.offsetX}
                onChange={(v) => updateShadow({ offsetX: v })}
                min={-50}
                max={50}
              />
            </PropertyRow>
            <PropertyRow label="Offset Y">
              <NumberInput
                value={shadow.offsetY}
                onChange={(v) => updateShadow({ offsetY: v })}
                min={-50}
                max={50}
              />
            </PropertyRow>
            <PropertyRow label="Spread">
              <NumberInput
                value={shadow.spread}
                onChange={(v) => updateShadow({ spread: v })}
                min={-20}
                max={20}
              />
            </PropertyRow>
          </>
        )}
      </PropertyGroup>
    </>
  );
}


function LineInspector({ element }: { element: LineElement }) {
  const { updateElement } = useElements();

  return (
    <>
      <StrokeEditor element={element} minWidth={1} />

      <PropertyGroup label="Line Style">
        <PropertyRow label="Type">
          <select
            value={element.lineType}
            onChange={(e) =>
              updateElement(element.id, {
                lineType: e.target.value,
              } as Partial<CanvasElement>)
            }
            style={styles.select}
          >
            <option value="straight">Straight</option>
            <option value="curved">Curved</option>
          </select>
        </PropertyRow>
      </PropertyGroup>

      <PropertyGroup label="Arrows">
        <PropertyRow label="Start Arrow">
          <input
            type="checkbox"
            checked={element.startArrow}
            onChange={(e) =>
              updateElement(element.id, {
                startArrow: e.target.checked,
              } as Partial<CanvasElement>)
            }
          />
        </PropertyRow>
        <PropertyRow label="End Arrow">
          <input
            type="checkbox"
            checked={element.endArrow}
            onChange={(e) =>
              updateElement(element.id, {
                endArrow: e.target.checked,
              } as Partial<CanvasElement>)
            }
          />
        </PropertyRow>
        <PropertyRow label="Arrow Size">
          <NumberInput
            value={element.arrowSize}
            onChange={(v) =>
              updateElement(element.id, {
                arrowSize: v,
              } as Partial<CanvasElement>)
            }
            min={5}
            max={30}
          />
        </PropertyRow>
      </PropertyGroup>
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
        let v = parseFloat(e.target.value);
        if (!isNaN(v)) {
          if (min !== undefined) v = Math.max(min, v);
          if (max !== undefined) v = Math.min(max, v);
          onChange(v);
        }
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
  const [showDataEditor, setShowDataEditor] = useState(false);
  const [csvInput, setCsvInput] = useState('');

  const handleCsvImport = useCallback(() => {
    if (!csvInput.trim()) return;
    const lines = csvInput.trim().split('\n').map((l) => l.split(/[,\t]/));
    if (lines.length < 2) return;

    const headers = lines[0];
    const hasMultipleSeries = headers.length > 2;

    if (hasMultipleSeries) {
      // Multi-series: first column = labels, rest = series
      const labels = lines.slice(1).map((row) => row[0]?.trim() || '');
      const series = headers.slice(1).map((name, colIdx) => ({
        name: name.trim(),
        data: lines.slice(1).map((row) => parseFloat(row[colIdx + 1]) || 0),
      }));
      updateElement(element.id, { labels, series, data: [] } as Partial<CanvasElement>);
    } else {
      // Single series: label, value
      const data = lines.slice(1).map((row) => ({
        label: row[0]?.trim() || '',
        value: parseFloat(row[1]) || 0,
      }));
      updateElement(element.id, { data, labels: undefined, series: undefined } as Partial<CanvasElement>);
    }
    setCsvInput('');
    setShowDataEditor(false);
  }, [csvInput, element.id, updateElement]);

  return (
    <>
      <PropertyGroup label="Chart">
        <PropertyRow label="Type">
          <select
            value={element.chartType}
            onChange={(e) => updateElement(element.id, { chartType: e.target.value } as Partial<CanvasElement>)}
            style={styles.select}
          >
            <optgroup label="Standard">
              <option value="bar">Bar</option>
              <option value="line">Line</option>
              <option value="area">Area</option>
              <option value="pie">Pie</option>
              <option value="donut">Donut</option>
            </optgroup>
            <optgroup label="Advanced">
              <option value="horizontalBar">Horizontal Bar</option>
              <option value="stackedBar">Stacked Bar</option>
              <option value="scatter">Scatter</option>
              <option value="radar">Radar</option>
              <option value="funnel">Funnel</option>
              <option value="treemap">Treemap</option>
              <option value="heatmap">Heatmap</option>
            </optgroup>
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
        <PropertyRow label="Legend">
          <input
            type="checkbox"
            checked={element.showLegend}
            onChange={(e) => updateElement(element.id, { showLegend: e.target.checked } as Partial<CanvasElement>)}
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

      {/* Data Editor */}
      <PropertyGroup label="Data">
        {/* Inline data display */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 8 }}>
          {element.data.map((d, i) => (
            <div key={i} style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
              <input
                type="text"
                value={d.label}
                onChange={(e) => {
                  const newData = [...element.data];
                  newData[i] = { ...newData[i], label: e.target.value };
                  updateElement(element.id, { data: newData } as Partial<CanvasElement>);
                }}
                style={{ ...styles.numberInput, flex: 1, fontSize: 11 }}
                placeholder="Label"
              />
              <input
                type="number"
                value={d.value}
                onChange={(e) => {
                  const newData = [...element.data];
                  newData[i] = { ...newData[i], value: parseFloat(e.target.value) || 0 };
                  updateElement(element.id, { data: newData } as Partial<CanvasElement>);
                }}
                style={{ ...styles.numberInput, width: 60, fontSize: 11 }}
              />
              <button
                onClick={() => {
                  const newData = element.data.filter((_, j) => j !== i);
                  updateElement(element.id, { data: newData } as Partial<CanvasElement>);
                }}
                style={{ ...styles.miniBtn, color: '#e03131' }}
                title="Remove"
              >
                x
              </button>
            </div>
          ))}
          <button
            onClick={() => {
              const newData = [...element.data, { label: `Item ${element.data.length + 1}`, value: 50 }];
              updateElement(element.id, { data: newData } as Partial<CanvasElement>);
            }}
            style={styles.addDataBtn}
          >
            + Add Row
          </button>
        </div>

        {/* CSV Import */}
        <button
          onClick={() => setShowDataEditor(!showDataEditor)}
          style={styles.csvToggleBtn}
        >
          {showDataEditor ? 'Hide CSV Import' : 'Import CSV / Paste Data'}
        </button>
        {showDataEditor && (
          <div style={{ marginTop: 6 }}>
            <textarea
              value={csvInput}
              onChange={(e) => setCsvInput(e.target.value)}
              placeholder={"Label,Value\nQ1,65\nQ2,85\nQ3,45\n\nOr multi-series:\nMonth,Sales,Costs\nJan,100,80\nFeb,120,85"}
              style={styles.csvTextarea}
              rows={6}
            />
            <button
              onClick={handleCsvImport}
              style={styles.csvImportBtn}
            >
              Apply Data
            </button>
          </div>
        )}
      </PropertyGroup>

      {/* Data Source Binding */}
      <DataSourceBindingSection element={element} />

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

/** Reusable data source binding section for any widget inspector */
function DataSourceBindingSection({ element }: { element: CanvasElement }) {
  const { updateElement } = useElements();
  const { sources, fetchDataSource } = useDataSources();
  const boundSourceId = element.dataSource?.dataSourceId;
  const boundSource = boundSourceId ? sources.find((s: any) => s.id === boundSourceId) : null;

  return (
    <PropertyGroup label="Live Data">
      {boundSource ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ flex: 1, fontSize: 11, color: '#50C878', fontWeight: 500 }}>
              Connected: {boundSource.name}
            </div>
            <button
              onClick={() => updateElement(element.id, { dataSource: undefined } as Partial<CanvasElement>)}
              style={styles.miniBtn}
              title="Disconnect"
            >
              x
            </button>
          </div>
          <button
            onClick={() => fetchDataSource(boundSourceId!)}
            style={styles.csvToggleBtn}
          >
            Refresh Data
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {sources.length === 0 ? (
            <div style={{ fontSize: 10, color: '#868e96', lineHeight: 1.4 }}>
              No data sources configured. Open the Data Sources panel to add one.
            </div>
          ) : (
            <select
              value=""
              onChange={(e) => {
                if (e.target.value) {
                  updateElement(element.id, {
                    dataSource: { dataSourceId: e.target.value },
                  } as Partial<CanvasElement>);
                  // Trigger immediate fetch
                  fetchDataSource(e.target.value);
                }
              }}
              style={styles.select}
            >
              <option value="">Connect a data source...</option>
              {sources.map((s: any) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          )}
        </div>
      )}
    </PropertyGroup>
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
      <DataSourceBindingSection element={element} />
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
  const [showCfEditor, setShowCfEditor] = useState(false);
  const rules = (element as any).conditionalFormats ?? [];

  const addRule = useCallback(() => {
    const newRule = {
      id: `cf-${Date.now()}`,
      columnIndex: 0,
      operator: 'contains',
      value: '',
      backgroundColor: '#ebfbee',
      textColor: '#2b8a3e',
    };
    updateElement(element.id, { conditionalFormats: [...rules, newRule] } as Partial<CanvasElement>);
  }, [element.id, rules, updateElement]);

  const updateRule = useCallback((idx: number, partial: Record<string, any>) => {
    const updated = rules.map((r: any, i: number) => i === idx ? { ...r, ...partial } : r);
    updateElement(element.id, { conditionalFormats: updated } as Partial<CanvasElement>);
  }, [element.id, rules, updateElement]);

  const removeRule = useCallback((idx: number) => {
    updateElement(element.id, { conditionalFormats: rules.filter((_: any, i: number) => i !== idx) } as Partial<CanvasElement>);
  }, [element.id, rules, updateElement]);

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
        <PropertyRow label="Page Size">
          <NumberInput
            value={(element as any).pageSize ?? 0}
            onChange={(v) => updateElement(element.id, { pageSize: v } as Partial<CanvasElement>)}
            min={0}
            max={100}
          />
        </PropertyRow>
        <div style={{ fontSize: 9, color: '#868e96', marginBottom: 6 }}>0 = show all rows. Set to 5-10 for pagination.</div>
        <ColorPicker color={element.headerBg} label="Header Bg" onChange={(c) => updateElement(element.id, { headerBg: c } as Partial<CanvasElement>)} />
        <ColorPicker color={element.headerColor} label="Header Txt" onChange={(c) => updateElement(element.id, { headerColor: c } as Partial<CanvasElement>)} />
        <ColorPicker color={element.rowBg} label="Row Bg" onChange={(c) => updateElement(element.id, { rowBg: c } as Partial<CanvasElement>)} />
        <ColorPicker color={element.altRowBg} label="Alt Row" onChange={(c) => updateElement(element.id, { altRowBg: c } as Partial<CanvasElement>)} />
      </PropertyGroup>

      {/* Conditional Formatting */}
      <PropertyGroup label="Conditional Formatting">
        <button
          onClick={() => setShowCfEditor(!showCfEditor)}
          style={styles.csvToggleBtn}
        >
          {showCfEditor ? 'Hide Rules' : `${rules.length} Rule${rules.length !== 1 ? 's' : ''} — Edit`}
        </button>
        {showCfEditor && (
          <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {rules.map((rule: any, idx: number) => (
              <div key={rule.id} style={{ padding: 8, border: '1px solid #dee2e6', borderRadius: 6, backgroundColor: '#f8f9fa' }}>
                <div style={{ display: 'flex', gap: 4, marginBottom: 4 }}>
                  <select
                    value={rule.columnIndex}
                    onChange={(e) => updateRule(idx, { columnIndex: parseInt(e.target.value) })}
                    style={{ ...styles.select, flex: 1, height: 26, fontSize: 10 }}
                  >
                    <option value={-1}>All Columns</option>
                    {element.headers.map((h: string, i: number) => (
                      <option key={i} value={i}>{h}</option>
                    ))}
                  </select>
                  <button onClick={() => removeRule(idx)} style={{ ...styles.miniBtn, color: '#e03131' }}>x</button>
                </div>
                <div style={{ display: 'flex', gap: 4, marginBottom: 4 }}>
                  <select
                    value={rule.operator}
                    onChange={(e) => updateRule(idx, { operator: e.target.value })}
                    style={{ ...styles.select, flex: 1, height: 26, fontSize: 10 }}
                  >
                    <option value="contains">Contains</option>
                    <option value="equals">Equals</option>
                    <option value="notEquals">Not Equals</option>
                    <option value="greaterThan">Greater Than</option>
                    <option value="lessThan">Less Than</option>
                    <option value="between">Between</option>
                    <option value="isEmpty">Is Empty</option>
                    <option value="isNotEmpty">Is Not Empty</option>
                  </select>
                </div>
                {!['isEmpty', 'isNotEmpty'].includes(rule.operator) && (
                  <div style={{ display: 'flex', gap: 4, marginBottom: 4 }}>
                    <input
                      type="text"
                      value={rule.value}
                      onChange={(e) => updateRule(idx, { value: e.target.value })}
                      placeholder="Value"
                      style={{ ...styles.numberInput, flex: 1, height: 26, fontSize: 10 }}
                    />
                    {rule.operator === 'between' && (
                      <input
                        type="text"
                        value={rule.value2 || ''}
                        onChange={(e) => updateRule(idx, { value2: e.target.value })}
                        placeholder="Max"
                        style={{ ...styles.numberInput, flex: 1, height: 26, fontSize: 10 }}
                      />
                    )}
                  </div>
                )}
                <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                  <span style={{ fontSize: 9, color: '#868e96', width: 22 }}>Bg:</span>
                  <input
                    type="color"
                    value={rule.backgroundColor || '#ebfbee'}
                    onChange={(e) => updateRule(idx, { backgroundColor: e.target.value })}
                    style={{ width: 24, height: 20, border: '1px solid #dee2e6', borderRadius: 3, padding: 0, cursor: 'pointer' }}
                  />
                  <span style={{ fontSize: 9, color: '#868e96', width: 22 }}>Txt:</span>
                  <input
                    type="color"
                    value={rule.textColor || '#2b8a3e'}
                    onChange={(e) => updateRule(idx, { textColor: e.target.value })}
                    style={{ width: 24, height: 20, border: '1px solid #dee2e6', borderRadius: 3, padding: 0, cursor: 'pointer' }}
                  />
                  <input
                    type="text"
                    value={rule.icon || ''}
                    onChange={(e) => updateRule(idx, { icon: e.target.value })}
                    placeholder="Icon"
                    style={{ ...styles.numberInput, width: 40, height: 22, fontSize: 10, textAlign: 'center' }}
                  />
                </div>
              </div>
            ))}
            <button onClick={addRule} style={styles.addDataBtn}>
              + Add Rule
            </button>
          </div>
        )}
      </PropertyGroup>

      <DataSourceBindingSection element={element} />
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
      <DataSourceBindingSection element={element} />
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

function FilterControlInspector({ element }: { element: any }) {
  const { updateElement } = useElements();
  return (
    <>
      <PropertyGroup label="Filter Control">
        <PropertyRow label="Type">
          <select
            value={element.controlType}
            onChange={(e) => updateElement(element.id, { controlType: e.target.value } as Partial<CanvasElement>)}
            style={styles.select}
          >
            <option value="dropdown">Dropdown</option>
            <option value="search">Search</option>
            <option value="dateRange">Date Range</option>
          </select>
        </PropertyRow>
        <PropertyRow label="Label">
          <input
            type="text"
            value={element.label}
            onChange={(e) => updateElement(element.id, { label: e.target.value } as Partial<CanvasElement>)}
            style={styles.numberInput}
          />
        </PropertyRow>
        <PropertyRow label="Field">
          <input
            type="text"
            value={element.filterField}
            onChange={(e) => updateElement(element.id, { filterField: e.target.value } as Partial<CanvasElement>)}
            style={styles.numberInput}
            placeholder="e.g. category, status"
          />
        </PropertyRow>
        {element.controlType === 'dropdown' && (
          <PropertyRow label="Options">
            <input
              type="text"
              value={(element.options || []).join(', ')}
              onChange={(e) => {
                const options = e.target.value.split(',').map((s: string) => s.trim()).filter(Boolean);
                updateElement(element.id, { options } as Partial<CanvasElement>);
              }}
              style={styles.numberInput}
              placeholder="Option 1, Option 2, ..."
            />
          </PropertyRow>
        )}
        <PropertyRow label="Placeholder">
          <input
            type="text"
            value={element.placeholder}
            onChange={(e) => updateElement(element.id, { placeholder: e.target.value } as Partial<CanvasElement>)}
            style={styles.numberInput}
          />
        </PropertyRow>
      </PropertyGroup>
    </>
  );
}

const DEFAULT_FILTERS = {
  brightness: 0,
  contrast: 0,
  saturation: 0,
  hueRotation: 0,
  blur: 0,
  preset: '',
} as const;

const FILTER_SLIDERS = [
  { key: 'brightness', label: 'Brightness', min: -100, max: 100, step: 1 },
  { key: 'contrast', label: 'Contrast', min: -100, max: 100, step: 1 },
  { key: 'saturation', label: 'Saturation', min: -100, max: 100, step: 1 },
  { key: 'hueRotation', label: 'Hue Rotation', min: -180, max: 180, step: 1 },
  { key: 'blur', label: 'Blur', min: 0, max: 20, step: 0.5 },
] as const;

function ImageInspector({ element }: { element: ImageElement }) {
  const { updateElement } = useElements();

  const filters = element.filters ?? DEFAULT_FILTERS;

  const updateFilter = useCallback(
    (key: string, value: number) => {
      const current = element.filters ?? DEFAULT_FILTERS;
      updateElement(element.id, {
        filters: { ...current, [key]: value, preset: '' },
      } as Partial<CanvasElement>);
    },
    [element.id, element.filters, updateElement],
  );

  const handlePresetChange = useCallback(
    (presetName: string) => {
      updateElement(element.id, {
        filters: applyFilterPreset(presetName),
      } as Partial<CanvasElement>);
    },
    [element.id, updateElement],
  );

  const handleReset = useCallback(() => {
    updateElement(element.id, {
      filters: { ...DEFAULT_FILTERS },
    } as Partial<CanvasElement>);
  }, [element.id, updateElement]);

  return (
    <>
      <PropertyGroup label="Filters">
        <PropertyRow label="Preset">
          <select
            value={filters.preset ?? ''}
            onChange={(e) => handlePresetChange(e.target.value)}
            style={styles.select}
          >
            {FILTER_PRESETS.map((p) => (
              <option key={p.name} value={p.name}>
                {p.displayName}
              </option>
            ))}
          </select>
        </PropertyRow>
        {FILTER_SLIDERS.map((slider) => (
          <PropertyRow key={slider.key} label={slider.label}>
            <input
              type="range"
              min={slider.min}
              max={slider.max}
              step={slider.step}
              value={filters[slider.key]}
              onChange={(e) => updateFilter(slider.key, parseFloat(e.target.value))}
              style={styles.slider}
            />
            <span style={styles.sliderValue}>{filters[slider.key]}</span>
          </PropertyRow>
        ))}
        <button
          onClick={handleReset}
          style={styles.resetButton}
        >
          Reset
        </button>
      </PropertyGroup>
    </>
  );
}

function PageAlignButton({ label, icon, onClick }: { label: string; icon: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      title={label}
      style={styles.pageAlignBtn}
    >
      <span style={{ fontSize: 13 }}>{icon}</span>
      <span style={{ fontSize: 9 }}>{label}</span>
    </button>
  );
}

const styles: Record<string, React.CSSProperties> = {
  inspector: {
    width: 280,
    backgroundColor: '#ffffff',
    borderLeft: '1px solid #f8f9fa',
    overflow: 'auto',
    height: '100%',
  },
  sectionHeader: {
    padding: '14px 16px 10px',
    color: '#212529',
    fontSize: 13,
    fontWeight: 600,
    borderBottom: '1px solid #f8f9fa',
  },
  propertyGroup: {
    padding: '12px 16px',
    borderBottom: '1px solid #f8f9fa',
  },
  groupLabel: {
    color: '#868e96',
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
    color: '#868e96',
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
    border: '1px solid #dee2e6',
    borderRadius: 8,
    backgroundColor: '#f8f9fa',
    color: '#212529',
    fontSize: 12,
    padding: '0 10px',
    outline: 'none',
    transition: 'border-color 0.12s',
    boxSizing: 'border-box' as const,
  },
  flipBtn: {
    width: 30,
    height: 26,
    border: '1px solid #dee2e6',
    borderRadius: 6,
    backgroundColor: '#f8f9fa',
    color: '#495057',
    fontSize: 14,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 0,
  },
  flipBtnActive: {
    backgroundColor: '#e7f0ff',
    color: '#4A90D9',
    borderColor: '#4A90D9',
  },
  colorInput: {
    width: 34,
    height: 30,
    border: '1px solid #dee2e6',
    borderRadius: 8,
    backgroundColor: '#f8f9fa',
    cursor: 'pointer',
    padding: 3,
  },
  select: {
    width: '100%',
    height: 30,
    border: '1px solid #dee2e6',
    borderRadius: 8,
    backgroundColor: '#f8f9fa',
    color: '#212529',
    fontSize: 12,
    padding: '0 8px',
    outline: 'none',
    boxSizing: 'border-box' as const,
  },
  slider: {
    flex: 1,
    accentColor: '#4A90D9',
  },
  sliderValue: {
    color: '#868e96',
    fontSize: 11,
    fontWeight: 500,
    minWidth: 30,
    textAlign: 'right' as const,
  },
  pageAlignBtn: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    width: 52,
    height: 38,
    border: '1px solid #dee2e6',
    borderRadius: 6,
    backgroundColor: '#f8f9fa',
    color: '#495057',
    cursor: 'pointer',
    padding: 0,
    gap: 1,
  },
  resetButton: {
    width: '100%',
    height: 30,
    border: '1px solid #dee2e6',
    borderRadius: 8,
    backgroundColor: '#f8f9fa',
    color: '#212529',
    fontSize: 12,
    cursor: 'pointer',
    marginTop: 6,
  },
  miniBtn: {
    width: 22,
    height: 22,
    border: '1px solid #dee2e6',
    borderRadius: 4,
    backgroundColor: '#f8f9fa',
    fontSize: 11,
    fontWeight: 600,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 0,
    flexShrink: 0,
  },
  addDataBtn: {
    width: '100%',
    height: 28,
    border: '1px dashed #dee2e6',
    borderRadius: 6,
    backgroundColor: 'transparent',
    color: '#868e96',
    fontSize: 11,
    cursor: 'pointer',
    marginTop: 4,
  },
  csvToggleBtn: {
    width: '100%',
    height: 28,
    border: '1px solid #dee2e6',
    borderRadius: 6,
    backgroundColor: '#f8f9fa',
    color: '#4A90D9',
    fontSize: 11,
    fontWeight: 500,
    cursor: 'pointer',
  },
  csvTextarea: {
    width: '100%',
    minHeight: 80,
    border: '1px solid #dee2e6',
    borderRadius: 8,
    backgroundColor: '#f8f9fa',
    color: '#212529',
    fontSize: 11,
    fontFamily: 'monospace',
    padding: 8,
    outline: 'none',
    resize: 'vertical' as const,
    boxSizing: 'border-box' as const,
  },
  csvImportBtn: {
    width: '100%',
    height: 28,
    border: 'none',
    borderRadius: 6,
    background: 'linear-gradient(135deg, #4A90D9, #7c5cbf)',
    color: '#ffffff',
    fontSize: 11,
    fontWeight: 600,
    cursor: 'pointer',
    marginTop: 6,
  },
};

// Alignment tools for multi-select
function AlignmentTools({ elements, updateElements }: {
  elements: CanvasElement[];
  updateElements: (updates: Array<{ id: string; changes: Partial<CanvasElement> }>) => void;
}) {
  type Axis = 'x' | 'y';
  const posKey = (axis: Axis) => axis;
  const sizeKey = (axis: Axis): 'width' | 'height' => axis === 'x' ? 'width' : 'height';

  const alignStart = (axis: Axis) => {
    const minVal = Math.min(...elements.map((e) => e[posKey(axis)]));
    updateElements(elements.map((el) => ({ id: el.id, changes: { [posKey(axis)]: minVal } as Partial<CanvasElement> })));
  };

  const alignCenter = (axis: Axis) => {
    const minVal = Math.min(...elements.map((e) => e[posKey(axis)]));
    const maxVal = Math.max(...elements.map((e) => e[posKey(axis)] + e[sizeKey(axis)]));
    const center = (minVal + maxVal) / 2;
    updateElements(elements.map((el) => ({ id: el.id, changes: { [posKey(axis)]: center - el[sizeKey(axis)] / 2 } as Partial<CanvasElement> })));
  };

  const alignEnd = (axis: Axis) => {
    const maxVal = Math.max(...elements.map((e) => e[posKey(axis)] + e[sizeKey(axis)]));
    updateElements(elements.map((el) => ({ id: el.id, changes: { [posKey(axis)]: maxVal - el[sizeKey(axis)] } as Partial<CanvasElement> })));
  };

  const distribute = (axis: Axis) => {
    if (elements.length < 3) return;
    const pos = posKey(axis);
    const size = sizeKey(axis);
    const sorted = [...elements].sort((a, b) => a[pos] - b[pos]);
    const first = sorted[0], last = sorted[sorted.length - 1];
    const totalSpace = (last[pos] + last[size]) - first[pos];
    const totalSize = sorted.reduce((s, e) => s + e[size], 0);
    const gap = Math.max(0, (totalSpace - totalSize) / (sorted.length - 1));
    const updates: Array<{ id: string; changes: Partial<CanvasElement> }> = [];
    let cursor = first[pos] + first[size] + gap;
    for (let i = 1; i < sorted.length - 1; i++) {
      updates.push({ id: sorted[i].id, changes: { [pos]: cursor } as Partial<CanvasElement> });
      cursor += sorted[i][size] + gap;
    }
    updateElements(updates);
  };

  const btnStyle: React.CSSProperties = {
    width: 30,
    height: 28,
    border: '1px solid #dee2e6',
    borderRadius: 6,
    backgroundColor: '#f8f9fa',
    color: '#495057',
    fontSize: 13,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 0,
  };

  return (
    <div style={{ padding: '0 14px 10px' }}>
      <div style={{ color: '#868e96', fontSize: 10, fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '1px', marginBottom: 6 }}>
        Align
      </div>
      <div style={{ display: 'flex', gap: 4, marginBottom: 6 }}>
        <button style={btnStyle} onClick={() => alignStart('x')} title="Align Left">{'\u258C'}</button>
        <button style={btnStyle} onClick={() => alignCenter('x')} title="Align Center H">{'\u2503'}</button>
        <button style={btnStyle} onClick={() => alignEnd('x')} title="Align Right">{'\u2590'}</button>
        <button style={btnStyle} onClick={() => alignStart('y')} title="Align Top">{'\u2580'}</button>
        <button style={btnStyle} onClick={() => alignCenter('y')} title="Align Middle">{'\u2501'}</button>
        <button style={btnStyle} onClick={() => alignEnd('y')} title="Align Bottom">{'\u2584'}</button>
      </div>
      {elements.length >= 3 && (
        <div style={{ display: 'flex', gap: 4 }}>
          <button style={{ ...btnStyle, flex: 1, fontSize: 10, width: 'auto' }} onClick={() => distribute('x')} title="Distribute Horizontally">
            Distribute H
          </button>
          <button style={{ ...btnStyle, flex: 1, fontSize: 10, width: 'auto' }} onClick={() => distribute('y')} title="Distribute Vertically">
            Distribute V
          </button>
        </div>
      )}
    </div>
  );
}
