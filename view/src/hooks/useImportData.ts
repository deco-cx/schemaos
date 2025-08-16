import { useState, useCallback } from 'react';
import { client } from '../lib/rpc';
import type { SchemaSpec } from '../ai/types';

// Manual type definition for GET_DATABASE_SCHEMA response
interface DatabaseSchemaResponse {
  nodes: Array<{
    id: string;
    name: string;
    fields: Array<{
      name: string;
      type: "string" | "number" | "boolean" | "datetime" | "text" | "email" | "enum";
      isPrimary?: boolean;
      isNullable?: boolean;
    }>;
  }>;
  edges: Array<{
    from: string;
    to: string;
    label: "1-1" | "1-N" | "N-N";
  }>;
}

export type ImportMode = 'natural-language' | 'sqlite';

export function useImportData() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [availableTables, setAvailableTables] = useState<string[]>([]);
  const [selectedTables, setSelectedTables] = useState<Set<string>>(new Set());

  // Load all available tables from database
  const loadAvailableTables = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Get all tables without filter to show the list
      const response = await client.GET_DATABASE_SCHEMA({}) as DatabaseSchemaResponse;
      
      const tableNames = response.nodes.map(node => node.name);
      setAvailableTables(tableNames);
      // Clear any previous selections when loading new tables
      setSelectedTables(new Set());
      
      return tableNames;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load database tables';
      setError(message);
      console.error('Failed to load tables:', err);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Import selected tables from database
  const importFromDatabase = useCallback(async (tables?: string[]): Promise<SchemaSpec | null> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const tablesToImport = tables || Array.from(selectedTables);
      
      console.log('Importing tables:', tablesToImport);
      console.log('Selected tables state:', Array.from(selectedTables));
      
      if (tablesToImport.length === 0) {
        setError('Please select at least one table to import');
        return null;
      }

      const response = await client.GET_DATABASE_SCHEMA({ 
        tables: tablesToImport 
      }) as DatabaseSchemaResponse;
      
      console.log('Received nodes:', response.nodes.map(n => n.name));
      
      // Convert to SchemaSpec format
      const schema: SchemaSpec = {
        nodes: response.nodes,
        edges: response.edges
      };
      
      return schema;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to import database schema';
      setError(message);
      console.error('Failed to import schema:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [selectedTables]);

  // Import from natural language description
  const importFromNaturalLanguage = useCallback(async (prompt: string): Promise<SchemaSpec | null> => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Define the expected schema for AI generation
      const schemaDefinition = {
        type: 'object',
        properties: {
          nodes: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'string', description: 'Unique identifier for the node (kebab-case)' },
                name: { type: 'string', description: 'Display name for the entity' },
                fields: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      name: { type: 'string', description: 'Field name (camelCase)' },
                      type: {
                        type: 'string',
                        enum: ['string', 'number', 'boolean', 'datetime', 'text', 'email', 'enum'],
                        description: 'Field data type'
                      },
                      isPrimary: { type: 'boolean', description: 'Is this a primary key?' },
                      isNullable: { type: 'boolean', description: 'Can this field be null?' }
                    },
                    required: ['name', 'type']
                  },
                  minItems: 1
                }
              },
              required: ['id', 'name', 'fields']
            },
            minItems: 1
          },
          edges: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                from: { type: 'string', description: 'Source node ID' },
                to: { type: 'string', description: 'Target node ID' },
                label: {
                  type: 'string',
                  enum: ['1-1', '1-N', 'N-N'],
                  description: 'Relationship cardinality'
                }
              },
              required: ['from', 'to', 'label']
            }
          }
        },
        required: ['nodes', 'edges']
      };

      const systemPrompt = `You are a database schema designer. Create a comprehensive data schema based on the user's description. 
Generate entities with appropriate fields and relationships. 
Ensure each entity has a primary key field (usually 'id'). 
Use appropriate field types and establish logical relationships between entities.
Follow these naming conventions:
- Entity IDs: kebab-case (e.g., "user-profile")
- Entity names: PascalCase (e.g., "UserProfile")
- Field names: camelCase (e.g., "firstName")`;

      const response = await client.AI_GENERATE_OBJECT({
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        schema: schemaDefinition,
        model: 'gpt-4o-mini',
        temperature: 0.3
      });
      
      if (!response.object) {
        throw new Error('AI did not generate a valid schema');
      }
      
      return response.object as SchemaSpec;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to generate schema from description';
      setError(message);
      console.error('Failed to generate schema:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Toggle table selection
  const toggleTableSelection = useCallback((tableName: string) => {
    setSelectedTables(prev => {
      const next = new Set(prev);
      if (next.has(tableName)) {
        next.delete(tableName);
      } else {
        next.add(tableName);
      }
      return next;
    });
  }, []);

  // Select all tables
  const selectAllTables = useCallback(() => {
    setSelectedTables(new Set(availableTables));
  }, [availableTables]);

  // Clear all selections
  const clearTableSelection = useCallback(() => {
    setSelectedTables(new Set());
  }, []);

  return {
    // State
    isLoading,
    error,
    availableTables,
    selectedTables,
    
    // Actions
    loadAvailableTables,
    importFromDatabase,
    importFromNaturalLanguage,
    toggleTableSelection,
    selectAllTables,
    clearTableSelection,
  };
}
