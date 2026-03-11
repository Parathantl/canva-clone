import React, { useCallback, useState } from 'react';
import { DesignEditor, LLM_SYSTEM_PROMPT, createSlideTransformer } from '@reactcanvas/editor';
import type { Document } from '@reactcanvas/core';
import type { AIChatMessage, StreamCallback } from '@reactcanvas/editor';
import {
  createDefaultDocument,
  createChartElement,
  createKPIElement,
  createTableElement,
  createProgressElement,
} from '@reactcanvas/core';

const STORAGE_KEY = 'reactcanvas-doc';

// AI Provider types
type AIProvider = 'anthropic' | 'openai';

const AI_PROVIDER_KEY = 'demo-ai-provider';
const AI_API_KEY_STORAGE = 'demo-ai-api-key';

function getProvider(): AIProvider {
  return (localStorage.getItem(AI_PROVIDER_KEY) as AIProvider) || 'anthropic';
}

function getApiKey(): string | null {
  return localStorage.getItem(AI_API_KEY_STORAGE);
}

/** Call Anthropic's streaming API */
async function streamAnthropic(
  apiKey: string,
  systemPrompt: string,
  userMessage: string,
  onChunk?: StreamCallback,
): Promise<string> {
  const resp = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 8192,
      stream: !!onChunk,
      system: systemPrompt,
      messages: [{ role: 'user', content: userMessage }],
    }),
  });

  if (!resp.ok) {
    const err = await resp.text();
    throw new Error(`Anthropic API error ${resp.status}: ${err}`);
  }

  if (!onChunk) {
    const data = await resp.json();
    return data.content?.[0]?.text ?? '';
  }

  // Read SSE stream
  let fullText = '';
  const reader = resp.body!.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';
    for (const line of lines) {
      if (!line.startsWith('data: ')) continue;
      const data = line.slice(6);
      if (data === '[DONE]') continue;
      try {
        const event = JSON.parse(data);
        if (event.type === 'content_block_delta' && event.delta?.text) {
          fullText += event.delta.text;
          onChunk(event.delta.text);
        }
      } catch {
        // Skip non-JSON SSE lines
      }
    }
  }

  return fullText;
}

/** Call OpenAI's streaming API */
async function streamOpenAI(
  apiKey: string,
  systemPrompt: string,
  userMessage: string,
  onChunk?: StreamCallback,
): Promise<string> {
  const resp = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      max_tokens: 8192,
      stream: !!onChunk,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage },
      ],
    }),
  });

  if (!resp.ok) {
    const err = await resp.text();
    throw new Error(`OpenAI API error ${resp.status}: ${err}`);
  }

  if (!onChunk) {
    const data = await resp.json();
    return data.choices?.[0]?.message?.content ?? '';
  }

  // Read SSE stream
  let fullText = '';
  const reader = resp.body!.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';
    for (const line of lines) {
      if (!line.startsWith('data: ')) continue;
      const data = line.slice(6).trim();
      if (data === '[DONE]') continue;
      try {
        const event = JSON.parse(data);
        const text = event.choices?.[0]?.delta?.content;
        if (text) {
          fullText += text;
          onChunk(text);
        }
      } catch {
        // Skip non-JSON SSE lines
      }
    }
  }

  return fullText;
}

/** Unified LLM call that routes to the selected provider */
async function callLLM(
  systemPrompt: string,
  userMessage: string,
  onChunk?: StreamCallback,
): Promise<string> {
  const provider = getProvider();
  const apiKey = getApiKey();
  if (!apiKey) {
    const example = provider === 'openai'
      ? 'localStorage.setItem("demo-ai-api-key", "sk-...")'
      : 'localStorage.setItem("demo-ai-api-key", "sk-ant-...")';
    throw new Error(
      `No API key configured for ${provider}.\n\nRun in browser console:\n  ${example}\n\nOr click the provider badge in the AI panel to configure.`
    );
  }

  if (provider === 'openai') {
    return streamOpenAI(apiKey, systemPrompt, userMessage, onChunk);
  }
  return streamAnthropic(apiKey, systemPrompt, userMessage, onChunk);
}

function loadFromLocalStorage(): Document | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw) as Document;
    }
  } catch (e) {
    console.warn('Failed to load document from localStorage:', e);
  }
  return null;
}

