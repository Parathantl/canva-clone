import React, { useCallback, useRef, useMemo, useState, useEffect } from 'react';
import type { CanvasElement, TextElement } from '@reactcanvas/core';
import { createImageElement } from '@reactcanvas/core';
import {
  useSelection,
  useElements,
  useViewport,
  usePages,
  useHistory,
} from '@reactcanvas/react';
import { DOMElementRenderer } from '../renderers/DOMElementRenderer';
import { TextToolbar } from '../ui/TextToolbar';
import { copyElements, pasteElements, flipElements, getClipboard } from './useClipboard';
import { computeSmartGuides, type Guide } from './smartGuides';

export interface EditorCanvasProps {
  width?: number;
  height?: number;
  className?: string;
  canvasRef?: React.RefObject<HTMLDivElement>;
}

type DragState = {
  type: 'move';
  ids: string[];
  startX: number;
  startY: number;
  origPositions: Array<{ id: string; x: number; y: number }>;
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
  origBounds?: { x: number; y: number; w: number; h: number };
  origElements?: Array<{ id: string; x: number; y: number; w: number; h: number }>;
} | {
  type: 'rotate';
  id: string;
  centerX: number;
  centerY: number;
  startAngle: number;
  origRotation: number;
} | {
  type: 'rubberband';
  startClientX: number;
  startClientY: number;
  currentClientX: number;
  currentClientY: number;
};

const NUDGE_AMOUNT = 1;
const NUDGE_SHIFT_AMOUNT = 10;

