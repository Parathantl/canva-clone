import { nanoid } from 'nanoid';
import type {
  Document,
  Page,
  ShapeElement,
  TextElement,
  ImageElement,
  FramedImageElement,
  LineElement,
  ChartElement,
  KPIElement,
  TableElement,
  ProgressElement,
  EmbedElement,
  Fill,
  Stroke,
  ImageFilters,
} from '../types/document';

// Factory Pattern: Centralized element creation with sensible defaults

export function createId(): string {
  return nanoid();
}

export function createDefaultDocument(): Document {
  const page = createPage();
  return {
    id: createId(),
    name: 'Untitled Design',
    schemaVersion: 1,
    pages: [page],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export function createPage(overrides: Partial<Page> = {}): Page {
  return {
    id: createId(),
    name: 'Page 1',
    width: 1920,
    height: 1080,
    backgroundColor: '#ffffff',
    elements: [],
    notes: '',
    ...overrides,
  };
}

export function createDefaultFill(): Fill {
  return { type: 'solid', color: '#4A90D9' };
}

export function createDefaultStroke(): Stroke {
  return { color: '#000000', width: 0, dashPattern: [] };
}

export function createDefaultImageFilters(): ImageFilters {
  return {
    brightness: 0,
    contrast: 0,
    saturation: 0,
    hueRotation: 0,
    blur: 0,
  };
}

export function createShapeElement(overrides: Partial<ShapeElement> = {}): ShapeElement {
  return {
    id: createId(),
    type: 'shape',
    name: 'Shape',
    x: 100,
    y: 100,
    width: 200,
    height: 200,
    rotation: 0,
    opacity: 1,
    locked: false,
    visible: true,
    layerOrder: 0,
    shapeType: 'rectangle',
    fill: createDefaultFill(),
    stroke: createDefaultStroke(),
    cornerRadius: 0,
    ...overrides,
  };
}

export function createTextElement(overrides: Partial<TextElement> = {}): TextElement {
  return {
    id: createId(),
    type: 'text',
    name: 'Text',
    x: 100,
    y: 100,
    width: 300,
    height: 60,
    rotation: 0,
    opacity: 1,
    locked: false,
    visible: true,
    layerOrder: 0,
    content: 'Type something...',
    fontFamily: 'Inter',
    fontSize: 24,
    fontWeight: 400,
    fontStyle: 'normal',
    textDecoration: 'none',
    fill: { type: 'solid', color: '#000000' },
    textAlign: 'left',
    lineHeight: 1.4,
    letterSpacing: 0,
    autoResize: true,
    ...overrides,
  };
}

export function createImageElement(overrides: Partial<ImageElement> = {}): ImageElement {
  return {
    id: createId(),
    type: 'image',
    name: 'Image',
    x: 100,
    y: 100,
    width: 400,
    height: 300,
    rotation: 0,
    opacity: 1,
    locked: false,
    visible: true,
    layerOrder: 0,
    src: '',
    originalWidth: 0,
    originalHeight: 0,
    cropX: 0,
    cropY: 0,
    cropWidth: 0,
    cropHeight: 0,
    filters: createDefaultImageFilters(),
    ...overrides,
  };
}

export function createFramedImageElement(overrides: Partial<FramedImageElement> = {}): FramedImageElement {
  return {
    id: createId(),
    type: 'framed-image',
    name: 'Framed Image',
    x: 100,
    y: 100,
    width: 200,
    height: 200,
    rotation: 0,
    opacity: 1,
    locked: false,
    visible: true,
    layerOrder: 0,
    shapeType: 'rectangle',
    fill: createDefaultFill(),
    stroke: createDefaultStroke(),
    cornerRadius: 0,
    imageX: 0,
    imageY: 0,
    imageWidth: 0,
    imageHeight: 0,
    imageOriginalWidth: 0,
    imageOriginalHeight: 0,
    fitMode: 'cover',
    filters: createDefaultImageFilters(),
    ...overrides,
  };
}

export const DEFAULT_CHART_COLORS = [
  '#4A90D9', '#E8596D', '#50C878', '#FFB347', '#9B72CF',
  '#FF6B9D', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD',
];

export function createChartElement(overrides: Partial<ChartElement> = {}): ChartElement {
  return {
    id: createId(),
    type: 'chart',
    name: 'Chart',
    x: 100,
    y: 100,
    width: 480,
    height: 320,
    rotation: 0,
    opacity: 1,
    locked: false,
    visible: true,
    layerOrder: 0,
    chartType: 'bar',
    data: [
      { label: 'Q1', value: 65 },
      { label: 'Q2', value: 85 },
      { label: 'Q3', value: 45 },
      { label: 'Q4', value: 95 },
    ],
    title: 'Revenue by Quarter',
    showLegend: false,
    showLabels: true,
    showGrid: true,
    colors: DEFAULT_CHART_COLORS,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    ...overrides,
  };
}

export function createKPIElement(overrides: Partial<KPIElement> = {}): KPIElement {
  return {
    id: createId(),
    type: 'kpi',
    name: 'KPI Card',
    x: 100,
    y: 100,
    width: 260,
    height: 140,
    rotation: 0,
    opacity: 1,
    locked: false,
    visible: true,
    layerOrder: 0,
    value: '12,450',
    label: 'Total Revenue',
    prefix: '$',
    suffix: '',
    trend: 'up',
    trendValue: '+12.5%',
    backgroundColor: '#ffffff',
    valueColor: '#1e1e2e',
    labelColor: '#6c7086',
    trendColor: '#50C878',
    borderRadius: 12,
    icon: '',
    ...overrides,
  };
}

export function createTableElement(overrides: Partial<TableElement> = {}): TableElement {
  return {
    id: createId(),
    type: 'table',
    name: 'Table',
    x: 100,
    y: 100,
    width: 520,
    height: 240,
    rotation: 0,
    opacity: 1,
    locked: false,
    visible: true,
    layerOrder: 0,
    headers: ['Name', 'Status', 'Value', 'Change'],
    rows: [
      ['Project Alpha', 'Active', '$24,500', '+15%'],
      ['Project Beta', 'Pending', '$18,200', '+8%'],
      ['Project Gamma', 'Active', '$31,000', '+22%'],
      ['Project Delta', 'Paused', '$12,800', '-3%'],
    ],
    headerBg: '#1e1e2e',
    headerColor: '#ffffff',
    rowBg: '#ffffff',
    altRowBg: '#f8f9fa',
    cellColor: '#333333',
    borderColor: '#e5e7eb',
    borderRadius: 12,
    fontSize: 13,
    ...overrides,
  };
}

export function createProgressElement(overrides: Partial<ProgressElement> = {}): ProgressElement {
  return {
    id: createId(),
    type: 'progress',
    name: 'Progress',
    x: 100,
    y: 100,
    width: 260,
    height: 140,
    rotation: 0,
    opacity: 1,
    locked: false,
    visible: true,
    layerOrder: 0,
    progressStyle: 'bar',
    value: 72,
    maxValue: 100,
    label: 'Completion',
    showValue: true,
    trackColor: '#e5e7eb',
    fillColor: '#4A90D9',
    valueColor: '#1e1e2e',
    labelColor: '#6c7086',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    thickness: 12,
    ...overrides,
  };
}

export function createEmbedElement(overrides: Partial<EmbedElement> = {}): EmbedElement {
  return {
    id: createId(),
    type: 'embed',
    name: 'Embed',
    x: 100,
    y: 100,
    width: 480,
    height: 320,
    rotation: 0,
    opacity: 1,
    locked: false,
    visible: true,
    layerOrder: 0,
    embedType: 'website',
    url: '',
    backgroundColor: '#f0f0f0',
    borderRadius: 12,
    showBorder: true,
    ...overrides,
  };
}

export function createLineElement(overrides: Partial<LineElement> = {}): LineElement {
  return {
    id: createId(),
    type: 'line',
    name: 'Line',
    x: 100,
    y: 100,
    width: 200,
    height: 0,
    rotation: 0,
    opacity: 1,
    locked: false,
    visible: true,
    layerOrder: 0,
    points: [0, 0, 200, 0],
    stroke: { color: '#000000', width: 2, dashPattern: [] },
    lineType: 'straight',
    startArrow: false,
    endArrow: false,
    arrowSize: 10,
    ...overrides,
  };
}
