import React, { memo, useCallback, useRef, useEffect, useMemo } from 'react';
import DOMPurify from 'dompurify';
import type { CanvasElement, ShapeElement, TextElement, ImageElement, LineElement, ChartElement, KPIElement, TableElement, ProgressElement, EmbedElement, FilterControlElement } from '@reactcanvas/core';
import { isSolidFill, isLinearGradient, isRadialGradient } from '@reactcanvas/core';
import { ChartContent, KPIContent, TableContent, ProgressContent, EmbedContent } from './WidgetRenderers';
import type { ChartFilterEvent } from './WidgetRenderers';
import { FilterControlContent } from './FilterControlRenderer';
import { WidgetOverlay } from './WidgetOverlay';

interface DOMElementRendererProps {
  element: CanvasElement;
  isSelected: boolean;
  isEditing: boolean;
  zoom: number;
  onSelect: (id: string, addToSelection: boolean) => void;
  onDragStart: (id: string, e: React.MouseEvent) => void;
  onResizeStart: (id: string, handle: string, e: React.MouseEvent) => void;
  onRotateStart: (id: string, e: React.MouseEvent) => void;
  onDblClick: (id: string) => void;
  onContextMenu?: (id: string, e: React.MouseEvent) => void;
  onAutoResize?: (id: string, height: number) => void;
  onTextContentChange?: (id: string, content: string) => void;
  onTextEditComplete?: () => void;
  /** Active filter values for cross-widget filtering */
  activeFilterValues?: Set<string>;
  /** Called when a chart data point is clicked to create a filter */
  onFilterClick?: (event: ChartFilterEvent) => void;
  /** Called when a filter control value changes */
  onFilterControlChange?: (elementId: string, field: string, values: string[], label: string) => void;
  /** Called when a drill-down navigation is triggered */
  onDrillDown?: (targetPageId: string, field: string, value: string) => void;
  /** Whether a bound data source is currently fetching */
  dataLoading?: boolean;
  /** Error message from a failed data source fetch */
  dataError?: string;
  /** Retry callback when data source fetch fails */
  onDataRetry?: () => void;
}

const HANDLE_SIZE = 10;
const ROTATE_OFFSET = 25;

const HANDLES = [
  { pos: 'tl', x: 0, y: 0, cursor: 'nwse-resize' },
  { pos: 'tc', x: 0.5, y: 0, cursor: 'ns-resize' },
  { pos: 'tr', x: 1, y: 0, cursor: 'nesw-resize' },
  { pos: 'ml', x: 0, y: 0.5, cursor: 'ew-resize' },
  { pos: 'mr', x: 1, y: 0.5, cursor: 'ew-resize' },
  { pos: 'bl', x: 0, y: 1, cursor: 'nesw-resize' },
  { pos: 'bc', x: 0.5, y: 1, cursor: 'ns-resize' },
  { pos: 'br', x: 1, y: 1, cursor: 'nwse-resize' },
];

function buildTransform(el: CanvasElement): string | undefined {
  const parts: string[] = [];
  if (el.rotation) parts.push(`rotate(${el.rotation}deg)`);
  if (el.flipX) parts.push('scaleX(-1)');
  if (el.flipY) parts.push('scaleY(-1)');
  return parts.length > 0 ? parts.join(' ') : undefined;
}

