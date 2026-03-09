import { useMemo } from 'react';
import type { Page } from '@reactcanvas/core';
import { useEditorStore } from '../context/EditorContext';

export function useActivePage(): Page | undefined {
  const activePageId = useEditorStore((s) => s.activePageId);
  const pages = useEditorStore((s) => s.document.pages);
  return useMemo(() => pages.find((p) => p.id === activePageId), [pages, activePageId]);
}
