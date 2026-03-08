import type { Page } from '@reactcanvas/core';

// Strategy Pattern: Each export format is a separate strategy

export interface ExportContext {
  pages: Page[];
  options: ExportOptions;
  onProgress?: (progress: number) => void;
}

export interface ExportOptions {
  format: string;
  quality?: number;
  dpi?: number;
  backgroundColor?: string;
  transparentBackground?: boolean;
  pageIds?: string[];
}

// PNG Export Strategy
export async function exportToPng(
  stageRef: any,
  options: ExportOptions = { format: 'png' }
): Promise<Blob> {
  const pixelRatio = (options.dpi ?? 72) / 72;
  const dataUrl = stageRef.toDataURL({
    pixelRatio,
    mimeType: 'image/png',
  });

  const response = await fetch(dataUrl);
  return response.blob();
}

// JPG Export Strategy
export async function exportToJpg(
  stageRef: any,
  options: ExportOptions = { format: 'jpg' }
): Promise<Blob> {
  const pixelRatio = (options.dpi ?? 72) / 72;
  const quality = options.quality ?? 0.92;
  const dataUrl = stageRef.toDataURL({
    pixelRatio,
    mimeType: 'image/jpeg',
    quality,
  });

  const response = await fetch(dataUrl);
  return response.blob();
}

// SVG Export Strategy
export function exportToSvg(pages: Page[], options: ExportOptions = { format: 'svg' }): string {
  const page = pages[0];
  if (!page) return '';

  const svgParts: string[] = [];
  svgParts.push(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${page.width}" height="${page.height}" viewBox="0 0 ${page.width} ${page.height}">`
  );

  // Background
  if (!options.transparentBackground) {
    svgParts.push(
      `<rect width="${page.width}" height="${page.height}" fill="${page.backgroundColor || '#ffffff'}" />`
    );
  }

  // Elements
  for (const element of page.elements) {
    if (!element.visible) continue;

    const transform = buildSvgTransform(element);

    switch (element.type) {
      case 'shape':
        svgParts.push(renderShapeToSvg(element, transform));
        break;
      case 'text':
        svgParts.push(renderTextToSvg(element, transform));
        break;
      case 'image':
        svgParts.push(renderImageToSvg(element, transform));
        break;
    }
  }

  svgParts.push('</svg>');
  return svgParts.join('\n');
}

function buildSvgTransform(element: { x: number; y: number; rotation: number; opacity: number }): string {
  const transforms: string[] = [];
  if (element.x || element.y) {
    transforms.push(`translate(${element.x}, ${element.y})`);
  }
  if (element.rotation) {
    transforms.push(`rotate(${element.rotation})`);
  }
  return transforms.length ? ` transform="${transforms.join(' ')}"` : '';
}

function renderShapeToSvg(element: any, transform: string): string {
  const fill = element.fill?.type === 'solid' ? element.fill.color : '#cccccc';
  const strokeAttr = element.stroke?.width
    ? ` stroke="${element.stroke.color}" stroke-width="${element.stroke.width}"`
    : '';
  const opacityAttr = element.opacity < 1 ? ` opacity="${element.opacity}"` : '';

  switch (element.shapeType) {
    case 'rectangle':
      const rx = typeof element.cornerRadius === 'number' ? element.cornerRadius : 0;
      return `<rect${transform} width="${element.width}" height="${element.height}" fill="${fill}"${strokeAttr}${opacityAttr} rx="${rx}" />`;
    case 'circle':
      const r = Math.min(element.width, element.height) / 2;
      return `<circle${transform} cx="${element.width / 2}" cy="${element.height / 2}" r="${r}" fill="${fill}"${strokeAttr}${opacityAttr} />`;
    case 'ellipse':
      return `<ellipse${transform} cx="${element.width / 2}" cy="${element.height / 2}" rx="${element.width / 2}" ry="${element.height / 2}" fill="${fill}"${strokeAttr}${opacityAttr} />`;
    case 'triangle':
      const points = `${element.width / 2},0 ${element.width},${element.height} 0,${element.height}`;
      return `<polygon${transform} points="${points}" fill="${fill}"${strokeAttr}${opacityAttr} />`;
    default:
      return `<rect${transform} width="${element.width}" height="${element.height}" fill="${fill}"${strokeAttr}${opacityAttr} />`;
  }
}

function renderTextToSvg(element: any, transform: string): string {
  const fill = element.fill?.type === 'solid' ? element.fill.color : '#000000';
  return `<text${transform} font-family="${element.fontFamily}" font-size="${element.fontSize}" font-weight="${element.fontWeight}" fill="${fill}" opacity="${element.opacity}">${escapeXml(element.content)}</text>`;
}

function renderImageToSvg(element: any, transform: string): string {
  return `<image${transform} width="${element.width}" height="${element.height}" href="${element.src}" opacity="${element.opacity}" />`;
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

// JSON Export Strategy
export function exportToJson(pages: Page[]): string {
  return JSON.stringify({ pages }, null, 2);
}

// Download helper
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function downloadString(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  downloadBlob(blob, filename);
}
