import { useState, useEffect } from 'react';
import { X, Copy, Download, Loader2, Bot, FileText, Send, Check, Database } from 'lucide-react';
import { Button } from '../components/ui/button';
import { useSchemaStore } from '../store';
import { client } from '../lib/rpc';
import { 
  getValidFieldTypes,
  getRelationStorageOptions,
  validateRelationField
} from '../lib/schema-types';
import { generateMigrationSQL, validateFieldForSQL } from '../lib/sql-builder';

export default function NodeAIModal() {
  const {
    nodes,
    selectedNodeIds,
    isNodeAIModalOpen,
    nodeAIMode,
    closeNodeAIModal,
    updateNode,
    addNode,
    addEdge,
    syncEdgesWithRelations,
  } = useSchemaStore();

  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string>('');
  const [userPrompt, setUserPrompt] = useState<string>('');

  const selectedNodes = nodes.filter(node => selectedNodeIds.has(node.id));

  // Reset state when modal opens
  useEffect(() => {
    if (isNodeAIModalOpen) {
      setResult(null);
      setError('');
      setUserPrompt('');
      setIsLoading(false);
    }
  }, [isNodeAIModalOpen, nodeAIMode]);

  const handleGenerateAI = async () => {
    if (!nodeAIMode || !userPrompt.trim()) return;
    if (nodeAIMode !== 'create' && selectedNodes.length === 0) return;

    setIsLoading(true);
    setError('');
    setResult(null);

    try {
      const schema = getSchemaForMode(nodeAIMode);
      const contextPrompt = buildContextPrompt(selectedNodes, nodeAIMode, userPrompt);

      const response = await client.AI_GENERATE_OBJECT({
        messages: [{
          role: 'user',
          content: contextPrompt
        }],
        schema,
        model: 'gpt-4o-mini',
        temperature: 0.3,
        maxTokens: 3000
      });

      if (response.object) {
        setResult(response.object);
      } else {
        setError('AI did not return a valid response');
      }
    } catch (err) {
      console.error('AI generation error:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate AI response');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateDeterministicSQL = () => {
    if (selectedNodes.length === 0) return;

    setIsLoading(true);
    setError('');

    try {
      // Generate SQL using our SQL builder
      const sql = generateMigrationSQL(selectedNodes.map(node => node.data));
      
      setResult({
        sql,
        explanation: 'Generated using deterministic SQL builder with proper relation handling'
      });
    } catch (err) {
      console.error('SQL generation error:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate SQL');
    } finally {
      setIsLoading(false);
    }
  };

  const buildContextPrompt = (nodes: any[], mode: 'create' | 'edit' | 'sql', userRequest: string) => {
    const validTypes = getValidFieldTypes().join(', ');
    const relationStorageOptions = getRelationStorageOptions().join(', ');
    
    // Build field types section using array join to avoid template literal issues
    const fieldTypesSectionParts = [
      '## VALID FIELD TYPES:',
      validTypes,
      '',
      '## RELATION SYNTAX:',
      'For fields that reference other entities, set the type to the entity name and include a relation property:',
      JSON.stringify({
        name: "author",
        type: "User",
        relation: {
          targetEntity: "User",
          storage: "foreign-key",
          isArray: false,
          isNullable: true
        }
      }, null, 2),
      '',
      'Available storage strategies: ' + relationStorageOptions,
      '- foreign-key: Traditional FK reference (1-1, 1-N relationships)',
      '- embedded: JSON/JSONB embedded data (when you want to store related data inline)',
      '- join-table: Many-to-many via join table (N-N relationships) - automatically handled when isArray: true',
      '',
      '## IMPORTANT RELATION GUIDELINES:',
      '- **One-to-Many (1-N)**: Add the relation field ONLY on the "many" side (e.g., only Turma has "alunos: Aluno[]")',
      '- **Many-to-Many (N-N)**: CREATE an intermediate entity (e.g., Matricula) with foreign keys to both sides',
      '- **ALWAYS include the relation property** when a field type is an entity name',
      '- Do NOT create bidirectional relations for 1-N relationships',
      '',
      '## RELATION PATTERNS:',
      '### One-to-Many (1-N):',
      '- Turma has many Alunos → Add "alunos" field to Turma only',
      'Example JSON:',
      JSON.stringify({
        name: "alunos",
        type: "Aluno",
        relation: {
          targetEntity: "Aluno",
          storage: "foreign-key",
          isArray: true,
          isNullable: false
        }
      }, null, 2),
      '',
      '### Many-to-Many (N-N):',
      '- Create intermediate entity (e.g., Matricula, Enrollment, Assignment)',
      'Example Matricula entity fields:',
      JSON.stringify([
        {
          name: "aluno",
          type: "Aluno",
          relation: {
            targetEntity: "Aluno",
            storage: "foreign-key",
            isArray: false,
            isNullable: false
          }
        },
        {
          name: "turma",
          type: "Turma",
          relation: {
            targetEntity: "Turma",
            storage: "foreign-key",
            isArray: false,
            isNullable: false
          }
        }
      ], null, 2),
      '',
      '## EXAMPLES:',
      '- company.employees: Employee[] (1-N, only on Company side)',
      '- post.author: User (N-1, foreign key on Post)',
      '- For Student <-> Course (N-N): Create Enrollment entity with student and course fields'
    ];
    
    const fieldTypesSection = fieldTypesSectionParts.join('\n');

    if (mode === 'create') {
      const promptParts = [
        'You are a database schema expert. The user wants to create a new database schema from scratch.',
        '',
        '## User Request:',
        userRequest,
        '',
        fieldTypesSection,
        '',
        'Please generate a complete schema with appropriate tables/entities, fields, and relationships based on the user\'s request.',
        '',
        '## DESIGN PRINCIPLES:',
        '1. **Unidirectional 1-N relations**: For one-to-many, add the array field ONLY on the "one" side',
        '2. **Intermediate entities for N-N**: For many-to-many, create a proper join entity (e.g., Matricula for Aluno <-> Turma)',
        '3. **Always include relation metadata**: Every field that references an entity MUST have the relation property',
        '4. **Clear ownership**: Relations should clearly show which side owns the relationship',
        '',
        'Consider:',
        '- Use only the valid field types listed above',
        '- EVERY field that references another entity MUST have the relation property properly configured',
        '- For 1-N: Add array field only on the "one" side (e.g., Turma.alunos not Aluno.turma)',
        '- For N-N: Create intermediate entity (e.g., Matricula) with foreign keys to both entities',
        '- Proper naming conventions (use the user\'s language if provided)',
        '- Primary keys (isPrimary: true) - typically "id" field with uuid type',
        '- Required vs optional fields',
        '- Think about the domain: students-classes usually need enrollment info (date, grade), so N-N needs intermediate entity'
      ];
      return promptParts.join('\n');
    }
    
    const nodesDescription = nodes.map(node => {
      const fieldsText = node.data.fields.map((field: any) => {
        const fieldParts = ['  - ' + field.name + ': ' + field.type];
        if (field.required) fieldParts.push(' (required)');
        if (field.description) fieldParts.push(' - ' + field.description);
        return fieldParts.join('');
      }).join('\n');

      return '**' + node.data.name + '** (ID: ' + node.id + ')\n' + (fieldsText || '  (no fields defined)');
    }).join('\n\n');

    if (mode === 'edit') {
      const editPromptParts = [
        'You are a database schema expert. The user has selected the following schema nodes and wants to make changes.',
        '',
        '## User Request:',
        userRequest,
        '',
        fieldTypesSection,
        '',
        '## Current Schema Nodes:',
        nodesDescription,
        '',
        'Please analyze the request and provide updated schema nodes. For each node that should be changed, include the complete updated structure. If a node doesn\'t need changes, you can omit it from the response.',
        '',
        'Focus on:',
        '- Use only the valid field types listed above',
        '- Use proper relation syntax for any relationships',
        '- Field types and naming conventions',
        '- Adding/removing/modifying fields as requested',
        '- Maintaining data integrity',
        '- Following best practices'
      ];
      return editPromptParts.join('\n');
    } else {
      const sqlPromptParts = [
        'You are a SQL expert. The user wants to generate SQL for the following schema nodes.',
        '',
        '## User Request:',
        userRequest,
        '',
        '## Schema Nodes:',
        nodesDescription,
        '',
        'Please generate clean, well-formatted SQL CREATE TABLE statements that fulfill the user\'s request.'
      ];
      return sqlPromptParts.join('\n');
    }
  };

  const getSchemaForMode = (mode: 'create' | 'edit' | 'sql') => {
    const validTypes = getValidFieldTypes();
    const relationStorageOptions = getRelationStorageOptions();
    
    // Get all entity names for type enum
    const entityNames = nodes.map(n => n.data.name).filter(name => name !== 'Self');
    const allFieldTypes = [...validTypes, ...entityNames];
    
    if (mode === 'create') {
      return {
        type: 'object',
        properties: {
          nodes: {
            type: 'array',
            description: 'New schema nodes to create',
            items: {
              type: 'object',
              properties: {
                name: { type: 'string', description: 'Table/entity name' },
                fields: {
                  type: 'array',
                  description: 'Fields for this node',
                  items: {
                    type: 'object',
                    properties: {
                      name: { type: 'string', description: 'Field name' },
                      type: { 
                        type: 'string', 
                        enum: allFieldTypes,
                        description: `Field type. Can be a primitive (${validTypes.join(', ')}) or an entity name (${entityNames.join(', ')})` 
                      },
                      required: { type: 'boolean', description: 'Whether field is required' },
                      description: { type: 'string', description: 'Field description' },
                      isPrimary: { type: 'boolean', description: 'Whether field is primary key' },
                      relation: {
                        type: 'object',
                        description: 'Relation to another entity (required when type is an entity name)',
                        properties: {
                          targetEntity: { 
                            type: 'string', 
                            description: 'Target entity name',
                            pattern: '^[A-Za-z][A-Za-z0-9_]*$'
                          },
                          storage: { 
                            type: 'string', 
                            enum: relationStorageOptions,
                            description: `How the relation is stored: ${relationStorageOptions.join(', ')}`
                          },
                          isArray: { type: 'boolean', description: 'Whether this is an array relation' },
                          isNullable: { type: 'boolean', description: 'Whether this relation can be null' },
                          description: { type: 'string', description: 'Relation description' }
                        },
                        required: ['targetEntity', 'storage']
                      }
                    },
                    required: ['name', 'type']
                  }
                }
              },
              required: ['name', 'fields']
            }
          },
          edges: {
            type: 'array',
            description: 'Visual relationships between nodes (optional, for UI)',
            items: {
              type: 'object',
              properties: {
                source: { type: 'string', description: 'Source node name' },
                target: { type: 'string', description: 'Target node name' },
                label: { type: 'string', enum: ['1-1', '1-N', 'N-N'], description: 'Relationship type' },
                description: { type: 'string', description: 'Edge description' }
              },
              required: ['source', 'target']
            }
          },
          explanation: {
            type: 'string',
            description: 'Explanation of the schema design'
          }
        },
        required: ['nodes', 'explanation']
      };
    } else if (mode === 'edit') {
      return {
        type: 'object',
        properties: {
          nodes: {
            type: 'array',
            description: 'Updated schema nodes',
            items: {
              type: 'object',
              properties: {
                id: { type: 'string', description: 'Node ID (required for updates)' },
                name: { type: 'string', description: 'Table/entity name' },
                fields: {
                  type: 'array',
                  description: 'Updated fields for this node',
                  items: {
                    type: 'object',
                    properties: {
                      id: { type: 'string', description: 'Field ID (generate new if adding)' },
                      name: { type: 'string', description: 'Field name' },
                      type: { 
                        type: 'string', 
                        enum: allFieldTypes,
                        description: `Field type. Can be a primitive (${validTypes.join(', ')}) or an entity name (${entityNames.join(', ')})` 
                      },
                      required: { type: 'boolean', description: 'Whether field is required' },
                      description: { type: 'string', description: 'Field description' },
                      isPrimary: { type: 'boolean', description: 'Whether field is primary key' },
                      relation: {
                        type: 'object',
                        description: 'Relation to another entity (required when type is an entity name)',
                        properties: {
                          targetEntity: { 
                            type: 'string', 
                            description: 'Target entity name',
                            pattern: '^[A-Za-z][A-Za-z0-9_]*$'
                          },
                          storage: { 
                            type: 'string', 
                            enum: relationStorageOptions,
                            description: `How the relation is stored: ${relationStorageOptions.join(', ')}`
                          },
                          isArray: { type: 'boolean', description: 'Whether this is an array relation' },
                          isNullable: { type: 'boolean', description: 'Whether this relation can be null' },
                          description: { type: 'string', description: 'Relation description' }
                        },
                        required: ['targetEntity', 'storage']
                      }
                    },
                    required: ['name', 'type']
                  }
                }
              },
              required: ['id', 'name', 'fields']
            }
          },
          explanation: {
            type: 'string',
            description: 'Explanation of changes made'
          }
        },
        required: ['nodes', 'explanation']
      };
    } else {
      return {
        type: 'object',
        properties: {
          sql: {
            type: 'string',
            description: 'SQL CREATE TABLE statements for the selected schema nodes'
          },
          explanation: {
            type: 'string',
            description: 'Explanation of the generated SQL'
          }
        },
        required: ['sql']
      };
    }
  };

  const validateNodeChanges = (updatedNode: any, allNodes?: any[]) => {
    const errors: string[] = [];
    
    // Validate node name
    if (!updatedNode.name || typeof updatedNode.name !== 'string' || updatedNode.name.trim().length === 0) {
      errors.push(`Node ${updatedNode.id}: Invalid or missing name`);
    }
    
    // Validate fields array
    if (!Array.isArray(updatedNode.fields)) {
      errors.push(`Node ${updatedNode.id}: Fields must be an array`);
      return errors;
    }
    
    // Get all available node names for relation validation
    const availableNodeNames = allNodes ? allNodes.map(n => n.name) : nodes.map(n => n.data.name);
    
    // Validate each field
    updatedNode.fields.forEach((field: any, index: number) => {
      if (!field.name || typeof field.name !== 'string' || field.name.trim().length === 0) {
        errors.push(`Node ${updatedNode.id}, Field ${index}: Invalid or missing field name`);
      }
      
      if (!field.type || typeof field.type !== 'string') {
        errors.push(`Node ${updatedNode.id}, Field ${index}: Invalid or missing field type`);
      }
      
      // Validate field type and relation consistency
      const relationErrors = validateRelationField(field, availableNodeNames);
      relationErrors.forEach(error => {
        errors.push(`Node ${updatedNode.id}: ${error}`);
      });
      
      // Validate field for SQL generation
      const sqlErrors = validateFieldForSQL(field);
      sqlErrors.forEach(sqlError => {
        errors.push(`Node ${updatedNode.id}, Field ${field.name}: ${sqlError}`);
      });
    });
    
    // Check for duplicate field names
    const fieldNames = updatedNode.fields.map((f: any) => f.name).filter(Boolean);
    const duplicates = fieldNames.filter((name: string, index: number) => fieldNames.indexOf(name) !== index);
    if (duplicates.length > 0) {
      errors.push(`Node ${updatedNode.id}: Duplicate field names found: ${duplicates.join(', ')}`);
    }
    
    return errors;
  };

  const handleApplyChanges = () => {
    if (!result || !result.nodes) return;
    if (nodeAIMode === 'sql') return;

    try {
      if (nodeAIMode === 'create') {
        // Validate all nodes first (including cross-references)
        const allErrors: string[] = [];
        result.nodes.forEach((newNode: any) => {
          const errors = validateNodeChanges(newNode, result.nodes);
          allErrors.push(...errors);
        });
        
        if (allErrors.length > 0) {
          setError(`Validation errors:\n${allErrors.join('\n')}`);
          return;
        }

        // Create new nodes
        const nodeMap = new Map<string, string>(); // Map from AI node name to actual node ID
        const baseX = 100;
        const baseY = 100;
        const spacing = 250;
        const autoEdges: any[] = []; // Collect edges from relations
        
        // First, create all nodes
        result.nodes.forEach((newNode: any, index: number) => {
          const nodeId = `node_${Date.now()}_${index}`;
          nodeMap.set(newNode.name, nodeId);
          
          const fields = newNode.fields.map((field: any) => ({
            id: `field_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            name: field.name,
            type: field.type,
            required: field.required || false,
            description: field.description || '',
            isPrimary: field.isPrimary || false,
            relation: field.relation // Include relation info
          }));
          
          // Collect edges from field relations
          newNode.fields.forEach((field: any) => {
            if (field.relation && field.relation.targetEntity) {
              const targetEntityName = field.relation.targetEntity;
              const label = field.relation.isArray ? 'N-N' : field.relation.storage === 'join-table' ? 'N-N' : '1-N';
              
              autoEdges.push({
                source: newNode.name,
                target: targetEntityName,
                label,
                description: `${field.name} -> ${targetEntityName} (${field.relation.storage})`
              });
            }
          });
          
          addNode({
            id: nodeId,
            type: 'custom',
            position: {
              x: baseX + (index % 3) * spacing,
              y: baseY + Math.floor(index / 3) * spacing
            },
            data: {
              id: nodeId,
              name: newNode.name,
              fields: fields,
              showAllFields: false
            }
          });
        });
        
        // Create edges from explicit result.edges
        if (result.edges && result.edges.length > 0) {
          result.edges.forEach((edge: any, index: number) => {
            const sourceId = nodeMap.get(edge.source);
            const targetId = nodeMap.get(edge.target);
            
            if (sourceId && targetId) {
              addEdge({
                id: `edge_${Date.now()}_${index}`,
                source: sourceId,
                target: targetId,
                type: 'relation',
                data: {
                  label: edge.label as '1-1' | '1-N' | 'N-N'
                }
              });
            }
          });
        }
        
        // Don't create edges manually anymore - let syncEdgesWithRelations handle it
        // The edges will be created automatically based on the field relations
        
        // Sync edges after all nodes are created
        setTimeout(() => {
          syncEdgesWithRelations();
        }, 100); // Small delay to ensure nodes are in the store
        
      } else if (nodeAIMode === 'edit') {
        // Validate all changes first (including cross-references)
        const allErrors: string[] = [];
        result.nodes.forEach((updatedNode: any) => {
          const errors = validateNodeChanges(updatedNode, [...result.nodes, ...nodes.map(n => ({ name: n.data.name }))]);
          allErrors.push(...errors);
        });
        
        if (allErrors.length > 0) {
          setError(`Validation errors:\n${allErrors.join('\n')}`);
          return;
        }

        // Apply changes to each node
        result.nodes.forEach((updatedNode: any) => {
          const existingNode = selectedNodes.find(n => n.id === updatedNode.id);
          if (existingNode) {
            // Generate new field IDs for new fields, preserve existing ones
            const updatedFields = updatedNode.fields.map((field: any) => {
              // Try to find existing field by name to preserve ID
              const existingField = existingNode.data.fields.find(f => f.name === field.name);
              
              return {
                ...field,
                id: existingField?.id || `field_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                required: field.required || false,
                description: field.description || '',
                isPrimary: field.isPrimary || false,
                relation: field.relation, // Include relation info
                // Preserve additional properties from existing field if any
                ...(existingField && {
                  schema: existingField.schema,
                  expanded: existingField.expanded
                })
              };
            });

            // Update the node in the store
            updateNode(updatedNode.id, {
              name: updatedNode.name.trim(),
              fields: updatedFields
            });
          }
        });
      }

      // Close modal after successful application
      closeNodeAIModal();
    } catch (error) {
      console.error('Error applying changes:', error);
      setError('Failed to apply changes. Please try again.');
    }
  };

  const handleCopy = () => {
    const textToCopy = nodeAIMode === 'sql' 
      ? result?.sql || ''
      : nodeAIMode === 'edit' 
        ? result?.explanation || JSON.stringify(result, null, 2)
        : JSON.stringify(result, null, 2);
    
    navigator.clipboard.writeText(textToCopy);
  };

  const handleDownload = () => {
    const extension = nodeAIMode === 'sql' ? '.sql' : '.json';
    const filename = `schema_${nodeAIMode}_${Date.now()}${extension}`;
    
    const content = nodeAIMode === 'sql' 
      ? result?.sql || ''
      : JSON.stringify(result, null, 2);
    
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getModeTitle = () => {
    if (nodeAIMode === 'create') return 'Create Schema with AI';
    if (nodeAIMode === 'edit') return 'Edit with AI';
    if (nodeAIMode === 'sql') return 'Generate SQL';
    return 'AI Assistant';
  };

  const getModeIcon = () => {
    if (nodeAIMode === 'create') return <Bot className="w-5 h-5" />;
    if (nodeAIMode === 'edit') return <Bot className="w-5 h-5" />;
    if (nodeAIMode === 'sql') return <FileText className="w-5 h-5" />;
    return <Bot className="w-5 h-5" />;
  };

  if (!isNodeAIModalOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            {getModeIcon()}
            <div>
              <h2 className="text-lg font-semibold text-gray-900">{getModeTitle()}</h2>
              <p className="text-sm text-gray-500">
                {selectedNodes.length} node{selectedNodes.length > 1 ? 's' : ''} selected
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={closeNodeAIModal}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden flex flex-col">
          {/* Selected Nodes Preview */}
          {nodeAIMode !== 'create' && (
            <div className="p-4 bg-gray-50 border-b border-gray-200">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Selected Nodes:</h3>
              <div className="flex flex-wrap gap-2">
                {selectedNodes.map(node => (
                  <div
                    key={node.id}
                    className="px-3 py-1 bg-white border border-gray-200 rounded-md text-sm"
                  >
                    {node.data.name}
                    <span className="ml-2 text-xs text-gray-500">
                      ({node.data.fields.length} fields)
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Create Mode Info */}
          {nodeAIMode === 'create' && !result && !isLoading && (
            <div className="p-4 bg-blue-50 border-b border-blue-200">
              <p className="text-sm text-blue-700">
                No nodes selected – a new schema will be created from scratch based on your description.
              </p>
            </div>
          )}

          {/* User Prompt Input */}
          {!result && !isLoading && (
            <div className="p-4 border-b border-gray-200">
              <label htmlFor="user-prompt" className="block text-sm font-medium text-gray-700 mb-2">
                What do you want to {nodeAIMode === 'create' ? 'create' : nodeAIMode === 'edit' ? 'change' : 'generate'}?
              </label>
              <textarea
                id="user-prompt"
                value={userPrompt}
                onChange={(e) => setUserPrompt(e.target.value)}
                placeholder={
                  nodeAIMode === 'create'
                    ? "Describe the schema you want to create (e.g., 'A blog system with posts, authors, and comments')"
                    : nodeAIMode === 'edit' 
                    ? "Describe the changes you want to make to these schema nodes..."
                    : "Describe what SQL you want to generate for these nodes..."
                }
                className="w-full h-24 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              />
              <div className="mt-3 flex justify-end gap-2">
                {nodeAIMode === 'sql' && selectedNodes.length > 0 && (
                  <Button
                    onClick={handleGenerateDeterministicSQL}
                    variant="outline"
                    className="flex items-center gap-2"
                  >
                    <Database className="w-4 h-4" />
                    Generate SQL
                  </Button>
                )}
                <Button
                  onClick={handleGenerateAI}
                  disabled={!userPrompt.trim()}
                  className="flex items-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  Generate with AI
                </Button>
              </div>
            </div>
          )}

          {/* Result Area */}
          <div className="flex-1 p-4 overflow-auto">
            {isLoading ? (
              <div className="flex items-center justify-center h-32">
                <div className="flex items-center gap-3">
                  <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
                  <span className="text-gray-600">Generating AI response...</span>
                </div>
              </div>
            ) : error ? (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <h4 className="text-red-800 font-medium mb-2">Error</h4>
                <p className="text-red-700 text-sm">{error}</p>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleGenerateAI}
                  className="mt-3"
                >
                  Try Again
                </Button>
              </div>
            ) : result ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-gray-900">Result</h4>
                  <div className="flex items-center gap-2">
                    {(nodeAIMode === 'create' || nodeAIMode === 'edit') && result.nodes && (
                      <Button
                        size="sm"
                        onClick={handleApplyChanges}
                        className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
                      >
                        <Check className="w-4 h-4" />
                        Apply Changes
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleCopy}
                      className="flex items-center gap-2"
                    >
                      <Copy className="w-4 h-4" />
                      Copy
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleDownload}
                      className="flex items-center gap-2"
                    >
                      <Download className="w-4 h-4" />
                      Download
                    </Button>
                  </div>
                </div>
                
                {(nodeAIMode === 'create' || nodeAIMode === 'edit') ? (
                  <div className="space-y-4">
                    {result.explanation && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <h5 className="font-medium text-blue-900 mb-2">Explanation</h5>
                        <p className="text-blue-800 text-sm">{result.explanation}</p>
                      </div>
                    )}
                    
                    {result.nodes && result.nodes.length > 0 && (
                      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                        <h5 className="font-medium text-gray-900 mb-3">Updated Nodes</h5>
                        <div className="space-y-4">
                          {result.nodes.map((node: any, index: number) => (
                            <div key={index} className="bg-white border border-gray-200 rounded-lg p-3">
                              <h6 className="font-medium text-gray-800 mb-2">{node.name}</h6>
                              <div className="space-y-1">
                                {node.fields.map((field: any, fieldIndex: number) => (
                                  <div key={fieldIndex} className="flex items-center gap-2 text-sm">
                                    <span className="font-medium text-gray-700">{field.name}:</span>
                                    <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                                      {field.type}
                                    </span>
                                    {field.required && (
                                      <span className="px-2 py-1 bg-red-100 text-red-800 rounded text-xs">
                                        required
                                      </span>
                                    )}
                                    {field.description && (
                                      <span className="text-gray-500 text-xs">- {field.description}</span>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <pre className="whitespace-pre-wrap text-sm text-gray-800 font-mono">
                      {result.sql || JSON.stringify(result, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center text-gray-500 py-8">
                <p>Enter your request above and click "Generate" to start</p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 flex justify-between">
          <Button
            variant="outline"
            onClick={closeNodeAIModal}
          >
            Close
          </Button>
          {result && !isLoading && (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setResult(null);
                  setError('');
                }}
              >
                New Request
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}