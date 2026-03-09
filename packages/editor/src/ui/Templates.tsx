import React, { useCallback } from 'react';
import { useEditorInstance } from '@reactcanvas/react';
import {
  createDefaultDocument,
  createTextElement,
  createChartElement,
  createKPIElement,
  createTableElement,
  createProgressElement,
} from '@reactcanvas/core';
import type { Document, Page } from '@reactcanvas/core';

interface Template {
  id: string;
  name: string;
  description: string;
  preview: string;
  build: () => Document;
}

const TEMPLATES: Template[] = [
  {
    id: 'blank',
    name: 'Blank',
    description: 'Start from scratch',
    preview: '\u25A1',
    build: () => createDefaultDocument(),
  },
  {
    id: 'dashboard',
    name: 'Dashboard',
    description: 'KPIs, charts & table',
    preview: '\u2630',
    build: () => {
      const doc = createDefaultDocument();
      doc.name = 'Dashboard';
      const page = doc.pages[0];
      page.name = 'Overview';

      page.elements.push(
        createKPIElement({ x: 60, y: 40, width: 280, height: 130, layerOrder: 0, name: 'Revenue', value: '$48.2K', label: 'Monthly Revenue', trend: 'up', trendValue: '+12.5%' }),
        createKPIElement({ x: 370, y: 40, width: 280, height: 130, layerOrder: 1, name: 'Users', value: '2,847', label: 'Active Users', trend: 'up', trendValue: '+8.3%', trendColor: '#50C878' }),
        createKPIElement({ x: 680, y: 40, width: 280, height: 130, layerOrder: 2, name: 'Conversion', value: '3.6%', label: 'Conversion Rate', trend: 'down', trendValue: '-0.4%', trendColor: '#E8596D' }),
        createChartElement({ x: 60, y: 200, width: 580, height: 340, layerOrder: 3, chartType: 'bar', title: 'Monthly Revenue', data: [{ label: 'Jan', value: 32 }, { label: 'Feb', value: 38 }, { label: 'Mar', value: 42 }, { label: 'Apr', value: 48 }] }),
        createChartElement({ x: 680, y: 200, width: 580, height: 340, layerOrder: 4, chartType: 'line', title: 'User Growth', data: [{ label: 'Jan', value: 1800 }, { label: 'Feb', value: 2100 }, { label: 'Mar', value: 2500 }, { label: 'Apr', value: 2847 }] }),
        createTableElement({ x: 60, y: 570, width: 600, height: 280, layerOrder: 5, name: 'Top Accounts', headers: ['Account', 'Plan', 'MRR'], rows: [['Acme Corp', 'Enterprise', '$12,400'], ['TechFlow', 'Business', '$8,200'], ['DataDrive', 'Enterprise', '$15,800']] }),
        createProgressElement({ x: 700, y: 570, width: 280, height: 130, layerOrder: 6, label: 'Q4 Target', value: 72 }),
      );
      return doc;
    },
  },
  {
    id: 'presentation',
    name: 'Presentation',
    description: '3-slide pitch deck',
    preview: '\u25B6',
    build: () => {
      const doc = createDefaultDocument();
      doc.name = 'Pitch Deck';
      const page1 = doc.pages[0];
      page1.name = 'Title';
      page1.backgroundColor = '#1e1e2e';

      page1.elements.push(
        createTextElement({ x: 200, y: 350, width: 1520, height: 120, layerOrder: 0, content: 'Your Company Name', fontSize: 72, fontWeight: 700, fill: { type: 'solid', color: '#cdd6f4' }, textAlign: 'center', name: 'Title' }),
        createTextElement({ x: 400, y: 500, width: 1120, height: 60, layerOrder: 1, content: 'A brief tagline that captures your value proposition', fontSize: 28, fill: { type: 'solid', color: '#a0a0c0' }, textAlign: 'center', name: 'Subtitle' }),
      );

      // Slide 2: Key metrics
      const page2: Page = { id: `p-${Date.now()}-2`, name: 'Metrics', width: 1920, height: 1080, backgroundColor: '#1e1e2e', elements: [], notes: '' };
      page2.elements.push(
        createTextElement({ x: 60, y: 40, width: 800, height: 80, layerOrder: 0, content: 'Key Metrics', fontSize: 48, fontWeight: 700, fill: { type: 'solid', color: '#cdd6f4' }, name: 'Heading' }),
        createKPIElement({ x: 60, y: 160, width: 400, height: 160, layerOrder: 1, value: '$2.4M', label: 'Annual Revenue', trend: 'up', trendValue: '+42%' }),
        createKPIElement({ x: 500, y: 160, width: 400, height: 160, layerOrder: 2, value: '15K+', label: 'Customers', trend: 'up', trendValue: '+28%' }),
        createChartElement({ x: 60, y: 380, width: 1200, height: 400, layerOrder: 3, chartType: 'area', title: 'Revenue Growth', data: [{ label: 'Q1', value: 400 }, { label: 'Q2', value: 700 }, { label: 'Q3', value: 1200 }, { label: 'Q4', value: 2400 }] }),
      );
      doc.pages.push(page2);

      // Slide 3: Roadmap
      const page3: Page = { id: `p-${Date.now()}-3`, name: 'Roadmap', width: 1920, height: 1080, backgroundColor: '#1e1e2e', elements: [], notes: '' };
      page3.elements.push(
        createTextElement({ x: 60, y: 40, width: 800, height: 80, layerOrder: 0, content: 'Roadmap', fontSize: 48, fontWeight: 700, fill: { type: 'solid', color: '#cdd6f4' }, name: 'Heading' }),
        createProgressElement({ x: 60, y: 180, width: 800, height: 120, layerOrder: 1, label: 'Phase 1: Foundation', value: 100, fillColor: '#50C878' }),
        createProgressElement({ x: 60, y: 340, width: 800, height: 120, layerOrder: 2, label: 'Phase 2: Growth', value: 65, fillColor: '#89b4fa' }),
        createProgressElement({ x: 60, y: 500, width: 800, height: 120, layerOrder: 3, label: 'Phase 3: Scale', value: 20, fillColor: '#cba6f7' }),
      );
      doc.pages.push(page3);

      return doc;
    },
  },
  {
    id: 'analytics',
    name: 'Analytics Report',
    description: 'Charts & data focus',
    preview: '\u2587',
    build: () => {
      const doc = createDefaultDocument();
      doc.name = 'Analytics Report';
      const page = doc.pages[0];
      page.name = 'Analytics';

      page.elements.push(
        createTextElement({ x: 60, y: 30, width: 600, height: 60, layerOrder: 0, content: 'Analytics Report', fontSize: 36, fontWeight: 700, fill: { type: 'solid', color: '#1a1a2e' }, name: 'Title' }),
        createChartElement({ x: 60, y: 110, width: 600, height: 320, layerOrder: 1, chartType: 'bar', title: 'Revenue by Channel', data: [{ label: 'Direct', value: 45 }, { label: 'Organic', value: 32 }, { label: 'Referral', value: 18 }, { label: 'Paid', value: 28 }] }),
        createChartElement({ x: 690, y: 110, width: 570, height: 320, layerOrder: 2, chartType: 'pie', title: 'Traffic Sources', data: [{ label: 'Organic', value: 45 }, { label: 'Direct', value: 25 }, { label: 'Social', value: 20 }, { label: 'Email', value: 10 }] }),
        createChartElement({ x: 60, y: 460, width: 1200, height: 300, layerOrder: 3, chartType: 'line', title: 'Monthly Trends', data: [{ label: 'Jan', value: 120 }, { label: 'Feb', value: 145 }, { label: 'Mar', value: 132 }, { label: 'Apr', value: 178 }, { label: 'May', value: 195 }, { label: 'Jun', value: 220 }] }),
        createTableElement({ x: 60, y: 790, width: 1200, height: 240, layerOrder: 4, headers: ['Metric', 'Current', 'Previous', 'Change'], rows: [['Revenue', '$48.2K', '$42.8K', '+12.6%'], ['Users', '2,847', '2,430', '+17.2%'], ['Bounce Rate', '38.2%', '41.5%', '-3.3%']] }),
      );
      return doc;
    },
  },
];

