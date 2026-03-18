import React, { useCallback } from 'react';
import { useEditorInstance } from '@reactcanvas/react';
import {
  createDefaultDocument,
  createTextElement,
  createChartElement,
  createKPIElement,
  createTableElement,
  createProgressElement,
  createFilterControlElement,
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
        createTextElement({ x: 200, y: 350, width: 1520, height: 120, layerOrder: 0, content: 'Your Company Name', fontSize: 72, fontWeight: 700, fill: { type: 'solid', color: '#212529' }, textAlign: 'center', name: 'Title' }),
        createTextElement({ x: 400, y: 500, width: 1120, height: 60, layerOrder: 1, content: 'A brief tagline that captures your value proposition', fontSize: 28, fill: { type: 'solid', color: '#6c757d' }, textAlign: 'center', name: 'Subtitle' }),
      );

      // Slide 2: Key metrics
      const page2: Page = { id: `p-${Date.now()}-2`, name: 'Metrics', width: 1920, height: 1080, backgroundColor: '#ffffff', elements: [], notes: '' };
      page2.elements.push(
        createTextElement({ x: 60, y: 40, width: 800, height: 80, layerOrder: 0, content: 'Key Metrics', fontSize: 48, fontWeight: 700, fill: { type: 'solid', color: '#212529' }, name: 'Heading' }),
        createKPIElement({ x: 60, y: 160, width: 400, height: 160, layerOrder: 1, value: '$2.4M', label: 'Annual Revenue', trend: 'up', trendValue: '+42%' }),
        createKPIElement({ x: 500, y: 160, width: 400, height: 160, layerOrder: 2, value: '15K+', label: 'Customers', trend: 'up', trendValue: '+28%' }),
        createChartElement({ x: 60, y: 380, width: 1200, height: 400, layerOrder: 3, chartType: 'area', title: 'Revenue Growth', data: [{ label: 'Q1', value: 400 }, { label: 'Q2', value: 700 }, { label: 'Q3', value: 1200 }, { label: 'Q4', value: 2400 }] }),
      );
      doc.pages.push(page2);

      // Slide 3: Roadmap
      const page3: Page = { id: `p-${Date.now()}-3`, name: 'Roadmap', width: 1920, height: 1080, backgroundColor: '#ffffff', elements: [], notes: '' };
      page3.elements.push(
        createTextElement({ x: 60, y: 40, width: 800, height: 80, layerOrder: 0, content: 'Roadmap', fontSize: 48, fontWeight: 700, fill: { type: 'solid', color: '#212529' }, name: 'Heading' }),
        createProgressElement({ x: 60, y: 180, width: 800, height: 120, layerOrder: 1, label: 'Phase 1: Foundation', value: 100, fillColor: '#50C878' }),
        createProgressElement({ x: 60, y: 340, width: 800, height: 120, layerOrder: 2, label: 'Phase 2: Growth', value: 65, fillColor: '#4A90D9' }),
        createProgressElement({ x: 60, y: 500, width: 800, height: 120, layerOrder: 3, label: 'Phase 3: Scale', value: 20, fillColor: '#7c5cbf' }),
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
  {
    id: 'sales-dashboard',
    name: 'Sales Dashboard',
    description: 'Pipeline, revenue & team',
    preview: '$',
    build: () => {
      const doc = createDefaultDocument();
      doc.name = 'Sales Dashboard';
      const page = doc.pages[0];
      page.name = 'Sales Overview';

      page.elements.push(
        // Filter controls row
        createFilterControlElement({ x: 60, y: 20, width: 220, height: 52, layerOrder: 0, name: 'Region Filter', controlType: 'dropdown', label: 'Region', filterField: 'region', options: ['North', 'South', 'East', 'West'], placeholder: 'All Regions' }),
        createFilterControlElement({ x: 300, y: 20, width: 280, height: 52, layerOrder: 1, name: 'Date Filter', controlType: 'dateRange', label: 'Period', filterField: 'date' }),
        // KPI row
        createKPIElement({ x: 60, y: 90, width: 280, height: 130, layerOrder: 2, value: '$1.2M', label: 'Pipeline Value', trend: 'up', trendValue: '+24%' }),
        createKPIElement({ x: 370, y: 90, width: 280, height: 130, layerOrder: 3, value: '34', label: 'Deals in Pipeline', trend: 'up', trendValue: '+8' }),
        createKPIElement({ x: 680, y: 90, width: 280, height: 130, layerOrder: 4, value: '$38.5K', label: 'Avg Deal Size', trend: 'up', trendValue: '+12%' }),
        createKPIElement({ x: 990, y: 90, width: 280, height: 130, layerOrder: 5, value: '28%', label: 'Win Rate', trend: 'down', trendValue: '-2%', trendColor: '#e03131' }),
        // Charts
        createChartElement({ x: 60, y: 240, width: 600, height: 340, layerOrder: 6, chartType: 'bar', title: 'Revenue by Region', data: [{ label: 'North', value: 420 }, { label: 'South', value: 280 }, { label: 'East', value: 350 }, { label: 'West', value: 190 }] }),
        createChartElement({ x: 690, y: 240, width: 580, height: 340, layerOrder: 7, chartType: 'donut', title: 'Pipeline by Stage', showLegend: true, data: [{ label: 'Prospect', value: 15 }, { label: 'Qualified', value: 8 }, { label: 'Proposal', value: 6 }, { label: 'Negotiation', value: 5 }] }),
        // Table
        createTableElement({ x: 60, y: 610, width: 1210, height: 320, layerOrder: 8, headers: ['Deal', 'Company', 'Value', 'Stage', 'Rep', 'Close Date'], rows: [
          ['Enterprise Suite', 'Acme Corp', '$85,000', 'Negotiation', 'Sarah K.', '2026-04-15'],
          ['Platform License', 'TechFlow', '$42,000', 'Proposal', 'Mike R.', '2026-04-22'],
          ['Annual Contract', 'DataDrive', '$120,000', 'Qualified', 'Sarah K.', '2026-05-01'],
          ['Starter Plan', 'NexaPoint', '$18,000', 'Prospect', 'Alex T.', '2026-05-15'],
          ['Growth Bundle', 'CloudBase', '$65,000', 'Proposal', 'Mike R.', '2026-04-30'],
        ] }),
      );
      return doc;
    },
  },
  {
    id: 'marketing-dashboard',
    name: 'Marketing',
    description: 'Campaigns, traffic & leads',
    preview: '\u2606',
    build: () => {
      const doc = createDefaultDocument();
      doc.name = 'Marketing Dashboard';
      const page = doc.pages[0];
      page.name = 'Marketing';

      page.elements.push(
        createFilterControlElement({ x: 60, y: 20, width: 220, height: 52, layerOrder: 0, name: 'Channel Filter', controlType: 'dropdown', label: 'Channel', filterField: 'channel', options: ['Organic', 'Paid', 'Social', 'Email', 'Referral'], placeholder: 'All Channels' }),
        createKPIElement({ x: 60, y: 90, width: 290, height: 130, layerOrder: 1, value: '48.2K', label: 'Monthly Visitors', trend: 'up', trendValue: '+18%' }),
        createKPIElement({ x: 380, y: 90, width: 290, height: 130, layerOrder: 2, value: '1,247', label: 'Leads Generated', trend: 'up', trendValue: '+24%' }),
        createKPIElement({ x: 700, y: 90, width: 290, height: 130, layerOrder: 3, value: '$14.20', label: 'Cost per Lead', trend: 'down', trendValue: '-8%', trendColor: '#2b8a3e' }),
        createKPIElement({ x: 1020, y: 90, width: 250, height: 130, layerOrder: 4, value: '2.6%', label: 'Conversion Rate', trend: 'up', trendValue: '+0.3%' }),
        createChartElement({ x: 60, y: 240, width: 620, height: 340, layerOrder: 5, chartType: 'area', title: 'Traffic Over Time', data: [{ label: 'Jan', value: 28000 }, { label: 'Feb', value: 32000 }, { label: 'Mar', value: 35000 }, { label: 'Apr', value: 38000 }, { label: 'May', value: 42000 }, { label: 'Jun', value: 48200 }] }),
        createChartElement({ x: 710, y: 240, width: 560, height: 340, layerOrder: 6, chartType: 'pie', title: 'Traffic by Channel', showLegend: true, data: [{ label: 'Organic', value: 42 }, { label: 'Paid', value: 28 }, { label: 'Social', value: 18 }, { label: 'Email', value: 8 }, { label: 'Referral', value: 4 }] }),
        createChartElement({ x: 60, y: 610, width: 600, height: 320, layerOrder: 7, chartType: 'horizontalBar' as any, title: 'Campaign Performance', data: [{ label: 'Summer Sale', value: 450 }, { label: 'Product Launch', value: 380 }, { label: 'Brand Awareness', value: 290 }, { label: 'Retargeting', value: 520 }, { label: 'Newsletter', value: 180 }] }),
        createTableElement({ x: 690, y: 610, width: 580, height: 320, layerOrder: 8, headers: ['Campaign', 'Spend', 'Leads', 'CPL', 'ROI'], rows: [
          ['Summer Sale', '$12,500', '324', '$38.58', '285%'],
          ['Product Launch', '$8,200', '186', '$44.09', '210%'],
          ['Retargeting', '$5,800', '412', '$14.08', '520%'],
          ['Newsletter', '$1,200', '98', '$12.24', '340%'],
        ] }),
      );
      return doc;
    },
  },
  {
    id: 'ops-dashboard',
    name: 'Operations',
    description: 'Uptime, SLAs & incidents',
    preview: '\u2699',
    build: () => {
      const doc = createDefaultDocument();
      doc.name = 'Ops Dashboard';
      const page = doc.pages[0];
      page.name = 'Operations';

      page.elements.push(
        createKPIElement({ x: 60, y: 40, width: 280, height: 130, layerOrder: 0, value: '99.97%', label: 'Uptime (30d)', trend: 'up', trendValue: '+0.02%' }),
        createKPIElement({ x: 370, y: 40, width: 280, height: 130, layerOrder: 1, value: '142ms', label: 'Avg Response Time', trend: 'down', trendValue: '-18ms', trendColor: '#2b8a3e' }),
        createKPIElement({ x: 680, y: 40, width: 280, height: 130, layerOrder: 2, value: '3', label: 'Open Incidents', trend: 'down', trendValue: '-2', trendColor: '#2b8a3e' }),
        createKPIElement({ x: 990, y: 40, width: 280, height: 130, layerOrder: 3, value: '94%', label: 'SLA Compliance', trend: 'up', trendValue: '+1.5%' }),
        createChartElement({ x: 60, y: 190, width: 620, height: 340, layerOrder: 4, chartType: 'line', title: 'Response Time (ms)', data: [{ label: 'Mon', value: 148 }, { label: 'Tue', value: 135 }, { label: 'Wed', value: 162 }, { label: 'Thu', value: 128 }, { label: 'Fri', value: 142 }, { label: 'Sat', value: 118 }, { label: 'Sun', value: 125 }] }),
        createChartElement({ x: 710, y: 190, width: 560, height: 340, layerOrder: 5, chartType: 'bar', title: 'Incidents by Severity', data: [{ label: 'Critical', value: 1, color: '#e03131' }, { label: 'High', value: 2, color: '#e67700' }, { label: 'Medium', value: 5, color: '#FFB347' }, { label: 'Low', value: 12, color: '#2b8a3e' }] }),
        createProgressElement({ x: 60, y: 560, width: 400, height: 130, layerOrder: 6, label: 'Deployment Success Rate', value: 96, fillColor: '#2b8a3e', thickness: 14 }),
        createProgressElement({ x: 490, y: 560, width: 200, height: 170, layerOrder: 7, progressStyle: 'circle', label: 'CPU Usage', value: 62, fillColor: '#4A90D9', thickness: 10 }),
        createProgressElement({ x: 720, y: 560, width: 200, height: 170, layerOrder: 8, progressStyle: 'circle', label: 'Memory', value: 78, fillColor: '#e67700', thickness: 10 }),
        createProgressElement({ x: 950, y: 560, width: 200, height: 170, layerOrder: 9, progressStyle: 'circle', label: 'Disk', value: 45, fillColor: '#2b8a3e', thickness: 10 }),
        createTableElement({ x: 60, y: 750, width: 1210, height: 240, layerOrder: 10, headers: ['Incident', 'Severity', 'Status', 'Assigned', 'Duration'], rows: [
          ['API latency spike', 'Critical', 'Investigating', 'Ops Team', '2h 15m'],
          ['EU region slowdown', 'High', 'Monitoring', 'Infra Team', '45m'],
          ['Certificate renewal', 'Medium', 'Scheduled', 'SecOps', 'Pending'],
        ] }),
      );
      return doc;
    },
  },
  {
    id: 'finance-dashboard',
    name: 'Finance',
    description: 'P&L, cash flow & budget',
    preview: '\u2261',
    build: () => {
      const doc = createDefaultDocument();
      doc.name = 'Finance Dashboard';
      const page = doc.pages[0];
      page.name = 'Finance';

      page.elements.push(
        createFilterControlElement({ x: 60, y: 20, width: 220, height: 52, layerOrder: 0, name: 'Period Filter', controlType: 'dropdown', label: 'Quarter', filterField: 'quarter', options: ['Q1 2026', 'Q2 2026', 'Q3 2026', 'Q4 2026'], placeholder: 'All Quarters' }),
        createKPIElement({ x: 60, y: 90, width: 280, height: 130, layerOrder: 1, value: '$2.4M', label: 'Total Revenue', prefix: '', trend: 'up', trendValue: '+18% YoY' }),
        createKPIElement({ x: 370, y: 90, width: 280, height: 130, layerOrder: 2, value: '$1.8M', label: 'Total Expenses', prefix: '', trend: 'up', trendValue: '+8%' }),
        createKPIElement({ x: 680, y: 90, width: 280, height: 130, layerOrder: 3, value: '$620K', label: 'Net Profit', prefix: '', trend: 'up', trendValue: '+42%' }),
        createKPIElement({ x: 990, y: 90, width: 280, height: 130, layerOrder: 4, value: '25.8%', label: 'Profit Margin', prefix: '', trend: 'up', trendValue: '+4.2%' }),
        createChartElement({
          x: 60, y: 240, width: 620, height: 340, layerOrder: 5,
          chartType: 'stackedBar' as any, title: 'Revenue vs Expenses', showLegend: true,
          data: [],
          labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
          series: [
            { name: 'Revenue', data: [320, 380, 420, 390, 440, 480], color: '#4A90D9' },
            { name: 'Expenses', data: [240, 260, 290, 280, 310, 320], color: '#e03131' },
          ],
        }),
        createChartElement({ x: 710, y: 240, width: 560, height: 340, layerOrder: 6, chartType: 'donut', title: 'Expense Breakdown', showLegend: true, data: [{ label: 'Payroll', value: 55 }, { label: 'Infrastructure', value: 18 }, { label: 'Marketing', value: 12 }, { label: 'Operations', value: 10 }, { label: 'Other', value: 5 }] }),
        createChartElement({ x: 60, y: 610, width: 1210, height: 300, layerOrder: 7, chartType: 'area', title: 'Cash Flow Trend', data: [{ label: 'Jan', value: 180 }, { label: 'Feb', value: 210 }, { label: 'Mar', value: 195 }, { label: 'Apr', value: 240 }, { label: 'May', value: 280 }, { label: 'Jun', value: 320 }] }),
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
    color: '#868e96',
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
    backgroundColor: '#f8f9fa',
    border: '1px solid #dee2e6',
    borderRadius: 10,
    cursor: 'pointer',
    transition: 'all 0.12s',
    textAlign: 'center' as const,
  },
  preview: {
    fontSize: 32,
    lineHeight: 1,
    color: '#4A90D9',
    marginBottom: 4,
  },
  cardName: {
    fontSize: 13,
    color: '#212529',
    fontWeight: 600,
  },
  cardDesc: {
    fontSize: 10,
    color: '#868e96',
  },
};
