import React, { useCallback, useState } from 'react';
import { DesignEditor } from '@reactcanvas/editor';
import type { Document } from '@reactcanvas/core';
import {
  createDefaultDocument,
  createChartElement,
  createKPIElement,
  createTableElement,
  createProgressElement,
} from '@reactcanvas/core';

const STORAGE_KEY = 'reactcanvas-doc';

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

function App() {
  // Load from localStorage if available, otherwise build the default dashboard
  const [initialDoc] = useState(() => {
    const saved = loadFromLocalStorage();
    if (saved) return saved;
    return buildDashboardDocument();
  });

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
      />
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
    </div>
  );
}

export default App;
