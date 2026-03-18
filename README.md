# ReactCanvas Studio

Open-source dashboard builder and slide editor for React. Like QuickSight/Tableau, but embeddable in any React app.

## Install

```bash
npm install @reactcanvas/editor
```

## Usage

```jsx
// Full editor — users build dashboards
import { DesignEditor } from '@reactcanvas/editor';
<DesignEditor onChange={(doc) => save(doc)} />

// Read-only viewer — embed dashboards anywhere
import { DashboardViewer } from '@reactcanvas/editor';
<DashboardViewer document={doc} interactive />

// Real-time viewer — fetches from your API, live updates via SSE
<DashboardViewer
  document={fallbackDoc}
  documentUrl="https://your-api.com/dashboards/123"
  streamUrl="https://your-api.com/dashboards/123/stream"
  token="your-auth-token"
/>
```

See [packages/editor/README.md](packages/editor/README.md) for full API docs.

## Architecture

```
packages/          ← npm-publishable libraries
  editor/          — DesignEditor, DashboardViewer, all UI (the main package)
  core/            — Types, state, factories, data sources, filters
  react/           — React hooks (useEditor, useElements, useFilters, etc.)
  shapes/          — Shape elements plugin
  text/            — Text elements plugin
  images/          — Image elements plugin
  pages/           — Page management plugin
  export/          — Export handlers
  history/         — Undo/redo plugin
  plugins/         — Plugin registry

apps/              ← demo application
  demo/            — Demo app (Vite + React)

examples/          ← reference backend implementations (NOT part of the library)
  sql-proxy/       — Example SQL proxy for Postgres/MySQL/Redshift
  dashboard-server/— Example real-time server with SSE + JWT auth
```

The library is **backend-agnostic**. The `examples/` folder shows how to build a backend, but consumers use their own API/auth/database.

## Development

```bash
pnpm install
pnpm build
pnpm demo         # Start demo at localhost:5173
```

## License

MIT
