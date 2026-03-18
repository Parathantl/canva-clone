import { useCallback } from 'react';
import { useEditorInstance, useEditorStore } from '../context/EditorContext';

export function useViewport() {
  const { store, eventBus } = useEditorInstance();

  const { zoom, panX, panY } = useEditorStore((s) => s.viewport);
  const viewport = { zoom, panX, panY };

  const setZoom = useCallback(
    (newZoom: number) => {
      store.getState().setZoom(newZoom);
      eventBus.emit('viewport:zoom', { zoom: newZoom });
    },
    [store, eventBus]
  );

  const setPan = useCallback(
    (x: number, y: number) => {
      store.getState().setPan(x, y);
      eventBus.emit('viewport:pan', { panX: x, panY: y });
    },
    [store, eventBus]
  );

  const zoomIn = useCallback(() => {
    const current = store.getState().viewport.zoom;
    setZoom(Math.min(10, current * 1.2));
  }, [store, setZoom]);

  const zoomOut = useCallback(() => {
    const current = store.getState().viewport.zoom;
    setZoom(Math.max(0.1, current / 1.2));
  }, [store, setZoom]);

  const zoomToFit = useCallback((canvasWidth?: number, canvasHeight?: number, pageWidth?: number, pageHeight?: number) => {
    if (canvasWidth && canvasHeight && pageWidth && pageHeight) {
      const scaleX = canvasWidth / pageWidth;
      const scaleY = canvasHeight / pageHeight;
      const fitZoom = Math.min(scaleX, scaleY) * 0.95;
      setZoom(Math.min(10, Math.max(0.1, fitZoom)));
    } else {
      setZoom(1);
    }
    store.getState().setPan(0, 0);
  }, [store, setZoom]);

  const zoomToPercent = useCallback(
    (percent: number) => {
      setZoom(percent / 100);
    },
    [setZoom]
  );

  return {
    viewport,
    zoom,
    panX,
    panY,
    setZoom,
    setPan,
    zoomIn,
    zoomOut,
    zoomToFit,
    zoomToPercent,
    zoomPercent: Math.round(zoom * 100),
  };
}
