import React, { memo, useMemo } from 'react';
import type { ChartDataPoint, HeatmapCell } from '@reactcanvas/core';

// ─── Funnel Chart ───────────────────────────────────────────────────

interface FunnelProps {
  data: ChartDataPoint[];
  colors: string[];
  showLabels: boolean;
}

export const FunnelChart = memo(function FunnelChart({ data, colors, showLabels }: FunnelProps) {
  if (data.length === 0) return null;

  const maxVal = Math.max(...data.map((d) => d.value), 1);
  const stepH = 100 / data.length;

  return (
    <svg width="100%" height="100%" viewBox="0 0 400 300" preserveAspectRatio="xMidYMid meet">
      {data.map((d, i) => {
        const widthPct = (d.value / maxVal);
        const nextWidthPct = i < data.length - 1 ? (data[i + 1].value / maxVal) : widthPct * 0.7;
        const y = i * stepH * 3;
        const h = stepH * 3 - 2;
        const cx = 200;

        const topW = widthPct * 360;
        const botW = nextWidthPct * 360;

        const x1 = cx - topW / 2;
        const x2 = cx + topW / 2;
        const x3 = cx + botW / 2;
        const x4 = cx - botW / 2;

        const color = d.color || colors[i % colors.length];

        return (
          <g key={i}>
            <polygon
              points={`${x1},${y} ${x2},${y} ${x3},${y + h} ${x4},${y + h}`}
              fill={color}
              opacity={0.85}
            />
            {showLabels && (
              <>
                <text
                  x={cx}
                  y={y + h / 2 - 2}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontSize={12}
                  fontWeight={600}
                  fill="#fff"
                >
                  {d.label}
                </text>
                <text
                  x={cx}
                  y={y + h / 2 + 13}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontSize={10}
                  fill="rgba(255,255,255,0.8)"
                >
                  {d.value.toLocaleString()} ({Math.round((d.value / maxVal) * 100)}%)
                </text>
              </>
            )}
          </g>
        );
      })}
    </svg>
  );
});

// ─── Heatmap Chart ──────────────────────────────────────────────────

interface HeatmapProps {
  heatmapData: HeatmapCell[];
  heatmapRows: string[];
  heatmapCols: string[];
  showLabels: boolean;
}

