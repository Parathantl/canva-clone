import React, { memo } from 'react';
import type {
  ChartElement,
  KPIElement,
  TableElement,
  ProgressElement,
  EmbedElement,
  ChartDataPoint,
} from '@reactcanvas/core';

// ─── Chart Renderer ─────────────────────────────────────────────────

export const ChartContent = memo(function ChartContent({ element }: { element: ChartElement }) {
  const { chartType, data, title, showLabels, showGrid, colors, backgroundColor, borderRadius } = element;

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        backgroundColor,
        borderRadius,
        padding: 16,
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: 'Inter, -apple-system, sans-serif',
        boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
        border: '1px solid #e5e7eb',
        overflow: 'hidden',
      }}
    >
      {title && (
        <div style={{ fontSize: 14, fontWeight: 600, color: '#1e1e2e', marginBottom: 12, flexShrink: 0 }}>
          {title}
        </div>
      )}
      <div style={{ flex: 1, minHeight: 0, position: 'relative' }}>
        {(chartType === 'bar' || chartType === 'line' || chartType === 'area') && (
          <BarLineAreaChart data={data} type={chartType} colors={colors} showLabels={showLabels} showGrid={showGrid} />
        )}
        {(chartType === 'pie' || chartType === 'donut') && (
          <PieDonutChart data={data} type={chartType} colors={colors} showLabels={showLabels} />
        )}
      </div>
    </div>
  );
});

function BarLineAreaChart({
  data,
  type,
  colors,
  showLabels,
  showGrid,
}: {
  data: ChartDataPoint[];
  type: 'bar' | 'line' | 'area';
  colors: string[];
  showLabels: boolean;
  showGrid: boolean;
}) {
  if (data.length === 0) return null;

  const maxVal = Math.max(...data.map((d) => d.value), 1);
  const padding = { top: 8, right: 8, bottom: showLabels ? 28 : 8, left: 40 };

  return (
    <svg width="100%" height="100%" viewBox="0 0 400 220" preserveAspectRatio="none">
      {/* Grid lines */}
      {showGrid &&
        [0, 0.25, 0.5, 0.75, 1].map((frac, i) => {
          const y = padding.top + (1 - frac) * (220 - padding.top - padding.bottom);
          return (
            <g key={i}>
              <line x1={padding.left} y1={y} x2={400 - padding.right} y2={y} stroke="#e5e7eb" strokeWidth={1} />
              <text x={padding.left - 4} y={y + 4} textAnchor="end" fontSize={9} fill="#9ca3af">
                {Math.round(maxVal * frac)}
              </text>
            </g>
          );
        })}

      {type === 'bar' &&
        data.map((d, i) => {
          const barWidth = (400 - padding.left - padding.right) / data.length * 0.6;
          const gap = (400 - padding.left - padding.right) / data.length;
          const barH = (d.value / maxVal) * (220 - padding.top - padding.bottom);
          const x = padding.left + i * gap + (gap - barWidth) / 2;
          const y = 220 - padding.bottom - barH;
          return (
            <g key={i}>
              <rect
                x={x}
                y={y}
                width={barWidth}
                height={barH}
                rx={4}
                fill={d.color ?? colors[i % colors.length]}
              />
              {showLabels && (
                <text
                  x={x + barWidth / 2}
                  y={220 - padding.bottom + 16}
                  textAnchor="middle"
                  fontSize={10}
                  fill="#6b7280"
                >
                  {d.label}
                </text>
              )}
            </g>
          );
        })}

      {(type === 'line' || type === 'area') && (() => {
        const chartW = 400 - padding.left - padding.right;
        const chartH = 220 - padding.top - padding.bottom;
        const points = data.map((d, i) => ({
          x: padding.left + (i / Math.max(data.length - 1, 1)) * chartW,
          y: padding.top + (1 - d.value / maxVal) * chartH,
        }));
        const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

        return (
          <g>
            {type === 'area' && (
              <path
                d={`${pathD} L ${points[points.length - 1].x} ${220 - padding.bottom} L ${points[0].x} ${220 - padding.bottom} Z`}
                fill={colors[0]}
                opacity={0.15}
              />
            )}
            <path d={pathD} fill="none" stroke={colors[0]} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
            {points.map((p, i) => (
              <circle key={i} cx={p.x} cy={p.y} r={4} fill="#fff" stroke={colors[0]} strokeWidth={2} />
            ))}
            {showLabels &&
              data.map((d, i) => (
                <text
                  key={i}
                  x={points[i].x}
                  y={220 - padding.bottom + 16}
                  textAnchor="middle"
                  fontSize={10}
                  fill="#6b7280"
                >
                  {d.label}
                </text>
              ))}
          </g>
        );
      })()}
    </svg>
  );
}

