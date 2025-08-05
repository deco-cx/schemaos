import { z } from 'zod';

// Standardized field types enum
export const FieldType = z.enum([
  'string',
  'number', 
  'boolean',
  'date',
  'datetime',
  'uuid',
  'json',
  'array',
  'object',
  'email',
  'url'
]);

export type FieldType = z.infer<typeof FieldType>;

// Relation storage strategies
export const RelationStorage = z.enum([
  'foreign-key',  // Traditional FK reference
  'embedded',     // JSON/JSONB embedded data
  'join-table'    // Many-to-many via join table
]);

export type RelationStorage = z.infer<typeof RelationStorage>;

// Relation metadata - now only references entities, not fields
export const RelationMetaSchema = z.object({
  targetEntity: z.string().regex(
    /^[A-Za-z][A-Za-z0-9_]*$/,
    'Target entity must be a valid entity name'
  ),
  storage: RelationStorage,
  isArray: z.boolean().optional().default(false), // Support for arrays like TypeScript
  isNullable: z.boolean().optional().default(true), // Support for nullable like TypeScript
  description: z.string().optional()
});

export type RelationMeta = z.infer<typeof RelationMetaSchema>;

// Enhanced field schema with relations
export const FieldSchema = z.object({
  id: z.string().optional(), // Optional for AI generation
  name: z.string().min(1, 'Field name is required'),
  type: z.string(), // Can be a primitive type OR an entity name
  required: z.boolean().optional().default(false),
  description: z.string().optional(),
  isPrimary: z.boolean().optional().default(false),
  relation: RelationMetaSchema.optional(), // Present when type is an entity name
  // UI state (not for AI)
  expanded: z.boolean().optional(),
  schema: z.any().optional() // For complex types like json/array/object
});

export type Field = z.infer<typeof FieldSchema>;

// Node schema
export const NodeSchema = z.object({
  id: z.string().optional(), // Optional for AI generation
  name: z.string().min(1, 'Node name is required'),
  fields: z.array(FieldSchema).min(1, 'At least one field is required')
});

export type SchemaNode = z.infer<typeof NodeSchema>;

// Edge schema (for visual representation)
export const EdgeSchema = z.object({
  id: z.string().optional(), // Optional for AI generation
  source: z.string(),
  target: z.string(),
  label: z.enum(['1-1', '1-N', 'N-N']).optional(),
  description: z.string().optional()
});

export type SchemaEdge = z.infer<typeof EdgeSchema>;

// Complete schema for AI generation
export const CreateSchemaResponse = z.object({
  nodes: z.array(NodeSchema).min(1, 'At least one node is required'),
  edges: z.array(EdgeSchema).optional().default([]),
  explanation: z.string()
});

export type CreateSchemaResponse = z.infer<typeof CreateSchemaResponse>;

// Edit schema response
export const EditSchemaResponse = z.object({
  nodes: z.array(NodeSchema.extend({
    id: z.string() // ID is required for edits
  })).min(1),
  explanation: z.string()
});

export type EditSchemaResponse = z.infer<typeof EditSchemaResponse>;

// SQL generation response
export const SQLResponse = z.object({
  sql: z.string(),
  explanation: z.string().optional()
});

export type SQLResponse = z.infer<typeof SQLResponse>;

// Validation utilities
export const validateFieldType = (type: string): type is FieldType => {
  return FieldType.safeParse(type).success;
};

// Check if a type is a primitive type
export const isPrimitiveType = (type: string): boolean => {
  return FieldType.safeParse(type).success;
};

// Check if a field has a relation (type is an entity)
export const isRelationType = (field: Field): boolean => {
  return !isPrimitiveType(field.type) && field.relation !== undefined;
};

// Validate that relation fields are consistent
export const validateRelationField = (field: Field, availableEntities: string[]): string[] => {
  const errors: string[] = [];
  
  if (isPrimitiveType(field.type) && field.relation) {
    errors.push(`Field "${field.name}" has primitive type "${field.type}" but defines a relation`);
  }
  
  if (!isPrimitiveType(field.type) && !field.relation) {
    errors.push(`Field "${field.name}" has entity type "${field.type}" but no relation metadata`);
  }
  
  if (field.relation && field.relation.targetEntity !== field.type) {
    errors.push(`Field "${field.name}" type "${field.type}" doesn't match relation target "${field.relation.targetEntity}"`);
  }
  
  if (field.relation && !availableEntities.includes(field.relation.targetEntity)) {
    errors.push(`Field "${field.name}" references unknown entity "${field.relation.targetEntity}"`);
  }
  
  return errors;
};

// Helper to get all valid field types as array
export const getValidFieldTypes = (): FieldType[] => {
  return FieldType.options;
};

// Helper to get all relation storage options
export const getRelationStorageOptions = (): RelationStorage[] => {
  return RelationStorage.options;
};