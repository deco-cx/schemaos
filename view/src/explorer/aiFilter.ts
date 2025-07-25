import type { Filter } from '../hooks/useExplorer';
import { FilterHelpers } from './filterDsl';

interface EntitySchema {
  fields: Array<{
    name: string;
    type: 'string' | 'number' | 'boolean' | 'date';
  }>;
}

/**
 * Mock AI filter translator
 * Uses simple keyword matching to convert natural language to filters
 */
export async function translateToFilters(
  naturalLanguage: string,
  entityId: string,
  schema?: EntitySchema
): Promise<Filter[]> {
  // Simulate AI thinking time
  await new Promise((resolve) => setTimeout(resolve, 300 + Math.random() * 500));
  
  const nl = naturalLanguage.toLowerCase();
  const filters: Filter[] = [];
  
  // Mock entity-specific filter patterns
  const entityPatterns = getEntityPatterns(entityId);
  
  // Check for numeric comparisons
  const gtMatch = nl.match(/(?:greater than|more than|above|over|>)\s*(\d+)/);
  const ltMatch = nl.match(/(?:less than|below|under|<)\s*(\d+)/);
  const eqMatch = nl.match(/(?:equals?|is|=)\s*(\d+)/);
  
  // Check for text contains
  const containsMatch = nl.match(/contains?\s+"([^"]+)"/);
  const includesMatch = nl.match(/includes?\s+"([^"]+)"/);
  
  // Entity-specific patterns
  for (const pattern of entityPatterns) {
    const match = nl.match(pattern.regex);
    if (match) {
      filters.push(pattern.createFilter(match));
    }
  }
  
  // Generic field detection based on common patterns
  if (gtMatch) {
    const field = detectNumericField(nl, entityId);
    if (field) {
      filters.push(FilterHelpers.gt(field, Number(gtMatch[1])));
    }
  }
  
  if (ltMatch) {
    const field = detectNumericField(nl, entityId);
    if (field) {
      filters.push(FilterHelpers.lt(field, Number(ltMatch[1])));
    }
  }
  
  if (containsMatch || includesMatch) {
    const field = detectTextField(nl, entityId);
    const value = containsMatch?.[1] || includesMatch?.[1];
    if (field && value) {
      filters.push(FilterHelpers.contains(field, value));
    }
  }
  
  // Handle "only" keyword for exclusive filters
  if (nl.includes('only')) {
    // VIP customers
    if (nl.includes('vip')) {
      filters.push(FilterHelpers.eq('segment', 'VIP'));
    }
    // Premium/Pro users
    if (nl.includes('premium') || nl.includes('pro')) {
      filters.push(FilterHelpers.eq('plan', 'premium'));
    }
    // Active/Inactive
    if (nl.includes('active')) {
      filters.push(FilterHelpers.eq('status', 'active'));
    }
    if (nl.includes('inactive')) {
      filters.push(FilterHelpers.eq('status', 'inactive'));
    }
  }
  
  // Handle location filters
  const locationMatch = nl.match(/from\s+(\w+)/);
  if (locationMatch) {
    const location = locationMatch[1];
    filters.push(FilterHelpers.contains('address', location));
  }
  
  // Handle date-based filters
  if (nl.includes('today')) {
    const today = new Date().toISOString().split('T')[0];
    filters.push(FilterHelpers.eq('date', today));
  }
  
  if (nl.includes('this week')) {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    filters.push(FilterHelpers.gt('date', weekAgo.toISOString()));
  }
  
  if (nl.includes('this month')) {
    const monthAgo = new Date();
    monthAgo.setMonth(monthAgo.getMonth() - 1);
    filters.push(FilterHelpers.gt('date', monthAgo.toISOString()));
  }
  
  // Handle OR conditions
  if (nl.includes(' or ')) {
    const parts = nl.split(' or ');
    if (parts.length === 2 && filters.length >= 2) {
      // Wrap last two filters in OR
      const filter2 = filters.pop()!;
      const filter1 = filters.pop()!;
      filters.push(FilterHelpers.or(filter1, filter2));
    }
  }
  
  return filters;
}

function getEntityPatterns(entityId: string): Array<{
  regex: RegExp;
  createFilter: (match: RegExpMatchArray) => Filter;
}> {
  const patterns: Record<string, Array<{
    regex: RegExp;
    createFilter: (match: RegExpMatchArray) => Filter;
  }>> = {
    'crm.customers': [
      {
        regex: /score\s*(?:>|greater than|above)\s*(\d+)/,
        createFilter: (match: RegExpMatchArray) => FilterHelpers.gt('score', Number(match[1])),
      },
      {
        regex: /vip|premium\s+customers?/,
        createFilter: () => FilterHelpers.eq('segment', 'VIP'),
      },
    ],
    'shopify.orders': [
      {
        regex: /(?:total|amount)\s*(?:>|greater than|above)\s*\$?(\d+)/,
        createFilter: (match: RegExpMatchArray) => FilterHelpers.gt('total', Number(match[1])),
      },
      {
        regex: /pending|processing|shipped|delivered/,
        createFilter: (match: RegExpMatchArray) => FilterHelpers.eq('status', match[0]),
      },
    ],
    'analytics.events': [
      {
        regex: /event\s+(?:type|name)\s+"([^"]+)"/,
        createFilter: (match: RegExpMatchArray) => FilterHelpers.eq('eventType', match[1]),
      },
    ],
  };
  
  return patterns[entityId] || [];
}

function detectNumericField(nl: string, entityId: string): string | null {
  // Entity-specific numeric fields
  const numericFields: Record<string, string[]> = {
    'crm.customers': ['score', 'totalSpent', 'orderCount'],
    'shopify.orders': ['total', 'itemCount', 'discount'],
    'analytics.events': ['duration', 'value'],
  };
  
  const fields = numericFields[entityId] || ['value', 'amount', 'count'];
  
  for (const field of fields) {
    if (nl.includes(field.toLowerCase())) {
      return field;
    }
  }
  
  // Default fallbacks
  if (nl.includes('score')) return 'score';
  if (nl.includes('total') || nl.includes('amount')) return 'total';
  if (nl.includes('count')) return 'count';
  
  return fields[0] || 'value';
}

function detectTextField(nl: string, entityId: string): string | null {
  // Entity-specific text fields
  const textFields: Record<string, string[]> = {
    'crm.customers': ['name', 'email', 'segment', 'address'],
    'shopify.orders': ['customerName', 'email', 'shippingAddress'],
    'analytics.events': ['eventType', 'userAgent', 'url'],
  };
  
  const fields = textFields[entityId] || ['name', 'description', 'title'];
  
  for (const field of fields) {
    if (nl.includes(field.toLowerCase())) {
      return field;
    }
  }
  
  // Default to first available text field
  return fields[0] || 'name';
} 