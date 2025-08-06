import type { Filter } from './filterDsl';

/**
 * Mock AI filter translator
 * Simulates converting natural language to Filter DSL
 */
export async function translateToFilter(
  naturalLanguage: string,
  availableFields: string[]
): Promise<Filter[]> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500));

  const query = naturalLanguage.toLowerCase();
  const filters: Filter[] = [];

  // Pattern matching for common queries
  
  // VIP/Premium customer patterns
  if (query.includes('vip') || query.includes('premium')) {
    filters.push({ field: 'segment', op: 'eq', value: 'VIP' });
  }

  // Score/rating patterns
  const scoreMatch = query.match(/score\s*([><=]+)\s*(\d+)/);
  if (scoreMatch) {
    const op = scoreMatch[1];
    const value = parseInt(scoreMatch[2]);
    filters.push({
      field: 'score',
      op: op === '>' ? 'gt' : op === '<' ? 'lt' : op === '>=' ? 'gte' : op === '<=' ? 'lte' : 'eq',
      value
    });
  }

  // Location patterns
  const locationPatterns = {
    'brazil': { field: 'country', op: 'eq' as const, value: 'Brazil' },
    'brazilian': { field: 'country', op: 'eq' as const, value: 'Brazil' },
    'usa': { field: 'country', op: 'eq' as const, value: 'USA' },
    'american': { field: 'country', op: 'eq' as const, value: 'USA' },
    'new york': { field: 'city', op: 'eq' as const, value: 'New York' },
    'london': { field: 'city', op: 'eq' as const, value: 'London' },
    'paris': { field: 'city', op: 'eq' as const, value: 'Paris' }
  };

  Object.entries(locationPatterns).forEach(([pattern, filter]) => {
    if (query.includes(pattern)) {
      filters.push(filter);
    }
  });

  // Status patterns
  const statusPatterns = {
    'active': { field: 'status', op: 'eq' as const, value: 'active' },
    'inactive': { field: 'status', op: 'eq' as const, value: 'inactive' },
    'pending': { field: 'status', op: 'eq' as const, value: 'pending' },
    'completed': { field: 'status', op: 'eq' as const, value: 'completed' },
    'delivered': { field: 'status', op: 'eq' as const, value: 'delivered' }
  };

  Object.entries(statusPatterns).forEach(([pattern, filter]) => {
    if (query.includes(pattern)) {
      filters.push(filter);
    }
  });

  // Date patterns
  if (query.includes('today')) {
    const today = new Date().toISOString().split('T')[0];
    filters.push({ field: 'date', op: 'eq', value: today });
  }
  if (query.includes('this week')) {
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    filters.push({ field: 'date', op: 'gte', value: weekAgo });
  }
  if (query.includes('this month')) {
    const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    filters.push({ field: 'date', op: 'gte', value: monthAgo });
  }

  // Amount/price patterns
  const amountMatch = query.match(/(?:amount|price|total)\s*([><=]+)\s*\$?(\d+)/);
  if (amountMatch) {
    const op = amountMatch[1];
    const value = parseInt(amountMatch[2]);
    filters.push({
      field: 'amount',
      op: op === '>' ? 'gt' : op === '<' ? 'lt' : op === '>=' ? 'gte' : op === '<=' ? 'lte' : 'eq',
      value
    });
  }

  // Channel patterns (for Discord example)
  if (query.includes('support') && query.includes('channel')) {
    filters.push({ field: 'channelId', op: 'eq', value: '123456' });
  }

  // Contains patterns
  const containsMatch = query.match(/contains?\s+["']([^"']+)["']/);
  if (containsMatch) {
    // Try to guess the field
    const searchTerm = containsMatch[1];
    if (query.includes('message') || query.includes('text')) {
      filters.push({ field: 'message', op: 'contains', value: searchTerm });
    } else if (query.includes('name')) {
      filters.push({ field: 'name', op: 'contains', value: searchTerm });
    } else {
      // Default to name field
      filters.push({ field: 'name', op: 'contains', value: searchTerm });
    }
  }

  // Logical operators
  if (query.includes(' or ')) {
    // If we have multiple filters and "or" is mentioned, wrap them in OR
    if (filters.length > 1) {
      return [{ op: 'or', filters }];
    }
  }

  // If no filters were created, try to be helpful
  if (filters.length === 0) {
    // Look for any quoted text and search for it
    const quotedMatch = query.match(/["']([^"']+)["']/);
    if (quotedMatch) {
      filters.push({ field: 'name', op: 'contains', value: quotedMatch[1] });
    }
  }

  return filters;
}

/**
 * Generate sample AI suggestions based on entity type
 */
export function getAISuggestions(entityId: string): string[] {
  const suggestions: Record<string, string[]> = {
    'crm.customers': [
      'VIP customers from Brazil',
      'score > 80',
      'active customers this month',
      'contains "John"'
    ],
    'shopify.orders': [
      'orders > $100',
      'delivered this week',
      'pending orders',
      'contains "shoes"'
    ],
    'discord.messages': [
      'messages in support channel',
      'messages today',
      'contains "help"',
      'messages from moderators'
    ],
    'slack.messages': [
      'messages in general channel',
      'messages this week',
      'contains "urgent"',
      'messages from admin'
    ]
  };

  return suggestions[entityId] || [
    'active items',
    'created today',
    'amount > 100',
    'contains "test"'
  ];
} 