/**
 * 3 WAYS TO PASS DATA TO WIDGETS:
 *
 * 1. initialDocument — Pre-build the document with data-populated elements
 * 2. onChange callback — React to changes, persist to DB, sync state
 * 3. Programmatic updates — Use the EditorProvider store externally
 *
 * This demo uses approach #1: building an initialDocument with real data.
 */

// Simulate fetching data from an API
function buildDashboardDocument(): Document {
  const doc = createDefaultDocument();
  doc.name = 'Q4 Dashboard';
  const page = doc.pages[0];
  page.name = 'Overview';

  // --- Pass data directly via element properties ---

  // KPI cards row (top)
  page.elements.push(
    createKPIElement({
      x: 60, y: 40, width: 280, height: 140, layerOrder: 0,
      name: 'Revenue',
      value: '284,500',
      label: 'Total Revenue',
      prefix: '$',
      trend: 'up',
      trendValue: '+18.2% vs last quarter',
    }),
    createKPIElement({
      x: 370, y: 40, width: 280, height: 140, layerOrder: 1,
      name: 'Customers',
      value: '1,247',
      label: 'Active Customers',
      prefix: '',
      trend: 'up',
      trendValue: '+42 this month',
      trendColor: '#50C878',
    }),
    createKPIElement({
      x: 680, y: 40, width: 280, height: 140, layerOrder: 2,
      name: 'Churn',
      value: '2.4',
      label: 'Churn Rate',
      prefix: '',
      suffix: '%',
      trend: 'down',
      trendValue: '-0.3% improvement',
      trendColor: '#50C878', // down is good here
    }),
    createKPIElement({
      x: 990, y: 40, width: 280, height: 140, layerOrder: 3,
      name: 'NPS',
      value: '72',
      label: 'Net Promoter Score',
      prefix: '',
      trend: 'up',
      trendValue: '+5 points',
    }),
  );

  // Bar chart — pass data array directly
  page.elements.push(
    createChartElement({
      x: 60, y: 210, width: 590, height: 360, layerOrder: 4,
      name: 'Revenue Chart',
      chartType: 'bar',
      title: 'Monthly Revenue ($k)',
      data: [
        { label: 'Jul', value: 42 },
        { label: 'Aug', value: 38 },
        { label: 'Sep', value: 55 },
        { label: 'Oct', value: 48 },
        { label: 'Nov', value: 62 },
        { label: 'Dec', value: 71 },
      ],
      showLabels: true,
      showGrid: true,
    }),
  );

  // Line chart
  page.elements.push(
    createChartElement({
      x: 680, y: 210, width: 590, height: 360, layerOrder: 5,
      name: 'Growth Trend',
      chartType: 'line',
      title: 'Customer Growth',
      data: [
        { label: 'Jul', value: 980 },
        { label: 'Aug', value: 1020 },
        { label: 'Sep', value: 1085 },
        { label: 'Oct', value: 1120 },
        { label: 'Nov', value: 1190 },
        { label: 'Dec', value: 1247 },
      ],
      colors: ['#50C878', '#4A90D9'],
      showLabels: true,
      showGrid: true,
    }),
  );

  // Table — pass headers and rows arrays
  page.elements.push(
    createTableElement({
      x: 60, y: 600, width: 750, height: 340, layerOrder: 6,
      name: 'Top Accounts',
      headers: ['Account', 'Plan', 'MRR', 'Health', 'Renewal'],
      rows: [
        ['Acme Corp', 'Enterprise', '$12,400', 'Healthy', 'Mar 2027'],
        ['TechFlow Inc', 'Business', '$8,200', 'At Risk', 'Jun 2026'],
        ['DataDrive Ltd', 'Enterprise', '$15,800', 'Healthy', 'Sep 2026'],
        ['CloudBase', 'Business', '$6,500', 'Healthy', 'Jan 2027'],
        ['InnoSoft', 'Starter', '$2,100', 'Churning', 'Feb 2026'],
        ['Orbit Labs', 'Enterprise', '$18,300', 'Healthy', 'Dec 2026'],
        ['NexaPoint', 'Business', '$9,700', 'Monitor', 'Apr 2027'],
      ],
      fontSize: 13,
    }),
  );

  // Progress indicators
  page.elements.push(
    createProgressElement({
      x: 840, y: 600, width: 430, height: 150, layerOrder: 7,
      name: 'Q4 Target',
      progressStyle: 'bar',
      value: 78,
      maxValue: 100,
      label: 'Q4 Revenue Target',
      fillColor: '#4A90D9',
      thickness: 14,
    }),
    createProgressElement({
      x: 840, y: 770, width: 200, height: 170, layerOrder: 8,
      name: 'Adoption',
      progressStyle: 'circle',
      value: 64,
      maxValue: 100,
      label: 'Feature Adoption',
      fillColor: '#cba6f7',
      thickness: 10,
    }),
    createProgressElement({
      x: 1070, y: 770, width: 200, height: 170, layerOrder: 9,
      name: 'CSAT',
      progressStyle: 'circle',
      value: 91,
      maxValue: 100,
      label: 'CSAT Score',
      fillColor: '#50C878',
      thickness: 10,
    }),
  );

  return doc;
}

