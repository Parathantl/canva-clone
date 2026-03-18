import React, { useCallback, useState } from 'react';
import { useElements, usePages } from '@reactcanvas/react';
import {
  createChartElement,
  createKPIElement,
  createTableElement,
  createProgressElement,
  createEmbedElement,
  createFilterControlElement,
} from '@reactcanvas/core';

interface WidgetItem {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  create: (layerOrder: number, cx: number, cy: number) => any;
}

const WIDGET_ITEMS: WidgetItem[] = [
  // Charts
  {
    id: 'bar-chart',
    name: 'Bar Chart',
    description: 'Vertical bar chart',
    icon: '\u2587\u2585\u2583\u2587',
    category: 'Charts',
    create: (lo, cx, cy) =>
      createChartElement({ chartType: 'bar', layerOrder: lo, x: cx - 240, y: cy - 160, name: 'Bar Chart' }),
  },
  {
    id: 'line-chart',
    name: 'Line Chart',
    description: 'Trend line chart',
    icon: '\u27CB',
    category: 'Charts',
    create: (lo, cx, cy) =>
      createChartElement({
        chartType: 'line',
        layerOrder: lo,
        x: cx - 240,
        y: cy - 160,
        name: 'Line Chart',
        title: 'Monthly Trend',
        data: [
          { label: 'Jan', value: 30 },
          { label: 'Feb', value: 45 },
          { label: 'Mar', value: 38 },
          { label: 'Apr', value: 62 },
          { label: 'May', value: 55 },
          { label: 'Jun', value: 78 },
        ],
      }),
  },
  {
    id: 'area-chart',
    name: 'Area Chart',
    description: 'Filled area chart',
    icon: '\u25E2',
    category: 'Charts',
    create: (lo, cx, cy) =>
      createChartElement({
        chartType: 'area',
        layerOrder: lo,
        x: cx - 240,
        y: cy - 160,
        name: 'Area Chart',
        title: 'Growth Over Time',
        data: [
          { label: 'W1', value: 20 },
          { label: 'W2', value: 35 },
          { label: 'W3', value: 28 },
          { label: 'W4', value: 50 },
          { label: 'W5', value: 42 },
          { label: 'W6', value: 65 },
        ],
      }),
  },
  {
    id: 'pie-chart',
    name: 'Pie Chart',
    description: 'Proportional pie chart',
    icon: '\u25D4',
    category: 'Charts',
    create: (lo, cx, cy) =>
      createChartElement({
        chartType: 'pie',
        layerOrder: lo,
        x: cx - 240,
        y: cy - 160,
        name: 'Pie Chart',
        title: 'Market Share',
        data: [
          { label: 'Product A', value: 40 },
          { label: 'Product B', value: 30 },
          { label: 'Product C', value: 20 },
          { label: 'Other', value: 10 },
        ],
      }),
  },
  {
    id: 'donut-chart',
    name: 'Donut Chart',
    description: 'Ring-style chart',
    icon: '\u25CE',
    category: 'Charts',
    create: (lo, cx, cy) =>
      createChartElement({
        chartType: 'donut',
        layerOrder: lo,
        x: cx - 240,
        y: cy - 160,
        name: 'Donut Chart',
        title: 'Distribution',
        data: [
          { label: 'Segment A', value: 45 },
          { label: 'Segment B', value: 25 },
          { label: 'Segment C', value: 30 },
        ],
      }),
  },

  {
    id: 'horizontal-bar-chart',
    name: 'Horizontal Bar',
    description: 'Horizontal bar chart',
    icon: '\u2590\u258C',
    category: 'Charts',
    create: (lo, cx, cy) =>
      createChartElement({
        chartType: 'horizontalBar' as any,
        layerOrder: lo,
        x: cx - 240,
        y: cy - 160,
        name: 'Horizontal Bar Chart',
        title: 'Top Categories',
        data: [
          { label: 'Electronics', value: 85 },
          { label: 'Clothing', value: 62 },
          { label: 'Food', value: 78 },
          { label: 'Books', value: 45 },
          { label: 'Sports', value: 55 },
        ],
      }),
  },
  {
    id: 'stacked-bar-chart',
    name: 'Stacked Bar',
    description: 'Stacked bar chart',
    icon: '\u2587\u2585',
    category: 'Charts',
    create: (lo, cx, cy) =>
      createChartElement({
        chartType: 'stackedBar' as any,
        layerOrder: lo,
        x: cx - 240,
        y: cy - 160,
        name: 'Stacked Bar Chart',
        title: 'Revenue vs Cost',
        showLegend: true,
        data: [],
        labels: ['Q1', 'Q2', 'Q3', 'Q4'],
        series: [
          { name: 'Revenue', data: [65, 85, 45, 95] },
          { name: 'Cost', data: [40, 55, 30, 60] },
        ],
      }),
  },
  {
    id: 'scatter-chart',
    name: 'Scatter Plot',
    description: 'Scatter plot chart',
    icon: '\u2022\u2022',
    category: 'Charts',
    create: (lo, cx, cy) =>
      createChartElement({
        chartType: 'scatter' as any,
        layerOrder: lo,
        x: cx - 240,
        y: cy - 160,
        name: 'Scatter Plot',
        title: 'Distribution',
        data: [
          { label: 'A', value: 65 },
          { label: 'B', value: 85 },
          { label: 'C', value: 45 },
          { label: 'D', value: 95 },
          { label: 'E', value: 55 },
          { label: 'F', value: 72 },
        ],
      }),
  },
  {
    id: 'radar-chart',
    name: 'Radar Chart',
    description: 'Radar / spider chart',
    icon: '\u25CB',
    category: 'Charts',
    create: (lo, cx, cy) =>
      createChartElement({
        chartType: 'radar' as any,
        layerOrder: lo,
        x: cx - 240,
        y: cy - 160,
        name: 'Radar Chart',
        title: 'Performance',
        showLegend: true,
        data: [
          { label: 'Speed', value: 80 },
          { label: 'Quality', value: 90 },
          { label: 'Cost', value: 65 },
          { label: 'Support', value: 75 },
          { label: 'Innovation', value: 85 },
        ],
      }),
  },
  {
    id: 'funnel-chart',
    name: 'Funnel',
    description: 'Conversion funnel',
    icon: '\u25BD',
    category: 'Charts',
    create: (lo, cx, cy) =>
      createChartElement({
        chartType: 'funnel' as any,
        layerOrder: lo,
        x: cx - 240,
        y: cy - 160,
        name: 'Funnel Chart',
        title: 'Sales Funnel',
        data: [
          { label: 'Visitors', value: 10000 },
          { label: 'Leads', value: 4200 },
          { label: 'Qualified', value: 1800 },
          { label: 'Proposals', value: 850 },
          { label: 'Closed', value: 320 },
        ],
      }),
  },
  {
    id: 'treemap-chart',
    name: 'Treemap',
    description: 'Proportional area chart',
    icon: '\u25A3',
    category: 'Charts',
    create: (lo, cx, cy) =>
      createChartElement({
        chartType: 'treemap' as any,
        layerOrder: lo,
        x: cx - 240,
        y: cy - 160,
        name: 'Treemap',
        title: 'Revenue by Product',
        data: [
          { label: 'Enterprise', value: 450 },
          { label: 'Business', value: 280 },
          { label: 'Starter', value: 120 },
          { label: 'Free Trial', value: 80 },
          { label: 'Add-ons', value: 60 },
          { label: 'Services', value: 45 },
        ],
      }),
  },
  {
    id: 'heatmap-chart',
    name: 'Heatmap',
    description: 'Matrix heatmap',
    icon: '\u2593',
    category: 'Charts',
    create: (lo, cx, cy) =>
      createChartElement({
        chartType: 'heatmap' as any,
        layerOrder: lo,
        x: cx - 240,
        y: cy - 180,
        width: 480,
        height: 360,
        name: 'Heatmap',
        title: 'Activity by Day & Hour',
        data: [],
        heatmapRows: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
        heatmapCols: ['9am', '10am', '11am', '12pm', '1pm', '2pm', '3pm', '4pm', '5pm'],
        heatmapData: [
          { row: 'Mon', col: '9am', value: 12 }, { row: 'Mon', col: '10am', value: 28 }, { row: 'Mon', col: '11am', value: 45 }, { row: 'Mon', col: '12pm', value: 32 }, { row: 'Mon', col: '1pm', value: 18 }, { row: 'Mon', col: '2pm', value: 38 }, { row: 'Mon', col: '3pm', value: 42 }, { row: 'Mon', col: '4pm', value: 35 }, { row: 'Mon', col: '5pm', value: 15 },
          { row: 'Tue', col: '9am', value: 15 }, { row: 'Tue', col: '10am', value: 35 }, { row: 'Tue', col: '11am', value: 52 }, { row: 'Tue', col: '12pm', value: 28 }, { row: 'Tue', col: '1pm', value: 22 }, { row: 'Tue', col: '2pm', value: 45 }, { row: 'Tue', col: '3pm', value: 48 }, { row: 'Tue', col: '4pm', value: 30 }, { row: 'Tue', col: '5pm', value: 12 },
          { row: 'Wed', col: '9am', value: 18 }, { row: 'Wed', col: '10am', value: 42 }, { row: 'Wed', col: '11am', value: 58 }, { row: 'Wed', col: '12pm', value: 35 }, { row: 'Wed', col: '1pm', value: 25 }, { row: 'Wed', col: '2pm', value: 50 }, { row: 'Wed', col: '3pm', value: 55 }, { row: 'Wed', col: '4pm', value: 40 }, { row: 'Wed', col: '5pm', value: 20 },
          { row: 'Thu', col: '9am', value: 14 }, { row: 'Thu', col: '10am', value: 32 }, { row: 'Thu', col: '11am', value: 48 }, { row: 'Thu', col: '12pm', value: 30 }, { row: 'Thu', col: '1pm', value: 20 }, { row: 'Thu', col: '2pm', value: 42 }, { row: 'Thu', col: '3pm', value: 45 }, { row: 'Thu', col: '4pm', value: 28 }, { row: 'Thu', col: '5pm', value: 10 },
          { row: 'Fri', col: '9am', value: 10 }, { row: 'Fri', col: '10am', value: 25 }, { row: 'Fri', col: '11am', value: 38 }, { row: 'Fri', col: '12pm', value: 22 }, { row: 'Fri', col: '1pm', value: 15 }, { row: 'Fri', col: '2pm', value: 32 }, { row: 'Fri', col: '3pm', value: 35 }, { row: 'Fri', col: '4pm', value: 20 }, { row: 'Fri', col: '5pm', value: 8 },
        ],
      } as any),
  },

  // KPI / Metrics
  {
    id: 'kpi-revenue',
    name: 'Revenue Card',
    description: 'Revenue KPI with trend',
    icon: '$',
    category: 'Metrics',
    create: (lo, cx, cy) =>
      createKPIElement({ layerOrder: lo, x: cx - 130, y: cy - 70, name: 'Revenue KPI' }),
  },
  {
    id: 'kpi-users',
    name: 'Users Card',
    description: 'Active users metric',
    icon: '\u263A',
    category: 'Metrics',
    create: (lo, cx, cy) =>
      createKPIElement({
        layerOrder: lo,
        x: cx - 130,
        y: cy - 70,
        name: 'Users KPI',
        value: '8,240',
        label: 'Active Users',
        prefix: '',
        trend: 'up',
        trendValue: '+5.2%',
        trendColor: '#50C878',
      }),
  },
  {
    id: 'kpi-conversion',
    name: 'Conversion Card',
    description: 'Conversion rate metric',
    icon: '%',
    category: 'Metrics',
    create: (lo, cx, cy) =>
      createKPIElement({
        layerOrder: lo,
        x: cx - 130,
        y: cy - 70,
        name: 'Conversion KPI',
        value: '3.24',
        label: 'Conversion Rate',
        prefix: '',
        suffix: '%',
        trend: 'down',
        trendValue: '-0.8%',
        trendColor: '#E8596D',
      }),
  },

  // Tables
  {
    id: 'data-table',
    name: 'Data Table',
    description: 'Tabular data display',
    icon: '\u2630',
    category: 'Tables',
    create: (lo, cx, cy) =>
      createTableElement({ layerOrder: lo, x: cx - 260, y: cy - 120, name: 'Data Table' }),
  },
  {
    id: 'leaderboard',
    name: 'Leaderboard',
    description: 'Ranked list table',
    icon: '\u2605',
    category: 'Tables',
    create: (lo, cx, cy) =>
      createTableElement({
        layerOrder: lo,
        x: cx - 260,
        y: cy - 120,
        name: 'Leaderboard',
        headers: ['Rank', 'Name', 'Score', 'Status'],
        rows: [
          ['1', 'Team Alpha', '2,450', 'Leading'],
          ['2', 'Team Beta', '2,280', 'Rising'],
          ['3', 'Team Gamma', '1,950', 'Stable'],
          ['4', 'Team Delta', '1,720', 'Declining'],
        ],
        headerBg: '#4A90D9',
      }),
  },

  // Progress
  {
    id: 'progress-bar',
    name: 'Progress Bar',
    description: 'Horizontal progress bar',
    icon: '\u25AC',
    category: 'Progress',
    create: (lo, cx, cy) =>
      createProgressElement({ layerOrder: lo, x: cx - 130, y: cy - 70, name: 'Progress Bar' }),
  },
  {
    id: 'progress-circle',
    name: 'Circular Gauge',
    description: 'Circular progress indicator',
    icon: '\u25CB',
    category: 'Progress',
    create: (lo, cx, cy) =>
      createProgressElement({
        layerOrder: lo,
        x: cx - 90,
        y: cy - 90,
        width: 180,
        height: 180,
        name: 'Circular Gauge',
        progressStyle: 'circle',
        value: 68,
        label: 'Health Score',
        thickness: 10,
      }),
  },
  {
    id: 'progress-semi',
    name: 'Semicircle Gauge',
    description: 'Half-circle gauge',
    icon: '\u25E0',
    category: 'Progress',
    create: (lo, cx, cy) =>
      createProgressElement({
        layerOrder: lo,
        x: cx - 110,
        y: cy - 80,
        width: 220,
        height: 160,
        name: 'Semicircle Gauge',
        progressStyle: 'semicircle',
        value: 85,
        label: 'Satisfaction',
        thickness: 12,
        fillColor: '#50C878',
      }),
  },

  // Embeds
  {
    id: 'embed-video',
    name: 'Video',
    description: 'Embed a video',
    icon: '\u25B6',
    category: 'Embeds',
    create: (lo, cx, cy) =>
      createEmbedElement({
        layerOrder: lo,
        x: cx - 240,
        y: cy - 160,
        name: 'Video',
        embedType: 'video',
      }),
  },
  {
    id: 'embed-website',
    name: 'Website',
    description: 'Embed a webpage',
    icon: '\u2302',
    category: 'Embeds',
    create: (lo, cx, cy) =>
      createEmbedElement({
        layerOrder: lo,
        x: cx - 240,
        y: cy - 160,
        name: 'Website',
        embedType: 'website',
      }),
  },

  // Filter Controls
  {
    id: 'filter-dropdown',
    name: 'Dropdown Filter',
    description: 'Dropdown filter control',
    icon: '\u25BC',
    category: 'Filters',
    create: (lo, cx, cy) =>
      createFilterControlElement({
        layerOrder: lo,
        x: cx - 120,
        y: cy - 24,
        width: 240,
        height: 56,
        name: 'Dropdown Filter',
        controlType: 'dropdown',
        label: 'Category',
        filterField: 'category',
        options: ['All', 'Sales', 'Marketing', 'Engineering', 'Support'],
        placeholder: 'Select category...',
      }),
  },
  {
    id: 'filter-search',
    name: 'Search Filter',
    description: 'Text search filter',
    icon: '\u2315',
    category: 'Filters',
    create: (lo, cx, cy) =>
      createFilterControlElement({
        layerOrder: lo,
        x: cx - 120,
        y: cy - 24,
        width: 240,
        height: 56,
        name: 'Search Filter',
        controlType: 'search',
        label: 'Search',
        filterField: 'name',
        placeholder: 'Type to search...',
      }),
  },
  {
    id: 'filter-daterange',
    name: 'Date Range',
    description: 'Date range filter',
    icon: '\u2630',
    category: 'Filters',
    create: (lo, cx, cy) =>
      createFilterControlElement({
        layerOrder: lo,
        x: cx - 160,
        y: cy - 24,
        width: 320,
        height: 56,
        name: 'Date Range',
        controlType: 'dateRange',
        label: 'Date Range',
        filterField: 'date',
        placeholder: '',
      }),
  },
];

