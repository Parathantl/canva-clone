import express from 'express';
import cors from 'cors';
import { Pool as PgPool } from 'pg';
import mysql from 'mysql2/promise';

const app = express();
app.use(cors());
app.use(express.json());

const PORT = parseInt(process.env.PORT || '3001', 10);
const API_KEY = process.env.SQL_PROXY_API_KEY || '';

// ─── Auth middleware ─────────────────────────────────────────────────

function authenticate(req: express.Request, res: express.Response, next: express.NextFunction) {
  if (!API_KEY) return next(); // No key configured = open (dev mode)

  const provided = req.headers['x-api-key'] || req.headers['authorization']?.replace('Bearer ', '');
  if (provided !== API_KEY) {
    res.status(401).json({ error: 'Invalid or missing API key' });
    return;
  }
  next();
}

app.use(authenticate);

// ─── Connection pools ───────────────────────────────────────────────

const pgPools = new Map<string, PgPool>();
const mysqlPools = new Map<string, mysql.Pool>();

function getPgPool(connectionString: string): PgPool {
  let pool = pgPools.get(connectionString);
  if (!pool) {
    pool = new PgPool({ connectionString, max: 5, idleTimeoutMillis: 30000 });
    pgPools.set(connectionString, pool);
  }
  return pool;
}

function getMysqlPool(connectionString: string): mysql.Pool {
  let pool = mysqlPools.get(connectionString);
  if (!pool) {
    pool = mysql.createPool(connectionString);
    mysqlPools.set(connectionString, pool);
  }
  return pool;
}

// ─── Query endpoint ─────────────────────────────────────────────────

interface QueryRequest {
  driver: 'postgres' | 'mysql';
  connectionString: string;
  query: string;
  params?: any[];
}

app.post('/query', async (req: express.Request, res: express.Response) => {
  const { driver, connectionString, query, params } = req.body as QueryRequest;

  if (!driver || !connectionString || !query) {
    res.status(400).json({ error: 'Missing required fields: driver, connectionString, query' });
    return;
  }

  // Basic SQL injection guard: block dangerous statements
  const normalized = query.trim().toUpperCase();
  const blocked = ['DROP ', 'DELETE ', 'TRUNCATE ', 'ALTER ', 'CREATE ', 'INSERT ', 'UPDATE ', 'GRANT ', 'REVOKE '];
  if (blocked.some((kw) => normalized.startsWith(kw))) {
    res.status(403).json({ error: 'Only SELECT queries are allowed' });
    return;
  }

  try {
    let rows: any[];

    if (driver === 'postgres') {
      const pool = getPgPool(connectionString);
      const result = await pool.query(query, params || []);
      rows = result.rows;
    } else if (driver === 'mysql') {
      const pool = getMysqlPool(connectionString);
      const [result] = await pool.query(query, params || []);
      rows = result as any[];
    } else {
      res.status(400).json({ error: `Unsupported driver: ${driver}. Use "postgres" or "mysql".` });
      return;
    }

    res.json({
      data: rows,
      rowCount: rows.length,
      fields: rows.length > 0 ? Object.keys(rows[0]) : [],
    });
  } catch (err: any) {
    console.error(`Query error [${driver}]:`, err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─── Schema introspection ───────────────────────────────────────────

app.post('/tables', async (req: express.Request, res: express.Response) => {
  const { driver, connectionString } = req.body as { driver: string; connectionString: string };

  try {
    let tables: string[];

    if (driver === 'postgres') {
      const pool = getPgPool(connectionString);
      const result = await pool.query(
        `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name`
      );
      tables = result.rows.map((r: any) => r.table_name);
    } else if (driver === 'mysql') {
      const pool = getMysqlPool(connectionString);
      const [result] = await pool.query('SHOW TABLES');
      tables = (result as any[]).map((r: any) => Object.values(r)[0] as string);
    } else {
      res.status(400).json({ error: `Unsupported driver: ${driver}` });
      return;
    }

    res.json({ tables });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/columns', async (req: express.Request, res: express.Response) => {
  const { driver, connectionString, table } = req.body as { driver: string; connectionString: string; table: string };

  if (!table) {
    res.status(400).json({ error: 'Missing table name' });
    return;
  }

  try {
    let columns: Array<{ name: string; type: string }>;

    if (driver === 'postgres') {
      const pool = getPgPool(connectionString);
      const result = await pool.query(
        `SELECT column_name, data_type FROM information_schema.columns WHERE table_name = $1 ORDER BY ordinal_position`,
        [table]
      );
      columns = result.rows.map((r: any) => ({ name: r.column_name, type: r.data_type }));
    } else if (driver === 'mysql') {
      const pool = getMysqlPool(connectionString);
      const [result] = await pool.query(`DESCRIBE \`${table}\``);
      columns = (result as any[]).map((r: any) => ({ name: r.Field, type: r.Type }));
    } else {
      res.status(400).json({ error: `Unsupported driver: ${driver}` });
      return;
    }

    res.json({ columns });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Health check ───────────────────────────────────────────────────

app.get('/health', (_req: express.Request, res: express.Response) => {
  res.json({ status: 'ok', version: '1.0.0' });
});

// ─── Start ──────────────────────────────────────────────────────────

app.listen(PORT, () => {
  console.log(`SQL Proxy running on http://localhost:${PORT}`);
  console.log(`Endpoints:`);
  console.log(`  POST /query    — Execute a SELECT query`);
  console.log(`  POST /tables   — List tables in database`);
  console.log(`  POST /columns  — List columns for a table`);
  console.log(`  GET  /health   — Health check`);
  if (API_KEY) {
    console.log(`Auth: API key required (x-api-key header)`);
  } else {
    console.log(`Auth: OPEN (set SQL_PROXY_API_KEY env var to secure)`);
  }
});
