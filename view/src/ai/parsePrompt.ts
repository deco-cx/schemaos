import { SchemaSpec, NodeSpec, EdgeSpec, FieldSpec, ParseResult } from './types';
import { validateSchema, autoFixSchema } from '../lib/validateSchema';
import { client } from '../lib/rpc';
import { parsePromptMock } from './parsePromptMock';

// Schema for AI to generate database schema
const SCHEMA_GENERATION_SCHEMA = {
  type: 'object',
  properties: {
    nodes: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string', description: 'Unique identifier for the node (lowercase, no spaces)' },
          name: { type: 'string', description: 'Display name for the table' },
          fields: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                name: { type: 'string', description: 'Field name (camelCase or snake_case)' },
                type: { 
                  type: 'string', 
                  enum: ['string', 'number', 'boolean', 'datetime', 'text', 'email', 'enum'],
                  description: 'Field data type'
                },
                isPrimary: { type: 'boolean', description: 'Is this the primary key?' },
                isNullable: { type: 'boolean', description: 'Can this field be null?' }
              },
              required: ['name', 'type']
            },
            description: 'List of fields for this table'
          }
        },
        required: ['id', 'name', 'fields']
      },
      description: 'List of database tables/entities'
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
      },
      description: 'List of relationships between tables'
    }
  },
  required: ['nodes', 'edges']
};

export async function parsePrompt(prompt: string): Promise<ParseResult> {
  try {
    if (!prompt.trim()) {
      return {
        success: false,
        errors: [{ type: 'error', message: 'Please provide a description of your schema' }]
      };
    }

    // Create system prompt for schema generation
    const systemPrompt = `You are a database schema designer. Generate a complete database schema based on the user's description.

Rules:
1. Create appropriate tables/entities based on the description
2. Add relevant fields with correct data types
3. Every table MUST have an 'id' field as primary key
4. Add timestamp fields (created_at, updated_at) where appropriate
5. Detect and create relationships between tables
6. For 1-N relationships, add foreign key fields (e.g., customerId in orders table)
7. Use clear, consistent naming conventions
8. Common patterns:
   - E-commerce: customers, orders, products, categories
   - CRM: contacts, companies, deals, activities
   - Blog: posts, authors, categories, comments
   - Project Management: projects, tasks, users, teams

Generate a complete, production-ready schema.`;

    // Call AI to generate schema
    const result = await client.AI_GENERATE_OBJECT({
      messages: [
        {
          role: 'system',
          content: systemPrompt
        },
        {
          role: 'user',
          content: `Generate a database schema for: ${prompt}`
        }
      ],
      schema: SCHEMA_GENERATION_SCHEMA,
      temperature: 0.3, // Lower temperature for consistent schema generation
      model: 'claude-3-5-sonnet-20241022' // Use Claude as requested
    });

    if (!result.object) {
      return {
        success: false,
        errors: [{ 
          type: 'error', 
          message: 'AI could not generate a schema. Please try rephrasing your description.' 
        }]
      };
    }

    // Convert AI response to our schema format
    const schema: SchemaSpec = {
      nodes: result.object.nodes || [],
      edges: result.object.edges || []
    };

    // Validate that we got at least one node
    if (schema.nodes.length === 0) {
      return {
        success: false,
        errors: [{ 
          type: 'error', 
          message: 'No tables were generated. Please provide more details about your data structure.' 
        }]
      };
    }

    // Auto-fix common issues
    const fixedSchema = autoFixSchema(schema);
    
    // Validate the schema
    const validationErrors = validateSchema(fixedSchema);
    
    // Only return errors that are actual blockers
    const blockingErrors = validationErrors.filter(e => e.type === 'error');
    
    if (blockingErrors.length > 0) {
      return {
        success: false,
        errors: blockingErrors
      };
    } else {
      return {
        success: true,
        schema: fixedSchema,
        errors: validationErrors.filter(e => e.type === 'warning') // Include warnings
      };
    }
  } catch (error: any) {
    console.error('Error calling AI:', error);
    
    // Check for authentication error
    if (error?.message?.includes('401') || error?.message?.includes('not logged in')) {
      console.log('Authentication error detected, falling back to mock implementation');
      // Fall back to mock implementation
      return await parsePromptMock(prompt);
    }
    
    // Provide helpful error messages
    if (error instanceof TypeError && error.message.includes('fetch')) {
      return {
        success: false,
        errors: [{ 
          type: 'error', 
          message: 'Connection error. Please check if the server is running.' 
        }]
      };
    }
    
    return {
      success: false,
      errors: [{ 
        type: 'error', 
        message: 'Failed to generate schema. Please try again.' 
      }]
    };
  }
}