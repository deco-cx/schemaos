import React from 'react';
import type { DragEvent } from 'react';
import { Database, Plus, Zap, Package, Bell } from 'lucide-react';
import { MOCK_BINDINGS } from '../mockData';
import type { MockBinding } from '../store';

export default function Palette() {
  const onDragStart = (event: DragEvent, nodeType: string, binding?: MockBinding) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    if (binding) {
      event.dataTransfer.setData('binding', JSON.stringify(binding));
    }
    event.dataTransfer.effectAllowed = 'move';
  };

  const getCapabilityIcon = (capability: string) => {
    switch (capability) {
      case 'PaginatedList':
        return <Package className="w-3 h-3" />;
      case 'WebhookSource':
        return <Bell className="w-3 h-3" />;
      case 'BulkExport':
        return <Zap className="w-3 h-3" />;
      default:
        return null;
    }
  };

  return (
    <div className="p-4 space-y-4">
      <div>
        <h3 className="text-sm font-medium text-gray-700 mb-3">New Table</h3>
        <div
          className="flex items-center gap-2 p-3 bg-white border border-gray-200 rounded-lg cursor-move hover:border-blue-300 hover:shadow-sm transition-all"
          onDragStart={(event) => onDragStart(event, 'custom')}
          draggable
        >
          <Plus className="w-4 h-4 text-gray-500" />
          <span className="text-sm text-gray-700">Blank Table</span>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-medium text-gray-700 mb-3">Data Sources</h3>
        <div className="space-y-2">
          {MOCK_BINDINGS.map((binding) => (
            <div
              key={binding.id}
              className="p-3 bg-white border border-gray-200 rounded-lg cursor-move hover:border-blue-300 hover:shadow-sm transition-all"
              onDragStart={(event) => onDragStart(event, 'custom', binding)}
              draggable
            >
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <Database className="w-4 h-4 text-blue-500" />
                  <span className="text-sm font-medium text-gray-900">
                    {binding.provider}
                  </span>
                </div>
              </div>
              <p className="text-xs text-gray-500 mb-2">{binding.id}</p>
              <div className="flex gap-1">
                {binding.capabilities.map((cap) => (
                  <div
                    key={cap}
                    className="flex items-center gap-1 px-1.5 py-0.5 bg-gray-100 rounded text-xs text-gray-600"
                    title={cap}
                  >
                    {getCapabilityIcon(cap)}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="pt-4 border-t border-gray-200">
        <p className="text-xs text-gray-500 italic">
          Drag items to the canvas to add them to your schema
        </p>
      </div>
    </div>
  );
} 