/** AI Settings modal for provider + API key configuration */
function AISettingsModal({ onClose }: { onClose: () => void }) {
  const [provider, setProvider] = useState<AIProvider>(getProvider);
  const [apiKey, setApiKey] = useState(getApiKey() ?? '');
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    localStorage.setItem(AI_PROVIDER_KEY, provider);
    if (apiKey.trim()) {
      localStorage.setItem(AI_API_KEY_STORAGE, apiKey.trim());
    } else {
      localStorage.removeItem(AI_API_KEY_STORAGE);
    }
    setSaved(true);
    setTimeout(() => onClose(), 600);
  };

  return (
    <div style={settingsStyles.overlay} onClick={onClose}>
      <div style={settingsStyles.modal} onClick={(e) => e.stopPropagation()}>
        <div style={settingsStyles.title}>AI Provider Settings</div>

        <div style={settingsStyles.field}>
          <label style={settingsStyles.label}>Provider</label>
          <div style={settingsStyles.providerRow}>
            {(['openai', 'anthropic'] as const).map((p) => (
              <button
                key={p}
                style={{
                  ...settingsStyles.providerBtn,
                  ...(provider === p ? settingsStyles.providerBtnActive : {}),
                }}
                onClick={() => setProvider(p)}
              >
                {p === 'openai' ? 'OpenAI (GPT-4o)' : 'Anthropic (Claude)'}
              </button>
            ))}
          </div>
        </div>

        <div style={settingsStyles.field}>
          <label style={settingsStyles.label}>API Key</label>
          <input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder={provider === 'openai' ? 'sk-...' : 'sk-ant-...'}
            style={settingsStyles.input}
          />
          <div style={settingsStyles.hint}>
            {provider === 'openai'
              ? 'Get your key from platform.openai.com/api-keys'
              : 'Get your key from console.anthropic.com'}
          </div>
        </div>

        <div style={settingsStyles.actions}>
          <button style={settingsStyles.cancelBtn} onClick={onClose}>Cancel</button>
          <button style={settingsStyles.saveBtn} onClick={handleSave}>
            {saved ? 'Saved!' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}

const settingsStyles: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000,
  },
  modal: {
    backgroundColor: '#1e1e2e', border: '1px solid #313244', borderRadius: 12,
    padding: 24, width: 380, maxWidth: '90vw',
  },
  title: {
    color: '#cdd6f4', fontSize: 16, fontWeight: 600, marginBottom: 20,
  },
  field: { marginBottom: 16 },
  label: {
    display: 'block', color: '#a6adc8', fontSize: 12, fontWeight: 500, marginBottom: 6,
  },
  providerRow: { display: 'flex', gap: 8 },
  providerBtn: {
    flex: 1, padding: '8px 12px', border: '1px solid #313244', borderRadius: 8,
    backgroundColor: '#16161e', color: '#a6adc8', fontSize: 12, cursor: 'pointer',
    transition: 'all 0.15s',
  },
  providerBtnActive: {
    borderColor: '#89b4fa', color: '#89b4fa', backgroundColor: 'rgba(137,180,250,0.1)',
  },
  input: {
    width: '100%', padding: '8px 12px', border: '1px solid #313244', borderRadius: 8,
    backgroundColor: '#16161e', color: '#cdd6f4', fontSize: 13, outline: 'none',
    boxSizing: 'border-box' as const,
  },
  hint: { color: '#585878', fontSize: 11, marginTop: 4 },
  actions: { display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 20 },
  cancelBtn: {
    padding: '8px 16px', border: '1px solid #313244', borderRadius: 8,
    backgroundColor: 'transparent', color: '#a6adc8', fontSize: 12, cursor: 'pointer',
  },
  saveBtn: {
    padding: '8px 20px', border: 'none', borderRadius: 8,
    background: 'linear-gradient(135deg, #89b4fa, #cba6f7)', color: '#16161e',
    fontSize: 12, fontWeight: 600, cursor: 'pointer',
  },
};

