import {
  createPage,
  createShapeElement,
  createTextElement,
  createImageElement,
  createChartElement,
  createKPIElement,
  createTableElement,
  createProgressElement,
  createLineElement,
  createId,
} from '@reactcanvas/core';
import type { Document, Page, CanvasElement, ChartDataPoint } from '@reactcanvas/core';

// ============================================================
// LLM Slide Schema — simplified format for AI-generated slides
// ============================================================

/** A complete presentation that an LLM can generate */
export interface SlidePresentation {
  title: string;
  /** Page dimensions — defaults to 1920x1080 */
  width?: number;
  height?: number;
  slides: Slide[];
}

/** A single slide */
export interface Slide {
  /** Optional slide title (shown in page list) */
  name?: string;
  /** Background color (hex) — defaults to white */
  backgroundColor?: string;
  /** Elements on this slide */
  elements: SlideElement[];
}

/** Union of all element types an LLM can place on a slide */
export type SlideElement =
  | SlideText
  | SlideShape
  | SlideImage
  | SlideChart
  | SlideKPI
  | SlideTable
  | SlideProgress
  | SlideLine;

/** Common positioning — all coordinates in pixels from top-left */
interface SlidePosition {
  x: number;
  y: number;
  width: number;
  height: number;
  /** Rotation in degrees */
  rotation?: number;
  /** Opacity 0-1, defaults to 1 */
  opacity?: number;
}

export interface SlideText extends SlidePosition {
  type: 'text';
  content: string;
  /** Font size in px — defaults to 24 */
  fontSize?: number;
  /** Font family — defaults to "Inter" */
  fontFamily?: string;
  /** Font weight — defaults to 400 */
  fontWeight?: number;
  /** "italic" or "normal" */
  fontStyle?: 'normal' | 'italic';
  /** Text color (hex) — defaults to "#000000" */
  color?: string;
  /** Text alignment — defaults to "left" */
  align?: 'left' | 'center' | 'right';
  /** Line height multiplier — defaults to 1.5 */
  lineHeight?: number;
}

export interface SlideShape extends SlidePosition {
  type: 'shape';
  /** Shape type — defaults to "rectangle" */
  shape?: 'rectangle' | 'circle' | 'triangle' | 'star' | 'polygon';
  /** Fill color (hex) — defaults to "#4A90D9" */
  fill?: string;
  /** Corner radius for rectangles — defaults to 0 */
  cornerRadius?: number;
  /** Stroke color */
  strokeColor?: string;
  /** Stroke width — defaults to 0 */
  strokeWidth?: number;
}

export interface SlideImage extends SlidePosition {
  type: 'image';
  /** Image URL or data URI */
  src: string;
}

export interface SlideChart extends SlidePosition {
  type: 'chart';
  /** Chart variant */
  chartType: 'bar' | 'line' | 'area' | 'pie' | 'donut';
  /** Chart title */
  title?: string;
  /** Data points */
  data: Array<{ label: string; value: number; color?: string }>;
  /** Show labels — defaults to true */
  showLabels?: boolean;
  /** Show grid lines — defaults to true */
  showGrid?: boolean;
  /** Background color */
  backgroundColor?: string;
}

export interface SlideKPI extends SlidePosition {
  type: 'kpi';
  /** The main value displayed */
  value: string;
  /** Label below the value */
  label: string;
  /** Prefix (e.g., "$") */
  prefix?: string;
  /** Suffix (e.g., "%") */
  suffix?: string;
  /** Trend direction */
  trend?: 'up' | 'down' | 'neutral';
  /** Trend value text (e.g., "+12.5%") */
  trendValue?: string;
  /** Background color */
  backgroundColor?: string;
  /** Value text color */
  valueColor?: string;
}

export interface SlideTable extends SlidePosition {
  type: 'table';
  /** Column headers */
  headers: string[];
  /** Row data — array of arrays */
  rows: string[][];
  /** Header background color */
  headerBg?: string;
  /** Header text color */
  headerColor?: string;
}

export interface SlideProgress extends SlidePosition {
  type: 'progress';
  /** Current value */
  value: number;
  /** Max value — defaults to 100 */
  maxValue?: number;
  /** Label text */
  label?: string;
  /** Visual style */
  style?: 'bar' | 'circle' | 'semicircle';
  /** Fill color */
  fillColor?: string;
  /** Track/background color */
  trackColor?: string;
}

export interface SlideLine extends SlidePosition {
  type: 'line';
  /** Line style */
  lineType?: 'straight' | 'curved';
  /** Stroke color — defaults to "#000000" */
  strokeColor?: string;
  /** Stroke width — defaults to 2 */
  strokeWidth?: number;
  /** Show arrow at end */
  endArrow?: boolean;
  /** Show arrow at start */
  startArrow?: boolean;
}

// ============================================================
// Converter: SlidePresentation → Document
// ============================================================