export const DOMElementRenderer = memo(function DOMElementRenderer({
  element,
  isSelected,
  isEditing,
  zoom,
  onSelect,
  onDragStart,
  onResizeStart,
  onRotateStart,
  onDblClick,
  onContextMenu,
  onAutoResize,
  onTextContentChange,
  onTextEditComplete,
  activeFilterValues,
  onFilterClick,
  onFilterControlChange,
  onDrillDown,
  dataLoading,
  dataError,
  onDataRetry,
}: DOMElementRendererProps) {
  const elRef = useRef<HTMLDivElement>(null);

  // Auto-resize text elements
  const lastSyncedHeight = useRef(element.height);
  useEffect(() => {
    lastSyncedHeight.current = element.height;
    if (element.type !== 'text' || !elRef.current || !onAutoResize) return;
    const el = elRef.current;
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      const boxSize = entry.borderBoxSize?.[0];
      const newH = boxSize
        ? Math.ceil(boxSize.blockSize)
        : Math.ceil(entry.contentRect.height + 16);
      if (newH > 0 && Math.abs(newH - lastSyncedHeight.current) > 2) {
        lastSyncedHeight.current = newH;
        onAutoResize(element.id, newH);
      }
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [element.id, element.type, element.height, onAutoResize]);

  // For chart/table widgets that are already selected, allow clicks through
  // to Chart.js canvas so data point click filtering works
  const isInteractiveWidget = element.type === 'chart' || element.type === 'table' || element.type === 'filterControl';

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      // When editing text, let clicks go to the contentEditable
      if (isEditing) return;

      // If this is an already-selected interactive widget, let the click
      // pass through to the Chart.js canvas for filter interactions
      if (isInteractiveWidget && isSelected) {
        // Still select on shift-click for multi-select
        if (e.shiftKey) {
          e.stopPropagation();
          e.preventDefault();
          onSelect(element.id, true);
          return;
        }
        // Don't prevent default or start drag — let Chart.js handle the click
        e.stopPropagation();
        return;
      }

      e.stopPropagation();
      e.preventDefault();
      onSelect(element.id, e.shiftKey);
      if (!element.locked) {
        onDragStart(element.id, e);
      }
    },
    [element.id, element.locked, isEditing, isSelected, isInteractiveWidget, onSelect, onDragStart]
  );

  const preventNativeDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const handleRightClick = useCallback(
    (e: React.MouseEvent) => {
      if (!onContextMenu) return;
      e.preventDefault();
      e.stopPropagation();
      // Auto-select the element on right-click
      if (!isSelected) {
        onSelect(element.id, false);
      }
      onContextMenu(element.id, e);
    },
    [element.id, isSelected, onSelect, onContextMenu]
  );

  const handleDoubleClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onDblClick(element.id);
    },
    [element.id, onDblClick]
  );

  if (!element.visible) return null;

  const handleSize = Math.max(HANDLE_SIZE, HANDLE_SIZE / zoom);
  const rotateOffset = Math.max(ROTATE_OFFSET, ROTATE_OFFSET / zoom);

  const isText = element.type === 'text';

  return (
    <div
      ref={elRef}
      style={{
        position: 'absolute',
        left: element.x,
        top: element.y,
        width: element.width,
        height: isText ? 'auto' : element.height,
        minHeight: isText ? 20 : undefined,
        transform: buildTransform(element),
        opacity: element.opacity,
        cursor: isEditing ? 'text' : element.locked ? 'default' : 'move',
        pointerEvents: 'auto',
        outline: isSelected ? '2px solid #4A90D9' : 'none',
        outlineOffset: -1,
        boxSizing: 'border-box',
      }}
      onMouseDown={handleMouseDown}
      onDoubleClick={handleDoubleClick}
      onContextMenu={handleRightClick}
      onDragStart={preventNativeDrag}
    >
      {/* Render the visual content */}
      {element.type === 'text' ? (
        <TextContent
          element={element as TextElement}
          isEditing={isEditing}
          onContentChange={onTextContentChange}
          onEditComplete={onTextEditComplete}
        />
      ) : (
        <ElementContent element={element} activeFilterValues={activeFilterValues} onFilterClick={onFilterClick} onFilterControlChange={onFilterControlChange} onDrillDown={onDrillDown} />
      )}

      {/* Data source loading/error overlay */}
      {(dataLoading || dataError) && (
        <WidgetOverlay loading={dataLoading} error={dataError} onRetry={onDataRetry} />
      )}

      {/* Selection handles — hide when editing text */}
      {isSelected && !isEditing && (
        <>
          {HANDLES.map(({ pos, x, y, cursor }) => (
            <div
              key={pos}
              style={{
                position: 'absolute',
                left: `calc(${x * 100}% - ${handleSize / 2}px)`,
                top: `calc(${y * 100}% - ${handleSize / 2}px)`,
                width: handleSize,
                height: handleSize,
                backgroundColor: '#fff',
                border: '2px solid #4A90D9',
                borderRadius: 2,
                cursor,
                zIndex: 10,
                boxSizing: 'border-box',
              }}
              onMouseDown={(e) => {
                e.stopPropagation();
                e.preventDefault();
                onResizeStart(element.id, pos, e);
              }}
            />
          ))}

          {/* Rotation handle */}
          <div
            style={{
              position: 'absolute',
              left: '50%',
              top: -rotateOffset,
              width: 1 / zoom,
              height: rotateOffset,
              backgroundColor: '#4A90D9',
              transformOrigin: 'bottom center',
              transform: 'translateX(-50%)',
              pointerEvents: 'none',
              zIndex: 10,
            }}
          />
          <div
            style={{
              position: 'absolute',
              left: `calc(50% - ${handleSize / 2}px)`,
              top: -rotateOffset - handleSize / 2,
              width: handleSize,
              height: handleSize,
              backgroundColor: '#fff',
              border: '2px solid #4A90D9',
              borderRadius: '50%',
              cursor: 'grab',
              zIndex: 10,
              boxSizing: 'border-box',
            }}
            onMouseDown={(e) => {
              e.stopPropagation();
              e.preventDefault();
              onRotateStart(element.id, e);
            }}
          />
        </>
      )}
    </div>
  );
});