export function Templates() {
  const { store } = useEditorInstance();

  const handleApply = useCallback(
    (template: Template) => {
      const doc = template.build();
      store.getState().setDocument(doc);
    },
    [store]
  );

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <span style={styles.title}>Templates</span>
      </div>
      <div style={styles.grid}>
        {TEMPLATES.map((t) => (
          <button
            key={t.id}
            onClick={() => handleApply(t)}
            style={styles.card}
            title={t.description}
          >
            <div style={styles.preview}>{t.preview}</div>
            <div style={styles.cardName}>{t.name}</div>
            <div style={styles.cardDesc}>{t.description}</div>
          </button>
        ))}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    overflow: 'hidden',
  },
  header: {
    padding: '10px 14px 8px',
  },
  title: {
    color: '#585878',
    fontSize: 10,
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '1px',
  },
  grid: {
    flex: 1,
    overflow: 'auto',
    padding: '0 12px 12px',
    display: 'grid',
    gridTemplateColumns: '1fr',
    gap: 8,
    alignContent: 'start',
  },
  card: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 6,
    padding: '18px 12px 14px',
    backgroundColor: '#1e1e2e',
    border: '1px solid #2a2a3a',
    borderRadius: 10,
    cursor: 'pointer',
    transition: 'all 0.12s',
    textAlign: 'center' as const,
  },
  preview: {
    fontSize: 32,
    lineHeight: 1,
    color: '#89b4fa',
    marginBottom: 4,
  },
  cardName: {
    fontSize: 13,
    color: '#cdd6f4',
    fontWeight: 600,
  },
  cardDesc: {
    fontSize: 10,
    color: '#585878',
  },
};
