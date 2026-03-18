import type { CanvasElement, ChartElement, TableElement, KPIElement } from '@reactcanvas/core';

/**
 * Escape a CSV field value — wraps in quotes if it contains commas, quotes, or newlines.
 */
function escapeCSVField(value: string): string {
  const str = String(value ?? '');
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return '"' + str.replace(/"/g, '""') + '"';
  }
  return str;
}

function rowToCSV(fields: string[]): string {
  return fields.map(escapeCSVField).join(',');
}

/**
 * Convert a table element's data to a CSV string.
 */
export function tableToCSV(headers: string[], rows: string[][]): string {
  const lines: string[] = [];
  lines.push(rowToCSV(headers));
  for (const row of rows) {
    lines.push(rowToCSV(row));
  }
  return lines.join('\n');
}

/**
 * Convert chart data points to a CSV string.
 */
export function chartToCSV(title: string, data: Array<{ label: string; value: number }>): string {
  const lines: string[] = [];
  lines.push(rowToCSV(['Label', 'Value']));
  for (const point of data) {
    lines.push(rowToCSV([point.label, String(point.value)]));
  }
  return lines.join('\n');
}

/**
 * Convert a KPI element to a CSV string.
 */
export function kpiToCSV(element: KPIElement): string {
  const lines: string[] = [];
  lines.push(rowToCSV(['Label', 'Value', 'Trend', 'Trend Value']));
  lines.push(
    rowToCSV([
      element.label,
      (element.prefix ?? '') + element.value + (element.suffix ?? ''),
      element.trend,
      element.trendValue,
    ])
  );
  return lines.join('\n');
}

/**
 * Export all widget data from a page as a multi-section CSV with headers between sections.
 */
export function pageDataToCSV(elements: CanvasElement[]): string {
  const sections: string[] = [];

  for (const el of elements) {
    if (el.type === 'table') {
      const table = el as TableElement;
      const sectionTitle = `--- ${table.name || 'Table'} ---`;
      sections.push(sectionTitle);
      sections.push(tableToCSV(table.headers, table.rows));
      sections.push(''); // blank line separator
    } else if (el.type === 'chart') {
      const chart = el as ChartElement;
      const sectionTitle = `--- ${chart.title || chart.name || 'Chart'} ---`;
      sections.push(sectionTitle);
      sections.push(chartToCSV(chart.title, chart.data));
      sections.push('');
    } else if (el.type === 'kpi') {
      const kpi = el as KPIElement;
      const sectionTitle = `--- ${kpi.label || kpi.name || 'KPI'} ---`;
      sections.push(sectionTitle);
      sections.push(kpiToCSV(kpi));
      sections.push('');
    }
  }

  if (sections.length === 0) {
    return 'No data widgets found on this page.';
  }

  return sections.join('\n');
}

/**
 * Trigger a download of a string as a CSV file.
 */
export function downloadCSV(content: string, filename: string): void {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = window.document.createElement('a');
  a.href = url;
  a.download = filename.endsWith('.csv') ? filename : filename + '.csv';
  window.document.body.appendChild(a);
  a.click();
  window.document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Convert to Excel-compatible CSV with BOM for proper UTF-8 encoding in Excel.
 */
export function downloadExcel(content: string, filename: string): void {
  const bom = '\uFEFF';
  const blob = new Blob([bom + content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = window.document.createElement('a');
  a.href = url;
  a.download = filename.endsWith('.csv') ? filename : filename + '.csv';
  window.document.body.appendChild(a);
  a.click();
  window.document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