// Renders non-text element content
const ElementContent = memo(function ElementContent({
  element,
  activeFilterValues,
  onFilterClick,
  onFilterControlChange,
  onDrillDown,
}: {
  element: CanvasElement;
  activeFilterValues?: Set<string>;
  onFilterClick?: (event: ChartFilterEvent) => void;
  onFilterControlChange?: (elementId: string, field: string, values: string[], label: string) => void;
  onDrillDown?: (targetPageId: string, field: string, value: string) => void;
}) {
  switch (element.type) {
    case 'shape':
      return <ShapeContent element={element as ShapeElement} />;
    case 'image':
      return <ImageContent element={element as ImageElement} />;
    case 'chart':
      return <ChartContent element={element as ChartElement} activeFilterValues={activeFilterValues} onFilterClick={onFilterClick} onDrillDown={(element as ChartElement).drillDownPageId ? onDrillDown : undefined} />;
    case 'kpi':
      return <KPIContent element={element as KPIElement} />;
    case 'table': {
      const tableEl = element as TableElement;
      return <TableContent element={tableEl} activeFilterValues={activeFilterValues} onDrillDown={tableEl.drillDownPageId ? onDrillDown : undefined} drillDownPageId={tableEl.drillDownPageId} drillDownColumn={tableEl.drillDownColumn} drillDownField={tableEl.drillDownField} />;
    }
    case 'progress':
      return <ProgressContent element={element as ProgressElement} />;
    case 'embed':
      return <EmbedContent element={element as EmbedElement} />;
    case 'filterControl':
      return <FilterControlContent element={element as FilterControlElement} onFilterChange={onFilterControlChange} />;
    case 'line':
      return <LineContent element={element as LineElement} />;
    case 'group':
      return (
        <div style={{ position: 'relative', width: '100%', height: '100%' }}>
          <div style={{
            position: 'absolute',
            inset: 0,
            border: '1px dashed rgba(74, 144, 217, 0.3)',
            borderRadius: 4,
            pointerEvents: 'none',
          }} />
        </div>
      );
    default:
      return null;
  }
});

