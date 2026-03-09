import React, { useEffect, useCallback, useState } from 'react';
import type { Page } from '@reactcanvas/core';
import { usePages } from '@reactcanvas/react';
import { DOMElementRenderer } from '../renderers/DOMElementRenderer';

export interface PresentationModeProps {
  isOpen: boolean;
  onClose: () => void;
}

export function PresentationMode({ isOpen, onClose }: PresentationModeProps) {
  const { pages } = usePages();
  const [currentIndex, setCurrentIndex] = useState(0);

  const page = pages[currentIndex] as Page | undefined;
  const totalPages = pages.length;

  // Reset to first page when opening
  useEffect(() => {
    if (isOpen) setCurrentIndex(0);
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

  if (!isOpen || !page) return null;

  const sortedElements = [...page.elements].sort((a, b) => a.layerOrder - b.layerOrder);
  const pageWidth = page.width ?? 1920;
  const pageHeight = page.height ?? 1080;

  return (
    <div style={styles.overlay} onClick={goNext}>
      {/* Scaled page */}
      <div style={styles.container}>
        <div
          style={{
            position: 'relative',
            width: pageWidth,
            height: pageHeight,
            backgroundColor: page.backgroundColor ?? '#ffffff',
            transform: `scale(${Math.min(window.innerWidth / pageWidth, window.innerHeight / pageHeight)})`,
            transformOrigin: 'center center',
          }}
        >
          {sortedElements.map((element) => (
            <DOMElementRenderer
              key={element.id}
              element={element}
              isSelected={false}
              isEditing={false}
              zoom={1}
              onSelect={() => {}}
              onDragStart={() => {}}
              onResizeStart={() => {}}
              onRotateStart={() => {}}
              onDblClick={() => {}}
              onAutoResize={() => {}}
              onTextContentChange={() => {}}
              onTextEditComplete={() => {}}
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
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
  },
  container: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: '100%',
  },
  nav: {
    position: 'fixed',
    bottom: 24,
    left: '50%',
    transform: 'translateX(-50%)',
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(22,22,30,0.9)',
    borderRadius: 12,
    padding: '8px 16px',
    backdropFilter: 'blur(8px)',
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
