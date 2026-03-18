import React, { useState, useCallback, useEffect } from 'react';
import { useDataSources } from '@reactcanvas/react';
import type { DataSource, DataSourceAuth, DataSourceHeader, FieldMapping, AuthType } from '@reactcanvas/core';
import type { FetchResult } from '@reactcanvas/core';
import { DatabaseConnector } from './DatabaseConnector';
import type { DatabaseConfig } from './DatabaseConnector';

interface DataSourcePanelProps {
  /** When provided, configure a specific data source for binding to an element */
  bindToElementId?: string;
  onBindSource?: (sourceId: string) => void;
}

export function DataSourcePanel({ bindToElementId, onBindSource }: DataSourcePanelProps) {
  const { sources, addDataSource, updateDataSource, removeDataSource, fetchDataSource, getCachedResult } = useDataSources();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showCreateMenu, setShowCreateMenu] = useState(false);
  const [showDbConnector, setShowDbConnector] = useState(false);

  const handleAddApi = useCallback(() => {
    const ds = addDataSource({ name: `Data Source ${sources.length + 1}` });
    setEditingId(ds.id);
    setShowCreateMenu(false);
  }, [addDataSource, sources.length]);

  const handleDbConnect = useCallback((config: DatabaseConfig) => {
    const actualDriver = config.driver === 'redshift' ? 'postgres' : config.driver;
    const proto = config.driver === 'mysql' ? 'mysql' : 'postgresql';
    const sslParam = config.ssl && config.driver !== 'mysql' ? '?sslmode=require' : '';
    const connStr = `${proto}://${config.username}:${encodeURIComponent(config.password)}@${config.host}:${config.port}/${config.database}${sslParam}`;

    const ds = addDataSource({
      name: `${config.driver === 'redshift' ? 'Redshift' : config.driver === 'postgres' ? 'PostgreSQL' : 'MySQL'}: ${config.database}`,
      url: `${config.proxyUrl}/query`,
      method: 'POST',
      headers: config.proxyApiKey ? [{ key: 'x-api-key', value: config.proxyApiKey, enabled: true }] : [],
      auth: { type: 'none' },
      body: JSON.stringify({
        driver: actualDriver,
        connectionString: connStr,
        query: `SELECT * FROM ${config.database} LIMIT 100`,
      }),
      fieldMapping: { dataPath: 'data' },
    });
    setEditingId(ds.id);
    setShowDbConnector(false);
    setShowCreateMenu(false);
  }, [addDataSource]);

  const editingSource = editingId ? sources.find((s) => s.id === editingId) : null;

  // Show database connector wizard
  if (showDbConnector) {
    return (
      <DatabaseConnector
        onConnect={handleDbConnect}
        onCancel={() => { setShowDbConnector(false); setShowCreateMenu(false); }}
      />
    );
  }

  if (editingSource) {
    return (
      <DataSourceEditor
        source={editingSource}
        onSave={(updated) => {
          updateDataSource(updated);
          setEditingId(null);
        }}
        onCancel={() => setEditingId(null)}
        onDelete={() => {
          removeDataSource(editingSource.id);
          setEditingId(null);
        }}
        onFetch={() => fetchDataSource(editingSource.id)}
        getCachedResult={() => getCachedResult(editingSource.id)}
      />
    );
  }

  return (
    <div style={panelStyles.container}>
      <div style={panelStyles.header}>
        <span style={panelStyles.title}>Data Sources</span>
        <button onClick={() => setShowCreateMenu(!showCreateMenu)} style={panelStyles.addBtn}>+ New</button>
      </div>

      {/* Create menu */}
      {showCreateMenu && (
        <div style={{ padding: '0 12px 8px', display: 'flex', flexDirection: 'column', gap: 4 }}>
          <button onClick={handleAddApi} style={{ ...panelStyles.sourceCard, cursor: 'pointer', border: '1px solid #dee2e6', padding: '10px 12px' }}>
            <div style={{ fontSize: 16, marginRight: 8 }}>API</div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, color: '#212529' }}>REST API</div>
              <div style={{ fontSize: 9, color: '#868e96' }}>Connect to any REST endpoint</div>
            </div>
          </button>
          <button onClick={() => setShowDbConnector(true)} style={{ ...panelStyles.sourceCard, cursor: 'pointer', border: '1px solid #dee2e6', padding: '10px 12px' }}>
            <div style={{ fontSize: 16, marginRight: 8 }}>DB</div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, color: '#212529' }}>Database</div>
              <div style={{ fontSize: 9, color: '#868e96' }}>Redshift, PostgreSQL, MySQL</div>
            </div>
          </button>
          <button onClick={() => setShowCreateMenu(false)} style={{ border: 'none', backgroundColor: 'transparent', color: '#868e96', fontSize: 10, cursor: 'pointer', padding: 4 }}>
            Cancel
          </button>
        </div>
      )}

      {sources.length === 0 && !showCreateMenu && (
        <div style={panelStyles.empty}>
          No data sources yet. Add one to connect live data to your widgets.
        </div>
      )}

      <div style={panelStyles.list}>
        {sources.map((ds) => {
          const cached = getCachedResult(ds.id);
          return (
            <div key={ds.id} style={panelStyles.sourceCard}>
              <div style={panelStyles.sourceInfo}>
                <div style={panelStyles.sourceName}>{ds.name}</div>
                <div style={panelStyles.sourceUrl}>{ds.url || 'No URL set'}</div>
                {cached?.error && (
                  <div style={panelStyles.sourceError}>{cached.error}</div>
                )}
                {cached && !cached.error && (
                  <div style={panelStyles.sourceSuccess}>
                    Last fetched: {new Date(cached.timestamp).toLocaleTimeString()}
                  </div>
                )}
                {ds.refreshInterval > 0 && (
                  <div style={panelStyles.sourceRefresh}>
                    Auto-refresh: {ds.refreshInterval}s
                  </div>
                )}
              </div>
              <div style={panelStyles.sourceActions}>
                <button
                  onClick={() => setEditingId(ds.id)}
                  style={panelStyles.iconBtn}
                  title="Edit"
                >
                  Edit
                </button>
                {bindToElementId && onBindSource && (
                  <button
                    onClick={() => onBindSource(ds.id)}
                    style={panelStyles.bindBtn}
                    title="Connect to widget"
                  >
                    Bind
                  </button>
                )}
                <button
                  onClick={() => fetchDataSource(ds.id)}
                  style={panelStyles.iconBtn}
                  title="Refresh"
                >
                  Fetch
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Data Source Editor ─────────────────────────────────────────────

interface DataSourceEditorProps {
  source: DataSource;
  onSave: (source: DataSource) => void;
  onCancel: () => void;
  onDelete: () => void;
  onFetch: () => Promise<FetchResult>;
  getCachedResult: () => FetchResult | undefined;
}

function DataSourceEditor({ source, onSave, onCancel, onDelete, onFetch, getCachedResult }: DataSourceEditorProps) {
  const [draft, setDraft] = useState<DataSource>({ ...source });
  const [previewData, setPreviewData] = useState<any>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [fetching, setFetching] = useState(false);
  const [activeTab, setActiveTab] = useState<'general' | 'auth' | 'headers' | 'mapping'>('general');

  const update = useCallback((partial: Partial<DataSource>) => {
    setDraft((d) => ({ ...d, ...partial }));
  }, []);

  const updateAuth = useCallback((partial: Partial<DataSourceAuth>) => {
    setDraft((d) => ({ ...d, auth: { ...d.auth, ...partial } }));
  }, []);

  const updateMapping = useCallback((partial: Partial<FieldMapping>) => {
    setDraft((d) => ({ ...d, fieldMapping: { ...d.fieldMapping, ...partial } }));
  }, []);

  const handleTestFetch = useCallback(async () => {
    // Save draft first so the manager uses updated config
    onSave(draft);
    setFetching(true);
    setPreviewError(null);
    try {
      const result = await onFetch();
      if (result.error) {
        setPreviewError(result.error);
        setPreviewData(null);
      } else {
        setPreviewData(result.data ?? result.raw);
        setPreviewError(null);
      }
    } catch (e: any) {
      setPreviewError(e.message);
    } finally {
      setFetching(false);
    }
  }, [draft, onSave, onFetch]);

  // Show cached data on load
  useEffect(() => {
    const cached = getCachedResult();
    if (cached && !cached.error) {
      setPreviewData(cached.data ?? cached.raw);
    }
  }, [getCachedResult]);

  // Detect available fields from preview
  const availableFields = previewData
    ? Array.isArray(previewData)
      ? previewData.length > 0 ? Object.keys(previewData[0]) : []
      : Object.keys(previewData)
    : [];

  return (
    <div style={panelStyles.container}>
      <div style={panelStyles.header}>
        <button onClick={onCancel} style={panelStyles.backBtn}>Back</button>
        <span style={panelStyles.title}>{draft.name}</span>
      </div>

      {/* Tabs */}
      <div style={panelStyles.tabs}>
        {(['general', 'auth', 'headers', 'mapping'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              ...panelStyles.tab,
              ...(activeTab === tab ? panelStyles.tabActive : {}),
            }}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      <div style={panelStyles.editorBody}>
        {/* General Tab */}
        {activeTab === 'general' && (
          <>
            <FieldRow label="Name">
              <input
                type="text"
                value={draft.name}
                onChange={(e) => update({ name: e.target.value })}
                style={panelStyles.input}
              />
            </FieldRow>
            <FieldRow label="URL">
              <input
                type="text"
                value={draft.url}
                onChange={(e) => update({ url: e.target.value })}
                style={panelStyles.input}
                placeholder="https://api.example.com/data"
              />
            </FieldRow>
            <FieldRow label="Method">
              <select
                value={draft.method}
                onChange={(e) => update({ method: e.target.value as 'GET' | 'POST' })}
                style={panelStyles.select}
              >
                <option value="GET">GET</option>
                <option value="POST">POST</option>
              </select>
            </FieldRow>
            {draft.method === 'POST' && (
              <FieldRow label="Body">
                <textarea
                  value={draft.body || ''}
                  onChange={(e) => update({ body: e.target.value })}
                  style={panelStyles.textarea}
                  placeholder='{"query": "..."}'
                  rows={3}
                />
              </FieldRow>
            )}
            <FieldRow label="Refresh (sec)">
              <input
                type="number"
                value={draft.refreshInterval}
                onChange={(e) => update({ refreshInterval: parseInt(e.target.value) || 0 })}
                style={panelStyles.input}
                min={0}
                placeholder="0 = manual only"
              />
            </FieldRow>
            <FieldRow label="Data Path">
              <input
                type="text"
                value={draft.fieldMapping.dataPath || ''}
                onChange={(e) => updateMapping({ dataPath: e.target.value || undefined })}
                style={panelStyles.input}
                placeholder="e.g. results.data or items"
              />
            </FieldRow>
            <div style={panelStyles.hint}>
              JSONPath to the data array in the response. Leave empty if the response is already an array.
            </div>
          </>
        )}

        {/* Auth Tab */}
        {activeTab === 'auth' && (
          <>
            <FieldRow label="Auth Type">
              <select
                value={draft.auth.type}
                onChange={(e) => updateAuth({ type: e.target.value as AuthType })}
                style={panelStyles.select}
              >
                <option value="none">None</option>
                <option value="bearer">Bearer Token</option>
                <option value="apiKey">API Key (Header)</option>
                <option value="basic">Basic Auth</option>
              </select>
            </FieldRow>

            {draft.auth.type === 'bearer' && (
              <FieldRow label="Token">
                <input
                  type="password"
                  value={draft.auth.token || ''}
                  onChange={(e) => updateAuth({ token: e.target.value })}
                  style={panelStyles.input}
                  placeholder="Bearer token value"
                />
              </FieldRow>
            )}

            {draft.auth.type === 'apiKey' && (
              <>
                <FieldRow label="Header Name">
                  <input
                    type="text"
                    value={draft.auth.headerName || ''}
                    onChange={(e) => updateAuth({ headerName: e.target.value })}
                    style={panelStyles.input}
                    placeholder="e.g. X-API-Key"
                  />
                </FieldRow>
                <FieldRow label="Header Value">
                  <input
                    type="password"
                    value={draft.auth.headerValue || ''}
                    onChange={(e) => updateAuth({ headerValue: e.target.value })}
                    style={panelStyles.input}
                    placeholder="Your API key"
                  />
                </FieldRow>
              </>
            )}

            {draft.auth.type === 'basic' && (
              <>
                <FieldRow label="Username">
                  <input
                    type="text"
                    value={draft.auth.username || ''}
                    onChange={(e) => updateAuth({ username: e.target.value })}
                    style={panelStyles.input}
                  />
                </FieldRow>
                <FieldRow label="Password">
                  <input
                    type="password"
                    value={draft.auth.password || ''}
                    onChange={(e) => updateAuth({ password: e.target.value })}
                    style={panelStyles.input}
                  />
                </FieldRow>
              </>
            )}

            <div style={panelStyles.hint}>
              {draft.auth.type === 'bearer' && 'Sends: Authorization: Bearer <token>'}
              {draft.auth.type === 'apiKey' && 'Sends the value as a custom header'}
              {draft.auth.type === 'basic' && 'Sends: Authorization: Basic <base64(user:pass)>'}
              {draft.auth.type === 'none' && 'No authentication headers will be sent'}
            </div>
          </>
        )}

        {/* Headers Tab */}
        {activeTab === 'headers' && (
          <>
            {draft.headers.map((h, i) => (
              <div key={i} style={panelStyles.headerRow}>
                <input
                  type="checkbox"
                  checked={h.enabled}
                  onChange={(e) => {
                    const headers = [...draft.headers];
                    headers[i] = { ...headers[i], enabled: e.target.checked };
                    update({ headers });
                  }}
                />
                <input
                  type="text"
                  value={h.key}
                  onChange={(e) => {
                    const headers = [...draft.headers];
                    headers[i] = { ...headers[i], key: e.target.value };
                    update({ headers });
                  }}
                  style={{ ...panelStyles.input, flex: 1 }}
                  placeholder="Header name"
                />
                <input
                  type="text"
                  value={h.value}
                  onChange={(e) => {
                    const headers = [...draft.headers];
                    headers[i] = { ...headers[i], value: e.target.value };
                    update({ headers });
                  }}
                  style={{ ...panelStyles.input, flex: 1 }}
                  placeholder="Value"
                />
                <button
                  onClick={() => {
                    const headers = draft.headers.filter((_, j) => j !== i);
                    update({ headers });
                  }}
                  style={panelStyles.removeBtn}
                >
                  x
                </button>
              </div>
            ))}
            <button
              onClick={() => {
                update({ headers: [...draft.headers, { key: '', value: '', enabled: true }] });
              }}
              style={panelStyles.addHeaderBtn}
            >
              + Add Header
            </button>
          </>
        )}

        {/* Mapping Tab */}
        {activeTab === 'mapping' && (
          <>
            <div style={panelStyles.hint}>
              Map response fields to chart/table/KPI properties.
              {availableFields.length > 0 && (
                <span> Detected fields: <strong>{availableFields.join(', ')}</strong></span>
              )}
            </div>
            <FieldRow label="Label Field">
              <FieldSelect
                value={draft.fieldMapping.labelField || ''}
                fields={availableFields}
                onChange={(v) => updateMapping({ labelField: v || undefined })}
                placeholder="e.g. name, date, category"
              />
            </FieldRow>
            <FieldRow label="Value Field">
              <FieldSelect
                value={draft.fieldMapping.valueField || ''}
                fields={availableFields}
                onChange={(v) => updateMapping({ valueField: v || undefined })}
                placeholder="e.g. amount, count, total"
              />
            </FieldRow>
            <FieldRow label="Series Field">
              <FieldSelect
                value={draft.fieldMapping.seriesField || ''}
                fields={availableFields}
                onChange={(v) => updateMapping({ seriesField: v || undefined })}
                placeholder="Group by (multi-series)"
              />
            </FieldRow>
            <FieldRow label="Metric Field">
              <FieldSelect
                value={draft.fieldMapping.metricField || ''}
                fields={availableFields}
                onChange={(v) => updateMapping({ metricField: v || undefined })}
                placeholder="For KPI cards"
              />
            </FieldRow>
          </>
        )}

        {/* Test & Preview */}
        <div style={panelStyles.testSection}>
          <button
            onClick={handleTestFetch}
            style={panelStyles.testBtn}
            disabled={fetching || !draft.url}
          >
            {fetching ? 'Fetching...' : 'Test & Preview'}
          </button>

          {previewError && (
            <div style={panelStyles.previewError}>{previewError}</div>
          )}

          {previewData && (
            <div style={panelStyles.preview}>
              <div style={panelStyles.previewLabel}>Response Preview:</div>
              <pre style={panelStyles.previewJson}>
                {JSON.stringify(previewData, null, 2).slice(0, 1000)}
                {JSON.stringify(previewData, null, 2).length > 1000 ? '\n...(truncated)' : ''}
              </pre>
            </div>
          )}
        </div>

        {/* Actions */}
        <div style={panelStyles.actions}>
          <button onClick={() => onSave(draft)} style={panelStyles.saveBtn}>
            Save
          </button>
          <button onClick={onDelete} style={panelStyles.deleteBtn}>
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Helper Components ──────────────────────────────────────────────

function FieldRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={panelStyles.fieldRow}>
      <label style={panelStyles.fieldLabel}>{label}</label>
      <div style={panelStyles.fieldValue}>{children}</div>
    </div>
  );
}

function FieldSelect({
  value,
  fields,
  onChange,
  placeholder,
}: {
  value: string;
  fields: string[];
  onChange: (v: string) => void;
  placeholder: string;
}) {
  if (fields.length > 0) {
    return (
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={panelStyles.select}
      >
        <option value="">(none)</option>
        {fields.map((f) => (
          <option key={f} value={f}>{f}</option>
        ))}
      </select>
    );
  }
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      style={panelStyles.input}
      placeholder={placeholder}
    />
  );
}

// ─── Styles ─────────────────────────────────────────────────────────

const panelStyles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    overflow: 'hidden',
  },
  header: {
    padding: '10px 14px 8px',
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    color: '#868e96',
    fontSize: 10,
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '1px',
  },
  addBtn: {
    marginLeft: 'auto',
    padding: '4px 10px',
    border: '1px solid #dee2e6',
    borderRadius: 6,
    backgroundColor: '#f8f9fa',
    color: '#4A90D9',
    fontSize: 10,
    fontWeight: 600,
    cursor: 'pointer',
  },
  backBtn: {
    padding: '4px 10px',
    border: '1px solid #dee2e6',
    borderRadius: 6,
    backgroundColor: '#f8f9fa',
    color: '#495057',
    fontSize: 10,
    fontWeight: 600,
    cursor: 'pointer',
  },
  empty: {
    padding: '24px 16px',
    color: '#868e96',
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 1.5,
  },
  list: {
    flex: 1,
    overflow: 'auto',
    padding: '0 12px 12px',
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
  },
  sourceCard: {
    padding: '10px 12px',
    backgroundColor: '#f8f9fa',
    border: '1px solid #dee2e6',
    borderRadius: 10,
    display: 'flex',
    gap: 8,
  },
  sourceInfo: {
    flex: 1,
    minWidth: 0,
  },
  sourceName: {
    fontSize: 12,
    fontWeight: 600,
    color: '#212529',
    marginBottom: 2,
  },
  sourceUrl: {
    fontSize: 10,
    color: '#868e96',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  sourceError: {
    fontSize: 9,
    color: '#e03131',
    marginTop: 2,
  },
  sourceSuccess: {
    fontSize: 9,
    color: '#2b8a3e',
    marginTop: 2,
  },
  sourceRefresh: {
    fontSize: 9,
    color: '#4A90D9',
    marginTop: 1,
  },
  sourceActions: {
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
    flexShrink: 0,
  },
  iconBtn: {
    padding: '3px 8px',
    border: '1px solid #dee2e6',
    borderRadius: 4,
    backgroundColor: 'transparent',
    color: '#495057',
    fontSize: 9,
    cursor: 'pointer',
  },
  bindBtn: {
    padding: '3px 8px',
    border: 'none',
    borderRadius: 4,
    background: 'linear-gradient(135deg, #4A90D9, #7c5cbf)',
    color: '#ffffff',
    fontSize: 9,
    fontWeight: 600,
    cursor: 'pointer',
  },
  tabs: {
    display: 'flex',
    gap: 2,
    padding: '0 12px 8px',
  },
  tab: {
    flex: 1,
    border: 'none',
    borderRadius: 6,
    backgroundColor: 'transparent',
    color: '#868e96',
    fontSize: 10,
    fontWeight: 600,
    padding: '5px 4px',
    cursor: 'pointer',
    textAlign: 'center',
  },
  tabActive: {
    backgroundColor: '#f8f9fa',
    color: '#4A90D9',
  },
  editorBody: {
    flex: 1,
    overflow: 'auto',
    padding: '0 12px 12px',
  },
  fieldRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  fieldLabel: {
    color: '#868e96',
    fontSize: 10,
    fontWeight: 600,
    minWidth: 70,
    flexShrink: 0,
  },
  fieldValue: {
    flex: 1,
    display: 'flex',
  },
  input: {
    width: '100%',
    height: 28,
    border: '1px solid #dee2e6',
    borderRadius: 6,
    backgroundColor: '#f8f9fa',
    color: '#212529',
    fontSize: 11,
    padding: '0 8px',
    outline: 'none',
    boxSizing: 'border-box',
  },
  select: {
    width: '100%',
    height: 28,
    border: '1px solid #dee2e6',
    borderRadius: 6,
    backgroundColor: '#f8f9fa',
    color: '#212529',
    fontSize: 11,
    padding: '0 6px',
    outline: 'none',
    boxSizing: 'border-box',
  },
  textarea: {
    width: '100%',
    border: '1px solid #dee2e6',
    borderRadius: 6,
    backgroundColor: '#f8f9fa',
    color: '#212529',
    fontSize: 11,
    fontFamily: 'monospace',
    padding: 8,
    outline: 'none',
    resize: 'vertical',
    boxSizing: 'border-box',
  },
  hint: {
    color: '#868e96',
    fontSize: 9,
    lineHeight: 1.4,
    marginBottom: 10,
    padding: '0 2px',
  },
  headerRow: {
    display: 'flex',
    gap: 4,
    alignItems: 'center',
    marginBottom: 4,
  },
  removeBtn: {
    width: 20,
    height: 20,
    border: '1px solid #dee2e6',
    borderRadius: 4,
    backgroundColor: 'transparent',
    color: '#e03131',
    fontSize: 11,
    fontWeight: 600,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 0,
  },
  addHeaderBtn: {
    width: '100%',
    height: 26,
    border: '1px dashed #dee2e6',
    borderRadius: 6,
    backgroundColor: 'transparent',
    color: '#868e96',
    fontSize: 10,
    cursor: 'pointer',
    marginTop: 4,
  },
  testSection: {
    marginTop: 12,
    borderTop: '1px solid #dee2e6',
    paddingTop: 12,
  },
  testBtn: {
    width: '100%',
    height: 30,
    border: 'none',
    borderRadius: 6,
    background: 'linear-gradient(135deg, #4A90D9, #7c5cbf)',
    color: '#ffffff',
    fontSize: 11,
    fontWeight: 600,
    cursor: 'pointer',
  },
  previewError: {
    marginTop: 8,
    padding: 8,
    backgroundColor: 'rgba(224,49,49,0.1)',
    border: '1px solid rgba(224,49,49,0.3)',
    borderRadius: 6,
    color: '#e03131',
    fontSize: 10,
  },
  preview: {
    marginTop: 8,
  },
  previewLabel: {
    color: '#868e96',
    fontSize: 9,
    fontWeight: 600,
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  previewJson: {
    backgroundColor: '#f8f9fa',
    border: '1px solid #dee2e6',
    borderRadius: 6,
    padding: 8,
    color: '#6c757d',
    fontSize: 10,
    fontFamily: 'monospace',
    maxHeight: 200,
    overflow: 'auto',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-all',
    margin: 0,
  },
  actions: {
    display: 'flex',
    gap: 8,
    marginTop: 12,
  },
  saveBtn: {
    flex: 1,
    height: 30,
    border: 'none',
    borderRadius: 6,
    background: 'linear-gradient(135deg, #4A90D9, #7c5cbf)',
    color: '#ffffff',
    fontSize: 11,
    fontWeight: 600,
    cursor: 'pointer',
  },
  deleteBtn: {
    height: 30,
    padding: '0 16px',
    border: '1px solid rgba(224,49,49,0.3)',
    borderRadius: 6,
    backgroundColor: 'transparent',
    color: '#e03131',
    fontSize: 11,
    fontWeight: 500,
    cursor: 'pointer',
  },
};
