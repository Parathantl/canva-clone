import React, { useCallback, useRef, useMemo, useState, useEffect } from 'react';
import type { CanvasElement, TextElement } from '@reactcanvas/core';
import {
  useSelection,
  useElements,
  useViewport,
  usePages,
} from '@reactcanvas/react';
import { DOMElementRenderer } from '../renderers/DOMElementRenderer';
import { TextToolbar } from '../ui/TextToolbar';

export interface EditorCanvasProps {
  width?: number;
  height?: number;
  className?: string;
  canvasRef?: React.RefObject<HTMLDivElement>;
}

type DragState = {
  type: 'move';
  id: string;
  startX: number;
  startY: number;
  origX: number;
  origY: number;
} | {
  type: 'resize';
  id: string;
  handle: string;
  startX: number;
  startY: number;
  origX: number;
  origY: number;
  origW: number;
  origH: number;
  element: CanvasElement;
} | {
  type: 'rotate';
  id: string;
  centerX: number;
  centerY: number;
  startAngle: number;
  origRotation: number;
};

const NUDGE_AMOUNT = 1;
const NUDGE_SHIFT_AMOUNT = 10;

export function EditorCanvas({ width = 1200, height = 800, className, canvasRef: externalCanvasRef }: EditorCanvasProps) {
  const internalCanvasRef = useRef<HTMLDivElement>(null);
  const canvasRef = externalCanvasRef ?? internalCanvasRef;
  const containerRef = useRef<HTMLDivElement>(null);
  const { elements, updateElement, removeElements, duplicateElements } = useElements();
  const { selectedElementIds, select, deselectAll, selectAll } = useSelection();
  const { zoom, panX, panY, setZoom, setPan, zoomToFit } = useViewport();
  const { activePage } = usePages();
  const [editingTextId, setEditingTextId] = useState<string | null>(null);
  const hasInitialFit = useRef(false);
  const [dragging, setDragging] = useState<DragState | null>(null);

  const pageWidth = activePage?.width ?? 1920;
  const pageHeight = activePage?.height ?? 1080;

  useEffect(() => {
    if (!hasInitialFit.current && width > 0 && height > 0) {
      hasInitialFit.current = true;
      zoomToFit(width, height, pageWidth, pageHeight);
    }
  }, [width, height, pageWidth, pageHeight, zoomToFit]);

  const sortedElements = useMemo(
    () => [...(activePage?.elements ?? [])].sort((a, b) => a.layerOrder - b.layerOrder),
    [activePage?.elements]
  );

  const offsetX = (width - pageWidth * zoom) / 2 + panX;
  const offsetY = (height - pageHeight * zoom) / 2 + panY;

  // Find selected text element for floating toolbar (always live from store)
  const selectedTextElement = useMemo(() => {
    const targetId = editingTextId ?? (selectedElementIds.length === 1 ? selectedElementIds[0] : null);
    if (!targetId) return null;
    const el = elements.find((e) => e.id === targetId);
    return el?.type === 'text' ? (el as TextElement) : null;
  }, [editingTextId, selectedElementIds, elements]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't handle shortcuts when editing text
      if (editingTextId) return;
      // Don't handle if typing in an input/textarea
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

      const meta = e.metaKey || e.ctrlKey;

      // Delete/Backspace → remove selected
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedElementIds.length > 0) {
        e.preventDefault();
        removeElements(selectedElementIds);
        return;
      }

      // Ctrl/Cmd+A → select all
      if (meta && e.key === 'a') {
        e.preventDefault();
        selectAll();
        return;
      }

      // Ctrl/Cmd+D → duplicate
      if (meta && e.key === 'd' && selectedElementIds.length > 0) {
        e.preventDefault();
        duplicateElements(selectedElementIds);
        return;
      }

      // Escape → deselect
      if (e.key === 'Escape') {
        deselectAll();
        return;
      }

      // Arrow keys → nudge
      if (selectedElementIds.length > 0) {
        const amount = e.shiftKey ? NUDGE_SHIFT_AMOUNT : NUDGE_AMOUNT;
        let dx = 0, dy = 0;
        if (e.key === 'ArrowLeft') dx = -amount;
        else if (e.key === 'ArrowRight') dx = amount;
        else if (e.key === 'ArrowUp') dy = -amount;
        else if (e.key === 'ArrowDown') dy = amount;

        if (dx !== 0 || dy !== 0) {
          e.preventDefault();
          for (const id of selectedElementIds) {
            const el = elements.find((el) => el.id === id);
            if (el && !el.locked) {
              updateElement(id, { x: el.x + dx, y: el.y + dy } as Partial<CanvasElement>);
            }
          }
          return;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedElementIds, elements, editingTextId, removeElements, duplicateElements, selectAll, deselectAll, updateElement]);

  // Wheel zoom/pan
  const wheelRef = useRef<{ zoom: number; panX: number; panY: number }>({ zoom, panX, panY });
  wheelRef.current = { zoom, panX, panY };

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const { zoom: z, panX: px, panY: py } = wheelRef.current;
      if (e.ctrlKey || e.metaKey) {
        const rect = container.getBoundingClientRect();
        const pointerX = e.clientX - rect.left;
        const pointerY = e.clientY - rect.top;
        const direction = e.deltaY > 0 ? -1 : 1;
        const factor = 1.1;
        const newScale = direction > 0 ? z * factor : z / factor;
        const clampedScale = Math.min(10, Math.max(0.1, newScale));
        const mousePointTo = {
          x: (pointerX - px) / z,
          y: (pointerY - py) / z,
        };
        setZoom(clampedScale);
        setPan(pointerX - mousePointTo.x * clampedScale, pointerY - mousePointTo.y * clampedScale);
      } else {
        setPan(px - e.deltaX, py - e.deltaY);
      }
    };

    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => container.removeEventListener('wheel', handleWheel);
  }, [setZoom, setPan]);

  // Click on page background → deselect and exit editing
  const handlePageClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) {
        e.preventDefault();
        setEditingTextId(null);
        deselectAll();
      }
    },
    [deselectAll]
  );

  // Click on viewport background (gray area) → deselect and exit editing
  const handleViewportClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) {
        e.preventDefault();
        setEditingTextId(null);
        deselectAll();
      }
    },
    [deselectAll]
  );

  // Select element (with shift for multi-select)
  const handleSelect = useCallback(
    (id: string, addToSelection: boolean) => {
      // Exit text editing if selecting a different element
      if (editingTextId && editingTextId !== id) {
        setEditingTextId(null);
      }
      select(id, addToSelection);
    },
    [select, editingTextId]
  );

  // Start dragging an element
  const handleDragStart = useCallback(
    (id: string, e: React.MouseEvent) => {
      const el = elements.find((el) => el.id === id);
      if (!el || el.locked) return;
      e.stopPropagation();
      setDragging({
        type: 'move',
        id,
        startX: e.clientX,
        startY: e.clientY,
        origX: el.x,
        origY: el.y,
      });
    },
    [elements]
  );

  // Start resizing an element
  const handleResizeStart = useCallback(
    (id: string, handle: string, e: React.MouseEvent) => {
      const el = elements.find((el) => el.id === id);
      if (!el || el.locked) return;
      e.stopPropagation();
      e.preventDefault();
      setDragging({
        type: 'resize',
        id,
        handle,
        startX: e.clientX,
        startY: e.clientY,
        origX: el.x,
        origY: el.y,
        origW: el.width,
        origH: el.height ?? 40,
        element: el,
      });
    },
    [elements]
  );

  // Start rotating an element
  const handleRotateStart = useCallback(
    (id: string, e: React.MouseEvent) => {
      const el = elements.find((el) => el.id === id);
      if (!el || el.locked) return;
      e.stopPropagation();
      e.preventDefault();

      const centerX = offsetX + (el.x + el.width / 2) * zoom;
      const centerY = offsetY + (el.y + el.height / 2) * zoom;
      const startAngle = Math.atan2(e.clientY - centerY, e.clientX - centerX) * (180 / Math.PI);

      setDragging({
        type: 'rotate',
        id,
        centerX,
        centerY,
        startAngle,
        origRotation: el.rotation,
      });
    },
    [elements, offsetX, offsetY, zoom]
  );

  // Drag/resize/rotate mouse tracking
  useEffect(() => {
    if (!dragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (dragging.type === 'move') {
        const dx = (e.clientX - dragging.startX) / zoom;
        const dy = (e.clientY - dragging.startY) / zoom;
        updateElement(dragging.id, {
          x: dragging.origX + dx,
          y: dragging.origY + dy,
        } as Partial<CanvasElement>);
      } else if (dragging.type === 'resize') {
        const dx = (e.clientX - dragging.startX) / zoom;
        const dy = (e.clientY - dragging.startY) / zoom;
        const h = dragging.handle;
        let newX = dragging.origX;
        let newY = dragging.origY;
        let newW = dragging.origW;
        let newH = dragging.origH;

        if (h.includes('l')) { newX = dragging.origX + dx; newW = dragging.origW - dx; }
        else if (h.includes('r')) { newW = dragging.origW + dx; }

        if (h.startsWith('t')) { newY = dragging.origY + dy; newH = dragging.origH - dy; }
        else if (h.startsWith('b')) { newH = dragging.origH + dy; }

        if (newW < 10) { newW = 10; newX = dragging.origX + dragging.origW - 10; }
        if (newH < 10) { newH = 10; newY = dragging.origY + dragging.origH - 10; }

        const attrs: Record<string, any> = { x: newX, y: newY, width: newW, height: newH };

        if (dragging.element.type === 'text') {
          const scaleY = newH / dragging.origH;
          attrs.fontSize = Math.max(8, Math.round((dragging.element as TextElement).fontSize * scaleY));
        }

        updateElement(dragging.id, attrs as Partial<CanvasElement>);
      } else if (dragging.type === 'rotate') {
        const currentAngle = Math.atan2(
          e.clientY - dragging.centerY,
          e.clientX - dragging.centerX
        ) * (180 / Math.PI);
        let newRotation = dragging.origRotation + (currentAngle - dragging.startAngle);

        if (e.shiftKey) {
          newRotation = Math.round(newRotation / 15) * 15;
        }

        while (newRotation > 180) newRotation -= 360;
        while (newRotation < -180) newRotation += 360;

        updateElement(dragging.id, { rotation: newRotation } as Partial<CanvasElement>);
      }
    };

    const handleMouseUp = () => {
      setDragging(null);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [dragging, zoom, updateElement]);

  // Double-click text to edit in-place
  const handleDblClick = useCallback(
    (id: string) => {
      const el = elements.find((e) => e.id === id);
      if (el?.type === 'text') {
        setEditingTextId(id);
      }
    },
    [elements]
  );

  // Auto-resize text element height when content grows
  const handleAutoResize = useCallback(
    (id: string, newHeight: number) => {
      updateElement(id, { height: newHeight } as Partial<CanvasElement>);
    },
    [updateElement]
  );

  // Text content change from in-place editor
  const handleTextContentChange = useCallback(
    (id: string, newContent: string) => {
      updateElement(id, { content: newContent } as Partial<CanvasElement>);
    },
    [updateElement]
  );

  // Text edit complete
  const handleTextEditComplete = useCallback(() => {
    setEditingTextId(null);
  }, []);

  return (
    <div
      ref={containerRef}
      tabIndex={0}
      style={{
        position: 'relative',
        width,
        height,
        overflow: 'hidden',
        backgroundColor: '#f0f0f0',
        cursor: dragging?.type === 'move' ? 'grabbing' : dragging?.type === 'rotate' ? 'grabbing' : 'default',
        outline: 'none',
      }}
      className={className}
      onMouseDown={handleViewportClick}
    >
      {/* Transform layer: zoom + pan */}
      <div
        style={{
          position: 'absolute',
          left: offsetX,
          top: offsetY,
          width: pageWidth,
          height: pageHeight,
          transform: `scale(${zoom})`,
          transformOrigin: '0 0',
        }}
      >
        {/* Page background */}
        <div
          ref={canvasRef}
          style={{
            position: 'absolute',
            width: pageWidth,
            height: pageHeight,
            backgroundColor: activePage?.backgroundColor ?? '#ffffff',
            boxShadow: '2px 2px 10px rgba(0,0,0,0.1)',
          }}
          onMouseDown={handlePageClick}
        >
          {/* Elements */}
          {sortedElements.map((element) => (
            <DOMElementRenderer
              key={element.id}
              element={element}
              isSelected={selectedElementIds.includes(element.id)}
              isEditing={editingTextId === element.id}
              zoom={zoom}
              onSelect={handleSelect}
              onDragStart={handleDragStart}
              onResizeStart={handleResizeStart}
              onRotateStart={handleRotateStart}
              onDblClick={handleDblClick}
              onAutoResize={handleAutoResize}
              onTextContentChange={handleTextContentChange}
              onTextEditComplete={handleTextEditComplete}
            />
          ))}
        </div>
      </div>

      {/* Floating text toolbar when a text element is selected or being edited */}
      {selectedTextElement && (
        <TextToolbar
          element={selectedTextElement}
          isEditing={!!editingTextId}
          onUpdate={(id, attrs) => updateElement(id, attrs)}
          style={{
            position: 'absolute',
            left: Math.max(8, Math.min(
              offsetX + selectedTextElement.x * zoom,
              width - 500
            )),
            top: Math.max(8,
              offsetY + selectedTextElement.y * zoom - 52
            ),
          }}
        />
      )}
    </div>
  );
}
