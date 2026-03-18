import React from 'react';
import { usePages, useElements, useSelection } from '@reactcanvas/react';

export function Sidebar() {
  const { pages, activePageId, setActivePage, addPage, removePage, duplicatePage } = usePages();
  const { elements } = useElements();
  const { selectedElementIds, select } = useSelection();

  return (
    <div style={styles.container}>
      {/* Pages */}
      <div style={styles.section}>
        <div style={styles.sectionHeader}>
          <span style={styles.sectionLabel}>Pages</span>
          <button
            style={styles.addBtn}
            onClick={() => addPage({ name: `Page ${pages.length + 1}` })}
            title="Add Page"
          >
            +
          </button>
        </div>
        <div style={styles.list}>
          {pages.map((page, index) => (
            <div
              key={page.id}
              style={{
                ...styles.pageItem,
                ...(page.id === activePageId ? styles.pageItemActive : {}),
              }}
              onClick={() => setActivePage(page.id)}
            >
              <div style={{ ...styles.thumb, backgroundColor: page.backgroundColor }}>
                <span style={styles.thumbNum}>{index + 1}</span>
              </div>
              <div style={styles.pageInfo}>
                <span style={styles.pageName}>{page.name}</span>
                <span style={styles.pageDim}>{page.width} x {page.height}</span>
              </div>
              {pages.length > 1 && (
                <div style={styles.actions}>
                  <button
                    style={styles.actionBtn}
                    onClick={(e) => { e.stopPropagation(); duplicatePage(page.id); }}
                    title="Duplicate"
                  >{'\u2398'}</button>
                  <button
                    style={styles.actionBtn}
                    onClick={(e) => { e.stopPropagation(); removePage(page.id); }}
                    title="Delete"
                  >{'\u2715'}</button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Layers */}
      <div style={styles.section}>
        <div style={styles.sectionHeader}>
          <span style={styles.sectionLabel}>Layers</span>
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
                  {getElementIcon(element.type)}
                </span>
                <span style={styles.layerName}>{element.name}</span>
                {element.locked && <span style={styles.statusIcon}>{'\uD83D\uDD12'}</span>}
                {!element.visible && <span style={styles.statusIcon}>{'\uD83D\uDC41'}</span>}
              </div>
            ))}
          {elements.length === 0 && (
            <div style={styles.empty}>No elements yet</div>
          )}
        </div>
      </div>
    </div>
  );
}

function getElementIcon(type: string): string {
  switch (type) {
    case 'shape': return '\u25A0';
    case 'text': return 'T';
    case 'image': return '\uD83D\uDCF7';
    case 'chart': return '\uD83D\uDCCA';
    case 'kpi': return '#';
    case 'table': return '\u2630';
    case 'progress': return '\u25CB';
    case 'embed': return '\uD83C\uDF10';
    default: return '\u25A0';
  }
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    overflow: 'hidden',
  },
  section: {
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  sectionHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '10px 14px 8px',
    flexShrink: 0,
  },
  sectionLabel: {
    color: '#868e96',
    fontSize: 10,
    fontWeight: 700,
    textTransform: 'uppercase' as const,
    letterSpacing: '1px',
  },
  addBtn: {
    width: 22,
    height: 22,
    border: 'none',
    borderRadius: 6,
    backgroundColor: '#f8f9fa',
    color: '#495057',
    cursor: 'pointer',
    fontSize: 13,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'background-color 0.12s',
  },
  list: {
    flex: '0 0 auto',
    maxHeight: 280,
    overflow: 'auto',
    padding: '0 10px 10px',
  },
  pageItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '8px 10px',
    borderRadius: 8,
    cursor: 'pointer',
    marginBottom: 2,
    transition: 'background-color 0.12s',
  },
  pageItemActive: {
    backgroundColor: '#f8f9fa',
  },
  thumb: {
    width: 44,
    height: 32,
    borderRadius: 6,
    border: '1px solid #dee2e6',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  thumbNum: {
    color: '#868e96',
    fontSize: 11,
    fontWeight: 700,
  },
  pageInfo: {
    flex: 1,
    minWidth: 0,
  },
  pageName: {
    display: 'block',
    color: '#212529',
    fontSize: 12,
    fontWeight: 500,
    whiteSpace: 'nowrap' as const,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  pageDim: {
    display: 'block',
    color: '#868e96',
    fontSize: 10,
    marginTop: 1,
  },
  actions: {
    display: 'flex',
    gap: 2,
  },
  actionBtn: {
    width: 22,
    height: 22,
    border: 'none',
    borderRadius: 5,
    backgroundColor: 'transparent',
    color: '#868e96',
    cursor: 'pointer',
    fontSize: 11,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'color 0.12s',
  },
  layerList: {
    flex: 1,
    overflow: 'auto',
    padding: '0 10px 10px',
  },
  layerItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '6px 10px',
    borderRadius: 6,
    cursor: 'pointer',
    marginBottom: 1,
    transition: 'background-color 0.12s',
  },
  layerItemActive: {
    backgroundColor: '#f8f9fa',
  },
  layerIcon: {
    color: '#868e96',
    fontSize: 13,
    width: 18,
    textAlign: 'center' as const,
    flexShrink: 0,
  },
  layerName: {
    flex: 1,
    color: '#495057',
    fontSize: 12,
    whiteSpace: 'nowrap' as const,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  statusIcon: {
    color: '#868e96',
    fontSize: 11,
  },
  empty: {
    color: '#868e96',
    fontSize: 12,
    textAlign: 'center' as const,
    padding: '24px 0',
  },
};