function PieDonutChart({
  data,
  type,
  colors,
  showLabels,
}: {
  data: ChartDataPoint[];
  type: 'pie' | 'donut';
  colors: string[];
  showLabels: boolean;
}) {
  if (data.length === 0) return null;

  const total = data.reduce((s, d) => s + d.value, 0) || 1;
  const cx = 120, cy = 110, r = 80;
  const innerR = type === 'donut' ? r * 0.55 : 0;
  let currentAngle = -Math.PI / 2;

  const slices = data.map((d, i) => {
    const angle = (d.value / total) * 2 * Math.PI;
    const startAngle = currentAngle;
    const endAngle = currentAngle + angle;
    currentAngle = endAngle;

    const x1 = cx + r * Math.cos(startAngle);
    const y1 = cy + r * Math.sin(startAngle);
    const x2 = cx + r * Math.cos(endAngle);
    const y2 = cy + r * Math.sin(endAngle);

    const ix1 = cx + innerR * Math.cos(startAngle);
    const iy1 = cy + innerR * Math.sin(startAngle);
    const ix2 = cx + innerR * Math.cos(endAngle);
    const iy2 = cy + innerR * Math.sin(endAngle);

    const largeArc = angle > Math.PI ? 1 : 0;

    const pathD = innerR > 0
      ? `M ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} L ${ix2} ${iy2} A ${innerR} ${innerR} 0 ${largeArc} 0 ${ix1} ${iy1} Z`
      : `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z`;

    const midAngle = startAngle + angle / 2;
    const labelR = r + 16;
    const lx = cx + labelR * Math.cos(midAngle);
    const ly = cy + labelR * Math.sin(midAngle);

    return { pathD, color: d.color ?? colors[i % colors.length], label: d.label, lx, ly, midAngle };
  });

  return (
    <svg width="100%" height="100%" viewBox="0 0 320 220" preserveAspectRatio="xMidYMid meet">
      {slices.map((s, i) => (
        <path key={i} d={s.pathD} fill={s.color} stroke="#fff" strokeWidth={2} />
      ))}
      {showLabels &&
        slices.map((s, i) => (
          <text
            key={i}
            x={s.lx}
            y={s.ly}
            textAnchor={s.midAngle > Math.PI / 2 && s.midAngle < (3 * Math.PI) / 2 ? 'end' : 'start'}
            fontSize={10}
            fill="#6b7280"
            dominantBaseline="middle"
          >
            {s.label}
          </text>
        ))}
    </svg>
  );
}

// ─── KPI Card Renderer ──────────────────────────────────────────────

export const KPIContent = memo(function KPIContent({ element }: { element: KPIElement }) {
  const { value, label, prefix, suffix, trend, trendValue, backgroundColor, valueColor, labelColor, trendColor, borderRadius, icon } = element;

  const trendArrow = trend === 'up' ? '\u25B2' : trend === 'down' ? '\u25BC' : '\u25C6';
  const effectiveTrendColor = trend === 'up' ? (trendColor || '#50C878') : trend === 'down' ? '#E8596D' : '#9ca3af';

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        backgroundColor,
        borderRadius,
        padding: 20,
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        fontFamily: 'Inter, -apple-system, sans-serif',
        boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
        border: '1px solid #e5e7eb',
      }}
    >
      <div style={{ color: labelColor, fontSize: 12, fontWeight: 500, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
        {icon && <span style={{ marginRight: 6 }}>{icon}</span>}
        {label}
      </div>
      <div style={{ color: valueColor, fontSize: 32, fontWeight: 700, lineHeight: 1.1, marginBottom: 8 }}>
        {prefix}{value}{suffix}
      </div>
      {trendValue && (
        <div style={{ color: effectiveTrendColor, fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ fontSize: 10 }}>{trendArrow}</span>
          {trendValue}
        </div>
      )}
    </div>
  );
});

// ─── Table Renderer ─────────────────────────────────────────────────

