import { SchemaSpec, NodeSpec, EdgeSpec, FieldSpec, ParseResult } from './types';
import { validateSchema, autoFixSchema } from '../lib/validateSchema';

// Common field patterns for different entity types
const ENTITY_PATTERNS = {
  // Construction professionals
  professional: {
    keywords: ['profissional', 'professional', 'pedreiro', 'mason', 'worker', 'trabalhador'],
    fields: [
      { name: 'id', type: 'string', isPrimary: true },
      { name: 'name', type: 'string' },
      { name: 'email', type: 'email' },
      { name: 'phone', type: 'string' },
      { name: 'cpf', type: 'string' },
      { name: 'specialties', type: 'text' },
      { name: 'experience_years', type: 'number' },
      { name: 'rating', type: 'number' },
      { name: 'verified', type: 'boolean' },
      { name: 'created_at', type: 'datetime' },
      { name: 'updated_at', type: 'datetime' }
    ]
  },
  service: {
    keywords: ['service', 'servico', 'job', 'trabalho', 'obra'],
    fields: [
      { name: 'id', type: 'string', isPrimary: true },
      { name: 'title', type: 'string' },
      { name: 'description', type: 'text' },
      { name: 'category', type: 'string' },
      { name: 'estimated_duration', type: 'string' },
      { name: 'price_range', type: 'string' },
      { name: 'status', type: 'enum' },
      { name: 'created_at', type: 'datetime' },
      { name: 'updated_at', type: 'datetime' }
    ]
  },
  customer: {
    keywords: ['customer', 'cliente', 'client', 'user', 'usuario'],
    fields: [
      { name: 'id', type: 'string', isPrimary: true },
      { name: 'name', type: 'string' },
      { name: 'email', type: 'email' },
      { name: 'phone', type: 'string' },
      { name: 'address', type: 'text' },
      { name: 'created_at', type: 'datetime' },
      { name: 'updated_at', type: 'datetime' }
    ]
  },
  review: {
    keywords: ['review', 'avaliacao', 'rating', 'feedback'],
    fields: [
      { name: 'id', type: 'string', isPrimary: true },
      { name: 'rating', type: 'number' },
      { name: 'comment', type: 'text' },
      { name: 'verified', type: 'boolean' },
      { name: 'created_at', type: 'datetime' }
    ]
  },
  // E-commerce patterns
  order: {
    keywords: ['order', 'pedido', 'purchase', 'compra', 'sale'],
    fields: [
      { name: 'id', type: 'string', isPrimary: true },
      { name: 'total', type: 'number' },
      { name: 'status', type: 'enum' },
      { name: 'created_at', type: 'datetime' },
      { name: 'updated_at', type: 'datetime' }
    ]
  },
  product: {
    keywords: ['product', 'produto', 'item', 'merchandise', 'goods'],
    fields: [
      { name: 'id', type: 'string', isPrimary: true },
      { name: 'name', type: 'string' },
      { name: 'description', type: 'text' },
      { name: 'price', type: 'number' },
      { name: 'sku', type: 'string' },
      { name: 'created_at', type: 'datetime' }
    ]
  }
};

// Common relationship patterns
const RELATIONSHIP_PATTERNS = [
  // Construction-specific
  { from: ['professional'], to: ['service'], type: '1-N' as const },
  { from: ['customer'], to: ['service'], type: '1-N' as const },
  { from: ['professional'], to: ['review'], type: '1-N' as const },
  { from: ['service'], to: ['review'], type: '1-N' as const },
  { from: ['customer'], to: ['review'], type: '1-N' as const },
  
  // General patterns
  { from: ['customer', 'user'], to: ['order', 'purchase'], type: '1-N' as const },
  { from: ['order'], to: ['item', 'line'], type: '1-N' as const },
  { from: ['category'], to: ['product'], type: '1-N' as const },
  { from: ['product'], to: ['category', 'tag'], type: 'N-N' as const },
];

