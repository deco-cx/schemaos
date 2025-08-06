import React, { useState } from 'react';
import { X, Search, Plus, CheckCircle2, Circle, Database, Sparkles } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { useDataSources } from '../hooks/useDataSources';
import { useSchemaStore } from '../store';
import { INTEGRATIONS, MOCK_BINDINGS } from '../mockData';
import { cn } from '../lib/utils';
import type { ObjectNode } from '../store';

export function DataSourceModal() {
  const { isModalOpen, closeModal, availableDataSources, addEntity, addAllEntities, isEntityAdded } = useDataSources();
  const { addNode } = useSchemaStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDataSource, setSelectedDataSource] = useState<string | null>(null);
  const [addedInSession, setAddedInSession] = useState<Set<string>>(new Set());

  if (!isModalOpen) return null;

  const handleAddEntity = (entityId: string) => {
    // Find the integration data
    const integration = INTEGRATIONS.find((i: any) => i.id === entityId);
    if (!integration) return;

    // Find the binding
    const binding = MOCK_BINDINGS.find(b => b.id === entityId);
    if (!binding) return;

    // Add to canvas
    const position = {
      x: 100 + (addedInSession.size % 4) * 320,
      y: 100 + Math.floor(addedInSession.size / 4) * 200,
    };

    const newNode: ObjectNode = {
      id: `node_${Date.now()}_${Math.random()}`,
      type: 'custom',
      position,
      data: {
        id: `node_${Date.now()}_${Math.random()}`,
        name: `${binding.provider} ${entityId.split('.')[1]?.charAt(0).toUpperCase()}${entityId.split('.')[1]?.slice(1) || ''}`,
        fields: integration.fields || [],
        binding,
        showAllFields: false,
      },
    };

    addNode(newNode);

    // Track additions
    addEntity(entityId);
    setAddedInSession(new Set([...addedInSession, entityId]));
    
    // Close modal after a short delay to show the addition
    setTimeout(() => {
      closeModal();
    }, 500);
  };

  const handleAddAllEntities = (dataSourceId: string) => {
    const dataSource = availableDataSources.find(ds => ds.id === dataSourceId);
    if (!dataSource) return;

    dataSource.entities.forEach((entity, index) => {
      if (!isEntityAdded(entity.id) && !addedInSession.has(entity.id)) {
        setTimeout(() => {
          handleAddEntity(entity.id);
        }, index * 100); // Stagger the additions for visual effect
      }
    });

    addAllEntities(dataSourceId);
    
    // Close modal after all entities are added
    setTimeout(() => {
      closeModal();
    }, dataSource.entities.length * 100 + 500);
  };

  const filteredDataSources = availableDataSources.filter(ds =>
    ds.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    ds.entities.some(e => e.name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const getEntityCount = (dataSourceId: string) => {
    const ds = availableDataSources.find(d => d.id === dataSourceId);
    if (!ds) return { total: 0, added: 0 };
    
    const added = ds.entities.filter(e => isEntityAdded(e.id) || addedInSession.has(e.id)).length;
    return { total: ds.entities.length, added };
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[85vh] flex flex-col animate-in slide-in-from-bottom-4">
        {/* Header */}
        <div className="px-8 py-6 border-b bg-gradient-to-r from-purple-50 to-blue-50">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Add Data Sources</h2>
              <p className="text-gray-600 mt-1">Connect your apps and databases to start building</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={closeModal}
              className="h-10 w-10 rounded-full hover:bg-white/80"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
          
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search apps or entities..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-11 bg-white/80 border-white/20 focus:bg-white"
            />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8">
          <div className="grid gap-6">
            {filteredDataSources.map((dataSource) => {
              const { total, added } = getEntityCount(dataSource.id);
              const isExpanded = selectedDataSource === dataSource.id;
              const allAdded = added === total;

              return (
                <div
                  key={dataSource.id}
                  className={cn(
                    "bg-white rounded-xl border-2 transition-all duration-200",
                    isExpanded ? "border-blue-200 shadow-lg" : "border-gray-200 hover:border-gray-300 hover:shadow-md"
                  )}
                >
                  {/* Data Source Header */}
                  <div
                    className="p-6 cursor-pointer"
                    onClick={() => setSelectedDataSource(isExpanded ? null : dataSource.id)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4">
                        <div className={cn("p-3 rounded-xl text-2xl", dataSource.color, "bg-opacity-10")}>
                          {dataSource.icon}
                        </div>
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-900">{dataSource.name}</h3>
                          <p className="text-sm text-gray-600 mt-1">{dataSource.description}</p>
                          
                          {/* Account Selector */}
                          {dataSource.account && (
                            <div className="flex items-center gap-2 mt-3">
                              <span className="text-sm text-gray-500">Account:</span>
                              <select 
                                className="text-sm px-3 py-1 border border-gray-200 rounded-md bg-white hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <option>{dataSource.account}</option>
                              </select>
                            </div>
                          )}
                          
                          <div className="flex items-center gap-3 mt-3">
                            <Badge variant="secondary" className="text-xs">
                              {total} entities
                            </Badge>
                            {added > 0 && (
                              <Badge variant="outline" className="text-xs text-green-700 border-green-200 bg-green-50">
                                <CheckCircle2 className="h-3 w-3 mr-1" />
                                {added} added
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <Button
                        variant={allAdded ? "outline" : "default"}
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAddAllEntities(dataSource.id);
                        }}
                        disabled={allAdded}
                        className="ml-4"
                      >
                        {allAdded ? (
                          <>
                            <CheckCircle2 className="h-4 w-4 mr-2" />
                            All Added
                          </>
                        ) : (
                          <>
                            <Plus className="h-4 w-4 mr-2" />
                            Add All
                          </>
                        )}
                      </Button>
                    </div>
                  </div>

                  {/* Entities List */}
                  {isExpanded && (
                    <div className="border-t px-6 py-4 bg-gray-50/50">
                      <div className="grid gap-3">
                        {dataSource.entities.map((entity) => {
                          const isAdded = isEntityAdded(entity.id) || addedInSession.has(entity.id);
                          
                          return (
                            <div
                              key={entity.id}
                              className={cn(
                                "flex items-center justify-between p-4 rounded-lg border bg-white transition-all",
                                isAdded ? "border-green-200 bg-green-50/50" : "border-gray-200 hover:border-gray-300 hover:shadow-sm"
                              )}
                            >
                              <div className="flex items-center gap-3">
                                {isAdded ? (
                                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                                ) : (
                                  <Circle className="h-5 w-5 text-gray-400" />
                                )}
                                <div>
                                  <h4 className="font-medium text-gray-900">{entity.name}</h4>
                                  {entity.description && (
                                    <p className="text-sm text-gray-600 mt-0.5">{entity.description}</p>
                                  )}
                                  <div className="flex items-center gap-3 mt-2">
                                    {entity.fields && (
                                      <span className="text-xs text-gray-500">
                                        {entity.fields} fields
                                      </span>
                                    )}
                                    {entity.records && (
                                      <span className="text-xs text-gray-500">
                                        {entity.records.toLocaleString()} records
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                              
                              <Button
                                variant={isAdded ? "ghost" : "outline"}
                                size="sm"
                                onClick={() => handleAddEntity(entity.id)}
                                disabled={isAdded}
                              >
                                {isAdded ? "Added" : "Add"}
                              </Button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="px-8 py-4 border-t bg-gray-50/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Sparkles className="h-4 w-4 text-purple-500" />
              <span>Tip: Double-click any entity to explore its data</span>
            </div>
            <Button variant="outline" onClick={closeModal}>
              Done
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
} 