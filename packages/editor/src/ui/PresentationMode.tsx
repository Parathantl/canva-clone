import React, { useEffect, useCallback, useState, useMemo } from 'react';
import type { Page } from '@reactcanvas/core';
import { usePages } from '@reactcanvas/react';
import { DOMElementRenderer } from '../renderers/DOMElementRenderer';

export interface PresentationModeProps {
  isOpen: boolean;
  onClose: () => void;
}

const noop = () => {};

export function PresentationMode({ isOpen, onClose }: PresentationModeProps) {
  const { pages } = usePages();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [viewportSize, setViewportSize] = useState({ w: window.innerWidth, h: window.innerHeight });

  const page = pages[currentIndex] as Page | undefined;
  const totalPages = pages.length;

  // Reset to first page when opening
  useEffect(() => {
    if (isOpen) setCurrentIndex(0);
  }, [isOpen]);

  // Track viewport size so scaling updates on resize / fullscreen
  useEffect(() => {
    if (!isOpen) return;
    const handleResize = () => setViewportSize({ w: window.innerWidth, h: window.innerHeight });
    // Re-measure after a tick to catch fullscreen transition
    const timer = setTimeout(handleResize, 100);
    window.addEventListener('resize', handleResize);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', handleResize);
    };
  }, [isOpen]);

  const goNext = useCallback(() => {
    setCurrentIndex((i) => Math.min(i + 1, totalPages - 1));
  }, [totalPages]);

  const goPrev = useCallback(() => {
    setCurrentIndex((i) => Math.max(i - 1, 0));
  }, []);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { onClose(); return; }
      if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'Enter') { e.preventDefault(); goNext(); }
      if (e.key === 'ArrowLeft' || e.key === 'Backspace') { e.preventDefault(); goPrev(); }
      if (e.key === 'Home') { setCurrentIndex(0); }
      if (e.key === 'End') { setCurrentIndex(totalPages - 1); }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, goNext, goPrev, totalPages]);

  // Request fullscreen
  useEffect(() => {
    if (!isOpen) return;
    document.documentElement.requestFullscreen?.().catch(() => {});
    return () => {
      if (document.fullscreenElement) {
        document.exitFullscreen?.().catch(() => {});
      }
    };
  }, [isOpen]);

  // Compute content bounding box and scale
  const presentation = useMemo(() => {
    if (!page) return null;
    const els = page.elements;
    if (els.length === 0) {
      // No elements: show the full page
      return { contentX: 0, contentY: 0, contentW: page.width, contentH: page.height };
    }
    // Compute bounding box of all elements
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const el of els) {
      minX = Math.min(minX, el.x);
      minY = Math.min(minY, el.y);
      maxX = Math.max(maxX, el.x + el.width);
      maxY = Math.max(maxY, el.y + (el.height ?? 40));
    }
    // Add padding around content
    const pad = 40;
    return {
      contentX: Math.max(0, minX - pad),
      contentY: Math.max(0, minY - pad),
      contentW: Math.min(page.width, maxX + pad) - Math.max(0, minX - pad),
      contentH: Math.min(page.height, maxY + pad) - Math.max(0, minY - pad),
    };
  }, [page]);

  if (!isOpen || !page || !presentation) return null;

  const sortedElements = [...page.elements].sort((a, b) => a.layerOrder - b.layerOrder);
  const pageWidth = page.width ?? 1920;
  const pageHeight = page.height ?? 1080;

  // Available space (leave room for nav bar)
  const navBarHeight = 70;
  const availW = viewportSize.w;
  const availH = viewportSize.h - navBarHeight;

  // Scale to fit content bounding box into available space
  const scaleX = availW / presentation.contentW;
  const scaleY = availH / presentation.contentH;
  const scale = Math.min(scaleX, scaleY, 2); // cap at 2x to avoid pixel artifacts

  // The visible area in page coordinates
  const visibleW = availW / scale;
  const visibleH = availH / scale;

  // Center the content bounding box within the visible area
  const offsetX = -(presentation.contentX - (visibleW - presentation.contentW) / 2);
  const offsetY = -(presentation.contentY - (visibleH - presentation.contentH) / 2);

  return (
    <div style={styles.overlay} onClick={goNext}>
      {/* Scaled page — using same approach as EditorCanvas */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: availW,
          height: availH,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            width: pageWidth,
            height: pageHeight,
            transform: `scale(${scale}) translate(${offsetX}px, ${offsetY}px)`,
            transformOrigin: '0 0',
            backgroundColor: page.backgroundColor ?? '#ffffff',
          }}
        >
          {sortedElements.map((element) => (
            <DOMElementRenderer
              key={element.id}
              element={element}
              isSelected={false}
              isEditing={false}
              zoom={1}
              onSelect={noop}
              onDragStart={noop}
              onResizeStart={noop}
              onRotateStart={noop}
              onDblClick={noop}
              onAutoResize={noop}
              onTextContentChange={noop}
              onTextEditComplete={noop}
            />
          ))}
        </div>
      </div>

      {/* Navigation bar */}
      <div style={styles.nav} onClick={(e) => e.stopPropagation()}>
        <button style={styles.navBtn} onClick={goPrev} disabled={currentIndex === 0}>
          {'\u2190'}
        </button>
        <span style={styles.navLabel}>
          {currentIndex + 1} / {totalPages}
        </span>
        <button style={styles.navBtn} onClick={goNext} disabled={currentIndex === totalPages - 1}>
          {'\u2192'}
        </button>
        <button style={styles.closeBtn} onClick={onClose}>
          {'\u2715'} Exit
        </button>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'fixed',
    inset: 0,
    zIndex: 10000,
    backgroundColor: '#000',
    cursor: 'pointer',
  },
  nav: {
    position: 'fixed',
    bottom: 20,
    left: '50%',
    transform: 'translateX(-50%)',
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(22,22,30,0.9)',
    borderRadius: 12,
    padding: '8px 16px',
    backdropFilter: 'blur(8px)',
    zIndex: 10001,
  },
  navBtn: {
    width: 36,
    height: 36,
    border: 'none',
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.1)',
    color: '#cdd6f4',
    fontSize: 16,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  navLabel: {
    color: '#cdd6f4',
    fontSize: 14,
    fontWeight: 600,
    minWidth: 60,
    textAlign: 'center' as const,
  },
  closeBtn: {
    height: 36,
    padding: '0 16px',
    border: 'none',
    borderRadius: 8,
    backgroundColor: 'rgba(232,89,109,0.2)',
    color: '#E8596D',
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
    marginLeft: 8,
  },
};