function extractEntities(prompt: string): string[] {
  const words = prompt.toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 2);

  const entities = new Set<string>();
  
  // Look for pattern matches
  for (const word of words) {
    for (const [patternName, pattern] of Object.entries(ENTITY_PATTERNS)) {
      if (pattern.keywords.some(keyword => word.includes(keyword))) {
        entities.add(patternName);
        break;
      }
    }
  }

  // Special handling for construction recommendation system
  if (prompt.toLowerCase().includes('recomenda') || prompt.toLowerCase().includes('construc')) {
    entities.add('professional');
    entities.add('customer');
    entities.add('service');
    entities.add('review');
  }

  return Array.from(entities);
}

function createNodeFromEntity(entity: string): NodeSpec {
  const pattern = ENTITY_PATTERNS[entity as keyof typeof ENTITY_PATTERNS];
  
  if (pattern) {
    return {
      id: entity,
      name: entity.charAt(0).toUpperCase() + entity.slice(1) + 's',
      fields: pattern.fields.map(field => ({
        ...field,
        isNullable: field.isNullable ?? !field.isPrimary
      }))
    };
  }

  // Create generic entity
  const capitalizedEntity = entity.charAt(0).toUpperCase() + entity.slice(1);
  return {
    id: entity,
    name: capitalizedEntity + 's',
    fields: [
      { name: 'id', type: 'string', isPrimary: true, isNullable: false },
      { name: 'name', type: 'string', isNullable: false },
      { name: 'description', type: 'text', isNullable: true },
      { name: 'created_at', type: 'datetime', isNullable: false },
      { name: 'updated_at', type: 'datetime', isNullable: false }
    ]
  };
}

function detectRelationships(entities: string[]): EdgeSpec[] {
  const edges: EdgeSpec[] = [];

  for (const pattern of RELATIONSHIP_PATTERNS) {
    for (const fromEntity of entities) {
      for (const toEntity of entities) {
        if (fromEntity !== toEntity) {
          const fromMatches = pattern.from.some(p => fromEntity.includes(p));
          const toMatches = pattern.to.some(p => toEntity.includes(p));
          
          if (fromMatches && toMatches) {
            const edgeExists = edges.some(e => 
              (e.from === fromEntity && e.to === toEntity) ||
              (e.from === toEntity && e.to === fromEntity)
            );
            
            if (!edgeExists) {
              edges.push({
                from: fromEntity,
                to: toEntity,
                label: pattern.type
              });
            }
          }
        }
      }
    }
  }

  return edges;
}

export async function parsePromptMock(prompt: string): Promise<ParseResult> {
  return new Promise((resolve) => {
    // Simulate AI processing delay
    setTimeout(() => {
      try {
        if (!prompt.trim()) {
          resolve({
            success: false,
            errors: [{ type: 'error', message: 'Please provide a description of your schema' }]
          });
          return;
        }

        // Extract entities from prompt
        const entities = extractEntities(prompt);
        
        if (entities.length === 0) {
          resolve({
            success: false,
            errors: [{ 
              type: 'error', 
              message: 'Could not identify any entities in your description. Try mentioning specific things like "customers", "orders", "products", etc.' 
            }]
          });
          return;
        }

        // Create nodes
        const nodes = entities.map(entity => createNodeFromEntity(entity));
        
        // Detect relationships
        const edges = detectRelationships(entities);

        const schema: SchemaSpec = { nodes, edges };
        
        // Auto-fix common issues
        const fixedSchema = autoFixSchema(schema);
        
        // Validate the schema
        const validationErrors = validateSchema(fixedSchema);
        
        // Only return errors that are actual blockers
        const blockingErrors = validationErrors.filter(e => e.type === 'error');
        
        if (blockingErrors.length > 0) {
          resolve({
            success: false,
            errors: blockingErrors
          });
        } else {
          resolve({
            success: true,
            schema: fixedSchema,
            errors: validationErrors.filter(e => e.type === 'warning')
          });
        }
      } catch (error) {
        resolve({
          success: false,
          errors: [{ 
            type: 'error', 
            message: 'Failed to parse your description. Please try rephrasing it.' 
          }]
        });
      }
    }, 1500); // Simulate AI processing time
  });
}