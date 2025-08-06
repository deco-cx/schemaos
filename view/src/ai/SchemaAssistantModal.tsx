import React, { useState } from 'react';
import { Sparkles, ArrowRight, ArrowLeft, Check, AlertCircle, Loader2, Lightbulb, Database } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Separator } from '../components/ui/separator';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '../components/ui/sheet';
import { useSchemaAI, getExamplePrompts } from './useSchemaAI';
import { useSchemaStore } from '../store';
import { client } from '../lib/rpc';
import type { SchemaSpec, NodeSpec } from './types';
import type { ObjectNode, RelationEdge } from '../store';
import type { Field } from '../lib/schema-types';

// Convert AI schema spec to store format
function convertSchemaToStoreFormat(schema: SchemaSpec): { nodes: ObjectNode[], edges: RelationEdge[] } {
  const nodes: ObjectNode[] = schema.nodes.map((nodeSpec, index) => ({
    id: nodeSpec.id,
    type: 'custom',
    position: { 
      x: 200 + (index % 3) * 300, 
      y: 100 + Math.floor(index / 3) * 200 
    },
    data: {
      id: nodeSpec.id,
      name: nodeSpec.name,
      fields: nodeSpec.fields.map(fieldSpec => ({
        id: `${nodeSpec.id}_${fieldSpec.name}_${Date.now()}`,
        name: fieldSpec.name,
        type: fieldSpec.type,
        required: !fieldSpec.isNullable
      })) as Field[]
    }
  }));

  const edges: RelationEdge[] = schema.edges.map(edgeSpec => ({
    id: `${edgeSpec.from}-${edgeSpec.to}`,
    source: edgeSpec.from,
    target: edgeSpec.to,
    type: 'relation',
    data: {
      label: edgeSpec.label
    }
  }));

  return { nodes, edges };
}

