// Shape presets library - SVG paths for complex shapes

export interface ShapePreset {
  name: string;
  displayName: string;
  category: string;
  path: string;
  viewBox: string;
}

export const SHAPE_PRESETS: ShapePreset[] = [
  // Hearts
  {
    name: 'heart',
    displayName: 'Heart',
    category: 'symbols',
    path: 'M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z',
    viewBox: '0 0 24 24',
  },
  // Speech bubbles
  {
    name: 'speech-bubble',
    displayName: 'Speech Bubble',
    category: 'callouts',
    path: 'M20 2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h14l4 4V4c0-1.1-.9-2-2-2z',
    viewBox: '0 0 24 24',
  },
  {
    name: 'speech-bubble-round',
    displayName: 'Round Speech Bubble',
    category: 'callouts',
    path: 'M12 2C6.48 2 2 6.04 2 11c0 2.79 1.53 5.27 3.93 6.82L4 22l4.59-2.43C9.67 19.85 10.81 20 12 20c5.52 0 10-4.04 10-9S17.52 2 12 2z',
    viewBox: '0 0 24 24',
  },
  // Badges
  {
    name: 'badge',
    displayName: 'Badge',
    category: 'badges',
    path: 'M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z',
    viewBox: '0 0 24 24',
  },
  {
    name: 'ribbon',
    displayName: 'Ribbon',
    category: 'badges',
    path: 'M4 2v18l8-4 8 4V2H4z',
    viewBox: '0 0 24 24',
  },
  // Banners
  {
    name: 'banner',
    displayName: 'Banner',
    category: 'banners',
    path: 'M1 5h22v14H1V5zm2 2v10h18V7H3z',
    viewBox: '0 0 24 24',
  },
  // Check marks
  {
    name: 'checkmark',
    displayName: 'Check Mark',
    category: 'symbols',
    path: 'M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z',
    viewBox: '0 0 24 24',
  },
  {
    name: 'checkmark-circle',
    displayName: 'Check Circle',
    category: 'symbols',
    path: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z',
    viewBox: '0 0 24 24',
  },
  // Arrows (as shapes)
  {
    name: 'arrow-right',
    displayName: 'Arrow Right',
    category: 'arrows',
    path: 'M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8-8-8z',
    viewBox: '0 0 24 24',
  },
  {
    name: 'arrow-left',
    displayName: 'Arrow Left',
    category: 'arrows',
    path: 'M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z',
    viewBox: '0 0 24 24',
  },
  {
    name: 'arrow-up',
    displayName: 'Arrow Up',
    category: 'arrows',
    path: 'M4 12l1.41 1.41L11 7.83V20h2V7.83l5.58 5.59L20 12l-8-8-8 8z',
    viewBox: '0 0 24 24',
  },
  {
    name: 'arrow-down',
    displayName: 'Arrow Down',
    category: 'arrows',
    path: 'M20 12l-1.41-1.41L13 16.17V4h-2v12.17l-5.58-5.59L4 12l8 8 8-8z',
    viewBox: '0 0 24 24',
  },
  // Symbols
  {
    name: 'star-4point',
    displayName: '4-Point Star',
    category: 'stars',
    path: 'M12 2l2.5 7.5H22l-6 4.5 2.5 7.5L12 17l-6.5 4.5L8 14 2 9.5h7.5L12 2z',
    viewBox: '0 0 24 24',
  },
  {
    name: 'cross',
    displayName: 'Cross',
    category: 'symbols',
    path: 'M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z',
    viewBox: '0 0 24 24',
  },
  {
    name: 'plus',
    displayName: 'Plus',
    category: 'symbols',
    path: 'M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z',
    viewBox: '0 0 24 24',
  },
  {
    name: 'minus',
    displayName: 'Minus',
    category: 'symbols',
    path: 'M19 13H5v-2h14v2z',
    viewBox: '0 0 24 24',
  },
  // Lightning
  {
    name: 'lightning',
    displayName: 'Lightning',
    category: 'symbols',
    path: 'M7 2v11h3v9l7-12h-4l4-8H7z',
    viewBox: '0 0 24 24',
  },
  // Cloud
  {
    name: 'cloud',
    displayName: 'Cloud',
    category: 'nature',
    path: 'M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96z',
    viewBox: '0 0 24 24',
  },
  // Moon
  {
    name: 'moon',
    displayName: 'Moon',
    category: 'nature',
    path: 'M12.43 2.3c-2.38-.59-4.68-.27-6.63.64-.35.16-.41.64-.1.86C8.3 5.6 9.67 8.5 9.67 11.7c0 3.19-1.37 6.1-3.97 7.9-.31.22-.25.7.1.86 1.2.55 2.55.84 3.95.84 5.35 0 9.59-4.51 9.17-9.93-.34-4.34-3.52-7.9-6.49-9.07z',
    viewBox: '0 0 24 24',
  },
  // Sun
  {
    name: 'sun',
    displayName: 'Sun',
    category: 'nature',
    path: 'M6.76 4.84l-1.8-1.79-1.41 1.41 1.79 1.79 1.42-1.41zM4 10.5H1v2h3v-2zm9-9.95h-2V3.5h2V.55zm7.45 3.91l-1.41-1.41-1.79 1.79 1.41 1.41 1.79-1.79zm-3.21 13.7l1.79 1.8 1.41-1.41-1.8-1.79-1.4 1.4zM20 10.5v2h3v-2h-3zm-8-5c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6-2.69-6-6-6zm-1 16.95h2V19.5h-2v2.95zm-7.45-3.91l1.41 1.41 1.79-1.8-1.41-1.41-1.79 1.8z',
    viewBox: '0 0 24 24',
  },
  // Diamond
  {
    name: 'diamond',
    displayName: 'Diamond',
    category: 'basic',
    path: 'M12 2L2 12l10 10 10-10L12 2z',
    viewBox: '0 0 24 24',
  },
  // Hexagon
  {
    name: 'hexagon-preset',
    displayName: 'Hexagon',
    category: 'basic',
    path: 'M12 2l9.5 5.5v11L12 24l-9.5-5.5v-11L12 2z',
    viewBox: '0 0 26 26',
  },
  // Parallelogram
  {
    name: 'parallelogram',
    displayName: 'Parallelogram',
    category: 'basic',
    path: 'M6 4h16l-4 16H2l4-16z',
    viewBox: '0 0 24 24',
  },
  // Trapezoid
  {
    name: 'trapezoid',
    displayName: 'Trapezoid',
    category: 'basic',
    path: 'M4 18h16l3-12H1l3 12z',
    viewBox: '0 0 24 24',
  },
  // Rounded rectangle variants
  {
    name: 'rounded-rect',
    displayName: 'Rounded Rectangle',
    category: 'basic',
    path: 'M4 2h16a2 2 0 012 2v16a2 2 0 01-2 2H4a2 2 0 01-2-2V4a2 2 0 012-2z',
    viewBox: '0 0 24 24',
  },
  // Cylinder
  {
    name: 'cylinder',
    displayName: 'Cylinder',
    category: 'basic',
    path: 'M12 2c-5.52 0-10 1.79-10 4v12c0 2.21 4.48 4 10 4s10-1.79 10-4V6c0-2.21-4.48-4-10-4zM2 6c0-1.1 4.48-2 10-2s10 .9 10 2-4.48 2-10 2S2 7.1 2 6z',
    viewBox: '0 0 24 24',
  },
  // Location pin
  {
    name: 'location-pin',
    displayName: 'Location Pin',
    category: 'symbols',
    path: 'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z',
    viewBox: '0 0 24 24',
  },
  // Music note
  {
    name: 'music-note',
    displayName: 'Music Note',
    category: 'symbols',
    path: 'M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z',
    viewBox: '0 0 24 24',
  },
  // Flag
  {
    name: 'flag',
    displayName: 'Flag',
    category: 'symbols',
    path: 'M14.4 6L14 4H5v17h2v-7h5.6l.4 2h7V6h-5.6z',
    viewBox: '0 0 24 24',
  },
  // Eye
  {
    name: 'eye',
    displayName: 'Eye',
    category: 'symbols',
    path: 'M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z',
    viewBox: '0 0 24 24',
  },
  // Cursor
  {
    name: 'cursor',
    displayName: 'Cursor',
    category: 'symbols',
    path: 'M13.64 21.97C13.14 22.21 12.54 22 12.31 21.5l-3.16-7.02L4.41 18.7c-.78.59-1.91 0-1.91-1V2.59c0-.89 1.08-1.34 1.71-.71l15 15c.63.63.18 1.71-.71 1.71h-5.5l3.09 6.85c.24.49 0 1.09-.49 1.33l-1.96.2z',
    viewBox: '0 0 24 24',
  },
  // Thought bubble
  {
    name: 'thought-bubble',
    displayName: 'Thought Bubble',
    category: 'callouts',
    path: 'M20 2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h2l-1 3c0 .55.45 1 1 1h.5c.28 0 .53-.11.71-.29L10.5 18H20c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z',
    viewBox: '0 0 24 24',
  },
  // Circle with ring
  {
    name: 'ring',
    displayName: 'Ring',
    category: 'basic',
    path: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8z',
    viewBox: '0 0 24 24',
  },
  // Pentagon
  {
    name: 'pentagon-preset',
    displayName: 'Pentagon',
    category: 'basic',
    path: 'M12 2l9.51 6.91L15.64 22H8.36L2.49 8.91 12 2z',
    viewBox: '0 0 24 24',
  },
  // Octagon
  {
    name: 'octagon-preset',
    displayName: 'Octagon',
    category: 'basic',
    path: 'M7.86 2h8.28L22 7.86v8.28L16.14 22H7.86L2 16.14V7.86L7.86 2z',
    viewBox: '0 0 24 24',
  },
  // Right arrow block
  {
    name: 'arrow-block-right',
    displayName: 'Block Arrow Right',
    category: 'arrows',
    path: 'M2 8v8h10v4l8-8-8-8v4H2z',
    viewBox: '0 0 22 24',
  },
  // Double arrow
  {
    name: 'double-arrow',
    displayName: 'Double Arrow',
    category: 'arrows',
    path: 'M6.99 11L2 6l4.99-5v3.5H17.01V1L22 6l-4.99 5V7.5H6.99V11zm10.02 2v3.5H6.99V20L2 15l4.99-5v3.5h10.02V13z',
    viewBox: '0 0 24 24',
  },
  // Star outline
  {
    name: 'star-outline',
    displayName: 'Star Outline',
    category: 'stars',
    path: 'M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21 12 17.27z',
    viewBox: '0 0 24 24',
  },
  // Leaf
  {
    name: 'leaf',
    displayName: 'Leaf',
    category: 'nature',
    path: 'M6.05 4.14l-.39-.39c-.39-.39-1.02-.39-1.41 0l-.01.01c-.39.39-.39 1.02 0 1.41l.39.39c3.65 3.65 3.65 9.58 0 13.23l-.39.39c-.39.39-.39 1.02 0 1.41l.01.01c.39.39 1.02.39 1.41 0l.39-.39c4.44-4.44 4.44-11.64 0-16.07zM18.07 5.99l-.39-.39c-.39-.39-1.02-.39-1.41 0l-.01.01c-.39.39-.39 1.02 0 1.41l.39.39c1.87 1.87 1.87 4.91 0 6.78l-.39.39c-.39.39-.39 1.02 0 1.41l.01.01c.39.39 1.02.39 1.41 0l.39-.39c2.66-2.66 2.66-6.95 0-9.61zM12.06 5.06l-.39-.38c-.39-.39-1.03-.39-1.42 0-.39.39-.39 1.03 0 1.42l.39.38c2.67 2.67 2.67 6.99 0 9.66l-.39.38c-.39.39-.39 1.03 0 1.42.2.2.45.29.71.29.26 0 .51-.1.71-.29l.39-.38c3.44-3.44 3.44-9.06 0-12.5z',
    viewBox: '0 0 24 24',
  },
  // Flame
  {
    name: 'flame',
    displayName: 'Flame',
    category: 'nature',
    path: 'M13.5.67s.74 2.65.74 4.8c0 2.06-1.35 3.73-3.41 3.73-2.07 0-3.63-1.67-3.63-3.73l.03-.36C5.21 7.51 4 10.62 4 14c0 4.42 3.58 8 8 8s8-3.58 8-8C20 8.61 17.41 3.8 13.5.67zM11.71 19c-1.78 0-3.22-1.4-3.22-3.14 0-1.62 1.05-2.76 2.81-3.12 1.77-.36 3.6-1.21 4.62-2.58.39 1.29.59 2.65.59 4.04 0 2.65-2.15 4.8-4.8 4.8z',
    viewBox: '0 0 24 24',
  },
  // Water drop
  {
    name: 'water-drop',
    displayName: 'Water Drop',
    category: 'nature',
    path: 'M12 2c-5.33 4.55-8 8.48-8 11.8 0 4.98 3.8 8.2 8 8.2s8-3.22 8-8.2c0-3.32-2.67-7.25-8-11.8z',
    viewBox: '0 0 24 24',
  },
  // Bookmark
  {
    name: 'bookmark',
    displayName: 'Bookmark',
    category: 'symbols',
    path: 'M17 3H7c-1.1 0-1.99.9-1.99 2L5 21l7-3 7 3V5c0-1.1-.9-2-2-2z',
    viewBox: '0 0 24 24',
  },
  // Bell
  {
    name: 'bell',
    displayName: 'Bell',
    category: 'symbols',
    path: 'M12 22c1.1 0 2-.9 2-2h-4c0 1.1.89 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z',
    viewBox: '0 0 24 24',
  },
  // Home
  {
    name: 'home',
    displayName: 'Home',
    category: 'symbols',
    path: 'M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z',
    viewBox: '0 0 24 24',
  },
  // Gear
  {
    name: 'gear',
    displayName: 'Gear',
    category: 'symbols',
    path: 'M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.07.62-.07.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z',
    viewBox: '0 0 24 24',
  },
  // Lock
  {
    name: 'lock',
    displayName: 'Lock',
    category: 'symbols',
    path: 'M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z',
    viewBox: '0 0 24 24',
  },
  // Smile
  {
    name: 'smile',
    displayName: 'Smile',
    category: 'symbols',
    path: 'M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5zm-7 0c.83 0 1.5-.67 1.5-1.5S9.33 8 8.5 8 7 8.67 7 9.5 7.67 11 8.5 11zm3.5 6.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z',
    viewBox: '0 0 24 24',
  },
];

