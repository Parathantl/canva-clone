import React from 'react';
import type { DashboardFilter } from '@reactcanvas/core';

interface FilterBarProps {
  filters: DashboardFilter[];
  onRemoveFilter: (filterId: string) => void;
  onClearAll: () => void;
}

/**
 * Displays active cross-widget filter pills above the canvas.
 * Each pill shows the filter value with an X to remove it.
 */
export function FilterBar({ filters, onRemoveFilter, onClearAll }: FilterBarProps) {
  if (filters.length === 0) return null;

  return (
    <div style={styles.container}>
      <div style={styles.label}>Filters:</div>
      <div style={styles.pills}>
        {filters.map((f) => (
          <div key={f.id} style={styles.pill}>
            <span style={styles.pillText}>{f.label}</span>
            <button
              onClick={(e) => { e.stopPropagation(); onRemoveFilter(f.id); }}
              style={styles.pillClose}
              title="Remove filter"
            >
              x
            </button>
          </div>
        ))}
      </div>
      <button onClick={onClearAll} style={styles.clearBtn}>
        Clear all
      </button>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '6px 16px',
    backgroundColor: '#fffbeb',
    borderBottom: '1px solid #fde68a',
    flexShrink: 0,
    minHeight: 36,
    flexWrap: 'wrap',
  },
  label: {
    fontSize: 11,
    fontWeight: 600,
    color: '#92400e',
    flexShrink: 0,
  },
  pills: {
    display: 'flex',
    gap: 6,
    flexWrap: 'wrap',
    flex: 1,
  },
  pill: {
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    padding: '3px 8px 3px 10px',
    backgroundColor: '#fef3c7',
    border: '1px solid #fde68a',
    borderRadius: 20,
  },
  pillText: {
    fontSize: 11,
    fontWeight: 500,
    color: '#78350f',
    maxWidth: 200,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  pillClose: {
    width: 16,
    height: 16,
    border: 'none',
    borderRadius: '50%',
    backgroundColor: 'rgba(120,53,15,0.15)',
    color: '#92400e',
    fontSize: 10,
    fontWeight: 700,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 0,
    lineHeight: 1,
  },
  clearBtn: {
    border: 'none',
    backgroundColor: 'transparent',
    color: '#92400e',
    fontSize: 11,
    fontWeight: 600,
    cursor: 'pointer',
    textDecoration: 'underline',
    flexShrink: 0,
    padding: '2px 4px',
  },
};
