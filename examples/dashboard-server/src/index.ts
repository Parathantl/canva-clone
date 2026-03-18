import express from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';

const app = express();
app.use(cors({ origin: '*' })); // Allow all origins for embeds
app.use(express.json({ limit: '50mb' }));

const PORT = parseInt(process.env.PORT || '3002', 10);
const JWT_SECRET = process.env.JWT_SECRET || 'dashboard-embed-secret-change-in-production';
const ADMIN_KEY = process.env.ADMIN_KEY || ''; // API key for admin operations
const DATA_DIR = process.env.DATA_DIR || path.join(process.cwd(), 'data');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// ─── SSE Client Management ──────────────────────────────────────────

interface SSEClient {
  id: string;
  dashboardId: string;
  res: express.Response;
}

const sseClients: SSEClient[] = [];

function addSSEClient(dashboardId: string, res: express.Response): string {
  const id = uuidv4();
  sseClients.push({ id, dashboardId, res });
  return id;
}

function removeSSEClient(id: string) {
  const idx = sseClients.findIndex((c) => c.id === id);
  if (idx !== -1) sseClients.splice(idx, 1);
}

function broadcastUpdate(dashboardId: string, data: any) {
  const payload = `data: ${JSON.stringify(data)}\n\n`;
  for (const client of sseClients) {
    if (client.dashboardId === dashboardId) {
      client.res.write(payload);
    }
  }
}

// ─── Auth Middleware ─────────────────────────────────────────────────

/** Admin auth — for publishing/managing dashboards */
function adminAuth(req: express.Request, res: express.Response, next: express.NextFunction) {
  if (!ADMIN_KEY) return next(); // Open in dev mode
  const key = req.headers['x-admin-key'] as string;
  if (key !== ADMIN_KEY) {
    res.status(401).json({ error: 'Invalid admin key' });
    return;
  }
  next();
}

/** Embed token auth — for viewing dashboards */
function embedAuth(req: express.Request, res: express.Response, next: express.NextFunction) {
  // Check for token in query param or Authorization header
  const token = (req.query.token as string) || req.headers['authorization']?.replace('Bearer ', '');

  if (!token) {
    // If no JWT_SECRET is set (dev mode), allow public access
    if (JWT_SECRET === 'dashboard-embed-secret-change-in-production') {
      return next();
    }
    res.status(401).json({ error: 'Missing embed token' });
    return;
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET) as any;
    const dashboardId = req.params.id;

    // Token must be for this specific dashboard (or wildcard)
    if (payload.dashboardId !== dashboardId && payload.dashboardId !== '*') {
      res.status(403).json({ error: 'Token not valid for this dashboard' });
      return;
    }

    (req as any).tokenPayload = payload;
    next();
  } catch (err: any) {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}

// ─── Dashboard Storage ──────────────────────────────────────────────

function getDashboardPath(id: string): string {
  // Sanitize ID to prevent path traversal
  const safeId = id.replace(/[^a-zA-Z0-9_-]/g, '');
  return path.join(DATA_DIR, `${safeId}.json`);
}

function loadDashboard(id: string): any | null {
  const filePath = getDashboardPath(id);
  if (!fs.existsSync(filePath)) return null;
  return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
}