const CATEGORIES = ['Charts', 'Metrics', 'Tables', 'Progress', 'Filters', 'Embeds'];

export function WidgetLibrary() {
  const { addElement, elements } = useElements();
  const { activePage } = usePages();
  const [activeCategory, setActiveCategory] = useState('Charts');
  const [searchQuery, setSearchQuery] = useState('');

  const handleAddWidget = useCallback(
    (item: WidgetItem) => {
      const cx = (activePage?.width ?? 1920) / 2;
      const cy = (activePage?.height ?? 1080) / 2;
      const element = item.create(elements.length, cx, cy);
      addElement(element);
    },
    [addElement, elements.length, activePage]
  );

  const filteredItems = WIDGET_ITEMS.filter((item) => {
    const matchCategory = item.category === activeCategory;
    const matchSearch = searchQuery
      ? item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase())
      : true;
    return matchCategory && matchSearch;
  });

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <span style={styles.title}>Widgets</span>
      </div>

      {/* Search */}
      <div style={styles.searchWrap}>
        <input
          type="text"
          placeholder="Search widgets..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={styles.searchInput}
        />
      </div>

      {/* Category tabs */}
      <div style={styles.tabs}>
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            style={{
              ...styles.tab,
              ...(activeCategory === cat ? styles.tabActive : {}),
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Widget grid */}
      <div style={styles.grid}>
        {filteredItems.map((item) => (
          <button
            key={item.id}
            onClick={() => handleAddWidget(item)}
            style={styles.widgetCard}
            title={item.description}
          >
            <div style={styles.widgetIcon}>{item.icon}</div>
            <div style={styles.widgetName}>{item.name}</div>
          </button>
        ))}
        {filteredItems.length === 0 && (
          <div style={styles.empty}>No widgets found</div>
        )}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    overflow: 'hidden',
  },
  header: {
    padding: '10px 14px 8px',
  },
  title: {
    color: '#868e96',
    fontSize: 10,
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '1px',
  },
  searchWrap: {
    padding: '4px 12px 8px',
  },
  searchInput: {
    width: '100%',
    height: 32,
    border: '1px solid #dee2e6',
    borderRadius: 8,
    backgroundColor: '#f8f9fa',
    color: '#212529',
    fontSize: 12,
    padding: '0 10px',
    outline: 'none',
    boxSizing: 'border-box',
    transition: 'border-color 0.12s',
  },
  tabs: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 3,
    padding: '0 12px 8px',
  },
  tab: {
    border: 'none',
    borderRadius: 6,
    backgroundColor: 'transparent',
    color: '#868e96',
    fontSize: 10,
    fontWeight: 600,
    padding: '5px 8px',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    transition: 'all 0.12s',
    letterSpacing: '0.2px',
  },
  tabActive: {
    backgroundColor: '#f8f9fa',
    color: '#4A90D9',
  },
  grid: {
    flex: 1,
    overflow: 'auto',
    padding: '0 12px 12px',
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 6,
    alignContent: 'start',
  },
  widgetCard: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    padding: '14px 8px',
    backgroundColor: '#f8f9fa',
    border: '1px solid #dee2e6',
    borderRadius: 10,
    cursor: 'pointer',
    transition: 'all 0.12s',
  },
  widgetIcon: {
    fontSize: 20,
    lineHeight: 1,
    color: '#4A90D9',
  },
  widgetName: {
    fontSize: 10,
    color: '#495057',
    fontWeight: 600,
    textAlign: 'center',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    maxWidth: '100%',
  },
  empty: {
    gridColumn: '1 / -1',
    textAlign: 'center',
    color: '#868e96',
    fontSize: 12,
    padding: '24px 0',
  },
};
