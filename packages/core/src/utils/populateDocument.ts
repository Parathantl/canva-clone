import type { Document, CanvasElement, ChartDataPoint } from '../types/document';

/**
 * Populates a dashboard template with live data.
 *
 * Use this on your backend to inject customer-specific data into a
 * saved dashboard template before serving it to the viewer.
 *
 * @example
 * ```typescript
 * import { populateDocument } from '@reactcanvas/core';
 *
 * const template = await db.getDashboard('customer-usage');
 *
 * const doc = populateDocument(template, {
 *   'Revenue Chart': {
 *     data: [
 *       { label: 'Jan', value: 4200 },
 *       { label: 'Feb', value: 5100 },
 *     ],
 *   },
 *   'Usage Table': {
 *     headers: ['Feature', 'Usage', 'Limit'],
 *     rows: [
 *       ['API Calls', '12,400', '50,000'],
 *       ['Storage', '8.2 GB', '20 GB'],
 *     ],
 *   },
 *   'Total Revenue': {
 *     value: '$42,800',
 *     trendValue: '+18%',
 *     trend: 'up',
 *   },
 *   'Health Score': {
 *     value: 85,
 *   },
 * });
 *
 * res.json(doc);
 * ```
 */
export function populateDocument(
  template: Document,
  data: Record<string, Partial<CanvasElement> & {
    /** For charts: array of {label, value} data points */
    data?: ChartDataPoint[];
    /** For tables: column headers */
    headers?: string[];
    /** For tables: row data */
    rows?: string[][];
    /** For KPIs: display value */
    value?: string | number;
    /** For KPIs: trend direction */
    trend?: 'up' | 'down' | 'neutral';
    /** For KPIs: trend text */
    trendValue?: string;
    /** For progress: numeric value 0-100 */
  }>,
): Document {
  // Deep clone to avoid mutating the template
  const doc: Document = JSON.parse(JSON.stringify(template));
  doc.updatedAt = new Date().toISOString();

  for (const page of doc.pages) {
    for (let i = 0; i < page.elements.length; i++) {
      const element = page.elements[i];
      // Match by element name
      const widgetData = data[element.name];
      if (!widgetData) continue;

      // Merge the data into the element
      const merged = { ...element, ...widgetData };
      // Ensure required BaseElement fields are preserved
      if (!merged.id || !merged.type || typeof merged.x !== 'number' || typeof merged.y !== 'number') continue;
      page.elements[i] = merged as CanvasElement;
    }
  }

  return doc;
}

/**
 * Populates widgets by element ID instead of name.
 * Useful when widget names might not be unique.
 */
export function populateDocumentById(
  template: Document,
  data: Record<string, Partial<CanvasElement>>,
): Document {
  const doc: Document = JSON.parse(JSON.stringify(template));
  doc.updatedAt = new Date().toISOString();

  for (const page of doc.pages) {
    for (let i = 0; i < page.elements.length; i++) {
      const element = page.elements[i];
      const widgetData = data[element.id];
      if (!widgetData) continue;
      const merged = { ...element, ...widgetData };
      // Ensure required BaseElement fields are preserved
      if (!merged.id || !merged.type || typeof merged.x !== 'number' || typeof merged.y !== 'number') continue;
      page.elements[i] = merged as CanvasElement;
    }
  }

  return doc;
}

/**
 * Extracts all widget names from a document.
 * Useful for knowing which data keys to provide to populateDocument.
 */
export function getWidgetNames(doc: Document): Array<{ name: string; type: string; id: string }> {
  const widgets: Array<{ name: string; type: string; id: string }> = [];
  for (const page of doc.pages) {
    for (const el of page.elements) {
      if (['chart', 'kpi', 'table', 'progress'].includes(el.type)) {
        widgets.push({ name: el.name, type: el.type, id: el.id });
      }
    }
  }
  return widgets;
}