export const HeatmapChart = memo(function HeatmapChart({ heatmapData, heatmapRows, heatmapCols, showLabels }: HeatmapProps) {
  if (!heatmapData || heatmapData.length === 0) return null;

  const { minVal, maxVal, cellMap } = useMemo(() => {
    const values = heatmapData.map((c) => c.value);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const map = new Map<string, number>();
    for (const cell of heatmapData) {
      map.set(`${cell.row}|${cell.col}`, cell.value);
    }
    return { minVal: min, maxVal: max, cellMap: map };
  }, [heatmapData]);

  const rows = heatmapRows;
  const cols = heatmapCols;
  const labelW = 60;
  const labelH = 24;

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Column headers */}
      <div style={{ display: 'flex', marginLeft: labelW, flexShrink: 0 }}>
        {cols.map((col, ci) => (
          <div key={ci} style={{
            flex: 1, textAlign: 'center', fontSize: 9, fontWeight: 600,
            color: '#6c757d', padding: '2px 0', overflow: 'hidden', textOverflow: 'ellipsis',
          }}>
            {col}
          </div>
        ))}
      </div>
      {/* Grid */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 1 }}>
        {rows.map((row, ri) => (
          <div key={ri} style={{ display: 'flex', flex: 1, gap: 1 }}>
            {/* Row label */}
            <div style={{
              width: labelW, flexShrink: 0, display: 'flex', alignItems: 'center',
              justifyContent: 'flex-end', paddingRight: 6,
              fontSize: 9, fontWeight: 600, color: '#6c757d',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {row}
            </div>
            {/* Cells */}
            {cols.map((col, ci) => {
              const val = cellMap.get(`${row}|${col}`) ?? 0;
              const intensity = maxVal === minVal ? 0.5 : (val - minVal) / (maxVal - minVal);
              const bg = heatmapColor(intensity);
              return (
                <div
                  key={ci}
                  style={{
                    flex: 1, borderRadius: 3, backgroundColor: bg,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 10, fontWeight: 500, color: intensity > 0.5 ? '#fff' : '#212529',
                    minHeight: labelH,
                  }}
                  title={`${row} / ${col}: ${val}`}
                >
                  {showLabels && val}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
});

function heatmapColor(intensity: number): string {
  // Blue (low) → Yellow → Red (high)
  if (intensity < 0.5) {
    const t = intensity * 2;
    const r = Math.round(66 + t * (255 - 66));
    const g = Math.round(133 + t * (200 - 133));
    const b = Math.round(244 - t * 200);
    return `rgb(${r},${g},${b})`;
  }
  const t = (intensity - 0.5) * 2;
  const r = Math.round(255);
  const g = Math.round(200 - t * 160);
  const b = Math.round(44 - t * 44);
  return `rgb(${r},${g},${b})`;
}

// ─── Treemap Chart ──────────────────────────────────────────────────

interface TreemapProps {
  data: ChartDataPoint[];
  colors: string[];
  showLabels: boolean;
}

export const TreemapChart = memo(function TreemapChart({ data, colors, showLabels }: TreemapProps) {
  if (data.length === 0) return null;

  const total = data.reduce((s, d) => s + d.value, 0) || 1;
  const sorted = [...data].sort((a, b) => b.value - a.value);

  // Simple squarified treemap layout
  const rects = useMemo(() => {
    return layoutTreemap(sorted, 400, 280, total);
  }, [sorted, total]);

  return (
    <svg width="100%" height="100%" viewBox="0 0 400 280" preserveAspectRatio="xMidYMid meet">
      {rects.map((rect, i) => {
        const color = rect.item.color || colors[i % colors.length];
        const pct = Math.round((rect.item.value / total) * 100);
        return (
          <g key={i}>
            <rect
              x={rect.x + 1}
              y={rect.y + 1}
              width={Math.max(0, rect.w - 2)}
              height={Math.max(0, rect.h - 2)}
              rx={4}
              fill={color}
              opacity={0.85}
            />
            {showLabels && rect.w > 40 && rect.h > 28 && (
              <>
                <text
                  x={rect.x + rect.w / 2}
                  y={rect.y + rect.h / 2 - 4}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontSize={Math.min(12, rect.w / 8)}
                  fontWeight={600}
                  fill="#fff"
                >
                  {rect.item.label}
                </text>
                <text
                  x={rect.x + rect.w / 2}
                  y={rect.y + rect.h / 2 + 10}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontSize={Math.min(10, rect.w / 10)}
                  fill="rgba(255,255,255,0.75)"
                >
                  {pct}%
                </text>
              </>
            )}
          </g>
        );
      })}
    </svg>
  );
});

interface TreemapRect {
  x: number;
  y: number;
  w: number;
  h: number;
  item: ChartDataPoint;
}

/** Simple slice-and-dice treemap layout */
function layoutTreemap(items: ChartDataPoint[], width: number, height: number, total: number): TreemapRect[] {
  const rects: TreemapRect[] = [];
  let x = 0, y = 0, w = width, h = height;
  let remaining = total;

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const ratio = item.value / remaining;

    if (w >= h) {
      // Split horizontally
      const itemW = w * ratio;
      rects.push({ x, y, w: itemW, h, item });
      x += itemW;
      w -= itemW;
    } else {
      // Split vertically
      const itemH = h * ratio;
      rects.push({ x, y, w, h: itemH, item });
      y += itemH;
      h -= itemH;
    }
    remaining -= item.value;
  }

  return rects;
}
