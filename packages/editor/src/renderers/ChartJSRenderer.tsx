import { memo, useMemo, useCallback, useRef } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  RadialLinearScale,
  Filler,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import type { ChartEvent, ActiveElement } from 'chart.js';
import { Bar, Line, Pie, Doughnut, Scatter, Radar } from 'react-chartjs-2';
import type { ChartElement as ChartElementType, ChartDataSeries } from '@reactcanvas/core';
import { FunnelChart, HeatmapChart, TreemapChart } from './CustomCharts';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  RadialLinearScale,
  Filler,
  Title,
  Tooltip,
  Legend
);

// Disable all animations globally for better canvas performance
ChartJS.defaults.animation = false as const;

interface DatasetEntry {
  label: string;
  data: number[];
  backgroundColor: string | string[];
  borderColor: string | string[];
}

export interface ChartFilterEvent {
  elementId: string;
  label: string;
  field: string;
  value: string;
}

export interface ChartJSContentProps {
  element: ChartElementType;
  /** Active filter values to highlight (field → Set of values) */
  activeFilterValues?: Set<string>;
  /** Called when user clicks a data point to create/toggle a filter */
  onFilterClick?: (event: ChartFilterEvent) => void;
  /** Called when user clicks a data point and drill-down is configured */
  onDrillDown?: (targetPageId: string, field: string, value: string) => void;
}

