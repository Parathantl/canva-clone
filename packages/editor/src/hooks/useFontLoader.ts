import { useEffect, useRef } from 'react';
import { FontManager } from '@reactcanvas/text';
import type { CanvasElement } from '@reactcanvas/core';

// Singleton FontManager instance
const fontManager = new FontManager();

const MAX_RETRIES = 2;

export function useFontLoader(elements: CanvasElement[]): void {
  const loadedRef = useRef<Set<string>>(new Set());
  const failedRef = useRef<Map<string, number>>(new Map());

  // Build a stable string key from font families to avoid depending on the elements array reference
  const fontKey = elements
    .filter((el) => el.type === 'text')
    .map((el) => (el as { fontFamily: string }).fontFamily)
    .filter(Boolean)
    .sort()
    .join(',');

  useEffect(() => {
    if (!fontKey) return;
    const families = [...new Set(fontKey.split(','))];

    for (const family of families) {
      if (loadedRef.current.has(family)) continue;

      const retries = failedRef.current.get(family) ?? 0;
      if (retries >= MAX_RETRIES) continue;

      loadedRef.current.add(family);
      fontManager.loadFont(family).catch(() => {
        loadedRef.current.delete(family);
        failedRef.current.set(family, retries + 1);
      });
    }
  }, [fontKey]);
}