// Helper to generate regular polygon points
export function generatePolygonPoints(sides: number, radius: number, centerX: number, centerY: number): number[] {
  const points: number[] = [];
  const angleStep = (2 * Math.PI) / sides;
  const startAngle = -Math.PI / 2; // Start from top

  for (let i = 0; i < sides; i++) {
    const angle = startAngle + i * angleStep;
    points.push(centerX + radius * Math.cos(angle));
    points.push(centerY + radius * Math.sin(angle));
  }
  return points;
}

// Helper to generate star points
export function generateStarPoints(
  pointCount: number,
  outerRadius: number,
  innerRadius: number,
  centerX: number,
  centerY: number
): number[] {
  const points: number[] = [];
  const totalPoints = pointCount * 2;
  const angleStep = (2 * Math.PI) / totalPoints;
  const startAngle = -Math.PI / 2;

  for (let i = 0; i < totalPoints; i++) {
    const angle = startAngle + i * angleStep;
    const radius = i % 2 === 0 ? outerRadius : innerRadius;
    points.push(centerX + radius * Math.cos(angle));
    points.push(centerY + radius * Math.sin(angle));
  }
  return points;
}

export function getPresetsByCategory(category: string): ShapePreset[] {
  return SHAPE_PRESETS.filter((p) => p.category === category);
}

export function getPresetCategories(): string[] {
  return [...new Set(SHAPE_PRESETS.map((p) => p.category))];
}
