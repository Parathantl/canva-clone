import React, { memo, useState, useMemo, useCallback } from 'react';
import type {
  KPIElement,
  TableElement,
  ProgressElement,
  EmbedElement,
  ConditionalFormatRule,
} from '@reactcanvas/core';
import { ChartJSContent } from './ChartJSRenderer';
export type { ChartFilterEvent, ChartJSContentProps } from './ChartJSRenderer';

// Re-export Chart.js renderer as ChartContent
export const ChartContent = ChartJSContent;

// ─── KPI Card Renderer ──────────────────────────────────────────────

export const KPIContent = memo(function KPIContent({ element }: { element: KPIElement }) {
  const { value, label, prefix, suffix, trend, trendValue, backgroundColor, valueColor, labelColor, trendColor, borderRadius, icon } = element;

  const trendArrow = trend === 'up' ? '\u25B2' : trend === 'down' ? '\u25BC' : '\u25C6';
  const effectiveTrendColor = trend === 'up' ? (trendColor || '#50C878') : trend === 'down' ? '#E8596D' : '#868e96';

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
        border: '1px solid #dee2e6',
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

// ─── Table Renderer (with sorting, pagination, conditional formatting) ───

export interface TableFilterProps {
  activeFilterValues?: Set<string>;
  onDrillDown?: (targetPageId: string, field: string, value: string) => void;
  drillDownPageId?: string;
  drillDownColumn?: number;
  drillDownField?: string;
}

export const TableContent = memo(function TableContent({ element, activeFilterValues, onDrillDown, drillDownPageId, drillDownColumn, drillDownField }: { element: TableElement } & TableFilterProps) {
  const {
    headers, rows, headerBg, headerColor, rowBg, altRowBg, cellColor,
    borderColor, borderRadius, fontSize, conditionalFormats,
    pageSize: configPageSize, sortColumn: configSortCol, sortDirection: configSortDir,
  } = element;

  const [sortCol, setSortCol] = useState<number | undefined>(configSortCol);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>(configSortDir || 'asc');
  const [currentPage, setCurrentPage] = useState(0);
  const pageSize = configPageSize || 0; // 0 = show all

  // Filter
  const hasFilter = activeFilterValues && activeFilterValues.size > 0;
  const rowMatchesFilter = useCallback((row: string[]): boolean => {
    if (!hasFilter) return true;
    return row.some((cell) => activeFilterValues!.has(cell));
  }, [hasFilter, activeFilterValues]);

  // Sort
  const sortedRows = useMemo(() => {
    if (sortCol == null) return rows;
    return [...rows].sort((a, b) => {
      const av = a[sortCol] ?? '';
      const bv = b[sortCol] ?? '';
      // Try numeric comparison
      const an = parseFloat(av.replace(/[$,%]/g, ''));
      const bn = parseFloat(bv.replace(/[$,%]/g, ''));
      if (!isNaN(an) && !isNaN(bn)) {
        return sortDir === 'asc' ? an - bn : bn - an;
      }
      return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
    });
  }, [rows, sortCol, sortDir]);

  // Paginate
  const totalPages = pageSize > 0 ? Math.ceil(sortedRows.length / pageSize) : 1;
  const displayRows = pageSize > 0
    ? sortedRows.slice(currentPage * pageSize, (currentPage + 1) * pageSize)
    : sortedRows;

  const hasDrillDown = !!(drillDownPageId && onDrillDown);

  const handleRowClick = useCallback((row: string[]) => {
    if (!hasDrillDown || !drillDownPageId || !onDrillDown) return;
    const colIdx = drillDownColumn ?? 0;
    const value = row[colIdx] ?? '';
    onDrillDown(drillDownPageId, drillDownField || 'label', value);
  }, [hasDrillDown, drillDownPageId, drillDownColumn, drillDownField, onDrillDown]);

  const handleHeaderClick = useCallback((colIdx: number) => {
    if (sortCol === colIdx) {
      setSortDir((d) => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortCol(colIdx);
      setSortDir('asc');
    }
    setCurrentPage(0);
  }, [sortCol]);

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
      {/* Header — clickable for sorting */}
      <div style={{ display: 'flex', backgroundColor: headerBg, flexShrink: 0 }}>
        {headers.map((h: string, i: number) => (
          <div
            key={i}
            onClick={(e) => { e.stopPropagation(); handleHeaderClick(i); }}
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
              cursor: 'pointer',
              userSelect: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            {h}
            {sortCol === i && (
              <span style={{ fontSize: 9, opacity: 0.8 }}>
                {sortDir === 'asc' ? '\u25B2' : '\u25BC'}
              </span>
            )}
          </div>
        ))}
      </div>

      {/* Rows */}
      <div style={{ flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column' }}>
        {displayRows.map((row: string[], ri: number) => {
          const matches = rowMatchesFilter(row);
          return (
            <div
              key={row.join('|') + ri}
              onClick={hasDrillDown ? (e) => { e.stopPropagation(); handleRowClick(row); } : undefined}
              style={{
                display: 'flex',
                flex: pageSize > 0 ? undefined : 1,
                minHeight: pageSize > 0 ? 36 : undefined,
                backgroundColor: matches && hasFilter ? '#e7f0ff' : ri % 2 === 0 ? rowBg : altRowBg,
                borderBottom: ri < displayRows.length - 1 ? `1px solid ${borderColor}` : undefined,
                alignItems: 'center',
                opacity: hasFilter && !matches ? 0.35 : 1,
                transition: 'opacity 0.15s, background-color 0.15s',
                cursor: hasDrillDown ? 'pointer' : undefined,
              }}
            >
              {row.map((cell: string, ci: number) => {
                const cfStyle = getCellConditionalStyle(cell, ci, conditionalFormats);
                return (
                  <div
                    key={ci}
                    style={{
                      flex: 1,
                      padding: '8px 14px',
                      fontSize,
                      color: cfStyle.textColor || cellColor,
                      backgroundColor: cfStyle.backgroundColor || undefined,
                      fontWeight: cfStyle.fontWeight || undefined,
                      borderRight: ci < row.length - 1 ? `1px solid ${borderColor}` : undefined,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      transition: 'background-color 0.15s',
                    }}
                  >
                    {cfStyle.icon ? `${cfStyle.icon} ${cell}` : cell}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>

      {/* Pagination footer */}
      {pageSize > 0 && totalPages > 1 && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '6px 14px',
          borderTop: `1px solid ${borderColor}`,
          backgroundColor: rowBg,
          flexShrink: 0,
        }}>
          <span style={{ fontSize: 10, color: '#868e96' }}>
            {currentPage * pageSize + 1}-{Math.min((currentPage + 1) * pageSize, sortedRows.length)} of {sortedRows.length}
          </span>
          <div style={{ display: 'flex', gap: 4 }}>
            <button
              onClick={(e) => { e.stopPropagation(); setCurrentPage((p) => Math.max(0, p - 1)); }}
              disabled={currentPage === 0}
              style={paginationBtnStyle}
            >
              Prev
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); setCurrentPage((p) => Math.min(totalPages - 1, p + 1)); }}
              disabled={currentPage >= totalPages - 1}
              style={paginationBtnStyle}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
});

const paginationBtnStyle: React.CSSProperties = {
  padding: '3px 10px',
  border: '1px solid #dee2e6',
  borderRadius: 4,
  backgroundColor: '#f8f9fa',
  color: '#495057',
  fontSize: 10,
  cursor: 'pointer',
};

/** Evaluate conditional formatting rules for a cell */
function getCellConditionalStyle(
  cellValue: string,
  columnIndex: number,
  rules?: ConditionalFormatRule[],
): { backgroundColor?: string; textColor?: string; fontWeight?: string; icon?: string } {
  if (!rules || rules.length === 0) return {};

  for (const rule of rules) {
    // Rule applies to this column or to all columns (-1)
    if (rule.columnIndex !== -1 && rule.columnIndex !== columnIndex) continue;

    if (evaluateCondition(cellValue, rule)) {
      return {
        backgroundColor: rule.backgroundColor,
        textColor: rule.textColor,
        fontWeight: rule.fontWeight,
        icon: rule.icon,
      };
    }
  }
  return {};
}

function evaluateCondition(cellValue: string, rule: ConditionalFormatRule): boolean {
  const val = cellValue.trim();
  const ruleVal = (rule.value || '').trim();

  switch (rule.operator) {
    case 'equals':
      return val.toLowerCase() === ruleVal.toLowerCase();
    case 'notEquals':
      return val.toLowerCase() !== ruleVal.toLowerCase();
    case 'contains':
      return val.toLowerCase().includes(ruleVal.toLowerCase());
    case 'isEmpty':
      return val === '';
    case 'isNotEmpty':
      return val !== '';
    case 'greaterThan': {
      const numVal = parseFloat(val.replace(/[$,%]/g, ''));
      const numRule = parseFloat(ruleVal);
      return !isNaN(numVal) && !isNaN(numRule) && numVal > numRule;
    }
    case 'lessThan': {
      const numVal = parseFloat(val.replace(/[$,%]/g, ''));
      const numRule = parseFloat(ruleVal);
      return !isNaN(numVal) && !isNaN(numRule) && numVal < numRule;
    }
    case 'between': {
      const numVal = parseFloat(val.replace(/[$,%]/g, ''));
      const lo = parseFloat(ruleVal);
      const hi = parseFloat((rule.value2 || '').trim());
      return !isNaN(numVal) && !isNaN(lo) && !isNaN(hi) && numVal >= lo && numVal <= hi;
    }
    default:
      return false;
  }
}

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
        border: '1px solid #dee2e6',
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
          color: '#868e96',
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
        border: showBorder ? '1px solid #dee2e6' : undefined,
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
