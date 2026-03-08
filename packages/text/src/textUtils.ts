// Utility functions for text measurement and rendering

export interface TextMeasurement {
  width: number;
  height: number;
  lines: string[];
}

export function measureText(
  text: string,
  fontFamily: string,
  fontSize: number,
  fontWeight: number,
  maxWidth: number,
  lineHeight: number,
  letterSpacing: number
): TextMeasurement {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;
  ctx.font = `${fontWeight} ${fontSize}px "${fontFamily}"`;

  if (letterSpacing) {
    // letterSpacing is not directly supported in canvas, approximate
  }

  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    const metrics = ctx.measureText(testLine);

    if (metrics.width > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }
  if (currentLine) {
    lines.push(currentLine);
  }

  const actualLineHeight = fontSize * lineHeight;
  const width = Math.max(...lines.map((line) => ctx.measureText(line).width));
  const height = lines.length * actualLineHeight;

  return { width, height, lines };
}

// Strip HTML tags for canvas text rendering
export function stripHtml(html: string): string {
  const div = document.createElement('div');
  div.innerHTML = html;
  return div.textContent || div.innerText || '';
}

// Parse simple rich text into segments for canvas rendering
export interface TextSegment {
  text: string;
  bold: boolean;
  italic: boolean;
  underline: boolean;
  strikethrough: boolean;
  color?: string;
  fontSize?: number;
}

export function parseRichText(html: string): TextSegment[] {
  const segments: TextSegment[] = [];
  const div = document.createElement('div');
  div.innerHTML = html;

  function walk(node: Node, style: Partial<TextSegment>) {
    if (node.nodeType === Node.TEXT_NODE) {
      if (node.textContent) {
        segments.push({
          text: node.textContent,
          bold: style.bold ?? false,
          italic: style.italic ?? false,
          underline: style.underline ?? false,
          strikethrough: style.strikethrough ?? false,
          color: style.color,
          fontSize: style.fontSize,
        });
      }
      return;
    }

    if (node.nodeType === Node.ELEMENT_NODE) {
      const el = node as HTMLElement;
      const newStyle = { ...style };

      if (el.tagName === 'STRONG' || el.tagName === 'B') newStyle.bold = true;
      if (el.tagName === 'EM' || el.tagName === 'I') newStyle.italic = true;
      if (el.tagName === 'U') newStyle.underline = true;
      if (el.tagName === 'S' || el.tagName === 'DEL') newStyle.strikethrough = true;

      const color = el.style?.color;
      if (color) newStyle.color = color;

      const fontSize = el.style?.fontSize;
      if (fontSize) newStyle.fontSize = parseInt(fontSize);

      for (const child of Array.from(node.childNodes)) {
        walk(child, newStyle);
      }
    }
  }

  for (const child of Array.from(div.childNodes)) {
    walk(child, {});
  }

  return segments;
}
