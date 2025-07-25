import React, { useState } from 'react';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '../components/ui/tabs';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Separator } from '../components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { Plus, Trash2, Sparkles, Edit2, Check, X, Database, BarChart3, Columns, Calendar, Activity } from 'lucide-react';
import { useSchemaStore } from '../store';
import { usePreview } from '../hooks/usePreview';
import type { Field } from '../store';
import { FIELD_TYPE_SUGGESTIONS } from '../mockData';
import { fakeAI } from '../aiMock';
import { getAvailableViews } from '../lib/viewRegistry';

export default function PropertyPanel() {
  const { nodes, selectedNodeId, updateNode, addField, updateField, deleteField } = useSchemaStore();
  const { openPreview } = usePreview();
  const [isLoadingAI, setIsLoadingAI] = useState(false);
  const [aiReasoning, setAiReasoning] = useState<string>('');
  const [editingFieldId, setEditingFieldId] = useState<string | null>(null);
  const [tempFieldName, setTempFieldName] = useState('');
  const [isEditingTableName, setIsEditingTableName] = useState(false);
  const [tempTableName, setTempTableName] = useState('');

  const selectedNode = nodes.find((n) => n.id === selectedNodeId);

  if (!selectedNode) {
    return (
      <div className="p-6 text-center text-gray-500">
        <p className="text-sm">Select a table to view its properties</p>
      </div>
    );
  }

  const hasPaginatedList = selectedNode.data.binding?.capabilities?.includes('PaginatedList');
  const availableViews = selectedNode.data.binding?.capabilities 
    ? getAvailableViews(selectedNode.data.binding.capabilities)
    : [];
    
  const getViewIcon = (iconName: string) => {
    const icons: Record<string, React.ReactNode> = {
      'Database': <Database className="w-3 h-3 mr-2" />,
      'BarChart3': <BarChart3 className="w-3 h-3 mr-2" />,
      'Columns': <Columns className="w-3 h-3 mr-2" />,
      'Calendar': <Calendar className="w-3 h-3 mr-2" />,
      'Activity': <Activity className="w-3 h-3 mr-2" />,
    };
    return icons[iconName] || null;
  };

  const handleAddField = () => {
    const newField: Field = {
      id: `field_${Date.now()}`,
      name: 'newField',
      type: 'string',
    };
    addField(selectedNode.id, newField);
  };

  const handleFieldTypeChange = (fieldId: string, type: string) => {
    updateField(selectedNode.id, fieldId, { type });
  };

  const handleFieldNameEdit = (fieldId: string, currentName: string) => {
    setEditingFieldId(fieldId);
    setTempFieldName(currentName);
  };

  const handleFieldNameSave = (fieldId: string) => {
    if (tempFieldName.trim()) {
      updateField(selectedNode.id, fieldId, { name: tempFieldName.trim() });
    }
    setEditingFieldId(null);
    setTempFieldName('');
  };

  const handleFieldNameCancel = () => {
    setEditingFieldId(null);
    setTempFieldName('');
  };

  const handleTableNameEdit = () => {
    setIsEditingTableName(true);
    setTempTableName(selectedNode.data.name);
  };

  const handleTableNameSave = () => {
    if (tempTableName.trim()) {
      updateNode(selectedNode.id, { name: tempTableName.trim() });
    }
    setIsEditingTableName(false);
    setTempTableName('');
  };

  const handleTableNameCancel = () => {
    setIsEditingTableName(false);
    setTempTableName('');
  };

  const handleAISuggestion = async () => {
    setIsLoadingAI(true);
    setAiReasoning('');
    
    try {
      const suggestion = await fakeAI(selectedNode.data.name);
      
      // Replace existing fields with AI suggestions
      updateNode(selectedNode.id, { fields: suggestion.fields });
      
      if (suggestion.reasoning) {
        setAiReasoning(suggestion.reasoning);
      }
    } catch (error) {
      console.error('AI suggestion failed:', error);
    } finally {
      setIsLoadingAI(false);
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-gray-200">
        {isEditingTableName ? (
          <div className="flex items-center gap-2">
            <Input
              value={tempTableName}
              onChange={(e) => setTempTableName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleTableNameSave();
                if (e.key === 'Escape') handleTableNameCancel();
              }}
              className="text-lg font-semibold"
              autoFocus
            />
            <Button
              size="sm"
              onClick={handleTableNameSave}
              className="h-8 w-8 p-0"
            >
              <Check className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleTableNameCancel}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-2 group">
            <h2 className="text-lg font-semibold text-gray-900">{selectedNode.data.name}</h2>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleTableNameEdit}
              className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <Edit2 className="h-3 w-3" />
            </Button>
          </div>
        )}
        {selectedNode.data.binding && (
          <div className="mt-1 flex items-center gap-2">
            <Badge variant="secondary" className="text-xs">
              {selectedNode.data.binding.provider}
            </Badge>
          </div>
        )}
      </div>

      <Tabs defaultValue="fields" className="flex-1 flex flex-col">
        <TabsList className="mx-4 grid w-[calc(100%-2rem)] grid-cols-3">
          <TabsTrigger value="fields">Fields</TabsTrigger>
          <TabsTrigger value="binding">Binding</TabsTrigger>
          <TabsTrigger value="ai">AI Assistant</TabsTrigger>
        </TabsList>

        <TabsContent value="fields" className="flex-1 px-4 pb-4 overflow-y-auto">
          <div className="space-y-3">
            {/* Data Views Section - Only show for nodes with views available */}
            {availableViews.length > 0 && (
              <>
                <div className="space-y-3">
                  <div>
                    <Label className="text-sm font-medium">Data Views</Label>
                    <p className="text-xs text-gray-500 mt-1">
                      Visualize and explore data from this binding
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2">
                    {availableViews.map(view => (
                      <Button
                        key={view.id}
                        variant="outline"
                        size="sm"
                        className={`justify-start ${!view.enabled ? 'opacity-50' : ''}`}
                        disabled={!view.enabled}
                        onClick={() => {
                          if (view.id === 'table-view' && selectedNode.data.binding?.id) {
                            openPreview(selectedNode.id, selectedNode.data.binding.id);
                          }
                        }}
                        title={!view.enabled ? `${view.name} coming soon` : view.description}
                      >
                        {getViewIcon(view.icon)}
                        {view.name}
                      </Button>
                    ))}
                  </div>
                  
                  <div className="text-xs text-gray-400 italic">
                    More AI-generated views can be added based on your data structure
                  </div>
                </div>
                
                <Separator className="my-4" />
              </>
            )}

            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Table Fields</Label>
              <Button
                size="sm"
                variant="outline"
                onClick={handleAddField}
                className="h-8"
              >
                <Plus className="w-3 h-3 mr-1" />
                Add Field
              </Button>
            </div>

            <div className="space-y-2">
              {selectedNode.data.fields.map((field) => (
                <div
                  key={field.id}
                  className="flex items-center gap-2 p-2 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
                >
                  <div className="flex-1">
                    {editingFieldId === field.id ? (
                      <div className="flex items-center gap-1">
                        <Input
                          value={tempFieldName}
                          onChange={(e) => setTempFieldName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleFieldNameSave(field.id);
                            if (e.key === 'Escape') handleFieldNameCancel();
                          }}
                          className="h-7 text-sm"
                          autoFocus
                        />
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleFieldNameSave(field.id)}
                          className="h-7 w-7 p-0"
                        >
                          <Check className="w-3 h-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={handleFieldNameCancel}
                          className="h-7 w-7 p-0"
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                    ) : (
                      <div
                        className="flex items-center gap-1 cursor-pointer group"
                        onClick={() => handleFieldNameEdit(field.id, field.name)}
                      >
                        <span className="text-sm">{field.name}</span>
                        <Edit2 className="w-3 h-3 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    )}
                  </div>
                  <Select
                    value={field.type}
                    onValueChange={(value) => handleFieldTypeChange(field.id, value)}
                  >
                    <SelectTrigger className="w-[120px] h-7 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {FIELD_TYPE_SUGGESTIONS.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => deleteField(selectedNode.id, field.id)}
                    className="h-7 w-7 p-0 text-red-500 hover:text-red-600"
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="binding" className="flex-1 px-4 pb-4">
          {selectedNode.data.binding ? (
            <div className="space-y-4">
              <div>
                <Label className="text-sm">Provider</Label>
                <p className="mt-1 text-sm text-gray-700">
                  {selectedNode.data.binding.provider}
                </p>
              </div>
              <Separator />
              <div>
                <Label className="text-sm">Binding ID</Label>
                <p className="mt-1 text-xs font-mono text-gray-600">
                  {selectedNode.data.binding.id}
                </p>
              </div>
              <Separator />
              <div>
                <Label className="text-sm">Capabilities</Label>
                <div className="mt-2 flex flex-wrap gap-2">
                  {selectedNode.data.binding.capabilities.map((cap) => (
                    <Badge key={cap} variant="outline">
                      {cap}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p className="text-sm">No binding configured</p>
              <p className="text-xs mt-2">This is a custom table</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="ai" className="flex-1 px-4 pb-4">
          <div className="space-y-4">
            <div className="text-center py-4">
              <Sparkles className="w-8 h-8 text-blue-500 mx-auto mb-3" />
              <h3 className="text-sm font-medium text-gray-900 mb-1">
                AI Field Suggestions
              </h3>
              <p className="text-xs text-gray-500">
                Let AI suggest fields based on your table name
              </p>
            </div>

            <Button
              onClick={handleAISuggestion}
              disabled={isLoadingAI}
              className="w-full"
            >
              {isLoadingAI ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Thinking...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Suggest Fields
                </>
              )}
            </Button>

            {aiReasoning && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-xs text-blue-700">{aiReasoning}</p>
              </div>
            )}

            <div className="text-xs text-gray-500 italic">
              <p>Note: This will replace existing fields.</p>
              <p className="mt-1">The AI analyzes your table name to suggest relevant fields.</p>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
} 