function TextContent({
  element,
  isEditing,
  onContentChange,
  onEditComplete,
}: {
  element: TextElement;
  isEditing: boolean;
  onContentChange?: (id: string, content: string) => void;
  onEditComplete?: () => void;
}) {
  const editorRef = useRef<HTMLDivElement>(null);
  const textColorStyle: React.CSSProperties = (() => {
    if (isSolidFill(element.fill)) {
      return { color: element.fill.color };
    }
    if (isLinearGradient(element.fill)) {
      const stops = element.fill.stops.map((s: { offset: number; color: string }) => `${s.color} ${s.offset * 100}%`).join(', ');
      return {
        background: `linear-gradient(${element.fill.angle}deg, ${stops})`,
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text',
      };
    }
    if (isRadialGradient(element.fill)) {
      const stops = element.fill.stops.map((s: { offset: number; color: string }) => `${s.color} ${s.offset * 100}%`).join(', ');
      return {
        background: `radial-gradient(circle at ${element.fill.centerX * 100}% ${element.fill.centerY * 100}%, ${stops})`,
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text',
      };
    }
    return { color: '#000000' };
  })();
  const hasHtml = useMemo(() => /<[a-z][\s\S]*>/i.test(element.content), [element.content]);

  // Focus when entering edit mode — place cursor at end instead of selecting all
  useEffect(() => {
    if (!isEditing || !editorRef.current) return;
    const el = editorRef.current;
    // Set initial HTML content
    el.innerHTML = element.content;
    el.focus();
    // Place cursor at end of content (not select all)
    const range = document.createRange();
    range.selectNodeContents(el);
    range.collapse(false); // collapse to end
    const sel = window.getSelection();
    sel?.removeAllRanges();
    sel?.addRange(range);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEditing]); // Only run when isEditing changes, not on every element update

  // Handle click-outside to complete editing
  useEffect(() => {
    if (!isEditing) return;
    const handleMouseDown = (e: MouseEvent) => {
      if (editorRef.current && !editorRef.current.contains(e.target as Node)) {
        const target = e.target as HTMLElement;
        if (target.closest('[data-text-toolbar]')) return;
        // Save HTML content before completing
        if (editorRef.current && onContentChange) {
          onContentChange(element.id, editorRef.current.innerHTML);
        }
        onEditComplete?.();
      }
    };
    document.addEventListener('mousedown', handleMouseDown, true);
    return () => document.removeEventListener('mousedown', handleMouseDown, true);
  }, [isEditing, element.id, onContentChange, onEditComplete]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      if (editorRef.current && onContentChange) {
        onContentChange(element.id, editorRef.current.innerHTML);
      }
      onEditComplete?.();
    }
    // Stop propagation so canvas keyboard shortcuts don't fire while editing
    e.stopPropagation();
  }, [element.id, onContentChange, onEditComplete]);

  // Save content on input (live sync)
  const handleInput = useCallback(() => {
    if (editorRef.current && onContentChange) {
      onContentChange(element.id, editorRef.current.innerHTML);
    }
  }, [element.id, onContentChange]);

  const baseStyle: React.CSSProperties = {
    width: '100%',
    height: '100%',
    fontFamily: element.fontFamily,
    fontSize: element.fontSize,
    fontWeight: element.fontWeight,
    fontStyle: element.fontStyle === 'italic' ? 'italic' : 'normal',
    textDecoration: element.textDecoration !== 'none' ? element.textDecoration : undefined,
    ...textColorStyle,
    textAlign: element.textAlign,
    lineHeight: element.lineHeight,
    letterSpacing: element.letterSpacing,
    padding: 8,
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
    overflow: 'visible',
    boxSizing: 'border-box',
    outline: 'none',
  };

  if (isEditing) {
    return (
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onKeyDown={handleKeyDown}
        onInput={handleInput}
        data-text-editor="true"
        style={{
          ...baseStyle,
          userSelect: 'text',
          cursor: 'text',
        }}
      />
    );
  }

  // Display mode: render content (may contain HTML from inline formatting)
  // Sanitize HTML to prevent XSS attacks
  return (
    <div
      style={{ ...baseStyle, userSelect: 'none' }}
      {...(hasHtml
        ? { dangerouslySetInnerHTML: { __html: DOMPurify.sanitize(element.content) } }
        : { children: element.content }
      )}
    />
  );
}

function getFillStyle(fill: ShapeElement['fill']): React.CSSProperties {
  if (isSolidFill(fill)) {
    return { backgroundColor: fill.color };
  }
  if (isLinearGradient(fill)) {
    const stops = fill.stops.map((s: { offset: number; color: string }) => `${s.color} ${s.offset * 100}%`).join(', ');
    return { background: `linear-gradient(${fill.angle}deg, ${stops})` };
  }
  if (isRadialGradient(fill)) {
    const stops = fill.stops.map((s: { offset: number; color: string }) => `${s.color} ${s.offset * 100}%`).join(', ');
    return { background: `radial-gradient(circle at ${fill.centerX * 100}% ${fill.centerY * 100}%, ${stops})` };
  }
  return { backgroundColor: '#cccccc' };
}

