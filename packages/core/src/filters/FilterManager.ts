import { nanoid } from 'nanoid';
import type { DashboardFilter } from '../types/document';

type FilterListener = (filters: DashboardFilter[]) => void;

/**
 * FilterManager — manages cross-widget dashboard filters.
 *
 * When a user clicks a bar/slice/row in one widget, a filter is created.
 * Other widgets on the same page react by filtering their displayed data.
 *
 * Filters are per-page and stack (multiple filters can be active).
 * Clicking the same value again removes the filter (toggle behavior).
 */
export class FilterManager {
  private filters: DashboardFilter[] = [];
  private listeners = new Set<FilterListener>();

  /** Get all active filters */
  getFilters(): DashboardFilter[] {
    return [...this.filters];
  }

  /** Get filters for a specific page */
  getPageFilters(pageId: string): DashboardFilter[] {
    return this.filters.filter((f) => f.pageId === pageId);
  }

  /**
   * Toggle a filter. If the same field+value from the same source exists, remove it.
   * Otherwise add it. This gives click-to-filter, click-again-to-clear behavior.
   */
  toggleFilter(filter: Omit<DashboardFilter, 'id'>): void {
    const existing = this.filters.find(
      (f) =>
        f.sourceElementId === filter.sourceElementId &&
        f.field === filter.field &&
        f.value === filter.value
    );

    if (existing) {
      this.filters = this.filters.filter((f) => f.id !== existing.id);
    } else {
      this.filters.push({
        ...filter,
        id: nanoid(),
      });
    }

    this.notify();
  }

  /** Add a filter (does not toggle — always adds) */
  addFilter(filter: Omit<DashboardFilter, 'id'>): void {
    // Remove existing filter from same source on same field (replace behavior)
    this.filters = this.filters.filter(
      (f) => !(f.sourceElementId === filter.sourceElementId && f.field === filter.field)
    );

    this.filters.push({
      ...filter,
      id: `filter-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    });

    this.notify();
  }

  /** Remove a specific filter by ID */
  removeFilter(filterId: string): void {
    this.filters = this.filters.filter((f) => f.id !== filterId);
    this.notify();
  }

  /** Remove all filters from a specific source element */
  removeSourceFilters(sourceElementId: string): void {
    this.filters = this.filters.filter((f) => f.sourceElementId !== sourceElementId);
    this.notify();
  }

  /** Clear all filters on a page */
  clearPageFilters(pageId: string): void {
    this.filters = this.filters.filter((f) => f.pageId !== pageId);
    this.notify();
  }

  /** Clear all filters */
  clearAll(): void {
    this.filters = [];
    this.notify();
  }

  /** Subscribe to filter changes */
  subscribe(listener: FilterListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * Apply filters to a data array. Returns only rows that match ALL active
   * filters for the given page (AND logic).
   */
  applyFilters<T extends Record<string, any>>(
    data: T[],
    pageId: string,
    /** Map of filter fields to data fields (if different) */
    fieldMap?: Record<string, string>,
  ): T[] {
    const pageFilters = this.getPageFilters(pageId);
    if (pageFilters.length === 0) return data;

    return data.filter((row) => {
      return pageFilters.every((filter) => {
        const dataField = fieldMap?.[filter.field] || filter.field;
        const rowValue = String(row[dataField] ?? '');
        return rowValue === filter.value;
      });
    });
  }

  /**
   * Check if a specific value is currently filtered (for highlighting).
   */
  isValueFiltered(pageId: string, field: string, value: string): boolean {
    return this.filters.some(
      (f) => f.pageId === pageId && f.field === field && f.value === value
    );
  }

  /**
   * Check if any filter is active for a page.
   */
  hasActiveFilters(pageId: string): boolean {
    return this.filters.some((f) => f.pageId === pageId);
  }

  private notify(): void {
    const snapshot = [...this.filters];
    for (const listener of this.listeners) {
      try {
        listener(snapshot);
      } catch {
        // Don't let listener errors break the manager
      }
    }
  }

  destroy(): void {
    this.filters = [];
    this.listeners.clear();
  }
}