function App() {
  // Load from localStorage if available, otherwise build the default dashboard
  const [initialDoc] = useState(() => {
    const saved = loadFromLocalStorage();
    if (saved) return saved;
    return buildDashboardDocument();
  });

  const [showAISettings, setShowAISettings] = useState(false);

  const handleChange = useCallback((_doc: Document) => {
    // React to every change — persist to DB, sync with others, etc.
  }, []);

  const handleAutoSave = useCallback((doc: Document) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(doc));
    } catch (e) {
      console.warn('Failed to save document to localStorage:', e);
    }
  }, []);

  // AI chat handler — routes to the selected provider (OpenAI or Anthropic)
  const handleAISendMessage = useCallback(async (
    message: string,
    _history: AIChatMessage[],
    onChunk: StreamCallback,
  ): Promise<string> => {
    return callLLM(LLM_SYSTEM_PROMPT, message, onChunk);
  }, []);

  // Transform copilot responses into slide JSON using a second LLM call.
  const handleTransformResponse = createSlideTransformer(
    async (systemPrompt, userMessage) => {
      return callLLM(systemPrompt, userMessage);
    }
  );

  const handleReset = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    window.location.reload();
  }, []);

  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <DesignEditor
        initialDocument={initialDoc}
        onChange={handleChange}
        onAutoSave={handleAutoSave}
        autoSaveInterval={2000}
        showToolbar={true}
        showSidebar={true}
        showInspector={true}
        onAISendMessage={handleAISendMessage}
        aiTransformResponse={handleTransformResponse}
      />
      {/* AI Settings button */}
      <button
        onClick={() => setShowAISettings(true)}
        style={{
          position: 'fixed',
          bottom: 16,
          right: 120,
          padding: '8px 16px',
          backgroundColor: '#313244',
          color: '#cdd6f4',
          border: '1px solid #45475a',
          borderRadius: 8,
          fontSize: 12,
          fontWeight: 500,
          cursor: 'pointer',
          zIndex: 999,
          opacity: 0.8,
          transition: 'opacity 0.15s',
          display: 'flex',
          alignItems: 'center',
          gap: 6,
        }}
        onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
        onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.8')}
        title="Configure AI provider and API key"
      >
        <span style={{ fontSize: 14 }}>AI</span>
        <span style={{
          padding: '1px 6px',
          borderRadius: 4,
          backgroundColor: getProvider() === 'openai' ? 'rgba(16,163,127,0.2)' : 'rgba(137,180,250,0.2)',
          color: getProvider() === 'openai' ? '#10a37f' : '#89b4fa',
          fontSize: 10,
          fontWeight: 600,
        }}>
          {getProvider() === 'openai' ? 'OpenAI' : 'Claude'}
        </span>
      </button>
      <button
        onClick={handleReset}
        style={{
          position: 'fixed',
          bottom: 16,
          right: 16,
          padding: '8px 16px',
          backgroundColor: '#313244',
          color: '#cdd6f4',
          border: '1px solid #45475a',
          borderRadius: 8,
          fontSize: 12,
          fontWeight: 500,
          cursor: 'pointer',
          zIndex: 999,
          opacity: 0.8,
          transition: 'opacity 0.15s',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
        onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.8')}
        title="Clear saved data and reload with default dashboard"
      >
        Reset Demo
      </button>
      {showAISettings && <AISettingsModal onClose={() => setShowAISettings(false)} />}
    </div>
  );
}

export default App;
