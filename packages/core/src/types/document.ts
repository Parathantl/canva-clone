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
  // Data source binding — connects this widget to a live data source
  dataSource?: DataSourceBinding;
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
export type ChartType = 'bar' | 'line' | 'pie' | 'donut' | 'area' | 'scatter' | 'radar' | 'horizontalBar' | 'stackedBar' | 'funnel' | 'heatmap' | 'treemap';

export interface ChartDataPoint {
  label: string;
  value: number;
  color?: string;
}

export interface ChartDataSeries {
  name: string;
  data: number[];
  color?: string;
}

export interface HeatmapCell {
  row: string;
  col: string;
  value: number;
}

export interface ChartElement extends BaseElement {
  type: 'chart';
  chartType: ChartType;
  data: ChartDataPoint[];
  // Multi-series support
  labels?: string[];
  series?: ChartDataSeries[];
  // Heatmap-specific
  heatmapData?: HeatmapCell[];
  heatmapRows?: string[];
  heatmapCols?: string[];
  title: string;
  showLegend: boolean;
  showLabels: boolean;
  showGrid: boolean;
  showTooltips: boolean;
  animated: boolean;
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

// Conditional formatting rules
export type ConditionalOperator = 'equals' | 'notEquals' | 'contains' | 'greaterThan' | 'lessThan' | 'between' | 'isEmpty' | 'isNotEmpty';

export interface ConditionalFormatRule {
  id: string;
  /** Column index to evaluate (or -1 for entire row) */
  columnIndex: number;
  operator: ConditionalOperator;
  value: string;
  /** For 'between' operator */
  value2?: string;
  /** Styling to apply when rule matches */
  backgroundColor?: string;
  textColor?: string;
  fontWeight?: 'normal' | 'bold';
  icon?: string; // emoji or symbol prefix
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
  // Sorting
  sortColumn?: number;
  sortDirection?: 'asc' | 'desc';
  // Pagination
  pageSize?: number; // 0 or undefined = show all
  currentPage?: number;
  // Conditional formatting
  conditionalFormats?: ConditionalFormatRule[];
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

// Filter Control element (dropdown, date range, search box)
export type FilterControlType = 'dropdown' | 'dateRange' | 'search';

export interface FilterControlElement extends BaseElement {
  type: 'filterControl';
  controlType: FilterControlType;
  /** The field name this control filters on */
  filterField: string;
  /** Label shown above the control */
  label: string;
  /** For dropdown: list of options. Empty = auto-detect from data */
  options: string[];
  /** Current selected value(s) */
  selectedValues: string[];
  /** For dateRange: start and end dates */
  dateStart?: string;
  dateEnd?: string;
  /** For search: placeholder text */
  placeholder: string;
  /** Styling */
  backgroundColor: string;
  borderRadius: number;
}

// ─── Calculated Fields ──────────────────────────────────────────────

export type AggregationType = 'sum' | 'avg' | 'count' | 'min' | 'max' | 'median';

export interface CalculatedField {
  id: string;
  name: string;
  /** 'aggregate' applies an aggregation function to a field */
  /** 'formula' applies a custom expression: e.g. "revenue - cost" */
  type: 'aggregate' | 'formula';
  /** For aggregate: source field + function */
  sourceField?: string;
  aggregation?: AggregationType;
  /** For formula: expression string */
  expression?: string;
}

// ─── Cross-Widget Filters ───────────────────────────────────────────

export interface DashboardFilter {
  id: string;
  /** Element that created this filter (the chart that was clicked) */
  sourceElementId: string;
  /** Human-readable label for the filter pill */
  label: string;
  /** The field name being filtered on */
  field: string;
  /** The value to match */
  value: string;
  /** Page the filter applies to */
  pageId: string;
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
  | EmbedElement
  | FilterControlElement;

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

// ─── Data Sources ───────────────────────────────────────────────────

export type AuthType = 'none' | 'bearer' | 'apiKey' | 'basic';

export interface DataSourceAuth {
  type: AuthType;
  // Bearer: token goes in 'token'
  token?: string;
  // API Key: header name + value
  headerName?: string;
  headerValue?: string;
  // Basic: username + password
  username?: string;
  password?: string;
}

export interface DataSourceHeader {
  key: string;
  value: string;
  enabled: boolean;
}

export interface FieldMapping {
  // For chart: which field is the label, which is the value
  labelField?: string;
  valueField?: string;
  // For multi-series: group-by field
  seriesField?: string;
  // For table: which fields become columns (ordered)
  columnFields?: string[];
  // For KPI: which field is the metric
  metricField?: string;
  // JSONPath-like accessor to reach the data array in the response
  dataPath?: string;
}

export interface DataSource {
  id: string;
  name: string;
  url: string;
  method: 'GET' | 'POST';
  headers: DataSourceHeader[];
  auth: DataSourceAuth;
  body?: string; // POST body (JSON string)
  refreshInterval: number; // seconds, 0 = manual only
  fieldMapping: FieldMapping;
  calculatedFields?: CalculatedField[];
  lastFetched?: string; // ISO timestamp
  lastError?: string;
}

// Base element gets optional data source binding
export interface DataSourceBinding {
  dataSourceId: string;
  // Override field mapping at the widget level
  fieldMapping?: Partial<FieldMapping>;
}

// Root document model
export interface Document {
  id: string;
  name: string;
  schemaVersion: number;
  pages: Page[];
  dataSources?: DataSource[];
  createdAt: string;
  updatedAt: string;
}
