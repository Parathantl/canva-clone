import React, { useState, useCallback, useMemo } from 'react';

export interface DatabaseConfig {
  driver: 'postgres' | 'mysql' | 'redshift';
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
  ssl: boolean;
  /** URL of the SQL proxy server */
  proxyUrl: string;
  /** API key for the SQL proxy */
  proxyApiKey: string;
}

export interface DatabaseConnectorProps {
  onConnect: (config: DatabaseConfig) => void;
  onCancel: () => void;
  /** Default proxy URL */
  defaultProxyUrl?: string;
}

const DEFAULT_PORTS: Record<string, number> = {
  postgres: 5432,
  mysql: 3306,
  redshift: 5439,
};

const DRIVER_LABELS: Record<string, string> = {
  redshift: 'AWS Redshift',
  postgres: 'PostgreSQL',
  mysql: 'MySQL',
};

export function DatabaseConnector({ onConnect, onCancel, defaultProxyUrl }: DatabaseConnectorProps) {
  const [driver, setDriver] = useState<DatabaseConfig['driver']>('redshift');
  const [host, setHost] = useState('');
  const [port, setPort] = useState(5439);
  const [database, setDatabase] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [ssl, setSsl] = useState(true);
  const [proxyUrl, setProxyUrl] = useState(defaultProxyUrl || 'http://localhost:3001');
  const [proxyApiKey, setProxyApiKey] = useState('');

  const [step, setStep] = useState<'connection' | 'tables' | 'query'>('connection');
  const [testing, setTesting] = useState(false);
  const [testError, setTestError] = useState<string | null>(null);
  const [testSuccess, setTestSuccess] = useState(false);
  const [tables, setTables] = useState<string[]>([]);
  const [columns, setColumns] = useState<Array<{ name: string; type: string }>>([]);
  const [selectedTable, setSelectedTable] = useState('');
  const [customQuery, setCustomQuery] = useState('');
  const [queryMode, setQueryMode] = useState<'table' | 'custom'>('table');
  const [previewData, setPreviewData] = useState<any[] | null>(null);
  const [previewFields, setPreviewFields] = useState<string[]>([]);

  const connectionString = useMemo(() => {
    const proto = driver === 'mysql' ? 'mysql' : 'postgresql';
    const sslParam = ssl && driver !== 'mysql' ? '?sslmode=require' : '';
    return `${proto}://${username}:${encodeURIComponent(password)}@${host}:${port}/${database}${sslParam}`;
  }, [driver, host, port, database, username, password, ssl]);

  const proxyHeaders = useMemo(() => {
    const h: Record<string, string> = { 'Content-Type': 'application/json' };
    if (proxyApiKey) h['x-api-key'] = proxyApiKey;
    return h;
  }, [proxyApiKey]);

  const actualDriver = driver === 'redshift' ? 'postgres' : driver;

  const handleTestConnection = useCallback(async () => {
    setTesting(true);
    setTestError(null);
    setTestSuccess(false);
    try {
      // Test by listing tables
      const resp = await fetch(`${proxyUrl}/tables`, {
        method: 'POST',
        headers: proxyHeaders,
        body: JSON.stringify({ driver: actualDriver, connectionString }),
      });
      if (!resp.ok) {
        const err = await resp.json().catch(() => ({ error: `HTTP ${resp.status}` }));
        throw new Error(err.error || `HTTP ${resp.status}`);
      }
      const data = await resp.json();
      setTables(data.tables || []);
      setTestSuccess(true);
      setStep('tables');
    } catch (e: any) {
      setTestError(e.message || 'Connection failed');
    } finally {
      setTesting(false);
    }
  }, [proxyUrl, proxyHeaders, actualDriver, connectionString]);

  const handleSelectTable = useCallback(async (table: string) => {
    setSelectedTable(table);
    setCustomQuery(`SELECT * FROM ${table} LIMIT 100`);
    try {
      const resp = await fetch(`${proxyUrl}/columns`, {
        method: 'POST',
        headers: proxyHeaders,
        body: JSON.stringify({ driver: actualDriver, connectionString, table }),
      });
      if (resp.ok) {
        const data = await resp.json();
        setColumns(data.columns || []);
      }
    } catch { /* ignore */ }
  }, [proxyUrl, proxyHeaders, actualDriver, connectionString]);

  const handlePreview = useCallback(async () => {
    const query = queryMode === 'table' ? `SELECT * FROM ${selectedTable} LIMIT 10` : customQuery;
    if (!query.trim()) return;
    setTesting(true);
    setTestError(null);
    try {
      const resp = await fetch(`${proxyUrl}/query`, {
        method: 'POST',
        headers: proxyHeaders,
        body: JSON.stringify({ driver: actualDriver, connectionString, query }),
      });
      if (!resp.ok) {
        const err = await resp.json().catch(() => ({ error: `HTTP ${resp.status}` }));
        throw new Error(err.error);
      }
      const data = await resp.json();
      setPreviewData(data.data?.slice(0, 5) || []);
      setPreviewFields(data.fields || []);
      setStep('query');
    } catch (e: any) {
      setTestError(e.message);
    } finally {
      setTesting(false);
    }
  }, [proxyUrl, proxyHeaders, actualDriver, connectionString, selectedTable, customQuery, queryMode]);

  const handleConnect = useCallback(() => {
    onConnect({ driver, host, port, database, username, password, ssl, proxyUrl, proxyApiKey });
  }, [onConnect, driver, host, port, database, username, password, ssl, proxyUrl, proxyApiKey]);

  return (
    <div style={dbStyles.container}>
      <div style={dbStyles.header}>
        <button onClick={onCancel} style={dbStyles.backBtn}>Back</button>
        <span style={dbStyles.title}>Connect Database</span>
      </div>

      {/* Step indicator */}
      <div style={dbStyles.steps}>
        {['Connection', 'Tables', 'Query'].map((label, i) => {
          const stepKey = ['connection', 'tables', 'query'][i];
          const isActive = step === stepKey;
          const isPast = ['connection', 'tables', 'query'].indexOf(step) > i;
          return (
            <div key={label} style={{
              ...dbStyles.step,
              color: isActive ? '#4A90D9' : isPast ? '#2b8a3e' : '#868e96',
              fontWeight: isActive ? 600 : 400,
            }}>
              <span style={{
                ...dbStyles.stepDot,
                backgroundColor: isPast ? '#2b8a3e' : isActive ? '#4A90D9' : '#dee2e6',
              }} />
              {label}
            </div>
          );
        })}
      </div>

      <div style={dbStyles.body}>
        {/* Step 1: Connection */}
        {step === 'connection' && (
          <>
            <FieldRow label="Database">
              <div style={dbStyles.driverRow}>
                {(['redshift', 'postgres', 'mysql'] as const).map((d) => (
                  <button
                    key={d}
                    onClick={() => { setDriver(d); setPort(DEFAULT_PORTS[d]); }}
                    style={{
                      ...dbStyles.driverBtn,
                      ...(driver === d ? dbStyles.driverBtnActive : {}),
                    }}
                  >
                    {DRIVER_LABELS[d]}
                  </button>
                ))}
              </div>
            </FieldRow>
            <FieldRow label="Host">
              <input
                type="text"
                value={host}
                onChange={(e) => setHost(e.target.value)}
                style={dbStyles.input}
                placeholder={driver === 'redshift' ? 'cluster.region.redshift.amazonaws.com' : 'localhost'}
              />
            </FieldRow>
            <FieldRow label="Port">
              <input
                type="number"
                value={port}
                onChange={(e) => setPort(parseInt(e.target.value) || 0)}
                style={{ ...dbStyles.input, width: 80 }}
              />
            </FieldRow>
            <FieldRow label="Database">
              <input
                type="text"
                value={database}
                onChange={(e) => setDatabase(e.target.value)}
                style={dbStyles.input}
                placeholder="my_database"
              />
            </FieldRow>
            <FieldRow label="Username">
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                style={dbStyles.input}
              />
            </FieldRow>
            <FieldRow label="Password">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={dbStyles.input}
              />
            </FieldRow>
            <FieldRow label="SSL">
              <input
                type="checkbox"
                checked={ssl}
                onChange={(e) => setSsl(e.target.checked)}
              />
              <span style={{ fontSize: 10, color: '#868e96', marginLeft: 4 }}>
                {driver === 'redshift' ? 'Required for Redshift' : 'Encrypt connection'}
              </span>
            </FieldRow>

            <div style={dbStyles.divider} />
            <div style={{ fontSize: 9, color: '#868e96', marginBottom: 6, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              SQL Proxy Server
            </div>
            <FieldRow label="Proxy URL">
              <input
                type="text"
                value={proxyUrl}
                onChange={(e) => setProxyUrl(e.target.value)}
                style={dbStyles.input}
                placeholder="http://localhost:3001"
              />
            </FieldRow>
            <FieldRow label="API Key">
              <input
                type="password"
                value={proxyApiKey}
                onChange={(e) => setProxyApiKey(e.target.value)}
                style={dbStyles.input}
                placeholder="Optional"
              />
            </FieldRow>
            <div style={dbStyles.hint}>
              Your backend SQL endpoint must accept POST with {`{driver, connectionString, query}`} and return {`{data: [...]}`}. See examples/sql-proxy for a reference implementation.
            </div>

            {testError && <div style={dbStyles.error}>{testError}</div>}
            {testSuccess && <div style={dbStyles.success}>Connected! Found {tables.length} tables.</div>}

            <button
              onClick={handleTestConnection}
              disabled={testing || !host || !database || !username}
              style={dbStyles.primaryBtn}
            >
              {testing ? 'Connecting...' : 'Test Connection'}
            </button>
          </>
        )}

        {/* Step 2: Select Table */}
        {step === 'tables' && (
          <>
            <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
              <button
                onClick={() => setQueryMode('table')}
                style={{ ...dbStyles.modeBtn, ...(queryMode === 'table' ? dbStyles.modeBtnActive : {}) }}
              >
                Select Table
              </button>
              <button
                onClick={() => setQueryMode('custom')}
                style={{ ...dbStyles.modeBtn, ...(queryMode === 'custom' ? dbStyles.modeBtnActive : {}) }}
              >
                Custom SQL
              </button>
            </div>

            {queryMode === 'table' && (
              <div style={dbStyles.tableList}>
                {tables.map((t) => (
                  <button
                    key={t}
                    onClick={() => handleSelectTable(t)}
                    style={{
                      ...dbStyles.tableItem,
                      ...(selectedTable === t ? dbStyles.tableItemActive : {}),
                    }}
                  >
                    {t}
                  </button>
                ))}
                {tables.length === 0 && (
                  <div style={{ color: '#868e96', fontSize: 11, padding: 12, textAlign: 'center' }}>
                    No tables found
                  </div>
                )}
              </div>
            )}

            {queryMode === 'table' && selectedTable && columns.length > 0 && (
              <div style={{ marginTop: 8 }}>
                <div style={{ fontSize: 10, color: '#868e96', fontWeight: 600, marginBottom: 4 }}>
                  Columns in {selectedTable}:
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                  {columns.map((c) => (
                    <span key={c.name} style={dbStyles.columnTag}>
                      {c.name} <span style={{ color: '#868e96' }}>({c.type})</span>
                    </span>
                  ))}
                </div>
              </div>
            )}

            {queryMode === 'custom' && (
              <textarea
                value={customQuery}
                onChange={(e) => setCustomQuery(e.target.value)}
                style={dbStyles.queryInput}
                rows={4}
                placeholder="SELECT * FROM sales WHERE region = 'US' LIMIT 100"
              />
            )}

            {testError && <div style={dbStyles.error}>{testError}</div>}

            <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
              <button onClick={() => setStep('connection')} style={dbStyles.secondaryBtn}>Back</button>
              <button
                onClick={handlePreview}
                disabled={testing || (queryMode === 'table' && !selectedTable)}
                style={dbStyles.primaryBtn}
              >
                {testing ? 'Loading...' : 'Preview Data'}
              </button>
            </div>
          </>
        )}

        {/* Step 3: Preview & Confirm */}
        {step === 'query' && (
          <>
            {previewData && previewData.length > 0 && (
              <div style={dbStyles.previewTable}>
                <div style={dbStyles.previewHeader}>
                  {previewFields.map((f) => (
                    <div key={f} style={dbStyles.previewHeaderCell}>{f}</div>
                  ))}
                </div>
                {previewData.map((row: any, ri: number) => (
                  <div key={ri} style={{
                    ...dbStyles.previewRow,
                    backgroundColor: ri % 2 === 0 ? '#ffffff' : '#f8f9fa',
                  }}>
                    {previewFields.map((f) => (
                      <div key={f} style={dbStyles.previewCell}>
                        {String(row[f] ?? '')}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )}

            <div style={{ marginTop: 8, fontSize: 10, color: '#868e96' }}>
              Showing first {previewData?.length || 0} rows. Fields: {previewFields.join(', ')}
            </div>

            <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
              <button onClick={() => setStep('tables')} style={dbStyles.secondaryBtn}>Back</button>
              <button onClick={handleConnect} style={dbStyles.primaryBtn}>
                Create Data Source
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function FieldRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={dbStyles.fieldRow}>
      <label style={dbStyles.fieldLabel}>{label}</label>
      <div style={dbStyles.fieldValue}>{children}</div>
    </div>
  );
}

const dbStyles: Record<string, React.CSSProperties> = {
  container: { display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' },
  header: { padding: '10px 14px 8px', display: 'flex', alignItems: 'center', gap: 8 },
  title: { color: '#868e96', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px' },
  backBtn: { padding: '4px 10px', border: '1px solid #dee2e6', borderRadius: 6, backgroundColor: '#f8f9fa', color: '#495057', fontSize: 10, fontWeight: 600, cursor: 'pointer' },
  steps: { display: 'flex', gap: 4, padding: '0 14px 10px', alignItems: 'center' },
  step: { display: 'flex', alignItems: 'center', gap: 4, fontSize: 10 },
  stepDot: { width: 8, height: 8, borderRadius: '50%', flexShrink: 0 },
  body: { flex: 1, overflow: 'auto', padding: '0 14px 14px' },
  fieldRow: { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 },
  fieldLabel: { color: '#6c757d', fontSize: 10, fontWeight: 600, minWidth: 65, flexShrink: 0 },
  fieldValue: { flex: 1, display: 'flex', alignItems: 'center' },
  input: { width: '100%', height: 28, border: '1px solid #dee2e6', borderRadius: 6, backgroundColor: '#ffffff', color: '#212529', fontSize: 11, padding: '0 8px', outline: 'none', boxSizing: 'border-box' as const },
  driverRow: { display: 'flex', gap: 4, flex: 1 },
  driverBtn: { flex: 1, padding: '6px 4px', border: '1px solid #dee2e6', borderRadius: 6, backgroundColor: '#f8f9fa', color: '#495057', fontSize: 10, fontWeight: 500, cursor: 'pointer', textAlign: 'center' as const },
  driverBtnActive: { borderColor: '#4A90D9', backgroundColor: '#e7f0ff', color: '#4A90D9', fontWeight: 600 },
  divider: { height: 1, backgroundColor: '#dee2e6', margin: '12px 0' },
  hint: { fontSize: 9, color: '#868e96', lineHeight: 1.4, marginBottom: 10 },
  error: { padding: 8, backgroundColor: '#fff5f5', border: '1px solid rgba(224,49,49,0.3)', borderRadius: 6, color: '#e03131', fontSize: 10, marginTop: 8 },
  success: { padding: 8, backgroundColor: '#ebfbee', border: '1px solid rgba(43,138,62,0.3)', borderRadius: 6, color: '#2b8a3e', fontSize: 10, marginTop: 8 },
  primaryBtn: { width: '100%', height: 32, border: 'none', borderRadius: 6, background: 'linear-gradient(135deg, #4A90D9, #7c5cbf)', color: '#ffffff', fontSize: 11, fontWeight: 600, cursor: 'pointer', marginTop: 8, flex: 1 },
  secondaryBtn: { height: 32, padding: '0 16px', border: '1px solid #dee2e6', borderRadius: 6, backgroundColor: '#f8f9fa', color: '#495057', fontSize: 11, cursor: 'pointer' },
  modeBtn: { flex: 1, height: 28, border: '1px solid #dee2e6', borderRadius: 6, backgroundColor: '#f8f9fa', color: '#495057', fontSize: 10, fontWeight: 500, cursor: 'pointer' },
  modeBtnActive: { borderColor: '#4A90D9', backgroundColor: '#e7f0ff', color: '#4A90D9', fontWeight: 600 },
  tableList: { maxHeight: 200, overflow: 'auto', border: '1px solid #dee2e6', borderRadius: 6, backgroundColor: '#ffffff' },
  tableItem: { display: 'block', width: '100%', padding: '8px 12px', border: 'none', borderBottom: '1px solid #f1f3f5', backgroundColor: 'transparent', color: '#212529', fontSize: 11, cursor: 'pointer', textAlign: 'left' as const },
  tableItemActive: { backgroundColor: '#e7f0ff', color: '#4A90D9', fontWeight: 600 },
  columnTag: { display: 'inline-block', padding: '2px 8px', backgroundColor: '#f1f3f5', borderRadius: 4, fontSize: 10, color: '#495057' },
  queryInput: { width: '100%', border: '1px solid #dee2e6', borderRadius: 6, backgroundColor: '#ffffff', color: '#212529', fontSize: 11, fontFamily: 'monospace', padding: 8, outline: 'none', resize: 'vertical' as const, boxSizing: 'border-box' as const },
  previewTable: { border: '1px solid #dee2e6', borderRadius: 6, overflow: 'hidden', fontSize: 10 },
  previewHeader: { display: 'flex', backgroundColor: '#1e293b', color: '#ffffff', fontWeight: 600 },
  previewHeaderCell: { flex: 1, padding: '6px 8px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const },
  previewRow: { display: 'flex' },
  previewCell: { flex: 1, padding: '5px 8px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const, color: '#495057' },
};
