# @reactcanvas/editor

Open-source dashboard builder for React. Build interactive dashboards like QuickSight/Tableau — fully embeddable, themeable, and backend-agnostic.

[Live Demo](https://canva-clone-demo.vercel.app)

## Install

```bash
npm install @reactcanvas/editor
```

Peer dependencies: `react >= 18.0.0` and `react-dom >= 18.0.0`

## Two Components, One Package

```jsx
// 1. Full editor — admins build dashboards
import { DesignEditor } from '@reactcanvas/editor';

// 2. Read-only viewer — end users see dashboards (lightweight import)
import { DashboardViewer } from '@reactcanvas/editor/viewer';
```

## Quick Start

### Dashboard Editor

```jsx
import { DesignEditor } from '@reactcanvas/editor';

function AdminPage() {
  return (
    <DesignEditor
      onAutoSave={(doc) => {
        fetch('/api/dashboards/my-dashboard', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(doc),
        });
      }}
    />
  );
}
```

### Dashboard Viewer

```jsx
import { DashboardViewer, createDefaultDocument } from '@reactcanvas/editor/viewer';

function CustomerPage({ customerId }) {
  return (
    <DashboardViewer
      document={createDefaultDocument()}
      documentUrl={`/api/dashboards/overview?customer=${customerId}`}
      token={getAuthToken()}
      interactive
      width="100%"
      height="700px"
    />
  );
}
```

### Pre-populate with Data

```jsx
import {
  createDefaultDocument,
  createChartElement,
  createKPIElement,
  createTableElement,
} from '@reactcanvas/editor';

const doc = createDefaultDocument();
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
    conditionalFormats: [
      { id: 'cf1', columnIndex: 1, operator: 'equals', value: 'Enterprise', backgroundColor: '#ebfbee', textColor: '#2b8a3e' },
    ],
  }),
);

<DesignEditor initialDocument={doc} />
```

## Features

### 12 Chart Types
Bar, line, area, pie, donut, scatter, radar, stacked bar, horizontal bar, funnel, treemap, heatmap — all powered by Chart.js with tooltips, legends, and filter highlighting.

### Dashboard Widgets
- **KPI cards** — metric display with trend indicators
- **Data tables** — sortable columns, pagination, conditional formatting (8 operators)
- **Progress gauges** — bar, circle, semicircle
- **Filter controls** — dropdown, search, date range
- **Embeds** — video, website, map via iframe

### Data Layer
- **REST API connectors** with auth (Bearer token, API key, Basic auth, custom headers)
- **CSV/JSON import** — paste or upload directly
- **Field mapping** — map API response fields to chart axes
- **Auto-refresh** — poll data sources at configurable intervals
- **Calculated fields** — sum, avg, min, max, median, custom math formulas
- **Database support** — connect to Postgres/MySQL/Redshift via SQL proxy (see examples/)

### Interactivity
- **Cross-widget filtering** — click a chart bar to filter all tables/KPIs on the page
- **Filter controls** — dropdown, search, and date range widgets
- **Drill-down navigation** — click a chart segment to navigate to a detail page with filter applied
- **Conditional formatting** — color table cells based on rules (equals, contains, greater than, between, etc.)
- **Sortable tables** — click column headers to sort (numeric-aware)
- **Pagination** — configurable page size for large tables

### Editor Capabilities
- **Drag & drop** — position widgets freely on the canvas
- **Resize & rotate** — handles on all elements
- **Multi-select** — Shift+click to select multiple widgets, bulk align/distribute
- **Undo/redo** — full history with Ctrl+Z / Ctrl+Shift+Z
- **Copy/paste** — Ctrl+C / Ctrl+V with clipboard support
- **Smart guides** — alignment snapping when dragging elements
- **Keyboard shortcuts** — full shortcut set (press `?` to see all)
- **Presentation mode** — fullscreen slide-by-slide presentation with keyboard navigation
- **Loading/error states** — spinner overlay while data sources fetch, error message with retry button
- **AI assistant** — generate dashboards via natural language (bring your own LLM API key)

### Dashboard Variables
Define `{{placeholder}}` variables in text, KPI values, chart titles, or data source URLs:

```jsx
// Admin defines variables in the editor's Variables panel
// Backend resolves them per customer:
import { populateDocument } from '@reactcanvas/editor/viewer';

const doc = populateDocument(template, widgetData, {
  customerId: '42',
  customerName: 'Acme Corp',
});

// Or resolve at viewer level:
<DashboardViewer document={template} variables={{ customerId: '42' }} />
```

### Theming
Match your brand:

```jsx
<DesignEditor
  theme={{
    primaryColor: '#FF6B00',
    accentColor: '#9333EA',
    fontFamily: 'Poppins, sans-serif',
    canvasBg: '#f5f0eb',
    panelBg: '#fffaf5',
    borderRadius: 12,
  }}
/>
```

### Export
- **PNG / JPG / SVG** — image export with DPI control
- **PDF** — print-ready export
- **CSV / Excel** — data export from all widgets
- **JSON** — save/load full documents
- **Embed code** — copy-paste React or HTML embed snippets

### Mobile Responsive
The `DashboardViewer` automatically stacks widgets vertically on small screens:

```jsx
<DashboardViewer
  document={doc}
  mobileBreakpoint={768}  // default, set to 0 to disable
/>
```

## Embedding Dashboards

### In a React App

```jsx
import { DashboardViewer } from '@reactcanvas/editor/viewer';

<DashboardViewer
  document={doc}
  interactive
  width="100%"
  height="600px"
  onFilterChange={(filters) => console.log(filters)}
  onWidgetClick={(id, type, name) => analytics.track('click', { name })}
/>
```

### Programmatic Control via Ref

```jsx
const viewerRef = useRef();

<DashboardViewer ref={viewerRef} document={doc} />

viewerRef.current.setFilter('region', 'US');
viewerRef.current.clearFilters();
viewerRef.current.goToPage(2);
viewerRef.current.refreshData();
```

### On Any Website (Vanilla JS)

```html
<div id="dashboard" style="width:100%;height:600px;"></div>
<script src="https://unpkg.com/@reactcanvas/editor/dist/embed.js"></script>
<script>
  const dashboard = await DashboardEmbed.render({
    target: '#dashboard',
    documentUrl: 'https://your-api.com/dashboards/123',
    token: 'auth-token',
    interactive: true,
    theme: { primaryColor: '#FF6B00' },
    variables: { customerId: '42' },
  });

  // Programmatic control
  dashboard.setFilter('region', 'US');
  dashboard.goToPage(1);
  dashboard.refreshData();
</script>
```

### Real-Time Updates (SSE)

```jsx
<DashboardViewer
  document={fallbackDoc}
  documentUrl="https://your-api.com/dashboards/123"
  streamUrl="https://your-api.com/dashboards/123/stream"
  token={authToken}
  onConnectionChange={(status) => console.log(status)} // 'connected' | 'disconnected' | 'error'
/>
```

## Backend Integration

The library is **backend-agnostic**. Your backend provides the data — the library renders it.

### Pattern 1: Inject Data into Templates

```typescript
// your-backend/routes/dashboards.ts
import { populateDocument } from '@reactcanvas/editor/viewer';

app.get('/api/dashboards/:id', async (req, res) => {
  const template = await db.getDashboard(req.params.id);
  const customerId = req.user.id;

  // Query your database
  const revenue = await redshift.query(
    'SELECT month, amount FROM revenue WHERE customer_id = $1',
    [customerId]
  );

  // Inject data into the template by widget name
  const doc = populateDocument(template, {
    'Revenue Chart': {
      data: revenue.rows.map(r => ({ label: r.month, value: r.amount })),
    },
    'Total Revenue': {
      value: '$' + revenue.rows.reduce((s, r) => s + r.amount, 0).toLocaleString(),
      trend: 'up',
      trendValue: '+18%',
    },
  }, {
    customerName: req.user.name, // resolves {{customerName}} in the template
  });

  res.json(doc);
});
```

### Pattern 2: REST API Data Sources

Widgets connect to your API directly via the Data Sources panel:
1. Admin configures a data source: URL, auth headers, field mapping
2. Widget polls the API at a configurable interval
3. Response data flows into charts/tables automatically

### Pattern 3: SQL Database (via Proxy)

See `examples/sql-proxy/` for a reference implementation that bridges the browser to Postgres/MySQL/Redshift.

## API Reference

### `<DesignEditor>` Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `initialDocument` | `Document` | blank | Pre-built document |
| `onChange` | `(doc) => void` | — | Called on every change |
| `onAutoSave` | `(doc) => void` | — | Debounced save callback |
| `autoSaveInterval` | `number` | `2000` | Auto-save debounce (ms) |
| `theme` | `Partial<EditorTheme>` | — | Custom theme |
| `showToolbar` | `boolean` | `true` | Show top toolbar |
| `showSidebar` | `boolean` | `true` | Show left sidebar |
| `showInspector` | `boolean` | `true` | Show right inspector |
| `onAISendMessage` | `function` | — | AI chat handler |

### `<DashboardViewer>` Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `document` | `Document` | required | Dashboard document |
| `documentUrl` | `string` | — | Fetch document from URL |
| `streamUrl` | `string` | — | SSE endpoint for real-time |
| `token` | `string` | — | Auth token (Bearer) |
| `variables` | `Record<string, string\|number>` | — | Template variable values |
| `theme` | `Partial<EditorTheme>` | — | Custom theme |
| `interactive` | `boolean` | `true` | Enable click-to-filter |
| `mobileBreakpoint` | `number` | `768` | Stack widgets below this width |
| `showPageNav` | `boolean` | `true` | Show page tabs |
| `pollInterval` | `number` | `0` | Polling fallback (ms) |
| `onFilterChange` | `(filters) => void` | — | Filter change callback |
| `onPageChange` | `(index, name) => void` | — | Page change callback |
| `onWidgetClick` | `(id, type, name) => void` | — | Widget click callback |
| `ref` | `DashboardViewerRef` | — | Programmatic API |

### `DashboardViewerRef` Methods

| Method | Description |
|--------|-------------|
| `setFilter(field, value)` | Apply a filter programmatically |
| `clearFilters()` | Remove all filters |
| `goToPage(index)` | Navigate to a page |
| `refreshData()` | Re-fetch from documentUrl |
| `getFilters()` | Get current active filters |
| `getCurrentPage()` | Get current page index |

### Factory Functions

```typescript
createDefaultDocument()           // Empty document
createChartElement(overrides)     // Chart (12 types)
createKPIElement(overrides)       // KPI metric card
createTableElement(overrides)     // Data table
createProgressElement(overrides)  // Progress gauge
createFilterControlElement(overrides) // Filter control
createEmbedElement(overrides)     // Embed iframe
```

### Backend Utilities

```typescript
// Inject data into a saved template
populateDocument(template, widgetData, variables?)

// Resolve {{variable}} placeholders
resolveVariables(doc, { key: 'value' })

// Find all {{variables}} used in a document
extractVariables(doc)  // → ['customerId', 'dateRange']

// Validate all variables have values
validateVariables(doc, values)  // → { valid: boolean, missing: string[] }

// Get widget names for data injection
getWidgetNames(doc)  // → [{ name: 'Revenue Chart', type: 'chart', id: '...' }]
```

## Templates

8 built-in templates available in the sidebar:
Blank, Dashboard, Presentation, Analytics, Sales, Marketing, Operations, Finance

## License

MIT