export function convertSlidesToDocument(presentation: SlidePresentation): Document {
  const pageWidth = presentation.width ?? 1920;
  const pageHeight = presentation.height ?? 1080;

  const pages: Page[] = presentation.slides.map((slide, slideIndex) => {
    const elements: CanvasElement[] = slide.elements.map((el, elIndex) => {
      return convertElement(el, elIndex);
    });

    return {
      ...createPage({
        width: pageWidth,
        height: pageHeight,
        backgroundColor: slide.backgroundColor ?? '#ffffff',
        name: slide.name ?? `Slide ${slideIndex + 1}`,
      }),
      elements,
    };
  });

  return {
    id: createId(),
    name: presentation.title,
    schemaVersion: 1,
    pages,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

function convertElement(el: SlideElement, layerOrder: number): CanvasElement {
  const base = {
    x: el.x,
    y: el.y,
    width: el.width,
    height: el.height,
    rotation: el.rotation ?? 0,
    opacity: el.opacity ?? 1,
    layerOrder,
  };

  switch (el.type) {
    case 'text':
      return createTextElement({
        ...base,
        content: el.content,
        fontSize: el.fontSize ?? 24,
        fontFamily: el.fontFamily ?? 'Inter',
        fontWeight: el.fontWeight ?? 400,
        fontStyle: el.fontStyle ?? 'normal',
        fill: { type: 'solid', color: el.color ?? '#000000' },
        textAlign: el.align ?? 'left',
        lineHeight: el.lineHeight ?? 1.5,
        name: el.content.slice(0, 30),
      });

    case 'shape':
      return createShapeElement({
        ...base,
        shapeType: el.shape ?? 'rectangle',
        fill: { type: 'solid', color: el.fill ?? '#4A90D9' },
        stroke: {
          color: el.strokeColor ?? '#000000',
          width: el.strokeWidth ?? 0,
          dashPattern: [],
        },
        cornerRadius: el.cornerRadius ?? 0,
        name: el.shape ?? 'Rectangle',
      });

    case 'image':
      return createImageElement({
        ...base,
        src: el.src,
        name: 'Image',
      });

    case 'chart':
      return createChartElement({
        ...base,
        chartType: el.chartType,
        title: el.title ?? '',
        data: el.data.map((d): ChartDataPoint => ({
          label: d.label,
          value: d.value,
          color: d.color,
        })),
        showLabels: el.showLabels ?? true,
        showGrid: el.showGrid ?? true,
        backgroundColor: el.backgroundColor ?? '#1e1e2e',
        name: el.title ?? 'Chart',
      });

    case 'kpi':
      return createKPIElement({
        ...base,
        value: el.value,
        label: el.label,
        prefix: el.prefix ?? '',
        suffix: el.suffix ?? '',
        trend: el.trend ?? 'neutral',
        trendValue: el.trendValue ?? '',
        backgroundColor: el.backgroundColor ?? '#1e1e2e',
        valueColor: el.valueColor ?? '#cdd6f4',
        name: el.label,
      });

    case 'table':
      return createTableElement({
        ...base,
        headers: el.headers,
        rows: el.rows,
        headerBg: el.headerBg ?? '#2a2a3a',
        headerColor: el.headerColor ?? '#cdd6f4',
        name: 'Table',
      });

    case 'progress':
      return createProgressElement({
        ...base,
        value: el.value,
        maxValue: el.maxValue ?? 100,
        label: el.label ?? '',
        progressStyle: el.style ?? 'bar',
        fillColor: el.fillColor ?? '#4A90D9',
        trackColor: el.trackColor ?? '#2a2a3a',
        name: el.label ?? 'Progress',
      });

    case 'line':
      return createLineElement({
        ...base,
        points: [0, 0, el.width, el.height],
        stroke: {
          color: el.strokeColor ?? '#000000',
          width: el.strokeWidth ?? 2,
          dashPattern: [],
        },
        lineType: el.lineType ?? 'straight',
        endArrow: el.endArrow ?? false,
        startArrow: el.startArrow ?? false,
        name: el.endArrow ? 'Arrow' : 'Line',
      });

    default:
      return createShapeElement({ ...base, name: 'Unknown' });
  }
}

// ============================================================
// Validation
// ============================================================

export function validateSlidePresentation(data: unknown): { valid: boolean; error?: string } {
  if (!data || typeof data !== 'object') {
    return { valid: false, error: 'Input must be a JSON object' };
  }
  const obj = data as Record<string, unknown>;
  if (typeof obj.title !== 'string') {
    return { valid: false, error: 'Missing or invalid "title" field' };
  }
  if (!Array.isArray(obj.slides)) {
    return { valid: false, error: 'Missing or invalid "slides" array' };
  }
  if (obj.slides.length === 0) {
    return { valid: false, error: '"slides" array must not be empty' };
  }
  for (let i = 0; i < obj.slides.length; i++) {
    const slide = obj.slides[i] as Record<string, unknown>;
    if (!slide || typeof slide !== 'object') {
      return { valid: false, error: `Slide ${i + 1} is not a valid object` };
    }
    if (!Array.isArray(slide.elements)) {
      return { valid: false, error: `Slide ${i + 1}: missing "elements" array` };
    }
    for (let j = 0; j < (slide.elements as unknown[]).length; j++) {
      const el = (slide.elements as Record<string, unknown>[])[j];
      if (!el || typeof el !== 'object' || typeof el.type !== 'string') {
        return { valid: false, error: `Slide ${i + 1}, element ${j + 1}: missing "type" field` };
      }
      if (typeof el.x !== 'number' || typeof el.y !== 'number' ||
          typeof el.width !== 'number' || typeof el.height !== 'number') {
        return { valid: false, error: `Slide ${i + 1}, element ${j + 1}: missing position/size (x, y, width, height)` };
      }
    }
  }
  return { valid: true };
}

// ============================================================
// Example prompt for LLMs
// ============================================================

export const LLM_SYSTEM_PROMPT = `You generate presentation slides as JSON. Use this exact schema:

\`\`\`typescript
{
  "title": "Presentation Name",
  "width": 1920,   // optional, defaults to 1920
  "height": 1080,  // optional, defaults to 1080
  "slides": [
    {
      "name": "Slide Title",           // optional
      "backgroundColor": "#ffffff",     // optional, hex color
      "elements": [
        // Text element:
        { "type": "text", "x": 100, "y": 100, "width": 800, "height": 60,
          "content": "Hello World", "fontSize": 48, "fontWeight": 700,
          "color": "#000000", "align": "left" },

        // Shape element:
        { "type": "shape", "x": 100, "y": 200, "width": 200, "height": 200,
          "shape": "rectangle", "fill": "#4A90D9", "cornerRadius": 12 },

        // Chart element:
        { "type": "chart", "x": 100, "y": 400, "width": 480, "height": 320,
          "chartType": "bar", "title": "Revenue",
          "data": [
            { "label": "Q1", "value": 100 },
            { "label": "Q2", "value": 150 }
          ]},

        // KPI element:
        { "type": "kpi", "x": 600, "y": 400, "width": 260, "height": 140,
          "value": "$12,450", "label": "Revenue", "trend": "up", "trendValue": "+12%" },

        // Table element:
        { "type": "table", "x": 100, "y": 750, "width": 520, "height": 240,
          "headers": ["Name", "Value"],
          "rows": [["Item A", "100"], ["Item B", "200"]] },

        // Progress element:
        { "type": "progress", "x": 900, "y": 400, "width": 260, "height": 140,
          "value": 72, "maxValue": 100, "label": "Completion", "style": "circle" },

        // Line/Arrow element:
        { "type": "line", "x": 100, "y": 950, "width": 200, "height": 0,
          "endArrow": true, "strokeColor": "#000000", "strokeWidth": 2 },

        // Image element:
        { "type": "image", "x": 900, "y": 100, "width": 400, "height": 300,
          "src": "https://example.com/image.png" }
      ]
    }
  ]
}
\`\`\`

Canvas is \${width}x\${height} pixels. Position elements using x,y from top-left.
Return ONLY valid JSON, no markdown fences or explanation.`;

// ============================================================
// Slide Transformer Helper
// ============================================================

/** A generic LLM caller — takes a system prompt + user message, returns the LLM's response text */
export type LLMCaller = (systemPrompt: string, userMessage: string) => Promise<string>;

/**
 * Creates a transformResponse function for AIChat.
 *
 * Use this when your backend (e.g. a copilot) returns natural language + data,
 * and you need a second LLM call to convert that into slide JSON.
 *
 * The library handles the prompt engineering — you just provide a way to call any LLM.
 *
 * @example
 * ```tsx
 * import { createSlideTransformer } from '@reactcanvas/editor';
 *
 * const transform = createSlideTransformer(async (systemPrompt, userMessage) => {
 *   const res = await fetch('/api/llm', {
 *     method: 'POST',
 *     body: JSON.stringify({ system: systemPrompt, message: userMessage }),
 *   });
 *   return await res.text();
 * });
 *
 * <DesignEditor
 *   onAISendMessage={callYourCopilot}
 *   transformResponse={transform}
 * />
 * ```
 */
export function createSlideTransformer(callLLM: LLMCaller): (responseText: string) => Promise<string> {
  return async (responseText: string): Promise<string> => {
    // If the response already looks like valid slide JSON, skip the transform
    const trimmed = responseText.trim();
    try {
      const parsed = JSON.parse(
        trimmed.startsWith('{') ? trimmed : (trimmed.match(/```(?:json)?\s*([\s\S]*?)```/)?.[1] ?? trimmed)
      );
      if (parsed?.title && Array.isArray(parsed?.slides)) {
        return responseText; // Already valid slide JSON — no transform needed
      }
    } catch {
      // Not JSON, proceed with transform
    }

    const userMessage = `Convert the following data and information into a visually appealing slide presentation. Use appropriate element types (KPIs for metrics, charts for trends, tables for lists, text for titles/descriptions). Choose a professional dark theme with good contrast.\n\nData to convert:\n\n${responseText}`;

    return callLLM(LLM_SYSTEM_PROMPT, userMessage);
  };
}