export const TableContent = memo(function TableContent({ element }: { element: TableElement }) {
  const { headers, rows, headerBg, headerColor, rowBg, altRowBg, cellColor, borderColor, borderRadius, fontSize } = element;

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        borderRadius,
        overflow: 'hidden',
        boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
        border: `1px solid ${borderColor}`,
        fontFamily: 'Inter, -apple-system, sans-serif',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          backgroundColor: headerBg,
          flexShrink: 0,
        }}
      >
        {headers.map((h: string, i: number) => (
          <div
            key={i}
            style={{
              flex: 1,
              padding: '10px 14px',
              fontSize: fontSize - 1,
              fontWeight: 600,
              color: headerColor,
              borderRight: i < headers.length - 1 ? `1px solid rgba(255,255,255,0.1)` : undefined,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {h}
          </div>
        ))}
      </div>

      {/* Rows - stretch to fill available height */}
      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {rows.map((row: string[], ri: number) => (
          <div
            key={ri}
            style={{
              display: 'flex',
              flex: 1,
              backgroundColor: ri % 2 === 0 ? rowBg : altRowBg,
              borderBottom: ri < rows.length - 1 ? `1px solid ${borderColor}` : undefined,
              alignItems: 'center',
            }}
          >
            {row.map((cell: string, ci: number) => (
              <div
                key={ci}
                style={{
                  flex: 1,
                  padding: '8px 14px',
                  fontSize,
                  color: cellColor,
                  borderRight: ci < row.length - 1 ? `1px solid ${borderColor}` : undefined,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {cell}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
});

// ─── Progress Renderer ──────────────────────────────────────────────

export const ProgressContent = memo(function ProgressContent({ element }: { element: ProgressElement }) {
  const {
    progressStyle, value, maxValue, label, showValue,
    trackColor, fillColor, valueColor, labelColor,
    backgroundColor, borderRadius, thickness,
  } = element;
  const pct = Math.min(100, Math.max(0, (value / maxValue) * 100));

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        backgroundColor,
        borderRadius,
        padding: 20,
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        alignItems: progressStyle === 'bar' ? 'stretch' : 'center',
        justifyContent: 'center',
        fontFamily: 'Inter, -apple-system, sans-serif',
        boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
        border: '1px solid #e5e7eb',
      }}
    >
      {progressStyle === 'bar' && (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
            <span style={{ color: labelColor, fontSize: 12, fontWeight: 500 }}>{label}</span>
            {showValue && <span style={{ color: valueColor, fontSize: 14, fontWeight: 700 }}>{Math.round(pct)}%</span>}
          </div>
          <div style={{ width: '100%', height: thickness, backgroundColor: trackColor, borderRadius: thickness / 2 }}>
            <div
              style={{
                width: `${pct}%`,
                height: '100%',
                backgroundColor: fillColor,
                borderRadius: thickness / 2,
                transition: 'width 0.3s ease',
              }}
            />
          </div>
        </>
      )}

      {(progressStyle === 'circle' || progressStyle === 'semicircle') && (() => {
        const size = Math.min(element.width - 40, element.height - 60);
        const r = (size - thickness) / 2;
        const circumference = progressStyle === 'semicircle' ? Math.PI * r : 2 * Math.PI * r;
        const offset = circumference * (1 - pct / 100);
        const rotation = progressStyle === 'semicircle' ? 180 : -90;

        return (
          <>
            <svg width={size} height={progressStyle === 'semicircle' ? size / 2 + 10 : size} style={{ overflow: 'visible' }}>
              <circle
                cx={size / 2}
                cy={size / 2}
                r={r}
                fill="none"
                stroke={trackColor}
                strokeWidth={thickness}
                strokeDasharray={progressStyle === 'semicircle' ? `${Math.PI * r} ${circumference}` : undefined}
                transform={`rotate(${rotation} ${size / 2} ${size / 2})`}
              />
              <circle
                cx={size / 2}
                cy={size / 2}
                r={r}
                fill="none"
                stroke={fillColor}
                strokeWidth={thickness}
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={offset}
                transform={`rotate(${rotation} ${size / 2} ${size / 2})`}
              />
              {showValue && (
                <text
                  x={size / 2}
                  y={progressStyle === 'semicircle' ? size / 2 - 4 : size / 2}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontSize={size * 0.22}
                  fontWeight={700}
                  fill={valueColor}
                >
                  {Math.round(pct)}%
                </text>
              )}
            </svg>
            <div style={{ color: labelColor, fontSize: 12, fontWeight: 500, marginTop: 6 }}>{label}</div>
          </>
        );
      })()}
    </div>
  );
});

// ─── Embed Renderer ─────────────────────────────────────────────────

export const EmbedContent = memo(function EmbedContent({ element }: { element: EmbedElement }) {
  const { url, backgroundColor, borderRadius, showBorder, embedType } = element;

  if (!url) {
    return (
      <div
        style={{
          width: '100%',
          height: '100%',
          backgroundColor,
          borderRadius,
          border: showBorder ? '2px dashed #ccc' : undefined,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'Inter, -apple-system, sans-serif',
          color: '#9ca3af',
          gap: 8,
        }}
      >
        <span style={{ fontSize: 32 }}>
          {embedType === 'video' ? '\uD83C\uDFA5' : embedType === 'map' ? '\uD83D\uDDFA\uFE0F' : '\uD83C\uDF10'}
        </span>
        <span style={{ fontSize: 13 }}>
          {embedType === 'video' ? 'Add video URL' : embedType === 'map' ? 'Add map URL' : 'Add website URL'}
        </span>
      </div>
    );
  }

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        borderRadius,
        overflow: 'hidden',
        border: showBorder ? '1px solid #e5e7eb' : undefined,
        backgroundColor,
      }}
    >
      <iframe
        src={url}
        title="Embedded content"
        style={{
          width: '100%',
          height: '100%',
          border: 'none',
          pointerEvents: 'none',
        }}
        sandbox="allow-scripts allow-same-origin"
      />
    </div>
  );
});
