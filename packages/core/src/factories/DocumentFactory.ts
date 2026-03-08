import { nanoid } from 'nanoid';
import type {
  Document,
  Page,
  ShapeElement,
  TextElement,
  ImageElement,
  FramedImageElement,
  LineElement,
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