function SvgPolygonShape({ element, points }: { element: ShapeElement; points: string }) {
  const shadowStyle: React.CSSProperties = element.shadow
    ? { filter: `drop-shadow(${element.shadow.offsetX}px ${element.shadow.offsetY}px ${element.shadow.blur}px ${element.shadow.color})` }
    : {};
  const fillColor = isSolidFill(element.fill) ? element.fill.color : '#cccccc';
  const gradientId = `grad-${element.id}`;

  return (
    <svg width="100%" height="100%" viewBox={`0 0 ${element.width} ${element.height}`} style={{ display: 'block', ...shadowStyle }}>
      {isLinearGradient(element.fill) && (() => {
        const angle = (element.fill.angle * Math.PI) / 180;
        const x1 = 50 - 50 * Math.cos(angle);
        const y1 = 50 - 50 * Math.sin(angle);
        const x2 = 50 + 50 * Math.cos(angle);
        const y2 = 50 + 50 * Math.sin(angle);
        return (
          <defs>
            <linearGradient id={gradientId} x1={`${x1}%`} y1={`${y1}%`} x2={`${x2}%`} y2={`${y2}%`}>
              {element.fill.stops.map((s: { offset: number; color: string }, i: number) => (
                <stop key={i} offset={s.offset} stopColor={s.color} />
              ))}
            </linearGradient>
          </defs>
        );
      })()}
      {isRadialGradient(element.fill) && (() => {
        return (
          <defs>
            <radialGradient id={gradientId} cx={`${element.fill.centerX * 100}%`} cy={`${element.fill.centerY * 100}%`} r="50%">
              {element.fill.stops.map((s: { offset: number; color: string }, i: number) => (
                <stop key={i} offset={s.offset} stopColor={s.color} />
              ))}
            </radialGradient>
          </defs>
        );
      })()}
      <polygon
        points={points}
        fill={isSolidFill(element.fill) ? fillColor : `url(#${gradientId})`}
        stroke={element.stroke?.width ? element.stroke.color : 'none'}
        strokeWidth={element.stroke?.width ?? 0}
        strokeDasharray={element.stroke?.dashPattern?.length ? element.stroke.dashPattern.join(' ') : undefined}
      />
    </svg>
  );
}

function ShapeContent({ element }: { element: ShapeElement }) {
  const fillStyle = getFillStyle(element.fill);
  const strokeStyle: React.CSSProperties = element.stroke?.width
    ? {
        borderWidth: element.stroke.width,
        borderStyle: element.stroke.dashPattern?.length ? 'dashed' : 'solid',
        borderColor: element.stroke.color,
      }
    : {};
  const shadowStyle: React.CSSProperties = element.shadow
    ? {
        boxShadow: `${element.shadow.offsetX}px ${element.shadow.offsetY}px ${element.shadow.blur}px ${element.shadow.spread}px ${element.shadow.color}`,
      }
    : {};

  switch (element.shapeType) {
    case 'circle':
    case 'ellipse':
      return (
        <div
          style={{
            width: '100%',
            height: '100%',
            borderRadius: '50%',
            boxSizing: 'border-box',
            ...fillStyle,
            ...strokeStyle,
            ...shadowStyle,
          }}
        />
      );
    case 'triangle':
      return (
        <SvgPolygonShape
          element={element}
          points={`${element.width / 2},0 ${element.width},${element.height} 0,${element.height}`}
        />
      );
    case 'polygon': {
      const sides = element.sides ?? 6;
      const cx = element.width / 2;
      const cy = element.height / 2;
      const r = Math.min(cx, cy);
      const pts = Array.from({ length: sides }, (_, i) => {
        const angle = (i * 2 * Math.PI) / sides - Math.PI / 2;
        return `${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`;
      }).join(' ');
      return <SvgPolygonShape element={element} points={pts} />;
    }
    case 'star': {
      const numPoints = element.points ?? 5;
      const cx = element.width / 2;
      const cy = element.height / 2;
      const outerR = (element.outerRadius ?? 1) * Math.min(cx, cy);
      const innerR = (element.innerRadius ?? 0.4) * Math.min(cx, cy);
      const pts = Array.from({ length: numPoints * 2 }, (_, i) => {
        const angle = (i * Math.PI) / numPoints - Math.PI / 2;
        const r = i % 2 === 0 ? outerR : innerR;
        return `${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`;
      }).join(' ');
      return <SvgPolygonShape element={element} points={pts} />;
    }
    default: // rectangle
      return (
        <div
          style={{
            width: '100%',
            height: '100%',
            borderRadius: typeof element.cornerRadius === 'number'
              ? element.cornerRadius
              : Array.isArray(element.cornerRadius)
                ? element.cornerRadius.map((r: number) => `${r}px`).join(' ')
                : 0,
            boxSizing: 'border-box',
            ...fillStyle,
            ...strokeStyle,
            ...shadowStyle,
          }}
        />
      );
  }
}

