import React from 'react';
import type { DragEvent } from 'react';
import { Plus } from 'lucide-react';
import { Badge } from '../components/ui/badge';

export default function Palette() {
  const onDragStart = (event: DragEvent, nodeType: string) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  };

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