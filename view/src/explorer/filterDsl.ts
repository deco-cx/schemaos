/*───────────────────────────────────────────────────────────────────────────┐
  ★ Filter DSL - Types and Evaluation Logic
 └───────────────────────────────────────────────────────────────────────────*/

export type FilterOperator = "eq" | "neq" | "gt" | "lt" | "gte" | "lte" | "contains" | "in" | "startsWith" | "endsWith";

export type Filter =
  | { field: string; op: FilterOperator; value: any }
  | { op: "and" | "or"; filters: Filter[] };

export interface ExplorerQuery {
  entityId: string;           // binding.id e.g. "shopify.orders"
  filters: Filter[];          // AND by default; optional nested ops
}

/**
 * Evaluates a filter against a data row
 */
export function evaluateFilter(row: any, filter: Filter): boolean {
  if ('filters' in filter) {
    // Logical operator
    if (filter.op === 'and') {
      return filter.filters.every(f => evaluateFilter(row, f));
    } else {
      return filter.filters.some(f => evaluateFilter(row, f));
    }
  }

  // Field comparison
  const value = getNestedValue(row, filter.field);
  const compareValue = filter.value;

  switch (filter.op) {
    case 'eq':
      return value === compareValue;
    case 'neq':
      return value !== compareValue;
    case 'gt':
      return value > compareValue;
    case 'lt':
      return value < compareValue;
    case 'gte':
      return value >= compareValue;
    case 'lte':
      return value <= compareValue;
    case 'contains':
      return String(value).toLowerCase().includes(String(compareValue).toLowerCase());
    case 'startsWith':
      return String(value).toLowerCase().startsWith(String(compareValue).toLowerCase());
    case 'endsWith':
      return String(value).toLowerCase().endsWith(String(compareValue).toLowerCase());
    case 'in':
      return Array.isArray(compareValue) && compareValue.includes(value);
    default:
      return false;
  }
}

/**
 * Evaluates multiple filters against a row (AND by default)
 */
export function evaluateFilters(row: any, filters: Filter[]): boolean {
  return filters.every(filter => evaluateFilter(row, filter));
}

/**
 * Gets nested value from object using dot notation
 */
function getNestedValue(obj: any, path: string): any {
  return path.split('.').reduce((current, key) => current?.[key], obj);
}

/**
 * Converts filter to human-readable string
 */
export function filterToString(filter: Filter): string {
  if ('filters' in filter) {
    const parts = filter.filters.map(f => filterToString(f));
    return `(${parts.join(` ${filter.op.toUpperCase()} `)})`;
  }

  const opLabels: Record<FilterOperator, string> = {
    eq: '=',
    neq: '≠',
    gt: '>',
    lt: '<',
    gte: '≥',
    lte: '≤',
    contains: 'contains',
    in: 'in',
    startsWith: 'starts with',
    endsWith: 'ends with'
  };

  return `${filter.field} ${opLabels[filter.op]} ${JSON.stringify(filter.value)}`;
}

/**
 * Gets available fields from a dataset
 */
export function getFieldsFromData(data: any[]): string[] {
  if (!data || data.length === 0) return [];
  
  const fields = new Set<string>();
  const sample = data[0];
  
  function extractFields(obj: any, prefix = '') {
    Object.keys(obj).forEach(key => {
      const fullKey = prefix ? `${prefix}.${key}` : key;
      if (obj[key] && typeof obj[key] === 'object' && !Array.isArray(obj[key])) {
        extractFields(obj[key], fullKey);
      } else {
        fields.add(fullKey);
      }
    });
  }
  
  extractFields(sample);
  return Array.from(fields).sort();
} 