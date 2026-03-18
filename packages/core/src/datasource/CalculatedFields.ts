import type { CalculatedField, AggregationType } from '../types/document';

/**
 * Applies calculated fields to a data array.
 * Returns the data array with new computed columns added.
 */
export function applyCalculatedFields(
  data: Record<string, any>[],
  fields: CalculatedField[],
): Record<string, any>[] {
  if (!fields || fields.length === 0 || data.length === 0) return data;

  // First pass: compute aggregates (single value applied to all rows)
  const aggregates = new Map<string, number>();
  for (const field of fields) {
    if (field.type === 'aggregate' && field.sourceField && field.aggregation) {
      const values = data
        .map((row) => parseFloat(row[field.sourceField!]))
        .filter((v) => !isNaN(v));
      aggregates.set(field.name, computeAggregate(values, field.aggregation));
    }
  }

  // Second pass: apply formula fields and attach aggregates
  return data.map((row) => {
    const newRow = { ...row };

    for (const field of fields) {
      if (field.type === 'aggregate') {
        newRow[field.name] = aggregates.get(field.name) ?? 0;
      } else if (field.type === 'formula' && field.expression) {
        newRow[field.name] = evaluateFormula(field.expression, row);
      }
    }

    return newRow;
  });
}

function computeAggregate(values: number[], fn: AggregationType): number {
  if (values.length === 0) return 0;

  switch (fn) {
    case 'sum':
      return values.reduce((a, b) => a + b, 0);
    case 'avg':
      return values.reduce((a, b) => a + b, 0) / values.length;
    case 'count':
      return values.length;
    case 'min':
      return Math.min(...values);
    case 'max':
      return Math.max(...values);
    case 'median': {
      const sorted = [...values].sort((a, b) => a - b);
      const mid = Math.floor(sorted.length / 2);
      return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
    }
    default:
      return 0;
  }
}

/**
 * Evaluate a simple math formula with field references.
 * Supports: +, -, *, /, (), field names, numbers
 * Example: "revenue - cost", "price * quantity", "(a + b) / 2"
 *
 * Uses a safe recursive descent parser instead of Function/eval.
 */
function evaluateFormula(expression: string, row: Record<string, any>): number {
  try {
    // Replace field references with their numeric values
    let expr = expression;
    // Sort field names by length (longest first) to avoid partial replacement
    const fieldNames = Object.keys(row).sort((a, b) => b.length - a.length);
    for (const field of fieldNames) {
      const val = parseFloat(row[field]);
      if (!isNaN(val)) {
        // Use word boundary replacement to avoid partial matches
        expr = expr.replace(new RegExp(`\\b${escapeRegex(field)}\\b`, 'g'), String(val));
      }
    }

    const result = parseMathExpression(expr);
    return typeof result === 'number' && isFinite(result) ? result : 0;
  } catch {
    return 0;
  }
}

/**
 * Safe recursive descent math parser.
 * Grammar:
 *   expr   = term (('+' | '-') term)*
 *   term   = factor (('*' | '/') factor)*
 *   factor = ['-'] (number | '(' expr ')')
 */
function parseMathExpression(input: string): number {
  let pos = 0;
  const str = input.replace(/\s+/g, ''); // strip whitespace

  function parseExpr(): number {
    let result = parseTerm();
    while (pos < str.length) {
      const ch = str[pos];
      if (ch === '+') { pos++; result += parseTerm(); }
      else if (ch === '-') { pos++; result -= parseTerm(); }
      else break;
    }
    return result;
  }

  function parseTerm(): number {
    let result = parseFactor();
    while (pos < str.length) {
      const ch = str[pos];
      if (ch === '*') { pos++; result *= parseFactor(); }
      else if (ch === '/') { pos++; result /= parseFactor(); }
      else break;
    }
    return result;
  }

  function parseFactor(): number {
    // Unary minus
    if (str[pos] === '-') {
      pos++;
      return -parseFactor();
    }
    // Unary plus
    if (str[pos] === '+') {
      pos++;
      return parseFactor();
    }
    // Parenthesized expression
    if (str[pos] === '(') {
      pos++; // skip '('
      const result = parseExpr();
      if (str[pos] === ')') pos++; // skip ')'
      return result;
    }
    // Number (integer or decimal)
    const start = pos;
    while (pos < str.length && (str[pos] >= '0' && str[pos] <= '9' || str[pos] === '.')) {
      pos++;
    }
    if (pos === start) {
      // Unexpected character — return NaN to signal error
      return NaN;
    }
    return parseFloat(str.slice(start, pos));
  }

  const result = parseExpr();
  // Ensure the entire input was consumed
  if (pos !== str.length) return NaN;
  return result;
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Compute a single aggregate value from a data array.
 * Useful for KPI cards that show a summary metric.
 */
export function computeAggregateValue(
  data: Record<string, any>[],
  field: string,
  aggregation: AggregationType,
): number {
  const values = data
    .map((row) => parseFloat(row[field]))
    .filter((v) => !isNaN(v));
  return computeAggregate(values, aggregation);
}