function buildCurvePath(points: number[]): string {
  if (points.length < 4) return '';
  const [x1, y1, x2, y2] = points;
  const cx = (x1 + x2) / 2;
  const cy = Math.min(y1, y2) - Math.abs(x2 - x1) * 0.2;
  return `M ${x1} ${y1} Q ${cx} ${cy} ${x2} ${y2}`;
}

function LineContent({ element }: { element: LineElement }) {
  const { points, stroke, startArrow, endArrow, arrowSize = 10 } = element;

  const w = element.width || 1;
  const h = Math.max(1, element.height);

  return (
    <svg
      width="100%"
      height="100%"
      viewBox={`0 0 ${w} ${h}`}
      style={{ position: 'absolute', inset: 0, overflow: 'visible', minHeight: 1 }}
    >
      <defs>
        {endArrow && (
          <marker id={`arrow-end-${element.id}`} markerWidth={arrowSize} markerHeight={arrowSize}
            refX={arrowSize - 1} refY={arrowSize / 2} orient="auto">
            <polygon points={`0 0, ${arrowSize} ${arrowSize / 2}, 0 ${arrowSize}`} fill={stroke.color} />
          </marker>
        )}
        {startArrow && (
          <marker id={`arrow-start-${element.id}`} markerWidth={arrowSize} markerHeight={arrowSize}
            refX="1" refY={arrowSize / 2} orient="auto-start-reverse">
            <polygon points={`0 0, ${arrowSize} ${arrowSize / 2}, 0 ${arrowSize}`} fill={stroke.color} />
          </marker>
        )}
      </defs>
      {element.lineType === 'curved' && points.length >= 4 ? (
        <path
          d={buildCurvePath(points)}
          stroke={stroke.color}
          strokeWidth={stroke.width}
          strokeDasharray={stroke.dashPattern?.join(' ') || undefined}
          fill="none"
          markerEnd={endArrow ? `url(#arrow-end-${element.id})` : undefined}
          markerStart={startArrow ? `url(#arrow-start-${element.id})` : undefined}
        />
      ) : (
        <line
          x1={points[0] ?? 0} y1={points[1] ?? 0}
          x2={points[2] ?? w} y2={points[3] ?? h}
          stroke={stroke.color}
          strokeWidth={stroke.width}
          strokeDasharray={stroke.dashPattern?.join(' ') || undefined}
          strokeLinecap="round"
          markerEnd={endArrow ? `url(#arrow-end-${element.id})` : undefined}
          markerStart={startArrow ? `url(#arrow-start-${element.id})` : undefined}
        />
      )}
    </svg>
  );
}

function ImageContent({ element }: { element: ImageElement }) {
  if (!element.src) return null;

  const filterParts: string[] = [];
  if (element.filters.brightness !== 0) filterParts.push(`brightness(${1 + element.filters.brightness / 100})`);
  if (element.filters.contrast !== 0) filterParts.push(`contrast(${1 + element.filters.contrast / 100})`);
  if (element.filters.saturation !== 0) filterParts.push(`saturate(${1 + element.filters.saturation / 100})`);
  if (element.filters.hueRotation !== 0) filterParts.push(`hue-rotate(${element.filters.hueRotation}deg)`);
  if (element.filters.blur > 0) filterParts.push(`blur(${element.filters.blur}px)`);

  return (
    <img
      src={element.src}
      crossOrigin="anonymous"
      draggable={false}
      alt=""
      style={{
        width: '100%',
        height: '100%',
        objectFit: 'fill',
        filter: filterParts.length > 0 ? filterParts.join(' ') : undefined,
        display: 'block',
        userSelect: 'none',
        pointerEvents: 'none',
      }}
    />
  );
}
