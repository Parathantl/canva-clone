# @reactcanvas/editor

A customizable dashboard builder and slide editor for React. Build interactive dashboards like QuickSight/Tableau, or presentation slides like Canva — fully embeddable in any React app.

## Install

```bash
npm install @reactcanvas/editor
# or
pnpm add @reactcanvas/editor
# or
yarn add @reactcanvas/editor
```

**Peer dependencies:** React 18+ and React DOM 18+

## Quick Start

### Full Editor (users build dashboards)

```jsx
import { DesignEditor } from '@reactcanvas/editor';

function App() {
  return (
    <DesignEditor
      onChange={(doc) => console.log('Document changed:', doc)}
      onAutoSave={(doc) => saveToDatabase(doc)}
      showToolbar={true}
      showSidebar={true}
      showInspector={true}
    />
  );
}
```

### Read-Only Viewer (embed dashboards)

```jsx
import { DashboardViewer } from '@reactcanvas/editor';

function EmbedPage({ dashboardData }) {
  return (
    <DashboardViewer
      document={dashboardData}
      interactive={true}
      width="100%"
      height="600px"
    />
  );
}
```

### Pre-populate with Data

```jsx
import {
  DesignEditor,
  createDefaultDocument,
  createChartElement,
  createKPIElement,
  createTableElement,
} from '@reactcanvas/editor';

const doc = createDefaultDocument();
doc.name = 'Sales Dashboard';
const page = doc.pages[0];

page.elements.push(
  createKPIElement({
    x: 60, y: 40, width: 280, height: 130,
    value: '$48.2K', label: 'Revenue', trend: 'up', trendValue: '+12%',
  }),
  createChartElement({
    x: 60, y: 200, width: 600, height: 340,
    chartType: 'bar',
    title: 'Monthly Revenue',
    data: [
      { label: 'Jan', value: 32 },
      { label: 'Feb', value: 38 },
      { label: 'Mar', value: 45 },
    ],
  }),
  createTableElement({
    x: 60, y: 570, width: 600, height: 280,
    headers: ['Account', 'Plan', 'MRR'],
    rows: [
      ['Acme Corp', 'Enterprise', '$12,400'],
      ['TechFlow', 'Business', '$8,200'],
    ],
  }),
);

function App() {
  return <DesignEditor initialDocument={doc} />;
}
```

## Features

### Dashboard Widgets
- **12 chart types** — bar, line, area, pie, donut, scatter, radar, stacked bar, horizontal bar, funnel, treemap, heatmap
- **KPI cards** — metric display with trend indicators
- **Data tables** — sortable columns, pagination, conditional formatting
- **Progress gauges** — bar, circle, semicircle
- **Filter controls** — dropdown, search, date range
- **Embeds** — video, website, map via iframe

### Data
- **CSV/JSON import** — paste or upload data directly
- **REST API connectors** — connect to any API with auth (Bearer, API key, Basic)
- **Field mapping** — map API response fields to chart axes
- **Auto-refresh** — poll data sources at configurable intervals
- **Calculated fields** — sum, avg, min, max, median, custom formulas
- **SQL database support** — via optional SQL proxy server (Postgres, MySQL)

### Interactivity
- **Cross-widget filtering** — click a chart bar to filter tables/KPIs on the same page
- **Filter controls** — dropdown, search, and date range widgets
- **Conditional formatting** — color table cells based on rules (equals, contains, greater than, etc.)
- **Sortable tables** — click column headers to sort
- **Pagination** — configurable page size for large tables

### Editor
- **Drag & drop** — position widgets freely on the canvas
- **Resize & rotate** — handles on all elements
- **Multi-select** — Shift+click to select multiple widgets
- **Undo/redo** — full history with Ctrl+Z / Ctrl+Shift+Z
- **Copy/paste** — Ctrl+C / Ctrl+V
- **Smart guides** — alignment snapping
- **Keyboard shortcuts** — full shortcut set (press ? to see)
- **AI assistant** — generate dashboards via natural language (bring your own LLM key)

### Export
- **PNG / JPG / SVG** — image export with DPI control
- **PDF** — print-ready export
- **CSV / Excel** — data export from all widgets
- **JSON** — save/load full documents
- **Embed code** — copy-paste React or HTML embed snippets

### Embedding
- **React component** — `<DashboardViewer>` for read-only display
- **Vanilla JS** — script tag embed for any website
- **Real-time sync** — SSE-based live updates via dashboard server
- **Token auth** — JWT-based access control for embeds

## API Reference

### `<DesignEditor>` Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `initialDocument` | `Document` | blank | Pre-built document with data |
| `onChange` | `(doc: Document) => void` | — | Called on every change |
| `onAutoSave` | `(doc: Document) => void` | — | Debounced save callback |
| `autoSaveInterval` | `number` | `2000` | Auto-save debounce (ms) |
| `onImageUpload` | `(blob, filename) => Promise<string>` | — | Upload handler for export |
| `onAISendMessage` | `(msg, history, onChunk) => Promise<string>` | — | AI chat handler |
| `showToolbar` | `boolean` | `true` | Show top toolbar |
| `showSidebar` | `boolean` | `true` | Show left sidebar |
| `showInspector` | `boolean` | `true` | Show right inspector |

### `<DashboardViewer>` Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `document` | `Document` | required | Dashboard document |
| `interactive` | `boolean` | `true` | Enable click-to-filter |
| `showPageNav` | `boolean` | `true` | Show page tabs |
| `width` | `string \| number` | `'100%'` | Container width |
| `height` | `string \| number` | `'100%'` | Container height |
| `serverUrl` | `string` | — | Dashboard server URL for real-time |
| `dashboardId` | `string` | — | Dashboard ID on server |
| `token` | `string` | — | JWT embed token |
| `realtime` | `boolean` | `true` | Enable SSE live updates |

### Factory Functions

```typescript
createDefaultDocument()          // Empty document
createChartElement(overrides)    // Chart widget
createKPIElement(overrides)      // KPI metric card
createTableElement(overrides)    // Data table
createProgressElement(overrides) // Progress gauge
createFilterControlElement(overrides) // Filter control
createEmbedElement(overrides)    // Embed iframe
```

### Vanilla JS Embed

```html
<div id="dashboard" style="width:100%;height:600px;"></div>
<script src="https://unpkg.com/@reactcanvas/editor/dist/embed.js"></script>
<script>
  DashboardEmbed.render({
    target: '#dashboard',
    documentUrl: '/api/dashboards/my-dashboard.json',
    interactive: true,
  });
</script>
```

## Dashboard Server (optional)

For real-time embeds, run the dashboard server:

```bash
cd apps/dashboard-server
pnpm install && pnpm dev
```

See `apps/dashboard-server/` for configuration and API docs.

## License

MIT
