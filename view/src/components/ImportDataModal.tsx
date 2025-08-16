import React, { useState, useEffect } from 'react';
import { 
  Database, 
  Sparkles, 
  Check, 
  Loader2, 
  Search,
  AlertCircle,
  FileText,
  ChevronRight
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { useImportData, ImportMode } from '../hooks/useImportData';
import { useSchemaStore } from '../store';
import type { SchemaSpec } from '../ai/types';
import type { ObjectNode, RelationEdge } from '../store';
import type { Field } from '../lib/schema-types';

interface ImportDataModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Convert AI schema spec to store format (reused from SchemaAssistantModal)
function convertSchemaToStoreFormat(schema: SchemaSpec): { nodes: ObjectNode[], edges: RelationEdge[] } {
  // Auto-layout: Improved grid positioning with better spacing
  const GRID_COLS = 3; // Reduced columns for wider spacing
  const NODE_WIDTH = 250; // Approximate node width
  const NODE_MIN_HEIGHT = 200; // Minimum node height
  const HORIZONTAL_SPACING = 150; // Space between columns
  const VERTICAL_SPACING = 100; // Space between rows
  const COL_WIDTH = NODE_WIDTH + HORIZONTAL_SPACING;
  const OFFSET_X = 100;
  const OFFSET_Y = 100;

  // Calculate row heights based on number of fields (dynamic spacing)
  const calculateNodeHeight = (fieldCount: number) => {
    const FIELD_HEIGHT = 30; // Approximate height per field
    const HEADER_HEIGHT = 60; // Space for title and controls
    return Math.max(NODE_MIN_HEIGHT, HEADER_HEIGHT + (fieldCount * FIELD_HEIGHT));
  };

  // Group nodes by rows and calculate cumulative row heights
  const rowHeights: number[] = [];
  for (let row = 0; row * GRID_COLS < schema.nodes.length; row++) {
    let maxHeightInRow = NODE_MIN_HEIGHT;
    for (let col = 0; col < GRID_COLS; col++) {
      const nodeIndex = row * GRID_COLS + col;
      if (nodeIndex < schema.nodes.length) {
        const nodeHeight = calculateNodeHeight(schema.nodes[nodeIndex].fields.length);
        maxHeightInRow = Math.max(maxHeightInRow, nodeHeight);
      }
    }
    rowHeights.push(maxHeightInRow);
  }

  // Calculate cumulative Y positions for each row
  const rowYPositions: number[] = [OFFSET_Y];
  for (let i = 0; i < rowHeights.length - 1; i++) {
    rowYPositions.push(rowYPositions[i] + rowHeights[i] + VERTICAL_SPACING);
  }

  const nodes: ObjectNode[] = schema.nodes.map((nodeSpec, index) => {
    const row = Math.floor(index / GRID_COLS);
    const col = index % GRID_COLS;
    
    return {
      id: nodeSpec.id,
      type: 'custom',
      position: { 
        x: OFFSET_X + col * COL_WIDTH, 
        y: rowYPositions[row] || (OFFSET_Y + row * (NODE_MIN_HEIGHT + VERTICAL_SPACING))
      },
      data: {
        id: nodeSpec.id,
        name: nodeSpec.name,
        fields: nodeSpec.fields.map(fieldSpec => ({
          id: `${nodeSpec.id}_${fieldSpec.name}_${Date.now()}_${Math.random()}`,
          name: fieldSpec.name,
          type: fieldSpec.type,
          required: !fieldSpec.isNullable
        })) as Field[]
      }
    };
  });

  const edges: RelationEdge[] = schema.edges.map(edgeSpec => ({
    id: `${edgeSpec.from}-${edgeSpec.to}-${Date.now()}`,
    source: edgeSpec.from,
    target: edgeSpec.to,
    type: 'relation',
    data: {
      label: edgeSpec.label
    }
  }));

  return { nodes, edges };
}

export function ImportDataModal({ isOpen, onClose }: ImportDataModalProps) {
  const [activeTab, setActiveTab] = useState<ImportMode>('natural-language');
  const [nlPrompt, setNlPrompt] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  
  const {
    isLoading,
    error,
    availableTables,
    selectedTables,
    loadAvailableTables,
    importFromDatabase,
    importFromNaturalLanguage,
    toggleTableSelection,
    selectAllTables,
    clearTableSelection,
  } = useImportData();

  const { addMany } = useSchemaStore();

  // Load tables when SQLite tab is activated
  useEffect(() => {
    if (activeTab === 'sqlite' && availableTables.length === 0 && isOpen) {
      loadAvailableTables();
    }
  }, [activeTab, availableTables.length, isOpen, loadAvailableTables]);

  // Filter tables based on search
  const filteredTables = availableTables.filter(table =>
    table.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleImport = async () => {
    let schema: SchemaSpec | null = null;

    if (activeTab === 'natural-language') {
      if (!nlPrompt.trim()) {
        return;
      }
      schema = await importFromNaturalLanguage(nlPrompt);
    } else {
      schema = await importFromDatabase();
    }

    if (schema) {
      const { nodes, edges } = convertSchemaToStoreFormat(schema);
      
      // Add to canvas
      addMany(nodes, edges);
      
      // Close modal
      onClose();
      
      // Reset state
      setNlPrompt('');
      setSearchQuery('');
      clearTableSelection();
    }
  };

  const examplePrompts = [
    "E-commerce platform with products, customers, orders, and payments",
    "Project management system with teams, projects, tasks, and comments",
    "Social media app with users, posts, comments, likes, and followers",
    "Learning management system with courses, lessons, students, and grades"
  ];

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Import Data Schema</DialogTitle>
          <DialogDescription>
            Import schema from natural language description or from your SQLite database
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as ImportMode)} className="flex-1 flex flex-col">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="natural-language" className="flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              Natural Language
            </TabsTrigger>
            <TabsTrigger value="sqlite" className="flex items-center gap-2">
              <Database className="w-4 h-4" />
              SQLite Database
            </TabsTrigger>
          </TabsList>

          <TabsContent value="natural-language" className="flex-1 flex flex-col gap-4 mt-4">
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Describe your data schema
                </label>
                <textarea
                  value={nlPrompt}
                  onChange={(e) => setNlPrompt(e.target.value)}
                  placeholder="Describe the entities, fields, and relationships you need..."
                  className="w-full h-32 px-3 py-2 border rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={isLoading}
                />
              </div>

              <div>
                <p className="text-sm text-gray-600 mb-2">Try an example:</p>
                <div className="flex flex-wrap gap-2">
                  {examplePrompts.map((example, idx) => (
                    <button
                      key={idx}
                      onClick={() => setNlPrompt(example)}
                      className="text-xs px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors text-left"
                      disabled={isLoading}
                    >
                      {example}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {error && (
              <div className="flex items-start gap-2 p-3 bg-red-50 text-red-700 rounded-md">
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span className="text-sm">{error}</span>
              </div>
            )}

            <div className="mt-auto pt-4 border-t flex justify-end gap-2">
              <Button variant="outline" onClick={onClose} disabled={isLoading}>
                Cancel
              </Button>
              <Button 
                onClick={handleImport} 
                disabled={!nlPrompt.trim() || isLoading}
                className="flex items-center gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Generate Schema
                  </>
                )}
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="sqlite" className="flex-1 flex flex-col gap-4 mt-4">
            <div className="space-y-4 flex-1">
              {/* Search and controls */}
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="Search tables..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                    disabled={isLoading}
                  />
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={loadAvailableTables}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    'Refresh'
                  )}
                </Button>
              </div>

              {/* Table selection controls */}
              {availableTables.length > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">
                    {selectedTables.size} of {filteredTables.length} tables selected
                  </span>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={selectAllTables}
                      disabled={isLoading}
                    >
                      Select All
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={clearTableSelection}
                      disabled={isLoading || selectedTables.size === 0}
                    >
                      Clear
                    </Button>
                  </div>
                </div>
              )}

              {/* Tables list */}
              <div className="border rounded-md overflow-hidden">
                {isLoading && availableTables.length === 0 ? (
                  <div className="p-8 text-center">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-gray-400" />
                    <p className="text-sm text-gray-600">Loading database tables...</p>
                  </div>
                ) : availableTables.length === 0 ? (
                  <div className="p-8 text-center">
                    <Database className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                    <p className="text-sm text-gray-600">No tables found in database</p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={loadAvailableTables}
                      className="mt-2"
                    >
                      Load Tables
                    </Button>
                  </div>
                ) : filteredTables.length === 0 ? (
                  <div className="p-8 text-center">
                    <Search className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                    <p className="text-sm text-gray-600">No tables match your search</p>
                  </div>
                ) : (
                  <div className="max-h-[300px] overflow-y-auto">
                    {filteredTables.map((table) => (
                      <button
                        key={table}
                        onClick={() => toggleTableSelection(table)}
                        disabled={isLoading}
                        className={`w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors border-b last:border-b-0 ${
                          selectedTables.has(table) ? 'bg-blue-50' : ''
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
                            selectedTables.has(table) 
                              ? 'border-blue-500 bg-blue-500' 
                              : 'border-gray-300'
                          }`}>
                            {selectedTables.has(table) && (
                              <Check className="w-3 h-3 text-white" />
                            )}
                          </div>
                          <FileText className="w-4 h-4 text-gray-400" />
                          <span className="font-medium">{table}</span>
                        </div>
                        <ChevronRight className="w-4 h-4 text-gray-400" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {error && (
              <div className="flex items-start gap-2 p-3 bg-red-50 text-red-700 rounded-md">
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span className="text-sm">{error}</span>
              </div>
            )}

            <div className="pt-4 border-t flex justify-end gap-2">
              <Button variant="outline" onClick={onClose} disabled={isLoading}>
                Cancel
              </Button>
              <Button 
                onClick={handleImport} 
                disabled={selectedTables.size === 0 || isLoading}
                className="flex items-center gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Importing...
                  </>
                ) : (
                  <>
                    <Database className="w-4 h-4" />
                    Import {selectedTables.size} Table{selectedTables.size !== 1 ? 's' : ''}
                  </>
                )}
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
