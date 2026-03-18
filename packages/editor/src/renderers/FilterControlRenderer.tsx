import React, { memo, useCallback } from 'react';
import type { FilterControlElement } from '@reactcanvas/core';

export interface FilterControlProps {
  element: FilterControlElement;
  onFilterChange?: (elementId: string, field: string, values: string[], label: string) => void;
}

export const FilterControlContent = memo(function FilterControlContent({
  element,
  onFilterChange,
}: FilterControlProps) {
  const {
    controlType, filterField, label, options, selectedValues,
    dateStart, dateEnd, placeholder, backgroundColor, borderRadius,
  } = element;

  const handleDropdownChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    const newValues = value === '' ? [] : [value];
    onFilterChange?.(element.id, filterField, newValues, value ? `${label}: ${value}` : '');
  }, [element.id, filterField, label, onFilterChange]);

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.trim();
    onFilterChange?.(element.id, filterField, value ? [value] : [], value ? `${label}: "${value}"` : '');
  }, [element.id, filterField, label, onFilterChange]);

  const handleDateChange = useCallback((type: 'start' | 'end', value: string) => {
    const start = type === 'start' ? value : (dateStart || '');
    const end = type === 'end' ? value : (dateEnd || '');
    const values = start || end ? [`${start}..${end}`] : [];
    const displayLabel = start && end
      ? `${label}: ${start} to ${end}`
      : start ? `${label}: from ${start}` : end ? `${label}: to ${end}` : '';
    onFilterChange?.(element.id, filterField, values, displayLabel);
  }, [element.id, filterField, label, dateStart, dateEnd, onFilterChange]);

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        backgroundColor,
        borderRadius,
        padding: '8px 12px',
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        fontFamily: 'Inter, -apple-system, sans-serif',
        border: '1px solid #dee2e6',
        boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
      }}
    >
      {label && (
        <div style={styles.label}>{label}</div>
      )}

      {controlType === 'dropdown' && (
        <select
          value={selectedValues[0] || ''}
          onChange={handleDropdownChange}
          style={styles.select}
        >
          <option value="">{placeholder || 'All'}</option>
          {options.map((opt) => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      )}

      {controlType === 'search' && (
        <input
          type="text"
          value={selectedValues[0] || ''}
          onChange={handleSearchChange}
          placeholder={placeholder || 'Search...'}
          style={styles.input}
        />
      )}

      {controlType === 'dateRange' && (
        <div style={styles.dateRow}>
          <input
            type="date"
            value={dateStart || ''}
            onChange={(e) => handleDateChange('start', e.target.value)}
            style={styles.dateInput}
          />
          <span style={styles.dateSep}>to</span>
          <input
            type="date"
            value={dateEnd || ''}
            onChange={(e) => handleDateChange('end', e.target.value)}
            style={styles.dateInput}
          />
        </div>
      )}
    </div>
  );
});

const styles: Record<string, React.CSSProperties> = {
  label: {
    fontSize: 10,
    fontWeight: 600,
    color: '#6c757d',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  select: {
    width: '100%',
    height: 30,
    border: '1px solid #dee2e6',
    borderRadius: 6,
    backgroundColor: '#f8f9fa',
    color: '#212529',
    fontSize: 12,
    padding: '0 8px',
    outline: 'none',
    cursor: 'pointer',
  },
  input: {
    width: '100%',
    height: 30,
    border: '1px solid #dee2e6',
    borderRadius: 6,
    backgroundColor: '#f8f9fa',
    color: '#212529',
    fontSize: 12,
    padding: '0 10px',
    outline: 'none',
    boxSizing: 'border-box',
  },
  dateRow: {
    display: 'flex',
    gap: 6,
    alignItems: 'center',
  },
  dateInput: {
    flex: 1,
    height: 28,
    border: '1px solid #dee2e6',
    borderRadius: 6,
    backgroundColor: '#f8f9fa',
    color: '#212529',
    fontSize: 11,
    padding: '0 6px',
    outline: 'none',
  },
  dateSep: {
    fontSize: 11,
    color: '#868e96',
    flexShrink: 0,
  },
};
