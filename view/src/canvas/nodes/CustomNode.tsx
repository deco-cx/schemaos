import React from 'react';
import { Handle, Position } from 'reactflow';
import type { NodeProps } from 'reactflow';
import { ChevronDown, ChevronUp, Database, Zap, Download } from 'lucide-react';
import { useSchemaStore } from '../../store';
import { usePreview } from '../../hooks/usePreview';
import type { ObjectNodeData } from '../../store';

export default function CustomNode({ id, data, selected }: NodeProps<ObjectNodeData>) {
  const { toggleShowAllFields, toggleFieldExpansion } = useSchemaStore();
  const { openPreview } = usePreview();
  
  const fieldsToShow = data.showAllFields ? data.fields : data.fields.slice(0, 5);
  const hasMoreFields = data.fields.length > 5;
  const isExpanded = data.showAllFields;
  
  const handleDoubleClick = () => {
    // Check if node has PaginatedList capability and a bindingId
    if (data.binding?.capabilities?.includes('PaginatedList') && data.binding?.id) {
      openPreview(id, data.binding.id);
    }
  };

  const getCapabilityIcon = (capability: string) => {
    switch (capability) {
      case 'PaginatedList': return <Database className="w-3 h-3" />;
      case 'WebhookSource': return <Zap className="w-3 h-3" />;
      case 'BulkExport': return <Download className="w-3 h-3" />;
      default: return null;
    }
  };

  const getFieldTypeColor = (type: string) => {
    const colors = {
      string: 'bg-blue-100 text-blue-800',
      number: 'bg-green-100 text-green-800',
      boolean: 'bg-purple-100 text-purple-800',
      date: 'bg-orange-100 text-orange-800',
      datetime: 'bg-orange-100 text-orange-800',
      email: 'bg-cyan-100 text-cyan-800',
      url: 'bg-indigo-100 text-indigo-800',
      uuid: 'bg-gray-100 text-gray-800',
      enum: 'bg-yellow-100 text-yellow-800',
      json: 'bg-pink-100 text-pink-800',
      array: 'bg-red-100 text-red-800',
      object: 'bg-teal-100 text-teal-800',
    };
    return colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const hasPaginatedList = data.binding?.capabilities?.includes('PaginatedList');

  return (
    <div 
      className={`bg-white rounded-lg border-2 transition-all duration-200 min-w-[280px] ${
        selected ? 'border-blue-500 shadow-lg' : 'border-gray-200 shadow-sm hover:shadow-md'
      } ${hasPaginatedList ? 'cursor-pointer' : ''}`}
      onDoubleClick={handleDoubleClick}
      title={hasPaginatedList ? 'Double-click to preview data' : undefined}
    >
      <Handle type="target" position={Position.Left} className="w-3 h-3 bg-gray-400" />
      <Handle type="source" position={Position.Right} className="w-3 h-3 bg-gray-400" />
      
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-gray-900 text-sm">{data.name}</h3>
          {data.binding && (
            <div className="flex items-center gap-1">
              {data.binding.capabilities?.map((capability, index) => (
                <div key={index} className="flex items-center gap-1 px-2 py-1 bg-gray-100 rounded-md">
                  {getCapabilityIcon(capability)}
                  <span className="text-xs text-gray-600">{capability}</span>
                </div>
              ))}
            </div>
          )}
        </div>
        
        {data.binding && (
          <div className="mt-2 flex items-center gap-2">
            <span className="text-xs text-gray-500">Binding:</span>
            <span className="text-xs font-medium text-blue-600">{data.binding.id}</span>
          </div>
        )}
      </div>

      {/* Fields */}
      <div className="relative">
        <div className="px-4 py-3">
          {fieldsToShow.length === 0 ? (
            <p className="text-sm text-gray-500 italic">No fields yet</p>
          ) : (
            <div className="space-y-2">
              {fieldsToShow.map((field, index) => (
                <div key={field.id}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-700">{field.name}</span>
                      <span className={`px-2 py-1 rounded-md text-xs font-medium ${getFieldTypeColor(field.type)}`}>
                        {field.type}
                        {(field.type === 'array' || field.type === 'object') && field.schema && (
                          <span className="ml-1 text-xs opacity-70">
                            {field.type === 'array' ? '[]' : '{}'}
                          </span>
                        )}
                      </span>
                    </div>
                    {(field.type === 'array' || field.type === 'object' || field.type === 'json') && field.schema && (
                      <button 
                        onClick={() => toggleFieldExpansion(data.id, field.id)}
                        className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                      >
                        {field.expanded ? 'collapse' : 'expand'}
                      </button>
                    )}
                  </div>
                  
                  {/* Expanded nested schema */}
                  {field.expanded && field.schema && (
                    <div className="ml-4 mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="text-xs text-blue-700 font-medium mb-2">
                        {field.type === 'array' ? 'Array Items:' : 'Object Properties:'}
                      </div>
                      {field.schema.properties ? (
                        <div className="space-y-1">
                          {Object.entries(field.schema.properties).slice(0, 3).map(([propName, propSchema]: [string, any]) => (
                            <div key={propName} className="flex items-center gap-2 text-xs">
                              <span className="text-gray-600">{propName}:</span>
                              <span className={`px-1.5 py-0.5 rounded text-xs ${getFieldTypeColor(propSchema.type || 'string')}`}>
                                {propSchema.type || 'string'}
                              </span>
                            </div>
                          ))}
                          {Object.keys(field.schema.properties).length > 3 && (
                            <div className="text-xs text-gray-500 italic">
                              +{Object.keys(field.schema.properties).length - 3} more...
                            </div>
                          )}
                        </div>
                      ) : field.schema.items && field.type === 'array' ? (
                        <div className="text-xs">
                          <span className="text-gray-600">Items: </span>
                          <span className={`px-1.5 py-0.5 rounded ${getFieldTypeColor(field.schema.items.type || 'string')}`}>
                            {field.schema.items.type || 'string'}
                          </span>
                        </div>
                      ) : (
                        <div className="text-xs text-gray-500 italic">No schema details available</div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Shadow effect and expand button */}
        {hasMoreFields && !isExpanded && (
          <div className="absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-white via-white/80 to-transparent pointer-events-none" />
        )}
        
        {hasMoreFields && (
          <div className="px-4 pb-3 pt-1 border-t border-gray-50">
            <button
              onClick={() => toggleShowAllFields(data.id)}
              className="w-full flex items-center justify-center gap-2 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded-md transition-colors"
            >
              {isExpanded ? (
                <>
                  <ChevronUp className="w-4 h-4" />
                  Show less ({data.fields.length - 5} hidden)
                </>
              ) : (
                <>
                  <ChevronDown className="w-4 h-4" />
                  Show all ({data.fields.length - 5} more)
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
} 