# ReactCanvas Studio

Open-source dashboard builder for React. Like QuickSight/Tableau, but embeddable in any React app.

[Live Demo](https://canva-clone-demo.vercel.app) | [API Docs](packages/editor/README.md)

## What is this?

A React component library that gives your app a full dashboard builder:

- **Admin** installs the editor, builds dashboards visually
- **Backend** queries your database, injects data into the saved template
- **End user** sees an interactive, real-time dashboard embedded in your app

```
npm install @reactcanvas/editor
```

```jsx
// Admin page — full editor
import { DesignEditor } from '@reactcanvas/editor';
<DesignEditor onAutoSave={(doc) => saveToDb(doc)} />

// Customer page — read-only viewer
import { DashboardViewer } from '@reactcanvas/editor/viewer';
<DashboardViewer
  document={fallbackDoc}
  documentUrl="/api/dashboards/overview"
  token={authToken}
  interactive
/>
```

## Key Features

| Category | What's included |
|----------|----------------|
| **Charts** | 12 types — bar, line, area, pie, donut, scatter, radar, stacked, horizontal, funnel, treemap, heatmap |
| **Widgets** | KPI cards, sortable/paginated tables, conditional formatting, progress gauges, filter controls, embeds |
| **Data** | REST API connectors with auth, CSV import, field mapping, auto-refresh, calculated fields, SQL proxy |
| **Interactivity** | Cross-widget filtering, drill-down between pages, filter controls (dropdown/search/date) |
| **Variables** | `{{placeholder}}` system with editor UI, auto-scan, backend resolution |
| **Theming** | Full theme API — colors, fonts, radius — on both editor and viewer |
| **Export** | PNG, JPG, SVG, PDF, CSV, Excel, JSON, embed code generator |
| **Embedding** | React component, vanilla JS script, SSE real-time sync, token auth, programmatic API |
| **Mobile** | Responsive viewer — widgets stack vertically below breakpoint |
| **Templates** | 8 built-in — Blank, Dashboard, Presentation, Analytics, Sales, Marketing, Ops, Finance |

## How It Works

### 1. Admin builds a dashboard

```jsx
<DesignEditor
  onAutoSave={(doc) => {
    fetch('/api/dashboards/customer-overview', {
      method: 'PUT',
      body: JSON.stringify(doc),
    });
  }}
/>
```

### 2. Your backend injects customer data

```typescript
import { populateDocument } from '@reactcanvas/editor/viewer';

app.get('/api/dashboards/customer-overview', async (req, res) => {
  const template = await db.getDashboard('customer-overview');
  const revenue = await redshift.query('SELECT month, amount FROM revenue WHERE customer_id = $1', [req.user.id]);

  const doc = populateDocument(template, {
    'Revenue Chart': { data: revenue.rows.map(r => ({ label: r.month, value: r.amount })) },
    'Total Revenue': { value: '$42,800', trend: 'up', trendValue: '+18%' },
  }, {
    customerName: req.user.name,
  });

  res.json(doc);
});
```

### 3. Customer sees their dashboard

```jsx
<DashboardViewer
  document={createDefaultDocument()}
  documentUrl="/api/dashboards/customer-overview"
  token={authToken}
  interactive
  variables={{ customerId: user.id }}
  theme={{ primaryColor: '#FF6B00' }}
/>
```

## Project Structure

```
packages/           ← npm-publishable libraries
  editor/           — DesignEditor + DashboardViewer (the main package)
  core/             — Types, state, factories, data sources, filters
  react/            — React hooks

apps/
  demo/             — Live demo (deployed on Vercel)

examples/           ← Reference backend implementations (NOT part of library)
  sql-proxy/        — SQL proxy for Postgres/MySQL/Redshift
  dashboard-server/ — Real-time server with SSE + JWT
```

## Development

```bash
pnpm install
pnpm build
pnpm demo         # localhost:5173
```

## Full Documentation

See [packages/editor/README.md](packages/editor/README.md) for complete API docs, all props, factory functions, backend patterns, and embed options.

## License

MIT
