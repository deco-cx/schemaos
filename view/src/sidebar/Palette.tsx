import React from 'react';
import type { DragEvent } from 'react';
import { Database, Plus, Sparkles, ChevronRight } from 'lucide-react';
import { Button } from '../components/ui/button';
import { useDataSources } from '../hooks/useDataSources';
import { Badge } from '../components/ui/badge';
import { MOCK_BINDINGS } from '../mockData';
import type { MockBinding } from '../store';

export default function Palette() {
  const { openModal, availableDataSources, isEntityAdded } = useDataSources();
  
  const onDragStart = (event: DragEvent, nodeType: string, binding?: MockBinding) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    if (binding) {
      event.dataTransfer.setData('binding', JSON.stringify(binding));
    }
    event.dataTransfer.effectAllowed = 'move';
  };

  // Get all added entities grouped by data source
  const addedEntitiesBySource = availableDataSources
    .map(ds => ({
      ...ds,
      addedEntities: ds.entities.filter(e => isEntityAdded(e.id))
    }))
    .filter(ds => ds.addedEntities.length > 0);

  return (
    <div className="p-4 space-y-4">
      <div>
        <h3 className="text-sm font-medium text-gray-700 mb-3">Tables</h3>
        <div className="space-y-2">
          <div
            className="flex items-center gap-2 p-3 bg-white border border-gray-200 rounded-lg cursor-move hover:border-blue-300 hover:shadow-sm transition-all"
            onDragStart={(event) => onDragStart(event, 'custom')}
            draggable
          >
            <Plus className="w-4 h-4 text-gray-500" />
            <span className="text-sm text-gray-700">Blank Table</span>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-medium text-gray-700 mb-3">Data Sources</h3>
        <Button
          variant="outline"
          size="sm"
          onClick={openModal}
          className="w-full justify-start gap-2 h-auto p-3"
        >
          <div className="p-1.5 bg-gradient-to-br from-purple-100 to-blue-100 rounded">
            <Database className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-left">
            <div className="text-sm font-medium text-gray-900">Add Data Source</div>
            <div className="text-xs text-gray-500">Connect apps & databases</div>
          </div>
          <Sparkles className="w-3 h-3 text-purple-500 ml-auto" />
        </Button>

        {/* Added Data Sources */}
        {addedEntitiesBySource.length > 0 && (
          <div className="mt-4 space-y-3">
            {addedEntitiesBySource.map(dataSource => (
              <div key={dataSource.id} className="space-y-2">
                <div className="flex items-center gap-2 px-1">
                  <span className="text-xs font-medium text-gray-600">{dataSource.name}</span>
                  <Badge variant="secondary" className="text-xs px-1.5 py-0">
                    {dataSource.addedEntities.length}
                  </Badge>
                </div>
                {dataSource.addedEntities.map(entity => {
                  const binding = MOCK_BINDINGS.find(b => b.id === entity.id);
                  if (!binding) return null;
                  
                  return (
                    <div
                      key={entity.id}
                      className="flex items-center gap-2 p-2 bg-white border border-gray-200 rounded cursor-move hover:border-blue-300 hover:shadow-sm transition-all text-xs"
                      onDragStart={(event) => onDragStart(event, 'custom', binding)}
                      draggable
                    >
                      <ChevronRight className="w-3 h-3 text-gray-400" />
                      <span className="text-gray-700 truncate">{entity.name}</span>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="border-t pt-4">
        <h3 className="text-sm font-medium text-gray-700 mb-2">Legend</h3>
        <div className="space-y-2 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-gray-600">Data-ready (double-click to explore)</span>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs h-5">PaginatedList</Badge>
            <span className="text-gray-600">Supports data exploration</span>
          </div>
        </div>
      </div>
    </div>
  );
} 