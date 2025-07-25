import type { Filter } from '../hooks/useExplorer';

/**
 * Type guard to check if filter is a simple filter
 */
function isSimpleFilter(filter: Filter): filter is { field: string; op: "eq" | "neq" | "gt" | "lt" | "contains" | "in"; value: any } {
  return 'field' in filter && 'op' in filter && 'value' in filter;
}

/**
 * Evaluates a filter against a data row
 * Returns true if the row passes the filter
 */
export function evaluateFilter(row: any, filter: Filter): boolean {
  if ('op' in filter && (filter.op === 'and' || filter.op === 'or')) {
    // Compound filter
    const results = filter.filters.map((f) => evaluateFilter(row, f));
    return filter.op === 'and' 
      ? results.every(Boolean) 
      : results.some(Boolean);
  }
  
  // Simple filter
  if (!isSimpleFilter(filter)) return true;
  
  const value = getNestedValue(row, filter.field);
  const filterValue = filter.value;
  
  switch (filter.op) {
    case 'eq':
      return value === filterValue;
    case 'neq':
      return value !== filterValue;
    case 'gt':
      return Number(value) > Number(filterValue);
    case 'lt':
      return Number(value) < Number(filterValue);
    case 'contains':
      return String(value).toLowerCase().includes(String(filterValue).toLowerCase());
    case 'in':
      return Array.isArray(filterValue) && filterValue.includes(value);
    default:
      return true;
  }
}

/**
 * Evaluates multiple filters against a row (AND by default)
 */
export function evaluateFilters(row: any, filters: Filter[]): boolean {
  return filters.every((filter) => evaluateFilter(row, filter));
}

/**
 * Gets a nested value from an object using dot notation
 * e.g., getNestedValue({a: {b: 1}}, 'a.b') => 1
 */
function getNestedValue(obj: any, path: string): any {
  return path.split('.').reduce((current, key) => current?.[key], obj);
}

/**
 * Helper to create common filters
 */
export const FilterHelpers = {
  eq: (field: string, value: any): Filter => ({ field, op: 'eq', value }),
  neq: (field: string, value: any): Filter => ({ field, op: 'neq', value }),
  gt: (field: string, value: any): Filter => ({ field, op: 'gt', value }),
  lt: (field: string, value: any): Filter => ({ field, op: 'lt', value }),
  contains: (field: string, value: any): Filter => ({ field, op: 'contains', value }),
  in: (field: string, value: any[]): Filter => ({ field, op: 'in', value }),
  and: (...filters: Filter[]): Filter => ({ op: 'and', filters }),
  or: (...filters: Filter[]): Filter => ({ op: 'or', filters }),
};

/**
 * Format filter for display in UI
 */
export function formatFilter(filter: Filter): string {
  if ('op' in filter && (filter.op === 'and' || filter.op === 'or')) {
    const parts = filter.filters.map(formatFilter);
    return `(${parts.join(` ${filter.op.toUpperCase()} `)})`;
  }
  
  if (!isSimpleFilter(filter)) return '';
  
  const opDisplay: Record<string, string> = {
    eq: '=',
    neq: '≠',
    gt: '>',
    lt: '<',
    contains: 'contains',
    in: 'in',
  };
  
  return `${filter.field} ${opDisplay[filter.op]} ${JSON.stringify(filter.value)}`;
} 