function PromptStep() {
  const { prompt, setPrompt, processPrompt, isProcessing, parseResult, setGeneratedSchema, setStep } = useSchemaAI();
  const [selectedExample, setSelectedExample] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const examples = getExamplePrompts();

  const handleExampleClick = (example: string) => {
    setPrompt(example);
    setSelectedExample(example);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (prompt.trim() && !isProcessing) {
      processPrompt();
    }
  };

  const handleImportFromDB = async () => {
    setIsImporting(true);
    
    try {
      // Run introspection query
      const response = await client.RUN_SQL({
        sql: `SELECT 
                m.name AS table_name,
                p.name AS column_name,
                p.type AS data_type,
                p.pk AS is_primary_key,
                p."notnull" AS is_not_null
              FROM 
                sqlite_master m
              JOIN 
                pragma_table_info(m.name) p
              WHERE 
                m.type = 'table'
                AND m.name NOT LIKE 'sqlite_%'
              ORDER BY 
                m.name,
                p.cid;`
      });

      if (!response.result?.[0]?.success || !response.result[0].results) {
        throw new Error('Failed to fetch database schema');
      }

      const rows = response.result[0].results as Array<{
        table_name: string;
        column_name: string;
        data_type: string;
        is_primary_key: number;
        is_not_null: number;
      }>;

      // Group by table
      const tableMap = new Map<string, Array<typeof rows[0]>>();
      rows.forEach(row => {
        if (!tableMap.has(row.table_name)) {
          tableMap.set(row.table_name, []);
        }
        tableMap.get(row.table_name)!.push(row);
      });

      // Convert to schema format
      const nodes: NodeSpec[] = Array.from(tableMap.entries()).map(([tableName, columns]) => ({
        id: `table_${tableName}`,
        name: tableName,
        fields: columns.map(col => ({
          name: col.column_name,
          type: mapSQLiteToSchemaType(col.data_type),
          isPrimary: col.is_primary_key === 1,
          isNullable: col.is_not_null === 0
        }))
      }));

      const schema: SchemaSpec = {
        nodes,
        edges: [] // No relationship inference for now
      };

      setGeneratedSchema(schema);
      setStep('summary');
    } catch (error) {
      console.error('Import from DB failed:', error);
      // Could show error toast here
    } finally {
      setIsImporting(false);
    }
  };

  // Map SQLite types to schema types
  const mapSQLiteToSchemaType = (sqliteType: string): "string" | "number" | "boolean" | "datetime" | "text" | "email" | "enum" => {
    const type = sqliteType.toUpperCase();
    if (type.includes('INT')) return 'number';
    if (type.includes('TEXT') || type.includes('VARCHAR') || type.includes('CHAR')) return 'string';
    if (type.includes('REAL') || type.includes('FLOAT') || type.includes('DOUBLE')) return 'number';
    if (type.includes('BLOB')) return 'string';
    if (type.includes('BOOLEAN') || type.includes('BOOL')) return 'boolean';
    if (type.includes('DATE') || type.includes('TIME')) return 'datetime';
    return 'string'; // fallback
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-900/20 mb-2">
          <Sparkles className="w-6 h-6 text-purple-600 dark:text-purple-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Describe Your Schema</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Tell me about the data structure you want to create. I'll generate tables and relationships for you.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Development mode notice */}
        <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
          <p className="text-sm text-amber-700 dark:text-amber-400">
            🚧 Development Mode: Using local AI simulation. For production, configure authentication.
          </p>
        </div>
        
        <div>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Describe your data structure... e.g., 'I need customers with orders. Each customer has name, email, and phone. Orders have total amount, status, and creation date.'"
            className="w-full h-32 p-3 border border-gray-200 dark:border-gray-700 rounded-lg resize-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
            disabled={isProcessing}
          />
        </div>

        {parseResult && !parseResult.success && (
          <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <div className="flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
              <div className="space-y-1">
                {parseResult.errors?.map((error, index) => (
                  <p key={index} className="text-sm text-red-700 dark:text-red-400">
                    {error.message}
                  </p>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="space-y-3">
          <Button 
            type="submit" 
            className="w-full" 
            disabled={!prompt.trim() || isProcessing || isImporting}
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                Generate Schema
                <ArrowRight className="w-4 h-4 ml-2" />
              </>
            )}
          </Button>
          
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-gray-200 dark:border-gray-700" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white dark:bg-gray-900 px-2 text-gray-500 dark:text-gray-400">or</span>
            </div>
          </div>
          
          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={handleImportFromDB}
            disabled={isProcessing || isImporting}
          >
            {isImporting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Importing...
              </>
            ) : (
              <>
                <Database className="w-4 h-4 mr-2" />
                Import from Workspace DB
              </>
            )}
          </Button>
        </div>
      </form>

      <div className="space-y-3">
        <div className="flex items-center space-x-2">
          <Lightbulb className="w-4 h-4 text-yellow-500" />
          <span className="text-sm font-medium text-gray-900 dark:text-gray-100">Try these examples:</span>
        </div>
        <div className="grid gap-2">
          {examples.slice(0, 3).map((example, index) => (
            <button
              key={index}
              onClick={() => handleExampleClick(example)}
              className={`p-3 text-left text-sm border rounded-lg transition-colors ${
                selectedExample === example
                  ? 'border-purple-200 bg-purple-50 dark:border-purple-700 dark:bg-purple-900/20 text-purple-900 dark:text-purple-100'
                  : 'border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
              disabled={isProcessing}
            >
              {example}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function SummaryStep() {
  const { generatedSchema, validationErrors, goBackToPrompt, applySchema } = useSchemaAI();

  if (!generatedSchema) {
    return null;
  }

  const hasBlockingErrors = validationErrors.some(e => e.type === 'error');

  return (
    <div className="flex flex-col h-full">
      <div className="text-center space-y-2 mb-6">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/20 mb-2">
          <Check className="w-6 h-6 text-green-600 dark:text-green-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Schema Generated</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Review the generated tables and relationships below.
        </p>
      </div>

      {/* Schema Summary - Scrollable content */}
      <div className="flex-1 overflow-y-auto space-y-6 mb-6 pr-4">
        <div>
          <h4 className="font-semibold text-lg mb-4 flex items-center text-gray-900 dark:text-gray-100">
            Tables ({generatedSchema.nodes.length})
          </h4>
          <div className="space-y-4">
            {generatedSchema.nodes.map((node) => (
              <div key={node.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-5 bg-white dark:bg-gray-800 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <h5 className="font-medium text-lg text-gray-900 dark:text-gray-100">{node.name}</h5>
                  <Badge variant="secondary" className="text-xs">
                    {node.fields.length} fields
                  </Badge>
                </div>
                <div className="space-y-2">
                  {node.fields.map((field) => (
                    <div key={field.name} className="flex items-center justify-between text-sm py-2 px-2 border-b border-gray-100 dark:border-gray-700 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded transition-colors">
                      <div className="flex items-center space-x-2">
                        <span className={`w-2 h-2 rounded-full flex-shrink-0 ${
                          field.isPrimary ? 'bg-yellow-400' : 'bg-gray-300 dark:bg-gray-600'
                        }`} />
                        <span className="text-gray-900 dark:text-gray-100 font-mono text-xs">{field.name}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline" className="text-xs">
                          {field.type}
                        </Badge>
                        {field.isPrimary && (
                          <Badge variant="default" className="text-xs bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                            PK
                          </Badge>
                        )}
                        {!field.isNullable && !field.isPrimary && (
                          <Badge variant="secondary" className="text-xs">
                            Required
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {generatedSchema.edges.length > 0 && (
          <>
            <Separator />
            <div>
              <h4 className="font-semibold text-lg mb-4 flex items-center text-gray-900 dark:text-gray-100">
                Relationships ({generatedSchema.edges.length})
              </h4>
              <div className="space-y-3">
                {generatedSchema.edges.map((edge, index) => {
                  const fromNode = generatedSchema.nodes.find(n => n.id === edge.from);
                  const toNode = generatedSchema.nodes.find(n => n.id === edge.to);
                  
                  return (
                    <div key={index} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
                      <div className="flex items-center space-x-3">
                        <div className="text-sm">
                          <span className="font-medium text-gray-900 dark:text-gray-100">{fromNode?.name}</span>
                        </div>
                        <ArrowRight className="w-4 h-4 text-gray-400" />
                        <Badge variant="outline" className="text-xs font-mono">
                          {edge.label}
                        </Badge>
                        <ArrowRight className="w-4 h-4 text-gray-400" />
                        <div className="text-sm">
                          <span className="font-medium text-gray-900 dark:text-gray-100">{toNode?.name}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}

        {/* Validation Errors */}
        {validationErrors.length > 0 && (
          <div className="space-y-2 mt-4">
            {validationErrors.map((error, index) => (
              <div 
                key={index} 
                className={`p-3 rounded-lg border ${
                  error.type === 'error' 
                    ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800' 
                    : 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'
                }`}
              >
                <div className="flex items-start space-x-2">
                  <AlertCircle className={`w-4 h-4 mt-0.5 flex-shrink-0 ${
                    error.type === 'error' ? 'text-red-500' : 'text-yellow-500'
                  }`} />
                  <p className={`text-sm ${
                    error.type === 'error' 
                      ? 'text-red-700 dark:text-red-400' 
                      : 'text-yellow-700 dark:text-yellow-400'
                  }`}>
                    {error.nodeId && `${error.nodeId}: `}
                    {error.message}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Actions - Fixed at bottom */}
      <div className="flex space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
        <Button variant="outline" onClick={goBackToPrompt} className="flex-1">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Edit Prompt
        </Button>
        <Button 
          onClick={applySchema} 
          disabled={hasBlockingErrors}
          className="flex-1"
        >
          Add to Canvas
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}

function ApplyingStep() {
  return (
    <div className="text-center space-y-4 py-8">
      <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/20 mb-2">
        <Loader2 className="w-6 h-6 text-blue-600 dark:text-blue-400 animate-spin" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Adding to Canvas</h3>
      <p className="text-sm text-gray-600 dark:text-gray-400">
        Creating your schema nodes and relationships...
      </p>
    </div>
  );
}

export function SchemaAssistantModal() {
  const { isOpen, closeModal, currentStep, generatedSchema } = useSchemaAI();
  const { addMany } = useSchemaStore();

  React.useEffect(() => {
    if (currentStep === 'applying' && generatedSchema) {
      // Convert and apply schema
      const { nodes, edges } = convertSchemaToStoreFormat(generatedSchema);
      
      // Simulate application delay for better UX
      setTimeout(() => {
        addMany(nodes, edges);
        closeModal();
        
        // Show success toast (you might want to add a toast system)
        console.log(`✅ Added ${nodes.length} tables and ${edges.length} relationships to canvas`);
      }, 1500);
    }
  }, [currentStep, generatedSchema, addMany, closeModal]);

  return (
    <Sheet open={isOpen} onOpenChange={closeModal}>
      <SheetContent className="w-full sm:max-w-3xl md:max-w-4xl lg:max-w-6xl xl:max-w-7xl bg-white dark:bg-gray-900 overflow-y-auto p-0">
        <SheetHeader className="px-8 pt-8 pb-6 border-b border-gray-200 dark:border-gray-800">
          <SheetTitle className="flex items-center space-x-2 text-gray-900 dark:text-gray-100">
            <Sparkles className="w-5 h-5 text-purple-600" />
            <span>AI Schema Assistant</span>
          </SheetTitle>
          <SheetDescription className="text-gray-600 dark:text-gray-400">
            Generate database schemas from natural language descriptions
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-col h-[calc(100vh-200px)] px-8 py-6">
          <div className="flex-1 overflow-y-auto">
            {currentStep === 'prompt' && <PromptStep />}
            {currentStep === 'summary' && <SummaryStep />}
            {currentStep === 'applying' && <ApplyingStep />}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}