function saveDashboard(id: string, data: any): void {
  const filePath = getDashboardPath(id);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

function deleteDashboard(id: string): boolean {
  const filePath = getDashboardPath(id);
  if (!fs.existsSync(filePath)) return false;
  fs.unlinkSync(filePath);
  return true;
}

function listDashboards(): Array<{ id: string; name: string; updatedAt: string }> {
  if (!fs.existsSync(DATA_DIR)) return [];
  return fs.readdirSync(DATA_DIR)
    .filter((f) => f.endsWith('.json'))
    .map((f) => {
      try {
        const data = JSON.parse(fs.readFileSync(path.join(DATA_DIR, f), 'utf-8'));
        return {
          id: f.replace('.json', ''),
          name: data.name || 'Untitled',
          updatedAt: data.updatedAt || '',
        };
      } catch {
        return { id: f.replace('.json', ''), name: 'Unknown', updatedAt: '' };
      }
    });
}

// ─── Admin Endpoints ────────────────────────────────────────────────

/** List all dashboards */
app.get('/api/dashboards', adminAuth, (_req, res) => {
  res.json({ dashboards: listDashboards() });
});

/** Publish / update a dashboard */
app.put('/api/dashboards/:id', adminAuth, (req, res) => {
  const { id } = req.params;
  const document = req.body;

  if (!document || typeof document !== 'object') {
    res.status(400).json({ error: 'Request body must be a valid document JSON' });
    return;
  }

  document.updatedAt = new Date().toISOString();
  saveDashboard(id, document);

  // Broadcast update to all SSE clients viewing this dashboard
  broadcastUpdate(id, {
    type: 'document:update',
    document,
    timestamp: document.updatedAt,
  });

  res.json({ success: true, id, updatedAt: document.updatedAt });
});

/** Delete a dashboard */
app.delete('/api/dashboards/:id', adminAuth, (req, res) => {
  const deleted = deleteDashboard(req.params.id);
  if (!deleted) {
    res.status(404).json({ error: 'Dashboard not found' });
    return;
  }
  broadcastUpdate(req.params.id, { type: 'document:deleted' });
  res.json({ success: true });
});

/** Generate an embed token */
app.post('/api/dashboards/:id/token', adminAuth, (req, res) => {
  const { id } = req.params;
  const { expiresIn = '24h' } = req.body || {};

  // Verify dashboard exists
  if (!loadDashboard(id)) {
    res.status(404).json({ error: 'Dashboard not found' });
    return;
  }

  const token = jwt.sign(
    { dashboardId: id, iat: Math.floor(Date.now() / 1000) },
    JWT_SECRET,
    { expiresIn }
  );

  res.json({ token, expiresIn, dashboardId: id });
});

// ─── Public / Embed Endpoints ───────────────────────────────────────

/** Get a dashboard document (with embed token auth) */
app.get('/api/dashboards/:id', embedAuth, (req, res) => {
  const doc = loadDashboard(req.params.id);
  if (!doc) {
    res.status(404).json({ error: 'Dashboard not found' });
    return;
  }
  res.json(doc);
});

/** SSE stream for real-time updates */
app.get('/api/dashboards/:id/stream', embedAuth, (req, res) => {
  const { id } = req.params;

  // Verify dashboard exists
  if (!loadDashboard(id)) {
    res.status(404).json({ error: 'Dashboard not found' });
    return;
  }

  // Set up SSE headers
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no', // Disable nginx buffering
  });

  // Send initial heartbeat
  res.write(`data: ${JSON.stringify({ type: 'connected', dashboardId: id })}\n\n`);

  // Register client
  const clientId = addSSEClient(id, res);

  // Heartbeat every 30s to keep connection alive
  const heartbeat = setInterval(() => {
    res.write(`data: ${JSON.stringify({ type: 'heartbeat' })}\n\n`);
  }, 30000);

  // Clean up on disconnect
  req.on('close', () => {
    clearInterval(heartbeat);
    removeSSEClient(clientId);
  });
});

// ─── Health Check ───────────────────────────────────────────────────

app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    version: '1.0.0',
    dashboards: listDashboards().length,
    sseClients: sseClients.length,
  });
});

// ─── Start ──────────────────────────────────────────────────────────

app.listen(PORT, () => {
  console.log(`Dashboard Server running on http://localhost:${PORT}`);
  console.log('');
  console.log('Endpoints:');
  console.log('  Admin (requires x-admin-key header):');
  console.log('    GET    /api/dashboards          — List all dashboards');
  console.log('    PUT    /api/dashboards/:id       — Publish/update a dashboard');
  console.log('    DELETE /api/dashboards/:id       — Delete a dashboard');
  console.log('    POST   /api/dashboards/:id/token — Generate embed token');
  console.log('');
  console.log('  Public (requires embed token):');
  console.log('    GET    /api/dashboards/:id        — Get dashboard document');
  console.log('    GET    /api/dashboards/:id/stream  — SSE real-time updates');
  console.log('');
  console.log(`  JWT Secret: ${JWT_SECRET === 'dashboard-embed-secret-change-in-production' ? 'DEFAULT (change in production!)' : 'Custom'}`);
  console.log(`  Admin Key: ${ADMIN_KEY ? 'Set' : 'OPEN (set ADMIN_KEY env var to secure)'}`);
  console.log(`  Data Dir: ${DATA_DIR}`);
});
