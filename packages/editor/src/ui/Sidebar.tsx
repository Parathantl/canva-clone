import React from 'react';
import { usePages, useElements, useSelection, useEditorStore } from '@reactcanvas/react';
import { createPage } from '@reactcanvas/core';

export function Sidebar() {
  const { pages, activePageId, setActivePage, addPage, removePage, duplicatePage } = usePages();
  const { elements } = useElements();
  const { selectedElementIds, select, deselectAll } = useSelection();

  return (
    <div style={styles.sidebar}>
      {/* Pages section */}
      <div style={styles.sectionHeader}>
        <span style={styles.sectionTitle}>Pages</span>
        <button
          style={styles.addButton}
          onClick={() => addPage({ name: `Page ${pages.length + 1}` })}
          title="Add Page"
        >
          +
        </button>
      </div>

      <div style={styles.pageList}>
        {pages.map((page, index) => (
          <div
            key={page.id}
            style={{
              ...styles.pageItem,
              ...(page.id === activePageId ? styles.pageItemActive : {}),
            }}
            onClick={() => setActivePage(page.id)}
          >
            <div style={styles.pageThumbnail}>
              <div
                style={{
                  ...styles.pageThumbnailInner,
                  backgroundColor: page.backgroundColor,
                }}
              >
                <span style={styles.pageNumber}>{index + 1}</span>
              </div>
            </div>
            <div style={styles.pageInfo}>
              <span style={styles.pageName}>{page.name}</span>
              <span style={styles.pageDimensions}>
                {page.width} x {page.height}
              </span>
            </div>
            {pages.length > 1 && (
              <div style={styles.pageActions}>
                <button
                  style={styles.smallButton}
                  onClick={(e) => {
                    e.stopPropagation();
                    duplicatePage(page.id);
                  }}
                  title="Duplicate"
                >
                  &#10697;
                </button>
                <button
                  style={styles.smallButton}
                  onClick={(e) => {
                    e.stopPropagation();
                    removePage(page.id);
                  }}
                  title="Delete"
                >
                  &#10005;
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Layers section */}
      <div style={styles.sectionHeader}>
        <span style={styles.sectionTitle}>Layers</span>
      </div>

      <div style={styles.layerList}>
        {[...elements]
          .sort((a, b) => b.layerOrder - a.layerOrder)
          .map((element) => (
            <div
              key={element.id}
              style={{
                ...styles.layerItem,
                ...(selectedElementIds.includes(element.id) ? styles.layerItemActive : {}),
              }}
              onClick={() => select(element.id)}
            >
              <span style={styles.layerIcon}>
                {element.type === 'shape' ? '&#9632;' : element.type === 'text' ? 'T' : '&#128247;'}
              </span>
              <span style={styles.layerName}>{element.name}</span>
              {element.locked && <span style={styles.lockIcon}>&#128274;</span>}
              {!element.visible && <span style={styles.lockIcon}>&#128065;</span>}
            </div>
          ))}
        {elements.length === 0 && (
          <div style={styles.emptyState}>No elements yet</div>
        )}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  sidebar: {
    width: 240,
    backgroundColor: '#1e1e2e',
    borderRight: '1px solid #313244',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    height: '100%',
  },
  sectionHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '12px 16px 8px',
    borderBottom: '1px solid #313244',
  },
  sectionTitle: {
    color: '#a6adc8',
    fontSize: 11,
    fontWeight: 600,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px',
  },
  addButton: {
    width: 24,
    height: 24,
    border: 'none',
    borderRadius: 4,
    backgroundColor: '#45475a',
    color: '#cdd6f4',
    cursor: 'pointer',
    fontSize: 14,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pageList: {
    flex: '0 0 auto',
    maxHeight: 300,
    overflow: 'auto',
    padding: '8px',
  },
  pageItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '8px',
    borderRadius: 6,
    cursor: 'pointer',
    marginBottom: 4,
    transition: 'background-color 0.15s',
  },
  pageItemActive: {
    backgroundColor: '#313244',
  },
  pageThumbnail: {
    width: 48,
    height: 36,
    borderRadius: 4,
    overflow: 'hidden',
    border: '1px solid #45475a',
    flexShrink: 0,
  },
  pageThumbnailInner: {
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pageNumber: {
    color: '#6c7086',
    fontSize: 12,
    fontWeight: 600,
  },
  pageInfo: {
    flex: 1,
    minWidth: 0,
  },
  pageName: {
    display: 'block',
    color: '#cdd6f4',
    fontSize: 13,
    whiteSpace: 'nowrap' as const,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  pageDimensions: {
    display: 'block',
    color: '#6c7086',
    fontSize: 10,
  },
  pageActions: {
    display: 'flex',
    gap: 2,
  },
  smallButton: {
    width: 22,
    height: 22,
    border: 'none',
    borderRadius: 3,
    backgroundColor: 'transparent',
    color: '#6c7086',
    cursor: 'pointer',
    fontSize: 11,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  layerList: {
    flex: 1,
    overflow: 'auto',
    padding: '8px',
  },
  layerItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '6px 8px',
    borderRadius: 4,
    cursor: 'pointer',
    marginBottom: 2,
  },
  layerItemActive: {
    backgroundColor: '#313244',
  },
  layerIcon: {
    color: '#6c7086',
    fontSize: 14,
    width: 20,
    textAlign: 'center' as const,
  },
  layerName: {
    flex: 1,
    color: '#cdd6f4',
    fontSize: 12,
    whiteSpace: 'nowrap' as const,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  lockIcon: {
    color: '#6c7086',
    fontSize: 12,
  },
  emptyState: {
    color: '#6c7086',
    fontSize: 12,
    textAlign: 'center' as const,
    padding: '24px 0',
  },
};
