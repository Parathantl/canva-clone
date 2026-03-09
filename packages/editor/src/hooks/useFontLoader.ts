import { useEffect, useRef, useMemo } from 'react';
import { FontManager } from '@reactcanvas/text';
import type { CanvasElement } from '@reactcanvas/core';

// Singleton FontManager instance
const fontManager = new FontManager();

const MAX_RETRIES = 2;

export function useFontLoader(elements: CanvasElement[]): void {
  const loadedRef = useRef<Set<string>>(new Set());
  const failedRef = useRef<Map<string, number>>(new Map());

  // Stable dependency — only recomputes when text element fonts actually change
  const fontFamilies = useMemo(
    () =>
      Array.from(
        new Set(
          elements
            .filter((el) => el.type === 'text')
            .map((el) => (el as { fontFamily: string }).fontFamily)
            .filter(Boolean)
        )
      ),
    [elements]
  );

  useEffect(() => {
    for (const family of fontFamilies) {
      if (loadedRef.current.has(family)) continue;

      const retries = failedRef.current.get(family) ?? 0;
      if (retries >= MAX_RETRIES) continue;

      loadedRef.current.add(family);
      fontManager.loadFont(family).catch(() => {
        loadedRef.current.delete(family);
        failedRef.current.set(family, retries + 1);
      });
    }
  }, [fontFamilies]);
}