export function EditorCanvas({ width = 1200, height = 800, className, canvasRef: externalCanvasRef }: EditorCanvasProps) {
  const internalCanvasRef = useRef<HTMLDivElement>(null);
  const canvasRef = externalCanvasRef ?? internalCanvasRef;
  const containerRef = useRef<HTMLDivElement>(null);
  const { elements, updateElement, removeElements, duplicateElements, addElement, bringToFront, sendToBack, bringForward, sendBackward, groupElements, ungroupElement } = useElements();
  const { selectedElementIds, select, deselectAll, selectAll, selectMultiple } = useSelection();
  const { zoom, panX, panY, setZoom, setPan, zoomToFit } = useViewport();
  const { activePage } = usePages();
  const { undo, redo } = useHistory();
  const [editingTextId, setEditingTextId] = useState<string | null>(null);
  const hasInitialFit = useRef(false);
  const [dragging, setDragging] = useState<DragState | null>(null);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);
  const [guides, setGuides] = useState<Array<{ type: 'h' | 'v'; pos: number }>>([]);

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

      // Ctrl/Cmd+Z → undo, Ctrl/Cmd+Shift+Z → redo
      if (meta && e.key === 'z') {
        e.preventDefault();
        if (e.shiftKey) { redo(); } else { undo(); }
        return;
      }

      // Ctrl/Cmd+C → copy
      if (meta && e.key === 'c' && selectedElementIds.length > 0) {
        copyElements(elements, selectedElementIds);
        return;
      }

      // Ctrl/Cmd+V → paste
      if (meta && e.key === 'v' && getClipboard().length > 0) {
        e.preventDefault();
        pasteElements(addElement, selectMultiple);
        return;
      }

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

      // Ctrl/Cmd+Shift+] → bring to front, Ctrl/Cmd+] → bring forward
      if (meta && e.key === ']' && selectedElementIds.length > 0) {
        e.preventDefault();
        if (e.shiftKey) { bringToFront(selectedElementIds); } else { bringForward(selectedElementIds); }
        return;
      }

      // Ctrl/Cmd+Shift+[ → send to back, Ctrl/Cmd+[ → send backward
      if (meta && e.key === '[' && selectedElementIds.length > 0) {
        e.preventDefault();
        if (e.shiftKey) { sendToBack(selectedElementIds); } else { sendBackward(selectedElementIds); }
        return;
      }

      // Ctrl/Cmd+Shift+H → flip horizontal
      if (meta && e.shiftKey && (e.key === 'H' || e.code === 'KeyH') && selectedElementIds.length > 0) {
        e.preventDefault();
        flipElements(selectedElementIds, elements, updateElement, 'x');
        return;
      }

      // Ctrl/Cmd+G → group
      if (meta && e.key === 'g' && !e.shiftKey && selectedElementIds.length >= 2) {
        e.preventDefault();
        groupElements(selectedElementIds);
        return;
      }

      // Ctrl/Cmd+Shift+G → ungroup
      if (meta && e.key === 'g' && e.shiftKey && selectedElementIds.length === 1) {
        e.preventDefault();
        const el = elements.find((el) => el.id === selectedElementIds[0]);
        if (el?.type === 'group') {
          ungroupElement(el.id);
        }
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
  }, [selectedElementIds, elements, editingTextId, removeElements, duplicateElements, selectAll, deselectAll, updateElement, undo, redo, addElement, selectMultiple, bringToFront, sendToBack, bringForward, sendBackward, groupElements, ungroupElement]);

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

  // Click on page background → start rubber band or deselect
  const handlePageClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) {
        e.preventDefault();
        setEditingTextId(null);
        deselectAll();
        // Start rubber band selection
        setDragging({
          type: 'rubberband',
          startClientX: e.clientX,
          startClientY: e.clientY,
          currentClientX: e.clientX,
          currentClientY: e.clientY,
        });
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

  // Start dragging an element (moves all selected elements together)
  const handleDragStart = useCallback(
    (id: string, e: React.MouseEvent) => {
      const el = elements.find((el) => el.id === id);
      if (!el || el.locked) return;
      e.stopPropagation();

      // Collect all selected elements (include the dragged one)
      const idsToMove = selectedElementIds.includes(id) ? selectedElementIds : [id];
      const origPositions = idsToMove
        .map((eid) => {
          const elem = elements.find((el) => el.id === eid);
          return elem && !elem.locked ? { id: eid, x: elem.x, y: elem.y } : null;
        })
        .filter(Boolean) as Array<{ id: string; x: number; y: number }>;

      setDragging({
        type: 'move',
        ids: idsToMove,
        startX: e.clientX,
        startY: e.clientY,
        origPositions,
      });
    },
    [elements, selectedElementIds]
  );

  // Start resizing an element (or multiple selected elements)
  const handleResizeStart = useCallback(
    (id: string, handle: string, e: React.MouseEvent) => {
      const el = elements.find((el) => el.id === id);
      if (!el || el.locked) return;
      e.stopPropagation();
      e.preventDefault();

      const idsToResize = selectedElementIds.includes(id) && selectedElementIds.length > 1
        ? selectedElementIds
        : [id];

      if (idsToResize.length > 1) {
        // Multi-select resize: compute bounding box + store each element's original bounds
        const resizeElements = idsToResize
          .map((eid) => elements.find((el) => el.id === eid))
          .filter((el): el is CanvasElement => !!el && !el.locked);

        const bx = Math.min(...resizeElements.map((e) => e.x));
        const by = Math.min(...resizeElements.map((e) => e.y));
        const bx2 = Math.max(...resizeElements.map((e) => e.x + e.width));
        const by2 = Math.max(...resizeElements.map((e) => e.y + (e.height ?? 40)));

        setDragging({
          type: 'resize',
          id,
          handle,
          startX: e.clientX,
          startY: e.clientY,
          origX: bx,
          origY: by,
          origW: bx2 - bx,
          origH: by2 - by,
          element: el,
          origBounds: { x: bx, y: by, w: bx2 - bx, h: by2 - by },
          origElements: resizeElements.map((e) => ({ id: e.id, x: e.x, y: e.y, w: e.width, h: e.height ?? 40 })),
        });
      } else {
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
      }
    },
    [elements, selectedElementIds]
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
        let dx = (e.clientX - dragging.startX) / zoom;
        let dy = (e.clientY - dragging.startY) / zoom;

        let newGuides: Guide[] = [];

        if (!e.altKey && dragging.origPositions.length > 0) {
          const first = dragging.origPositions[0];
          const el = sortedElements.find((se) => se.id === first.id);
          const elW = el?.width ?? 0;
          const elH = el?.height ?? 0;

          const movingIds = new Set(dragging.origPositions.map((p) => p.id));
          const stationary = sortedElements.filter((se) => !movingIds.has(se.id));

          const result = computeSmartGuides(
            { left: first.x + dx, top: first.y + dy, width: elW, height: elH },
            stationary,
          );
          dx += result.dx;
          dy += result.dy;
          newGuides = result.guides;
        }

        setGuides(newGuides);

        for (const orig of dragging.origPositions) {
          updateElement(orig.id, {
            x: orig.x + dx,
            y: orig.y + dy,
          } as Partial<CanvasElement>);
        }
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

        // Shift = lock aspect ratio on corner handles
        const isCorner = (h === 'tl' || h === 'tr' || h === 'bl' || h === 'br');
        if (e.shiftKey && isCorner && dragging.origW > 0 && dragging.origH > 0) {
          const aspect = dragging.origW / dragging.origH;
          if (Math.abs(dx) > Math.abs(dy)) {
            newH = newW / aspect;
            if (h.startsWith('t')) { newY = dragging.origY + dragging.origH - newH; }
          } else {
            newW = newH * aspect;
            if (h.includes('l')) { newX = dragging.origX + dragging.origW - newW; }
          }
        }

        if (newW < 10) { newW = 10; newX = dragging.origX + dragging.origW - 10; }
        if (newH < 10) { newH = 10; newY = dragging.origY + dragging.origH - 10; }

        // Multi-select resize: scale all elements proportionally within the bounding box
        if (dragging.origBounds && dragging.origElements) {
          const ob = dragging.origBounds;
          const scaleX = ob.w > 0 ? newW / ob.w : 1;
          const scaleY = ob.h > 0 ? newH / ob.h : 1;

          for (const orig of dragging.origElements) {
            const elNewX = newX + (orig.x - ob.x) * scaleX;
            const elNewY = newY + (orig.y - ob.y) * scaleY;
            const elNewW = Math.max(10, orig.w * scaleX);
            const elNewH = Math.max(10, orig.h * scaleY);
            updateElement(orig.id, { x: elNewX, y: elNewY, width: elNewW, height: elNewH } as Partial<CanvasElement>);
          }
        } else {
          // Single element resize
          const attrs: Record<string, any> = { x: newX, y: newY, width: newW, height: newH };

          // Text elements: only scale font when dragging vertical-only handles (tc, bc)
          if (dragging.element.type === 'text') {
            const isVerticalOnly = h === 'tc' || h === 'bc';
            if (isVerticalOnly) {
              const scaleY = newH / dragging.origH;
              attrs.fontSize = Math.max(8, Math.round((dragging.element as TextElement).fontSize * scaleY));
            }
          }

          updateElement(dragging.id, attrs as Partial<CanvasElement>);
        }
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
      } else if (dragging.type === 'rubberband') {
        setDragging({
          ...dragging,
          currentClientX: e.clientX,
          currentClientY: e.clientY,
        });
      }
    };

    const handleMouseUp = (e: MouseEvent) => {
      if (dragging.type === 'rubberband') {
        // Convert client coords to page coords and select elements within the rectangle
        const x1 = Math.min(dragging.startClientX, e.clientX);
        const y1 = Math.min(dragging.startClientY, e.clientY);
        const x2 = Math.max(dragging.startClientX, e.clientX);
        const y2 = Math.max(dragging.startClientY, e.clientY);

        // Only select if dragged at least a few pixels
        if (x2 - x1 > 5 || y2 - y1 > 5) {
          const ids = sortedElements.filter((el) => {
            const elLeft = offsetX + el.x * zoom;
            const elTop = offsetY + el.y * zoom;
            const elRight = elLeft + el.width * zoom;
            const elBottom = elTop + el.height * zoom;
            return elLeft < x2 && elRight > x1 && elTop < y2 && elBottom > y1;
          }).map((el) => el.id);

          if (ids.length > 0) {
            selectMultiple(ids);
          }
        }
      }
      setDragging(null);
      setGuides([]);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [dragging, zoom, updateElement, offsetX, offsetY, sortedElements, selectMultiple]);

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

  // Right-click context menu (on canvas background)
  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY });
  }, []);

  // Right-click context menu on an element (auto-selects + opens menu)
  const handleElementContextMenu = useCallback(
    (_id: string, e: React.MouseEvent) => {
      // Selection is handled inside DOMElementRenderer
      setContextMenu({ x: e.clientX, y: e.clientY });
    },
    []
  );

  // Close context menu on any click
  useEffect(() => {
    if (!contextMenu) return;
    const close = () => setContextMenu(null);
    window.addEventListener('mousedown', close);
    return () => window.removeEventListener('mousedown', close);
  }, [contextMenu]);

  // Image drag-and-drop
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files).filter((f) => f.type.startsWith('image/'));
    if (files.length === 0) return;

    const containerRect = containerRef.current?.getBoundingClientRect();
    const dropX = containerRect ? (e.clientX - containerRect.left - offsetX) / zoom : (activePage?.width ?? 1920) / 2;
    const dropY = containerRect ? (e.clientY - containerRect.top - offsetY) / zoom : (activePage?.height ?? 1080) / 2;

    for (const file of files) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const src = ev.target?.result as string;
        const img = new Image();
        img.onload = () => {
          let w = img.naturalWidth, h = img.naturalHeight;
          const maxDim = 600;
          if (w > maxDim || h > maxDim) {
            const ratio = Math.min(maxDim / w, maxDim / h);
            w *= ratio; h *= ratio;
          }
          addElement(createImageElement({
            src,
            x: dropX - w / 2,
            y: dropY - h / 2,
            width: w,
            height: h,
            originalWidth: img.naturalWidth,
            originalHeight: img.naturalHeight,
            cropWidth: img.naturalWidth,
            cropHeight: img.naturalHeight,
            layerOrder: elements.length,
            name: file.name,
          }));
        };
        img.src = src;
      };
      reader.readAsDataURL(file);
    }
  }, [addElement, elements.length, offsetX, offsetY, zoom, activePage]);

  // Compute rubber band rect in screen coords
  const rubberBand = dragging?.type === 'rubberband' ? {
    left: Math.min(dragging.startClientX, dragging.currentClientX),
    top: Math.min(dragging.startClientY, dragging.currentClientY),
    width: Math.abs(dragging.currentClientX - dragging.startClientX),
    height: Math.abs(dragging.currentClientY - dragging.startClientY),
  } : null;

  return (
    <div
      ref={containerRef}
      tabIndex={0}
      style={{
        position: 'relative',
        width,
        height,
        overflow: 'hidden',
        backgroundColor: '#0f0f14',
        cursor: dragging?.type === 'move' ? 'grabbing' : dragging?.type === 'rotate' ? 'grabbing' : dragging?.type === 'rubberband' ? 'crosshair' : 'default',
        outline: 'none',
      }}
      className={className}
      onMouseDown={handleViewportClick}
      onContextMenu={handleContextMenu}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
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
            boxShadow: '0 4px 24px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.05)',
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
              onContextMenu={handleElementContextMenu}
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

      {/* Rubber band selection rectangle */}
      {rubberBand && rubberBand.width > 2 && rubberBand.height > 2 && (
        <div
          style={{
            position: 'fixed',
            left: rubberBand.left,
            top: rubberBand.top,
            width: rubberBand.width,
            height: rubberBand.height,
            border: '1px solid #89b4fa',
            backgroundColor: 'rgba(137, 180, 250, 0.1)',
            pointerEvents: 'none',
            zIndex: 9999,
          }}
        />
      )}

      {/* Smart guides */}
      {guides.map((g, i) =>
        g.type === 'v' ? (
          <div
            key={`g${i}`}
            style={{
              position: 'absolute',
              left: offsetX + g.pos * zoom,
              top: 0,
              width: 1,
              height: '100%',
              backgroundColor: '#f43f5e',
              pointerEvents: 'none',
              zIndex: 9998,
              opacity: 0.7,
            }}
          />
        ) : (
          <div
            key={`g${i}`}
            style={{
              position: 'absolute',
              left: 0,
              top: offsetY + g.pos * zoom,
              width: '100%',
              height: 1,
              backgroundColor: '#f43f5e',
              pointerEvents: 'none',
              zIndex: 9998,
              opacity: 0.7,
            }}
          />
        )
      )}

      {/* Context menu */}
      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          hasSelection={selectedElementIds.length > 0}
          canGroup={selectedElementIds.length >= 2}
          canUngroup={selectedElementIds.length === 1 && elements.find((el) => el.id === selectedElementIds[0])?.type === 'group'}
          onBringToFront={() => { bringToFront(selectedElementIds); setContextMenu(null); }}
          onBringForward={() => { bringForward(selectedElementIds); setContextMenu(null); }}
          onSendToBack={() => { sendToBack(selectedElementIds); setContextMenu(null); }}
          onSendBackward={() => { sendBackward(selectedElementIds); setContextMenu(null); }}
          onDuplicate={() => { duplicateElements(selectedElementIds); setContextMenu(null); }}
          onDelete={() => { removeElements(selectedElementIds); setContextMenu(null); }}
          onFlipH={() => { flipElements(selectedElementIds, elements, updateElement, 'x'); setContextMenu(null); }}
          onFlipV={() => { flipElements(selectedElementIds, elements, updateElement, 'y'); setContextMenu(null); }}
          onCopy={() => { copyElements(elements, selectedElementIds); setContextMenu(null); }}
          onPaste={() => { pasteElements(addElement, selectMultiple); setContextMenu(null); }}
          onGroup={() => { groupElements(selectedElementIds); setContextMenu(null); }}
          onUngroup={() => { ungroupElement(selectedElementIds[0]); setContextMenu(null); }}
          onSelectAll={() => { selectAll(); setContextMenu(null); }}
          hasClipboard={getClipboard().length > 0}
        />
      )}
    </div>
  );
}

