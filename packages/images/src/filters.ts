import type { ImageFilters } from '@reactcanvas/core';

export interface FilterPreset {
  name: string;
  displayName: string;
  filters: Partial<ImageFilters>;
}

export const FILTER_PRESETS: FilterPreset[] = [
  {
    name: 'none',
    displayName: 'None',
    filters: { brightness: 0, contrast: 0, saturation: 0, hueRotation: 0, blur: 0 },
  },
  {
    name: 'grayscale',
    displayName: 'Grayscale',
    filters: { saturation: -100 },
  },
  {
    name: 'sepia',
    displayName: 'Sepia',
    filters: { saturation: -60, hueRotation: 30, brightness: 10 },
  },
  {
    name: 'warm',
    displayName: 'Warm',
    filters: { hueRotation: -15, saturation: 20, brightness: 5 },
  },
  {
    name: 'cool',
    displayName: 'Cool',
    filters: { hueRotation: 15, saturation: -10, brightness: 5 },
  },
  {
    name: 'vintage',
    displayName: 'Vintage',
    filters: { saturation: -30, contrast: 15, brightness: -10 },
  },
  {
    name: 'dramatic',
    displayName: 'Dramatic',
    filters: { contrast: 40, saturation: 20, brightness: -10 },
  },
  {
    name: 'bright',
    displayName: 'Bright',
    filters: { brightness: 30, contrast: 10 },
  },
  {
    name: 'muted',
    displayName: 'Muted',
    filters: { saturation: -40, brightness: 10 },
  },
  {
    name: 'high-contrast',
    displayName: 'High Contrast',
    filters: { contrast: 50 },
  },
];

export function applyFilterPreset(preset: string): ImageFilters {
  const found = FILTER_PRESETS.find((p) => p.name === preset);
  const base: ImageFilters = {
    brightness: 0,
    contrast: 0,
    saturation: 0,
    hueRotation: 0,
    blur: 0,
    preset,
  };

  if (found) {
    return { ...base, ...found.filters, preset };
  }
  return base;
}

// Convert ImageFilters to Konva filter-compatible values
export function filtersToKonvaConfig(filters: ImageFilters): Record<string, number> {
  return {
    brightness: filters.brightness / 100,
    contrast: filters.contrast / 100,
    saturation: filters.saturation / 100,
    hueRotation: filters.hueRotation,
    blurRadius: filters.blur,
  };
}