export const ChartJSContent = memo(function ChartJSContent({
  element,
  activeFilterValues,
  onFilterClick,
  onDrillDown,
}: ChartJSContentProps) {
  const {
    chartType, data, labels: multiLabels, series,
    title, showLegend, showLabels, showGrid, showTooltips,
    colors, backgroundColor, borderRadius,
  } = element;

  // Derive labels and datasets from either multi-series or single data
  const { chartLabels, datasets } = useMemo(() => {
    // Multi-series mode
    if (series && series.length > 0 && multiLabels && multiLabels.length > 0) {
      return {
        chartLabels: multiLabels,
        datasets: series.map((s: ChartDataSeries, i: number) => ({
          label: s.name,
          data: s.data,
          backgroundColor: s.color || colors[i % colors.length],
          borderColor: s.color || colors[i % colors.length],
        })),
      };
    }
    // Single data array mode (backwards compatible)
    return {
      chartLabels: data.map((d) => d.label),
      datasets: [{
        label: title || 'Data',
        data: data.map((d) => d.value),
        backgroundColor: data.map((d, i) => d.color || colors[i % colors.length]),
        borderColor: data.map((d, i) => d.color || colors[i % colors.length]),
      }],
    };
  }, [data, multiLabels, series, colors, title]);

  // Handle click on chart data points to trigger filtering or drill-down
  const handleChartClick = useCallback((_event: ChartEvent, activeElements: ActiveElement[]) => {
    if (activeElements.length === 0) return;
    const el = activeElements[0];
    const label = chartLabels[el.index] ?? '';
    if (!label) return;

    // Drill-down navigation takes priority if configured
    if (element.drillDownPageId && onDrillDown) {
      onDrillDown(element.drillDownPageId, element.drillDownField || 'label', String(label));
      return;
    }

    if (!onFilterClick) return;
    onFilterClick({
      elementId: element.id,
      label: `${title || 'Chart'}: ${label}`,
      field: 'label',
      value: String(label),
    });
  }, [onFilterClick, onDrillDown, chartLabels, element.id, element.drillDownPageId, element.drillDownField, title]);

  // Keep a stable ref to the click handler so commonOptions doesn't change every render
  const clickHandlerRef = useRef(handleChartClick);
  clickHandlerRef.current = handleChartClick;

  // Dim non-filtered bars/slices when a filter is active
  const applyFilterHighlight = useCallback((baseColors: string | string[]): string | string[] => {
    if (!activeFilterValues || activeFilterValues.size === 0) return baseColors;
    if (Array.isArray(baseColors)) {
      return baseColors.map((c, i) => {
        const label = String(chartLabels[i] ?? '');
        return activeFilterValues.has(label) ? c : hexToRgba(c, 0.2);
      });
    }
    return baseColors;
  }, [activeFilterValues, chartLabels]);

  const commonOptions = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    animation: false as const,
    onClick: (...args: [ChartEvent, ActiveElement[]]) => clickHandlerRef.current?.(...args),
    plugins: {
      legend: {
        display: showLegend,
        position: 'top' as const,
        labels: {
          font: { family: 'Inter, -apple-system, sans-serif', size: 11 },
          color: '#6c757d',
          padding: 12,
          usePointStyle: true,
          pointStyleWidth: 8,
        },
      },
      tooltip: {
        enabled: showTooltips !== false,
        backgroundColor: '#1e293b',
        titleFont: { family: 'Inter, -apple-system, sans-serif', size: 12 },
        bodyFont: { family: 'Inter, -apple-system, sans-serif', size: 11 },
        padding: 10,
        cornerRadius: 8,
        displayColors: true,
      },
    },
  }), [showLegend, showTooltips]);

  const axisOptions = useMemo(() => ({
    scales: {
      x: {
        display: showLabels,
        grid: { display: showGrid, color: 'rgba(222,226,230,0.5)' },
        ticks: {
          font: { family: 'Inter, -apple-system, sans-serif', size: 10 },
          color: '#868e96',
        },
      },
      y: {
        display: true,
        grid: { display: showGrid, color: 'rgba(222,226,230,0.5)' },
        ticks: {
          font: { family: 'Inter, -apple-system, sans-serif', size: 10 },
          color: '#868e96',
        },
        beginAtZero: true,
      },
    },
  }), [showLabels, showGrid]);

  const renderChart = () => {
    switch (chartType) {
      case 'bar':
      case 'stackedBar':
        return (
          <Bar
            data={{ labels: chartLabels, datasets: datasets.map((ds: DatasetEntry) => ({
              ...ds,
              backgroundColor: applyFilterHighlight(ds.backgroundColor),
              borderRadius: 4,
              borderWidth: 0,
              maxBarThickness: 60,
            })) }}
            options={{
              ...commonOptions,
              ...axisOptions,
              ...(chartType === ('stackedBar' as string) ? {
                scales: {
                  ...axisOptions.scales,
                  x: { ...axisOptions.scales.x, stacked: true },
                  y: { ...axisOptions.scales.y, stacked: true },
                },
              } : {}),
            }}
          />
        );

      case 'horizontalBar':
        return (
          <Bar
            data={{ labels: chartLabels, datasets: datasets.map((ds: DatasetEntry) => ({
              ...ds,
              backgroundColor: applyFilterHighlight(ds.backgroundColor),
              borderRadius: 4,
              borderWidth: 0,
            })) }}
            options={{
              ...commonOptions,
              indexAxis: 'y' as const,
              scales: {
                x: {
                  display: true,
                  grid: { display: showGrid, color: 'rgba(222,226,230,0.5)' },
                  ticks: { font: { family: 'Inter, -apple-system, sans-serif', size: 10 }, color: '#868e96' },
                  beginAtZero: true,
                },
                y: {
                  display: showLabels,
                  grid: { display: false },
                  ticks: { font: { family: 'Inter, -apple-system, sans-serif', size: 10 }, color: '#868e96' },
                },
              },
            }}
          />
        );

      case 'line':
      case 'area':
        return (
          <Line
            data={{ labels: chartLabels, datasets: datasets.map((ds: DatasetEntry, i: number) => ({
              ...ds,
              borderWidth: 2.5,
              pointRadius: 4,
              pointHoverRadius: 6,
              pointBackgroundColor: '#fff',
              pointBorderColor: typeof ds.borderColor === 'string' ? ds.borderColor : colors[i % colors.length],
              pointBorderWidth: 2,
              borderColor: typeof ds.borderColor === 'string' ? ds.borderColor : colors[i % colors.length],
              backgroundColor: chartType === 'area'
                ? hexToRgba(typeof ds.backgroundColor === 'string' ? ds.backgroundColor : colors[i % colors.length], 0.15)
                : 'transparent',
              fill: chartType === 'area',
              tension: 0.3,
            })) }}
            options={{ ...commonOptions, ...axisOptions }}
          />
        );

      case 'pie':
        return (
          <Pie
            data={{
              labels: chartLabels,
              datasets: [{
                data: datasets[0].data,
                backgroundColor: applyFilterHighlight(datasets[0].backgroundColor),
                borderColor: '#fff',
                borderWidth: 2,
                hoverOffset: 8,
              }],
            }}
            options={{
              ...commonOptions,
              plugins: {
                ...commonOptions.plugins,
                legend: {
                  ...commonOptions.plugins.legend,
                  display: true,
                  position: 'right' as const,
                },
              },
            }}
          />
        );

      case 'donut':
        return (
          <Doughnut
            data={{
              labels: chartLabels,
              datasets: [{
                data: datasets[0].data,
                backgroundColor: applyFilterHighlight(datasets[0].backgroundColor),
                borderColor: '#fff',
                borderWidth: 2,
                hoverOffset: 8,
              }],
            }}
            options={{
              ...commonOptions,
              cutout: '60%',
              plugins: {
                ...commonOptions.plugins,
                legend: {
                  ...commonOptions.plugins.legend,
                  display: true,
                  position: 'right' as const,
                },
              },
            }}
          />
        );

      case 'scatter':
        return (
          <Scatter
            data={{
              datasets: datasets.map((ds: DatasetEntry, i: number) => ({
                label: ds.label,
                data: (ds.data as number[]).map((v: number, j: number) => ({ x: j, y: v })),
                backgroundColor: typeof ds.backgroundColor === 'string' ? ds.backgroundColor : colors[i % colors.length],
                pointRadius: 5,
                pointHoverRadius: 7,
              })),
            }}
            options={{
              ...commonOptions,
              scales: {
                x: {
                  display: true,
                  grid: { display: showGrid, color: 'rgba(222,226,230,0.5)' },
                  ticks: { font: { family: 'Inter, -apple-system, sans-serif', size: 10 }, color: '#868e96' },
                },
                y: {
                  display: true,
                  grid: { display: showGrid, color: 'rgba(222,226,230,0.5)' },
                  ticks: { font: { family: 'Inter, -apple-system, sans-serif', size: 10 }, color: '#868e96' },
                  beginAtZero: true,
                },
              },
            }}
          />
        );

      case 'radar':
        return (
          <Radar
            data={{
              labels: chartLabels,
              datasets: datasets.map((ds: DatasetEntry, i: number) => ({
                label: ds.label,
                data: ds.data,
                backgroundColor: hexToRgba(typeof ds.backgroundColor === 'string' ? ds.backgroundColor : colors[i % colors.length], 0.2),
                borderColor: typeof ds.borderColor === 'string' ? ds.borderColor : colors[i % colors.length],
                borderWidth: 2,
                pointBackgroundColor: typeof ds.borderColor === 'string' ? ds.borderColor : colors[i % colors.length],
                pointRadius: 3,
              })),
            }}
            options={{
              ...commonOptions,
              scales: {
                r: {
                  beginAtZero: true,
                  grid: { color: 'rgba(222,226,230,0.5)' },
                  angleLines: { color: 'rgba(222,226,230,0.5)' },
                  ticks: {
                    font: { size: 9 },
                    color: '#868e96',
                    backdropColor: 'transparent',
                  },
                  pointLabels: {
                    font: { family: 'Inter, -apple-system, sans-serif', size: 10 },
                    color: '#6c757d',
                  },
                },
              },
            }}
          />
        );

      case 'funnel':
        return <FunnelChart data={data} colors={colors} showLabels={showLabels} />;

      case 'heatmap':
        return (
          <HeatmapChart
            heatmapData={element.heatmapData ?? []}
            heatmapRows={element.heatmapRows ?? []}
            heatmapCols={element.heatmapCols ?? []}
            showLabels={showLabels}
          />
        );

      case 'treemap':
        return <TreemapChart data={data} colors={colors} showLabels={showLabels} />;

      default:
        return null;
    }
  };

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
        border: '1px solid #dee2e6',
        overflow: 'hidden',
      }}
    >
      {title && (
        <div style={{ fontSize: 14, fontWeight: 600, color: '#1e293b', marginBottom: 8, flexShrink: 0 }}>
          {title}
        </div>
      )}
      <div style={{ flex: 1, minHeight: 0, position: 'relative' }}>
        {renderChart()}
      </div>
    </div>
  );
});

function hexToRgba(hex: string, alpha: number): string {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.substring(0, 2), 16);
  const g = parseInt(clean.substring(2, 4), 16);
  const b = parseInt(clean.substring(4, 6), 16);
  if (isNaN(r) || isNaN(g) || isNaN(b)) return `rgba(74,144,217,${alpha})`;
  return `rgba(${r},${g},${b},${alpha})`;
}
