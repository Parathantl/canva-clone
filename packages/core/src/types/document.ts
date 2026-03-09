// Base element interface - all elements extend this (Interface Segregation)
export interface BaseElement {
  id: string;
  type: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  opacity: number;
  locked: boolean;
  layerOrder: number;
  visible: boolean;
  name: string;
  flipX?: boolean;
  flipY?: boolean;
}

// Shape fill types
export interface SolidFill {
  type: 'solid';
  color: string;
}

export interface LinearGradientFill {
  type: 'linear-gradient';
  stops: Array<{ offset: number; color: string }>;
  angle: number;
}

export interface RadialGradientFill {
  type: 'radial-gradient';
  stops: Array<{ offset: number; color: string }>;
  centerX: number;
  centerY: number;
  radius: number;
}

export type Fill = SolidFill | LinearGradientFill | RadialGradientFill;

export interface Stroke {
  color: string;
  width: number;
  dashPattern: number[];
}

export interface Shadow {
  color: string;
  blur: number;
  offsetX: number;
  offsetY: number;
  spread: number;
}

// Concrete element types
export interface ShapeElement extends BaseElement {
  type: 'shape';
  shapeType: string; // 'rectangle' | 'circle' | 'triangle' | 'polygon' | 'star' | etc
  fill: Fill;
  stroke: Stroke;
  cornerRadius: number | [number, number, number, number];
  shadow?: Shadow;
  // Polygon-specific
  sides?: number;
  // Star-specific
  innerRadius?: number;
  outerRadius?: number;
  points?: number;
}

export interface TextElement extends BaseElement {
  type: 'text';
  content: string; // HTML content for TipTap
  fontFamily: string;
  fontSize: number;
  fontWeight: number;
  fontStyle: 'normal' | 'italic';
  textDecoration: 'none' | 'underline' | 'line-through';
  fill: Fill;
  textAlign: 'left' | 'center' | 'right' | 'justify';
  lineHeight: number;
  letterSpacing: number;
  autoResize: boolean;
}

export interface ImageElement extends BaseElement {
  type: 'image';
  src: string;
  originalWidth: number;
  originalHeight: number;
  cropX: number;
  cropY: number;
  cropWidth: number;
  cropHeight: number;
  filters: ImageFilters;
}

export interface ImageFilters {
  brightness: number;
  contrast: number;
  saturation: number;
  hueRotation: number;
  blur: number;
  preset?: string;
}

export interface FramedImageElement extends BaseElement {
  type: 'framed-image';
  shapeType: string;
  fill: Fill;
  stroke: Stroke;
  cornerRadius: number | [number, number, number, number];
  shadow?: Shadow;
  imageSrc?: string;
  imageX: number;
  imageY: number;
  imageWidth: number;
  imageHeight: number;
  imageOriginalWidth: number;
  imageOriginalHeight: number;
  fitMode: 'cover' | 'contain' | 'stretch';
  filters: ImageFilters;
}

export interface GroupElement extends BaseElement {
  type: 'group';
  children: string[]; // IDs of child elements
}

export interface LineElement extends BaseElement {
  type: 'line';
  points: number[];
  stroke: Stroke;
  lineType: 'straight' | 'curved' | 'freehand';
  startArrow: boolean;
  endArrow: boolean;
  arrowSize: number;
}

export interface SVGElement extends BaseElement {
  type: 'svg';
  svgPath: string;
  fill: Fill;
  stroke: Stroke;
}

// Chart element types
export type ChartType = 'bar' | 'line' | 'pie' | 'donut' | 'area';

export interface ChartDataPoint {
  label: string;
  value: number;
  color?: string;
}

export interface ChartElement extends BaseElement {
  type: 'chart';
  chartType: ChartType;
  data: ChartDataPoint[];
  title: string;
  showLegend: boolean;
  showLabels: boolean;
  showGrid: boolean;
  colors: string[];
  backgroundColor: string;
  borderRadius: number;
}

// KPI / Metric card
export type TrendDirection = 'up' | 'down' | 'neutral';

export interface KPIElement extends BaseElement {
  type: 'kpi';
  value: string;
  label: string;
  prefix: string;
  suffix: string;
  trend: TrendDirection;
  trendValue: string;
  backgroundColor: string;
  valueColor: string;
  labelColor: string;
  trendColor: string;
  borderRadius: number;
  icon: string;
}

// Table element
export interface TableElement extends BaseElement {
  type: 'table';
  headers: string[];
  rows: string[][];
  headerBg: string;
  headerColor: string;
  rowBg: string;
  altRowBg: string;
  cellColor: string;
  borderColor: string;
  borderRadius: number;
  fontSize: number;
}

// Progress / Gauge element
export type ProgressStyle = 'bar' | 'circle' | 'semicircle';

export interface ProgressElement extends BaseElement {
  type: 'progress';
  progressStyle: ProgressStyle;
  value: number; // 0-100
  maxValue: number;
  label: string;
  showValue: boolean;
  trackColor: string;
  fillColor: string;
  valueColor: string;
  labelColor: string;
  backgroundColor: string;
  borderRadius: number;
  thickness: number;
}

// Embed / iframe element
export interface EmbedElement extends BaseElement {
  type: 'embed';
  embedType: 'video' | 'website' | 'map';
  url: string;
  backgroundColor: string;
  borderRadius: number;
  showBorder: boolean;
}

// Union of all element types
export type CanvasElement =
  | ShapeElement
  | TextElement
  | ImageElement
  | FramedImageElement
  | GroupElement
  | LineElement
  | SVGElement
  | ChartElement
  | KPIElement
  | TableElement
  | ProgressElement
  | EmbedElement;

// Page model
export interface Page {
  id: string;
  name: string;
  width: number;
  height: number;
  backgroundColor: string;
  backgroundImage?: string;
  elements: CanvasElement[];
  notes: string;
}

// Root document model
export interface Document {
  id: string;
  name: string;
  schemaVersion: number;
  pages: Page[];
  createdAt: string;
  updatedAt: string;
}