// Context menu component
function ContextMenu({
  x, y,
  hasSelection, canGroup, canUngroup,
  onBringToFront, onBringForward, onSendToBack, onSendBackward,
  onDuplicate, onDelete,
  onCopy, onPaste, onGroup, onUngroup, onSelectAll,
  onFlipH, onFlipV,
  hasClipboard,
}: {
  x: number; y: number;
  hasSelection: boolean; canGroup: boolean; canUngroup: boolean;
  onBringToFront: () => void; onBringForward: () => void;
  onSendToBack: () => void; onSendBackward: () => void;
  onDuplicate: () => void; onDelete: () => void;
  onCopy: () => void; onPaste: () => void;
  onGroup: () => void; onUngroup: () => void;
  onSelectAll: () => void;
  onFlipH: () => void; onFlipV: () => void;
  hasClipboard: boolean;
}) {
  return (
    <div
      style={{
        position: 'fixed',
        left: x,
        top: y,
        zIndex: 10000,
        minWidth: 200,
        backgroundColor: '#1e1e2e',
        border: '1px solid #313244',
        borderRadius: 10,
        padding: '6px 0',
        boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
        fontFamily: 'Inter, -apple-system, sans-serif',
      }}
      onMouseDown={(e) => e.stopPropagation()}
    >
      {hasSelection && (
        <>
          <CtxItem label="Copy" shortcut={'\u2318C'} onClick={onCopy} />
          <CtxItem label="Paste" shortcut={'\u2318V'} onClick={onPaste} disabled={!hasClipboard} />
          <CtxItem label="Duplicate" shortcut={'\u2318D'} onClick={onDuplicate} />
          <CtxDivider />
          <CtxItem label="Bring to Front" shortcut={'\u21E7\u2318]'} onClick={onBringToFront} />
          <CtxItem label="Bring Forward" shortcut={'\u2318]'} onClick={onBringForward} />
          <CtxItem label="Send Backward" shortcut={'\u2318['} onClick={onSendBackward} />
          <CtxItem label="Send to Back" shortcut={'\u21E7\u2318['} onClick={onSendToBack} />
          <CtxDivider />
          <CtxItem label="Flip Horizontal" shortcut={'\u21E7\u2318H'} onClick={onFlipH} />
          <CtxItem label="Flip Vertical" onClick={onFlipV} />
          <CtxDivider />
          {canGroup && <CtxItem label="Group" shortcut={'\u2318G'} onClick={onGroup} />}
          {canUngroup && <CtxItem label="Ungroup" shortcut={'\u21E7\u2318G'} onClick={onUngroup} />}
          {(canGroup || canUngroup) && <CtxDivider />}
          <CtxItem label="Delete" shortcut={'\u232B'} onClick={onDelete} danger />
        </>
      )}
      {!hasSelection && (
        <>
          <CtxItem label="Paste" shortcut={'\u2318V'} onClick={onPaste} disabled={!hasClipboard} />
          <CtxDivider />
          <CtxItem label="Select All" shortcut={'\u2318A'} onClick={onSelectAll} />
        </>
      )}
    </div>
  );
}

function CtxItem({ label, shortcut, onClick, disabled, danger }: {
  label: string; shortcut?: string; onClick: () => void; disabled?: boolean; danger?: boolean;
}) {
  return (
    <button
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
        padding: '7px 14px',
        border: 'none',
        backgroundColor: 'transparent',
        color: disabled ? '#45475a' : danger ? '#E8596D' : '#cdd6f4',
        fontSize: 12,
        fontWeight: 500,
        cursor: disabled ? 'default' : 'pointer',
        textAlign: 'left',
        fontFamily: 'inherit',
      }}
    >
      <span>{label}</span>
      {shortcut && <span style={{ color: '#585878', fontSize: 11, marginLeft: 24 }}>{shortcut}</span>}
    </button>
  );
}

function CtxDivider() {
  return <div style={{ height: 1, backgroundColor: '#313244', margin: '4px 0' }} />;
}
