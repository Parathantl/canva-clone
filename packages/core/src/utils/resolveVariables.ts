import type { Document } from '../types/document';

/**
 * Resolves {{variable}} placeholders in a document.
 *
 * Usage:
 *   const resolved = resolveVariables(template, {
 *     customerId: '42',
 *     startDate: '2026-01-01',
 *     endDate: '2026-03-31',
 *   });
 *
 * Replaces {{variableName}} in:
 * - Text element content
 * - KPI values, labels, trendValues
 * - Chart titles
 * - Table cell values
 * - Data source URLs and POST bodies
 * - Filter control options
 */
export function resolveVariables(
  doc: Document,
  values: Record<string, string | number>,
): Document {
  // Deep clone to avoid mutating the original
  const resolved: Document = JSON.parse(JSON.stringify(doc));

  // Build replacement map
  const replacements = new Map<string, string>();
  for (const [key, val] of Object.entries(values)) {
    replacements.set(`{{${key}}}`, String(val));
  }
  // Also fill in defaults from document variables
  if (resolved.variables) {
    for (const v of resolved.variables) {
      const key = `{{${v.name}}}`;
      if (!replacements.has(key)) {
        replacements.set(key, v.defaultValue);
      }
    }
  }

  // Replace in all string fields recursively
  replaceInObject(resolved, replacements);

  return resolved;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- recursive walk over unknown JSON structure
function replaceInObject(obj: Record<string, any> | any[], replacements: Map<string, string>): void {
  if (obj == null || typeof obj !== 'object') return;

  if (Array.isArray(obj)) {
    for (let i = 0; i < obj.length; i++) {
      if (typeof obj[i] === 'string') {
        obj[i] = replaceString(obj[i], replacements);
      } else if (typeof obj[i] === 'object' && obj[i] !== null) {
        replaceInObject(obj[i], replacements);
      }
    }
    return;
  }

  for (const key of Object.keys(obj)) {
    const value = obj[key];
    if (typeof value === 'string') {
      obj[key] = replaceString(value, replacements);
    } else if (typeof value === 'object' && value !== null) {
      replaceInObject(value, replacements);
    }
  }
}

function replaceString(str: string, replacements: Map<string, string>): string {
  if (!str.includes('{{')) return str;
  let result = str;
  for (const [pattern, replacement] of replacements) {
    // Replace all occurrences using split/join to avoid infinite loop
    // when a replacement value contains the pattern itself
    result = result.split(pattern).join(replacement);
  }
  return result;
}

/** Variable pattern for scanning: matches {{variableName}} */
const VARIABLE_PATTERN = /\{\{([^}]+)\}\}/g;

/** Get all variable names used in a document (scans for {{...}} patterns) */
export function extractVariables(doc: Document): string[] {
  const names = new Set<string>();
  scanObject(doc, names);
  return Array.from(names);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- recursive walk over unknown JSON structure
function scanObject(obj: Record<string, any> | any[], names: Set<string>): void {
  if (obj == null || typeof obj !== 'object') return;

  if (Array.isArray(obj)) {
    for (const item of obj) {
      if (typeof item === 'string') {
        scanString(item, names);
      } else if (typeof item === 'object' && item !== null) {
        scanObject(item, names);
      }
    }
    return;
  }

  for (const key of Object.keys(obj)) {
    const value = obj[key];
    if (typeof value === 'string') {
      scanString(value, names);
    } else if (typeof value === 'object' && value !== null) {
      scanObject(value, names);
    }
  }
}

function scanString(str: string, names: Set<string>): void {
  let match: RegExpExecArray | null;
  VARIABLE_PATTERN.lastIndex = 0;
  while ((match = VARIABLE_PATTERN.exec(str)) !== null) {
    names.add(match[1]);
  }
}

/** Validates that all required variables have values */
export function validateVariables(
  doc: Document,
  values: Record<string, string | number>,
): { valid: boolean; missing: string[] } {
  const used = extractVariables(doc);
  const provided = new Set(Object.keys(values));

  // Also count defaults from doc.variables as provided
  if (doc.variables) {
    for (const v of doc.variables) {
      if (v.defaultValue !== undefined && v.defaultValue !== '') {
        provided.add(v.name);
      }
    }
  }

  const missing = used.filter((name) => !provided.has(name));
  return { valid: missing.length === 0, missing };
}
