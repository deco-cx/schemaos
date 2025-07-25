import React, { useState, useRef, useEffect } from 'react';
import { X, Plus, Sparkles, Loader2 } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import type { Filter } from '../hooks/useExplorer';
import { formatFilter } from './filterDsl';
import { translateToFilters } from './aiFilter';
import { cn } from '../lib/utils';

interface FilterBarProps {
  entityId: string;
  entityName: string;
  filters: Filter[];
  onAddFilter: (filter: Filter) => void;
  onRemoveFilter: (index: number) => void;
  onUpdateFilter: (index: number, filter: Filter) => void;
  availableFields?: Array<{ name: string; type: string }>;
}

export function FilterBar({
  entityId,
  entityName,
  filters,
  onAddFilter,
  onRemoveFilter,
  onUpdateFilter,
  availableFields = [],
}: FilterBarProps) {
  const [aiPrompt, setAiPrompt] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [showAddFilter, setShowAddFilter] = useState(false);
  const [selectedField, setSelectedField] = useState('');
  const [selectedOp, setSelectedOp] = useState<string>('eq');
  const [filterValue, setFilterValue] = useState('');
  const [animatingFilters, setAnimatingFilters] = useState<number[]>([]);
  const aiInputRef = useRef<HTMLInputElement>(null);

  // Default fields if none provided
  const fields = availableFields.length > 0 ? availableFields : [
    { name: 'name', type: 'string' },
    { name: 'status', type: 'string' },
    { name: 'value', type: 'number' },
    { name: 'date', type: 'date' },
  ];

  const handleAiSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiPrompt.trim() || isAiLoading) return;

    setIsAiLoading(true);
    try {
      const newFilters = await translateToFilters(aiPrompt, entityId);
      
      // Add filters with animation
      const startIndex = filters.length;
      newFilters.forEach((filter, i) => {
        setTimeout(() => {
          onAddFilter(filter);
          setAnimatingFilters(prev => [...prev, startIndex + i]);
          
          // Remove animation after 1s
          setTimeout(() => {
            setAnimatingFilters(prev => prev.filter(idx => idx !== startIndex + i));
          }, 1000);
        }, i * 100);
      });
      
      setAiPrompt('');
    } catch (error) {
      console.error('AI filter error:', error);
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleAiKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && e.altKey) {
      e.preventDefault();
      handleAiSubmit(e as any);
    }
  };

  const handleManualAdd = () => {
    if (!selectedField || !filterValue) return;
    
    const filter: Filter = {
      field: selectedField,
      op: selectedOp as any,
      value: filterValue,
    };
    
    onAddFilter(filter);
    setShowAddFilter(false);
    setSelectedField('');
    setFilterValue('');
  };

  const getOperatorsForType = (type: string) => {
    switch (type) {
      case 'number':
        return [
          { value: 'eq', label: 'Equals' },
          { value: 'neq', label: 'Not equals' },
          { value: 'gt', label: 'Greater than' },
          { value: 'lt', label: 'Less than' },
        ];
      case 'string':
        return [
          { value: 'eq', label: 'Equals' },
          { value: 'neq', label: 'Not equals' },
          { value: 'contains', label: 'Contains' },
        ];
      default:
        return [
          { value: 'eq', label: 'Equals' },
          { value: 'neq', label: 'Not equals' },
        ];
    }
  };

  const selectedFieldType = fields.find(f => f.name === selectedField)?.type || 'string';
  const operators = getOperatorsForType(selectedFieldType);

  return (
    <div className="bg-white border-b">
      <div className="px-8 py-5 space-y-4">
        {/* Filter chips */}
        <div className="flex flex-wrap gap-2 items-center min-h-[32px]">
          {/* Entity filter (locked) - removed since it's redundant with header */}
        
          {/* User filters */}
          {filters.map((filter, index) => (
            <Badge
              key={index}
              variant="outline"
              className={cn(
                "gap-2 px-3 py-1.5 text-sm font-medium bg-white border-gray-200 hover:bg-gray-50 transition-all duration-200",
                animatingFilters.includes(index) && "animate-pulse ring-2 ring-blue-200 ring-offset-2 border-blue-300"
              )}
            >
              <span className="text-gray-700">{formatFilter(filter)}</span>
              <button
                onClick={() => onRemoveFilter(index)}
                className="ml-1 hover:text-red-600 text-gray-400 transition-colors rounded-full hover:bg-red-50 p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
          
          {/* Add filter button */}
          {!showAddFilter && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAddFilter(true)}
              className="h-8 gap-2 text-gray-600 border-gray-200 hover:bg-gray-50 hover:border-gray-300"
            >
              <Plus className="h-3.5 w-3.5" />
              Add filter
            </Button>
          )}
      </div>
      
        {/* Manual filter form */}
        {showAddFilter && (
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 animate-in slide-in-from-top-2">
            <div className="flex gap-3 items-center">
              <Select value={selectedField} onValueChange={setSelectedField}>
                <SelectTrigger className="w-36 h-9 bg-white border-gray-200">
                  <SelectValue placeholder="Choose field" />
                </SelectTrigger>
                <SelectContent>
                  {fields.map(field => (
                    <SelectItem key={field.name} value={field.name}>
                      {field.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select value={selectedOp} onValueChange={setSelectedOp}>
                <SelectTrigger className="w-36 h-9 bg-white border-gray-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {operators.map(op => (
                    <SelectItem key={op.value} value={op.value}>
                      {op.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Input
                placeholder="Enter value"
                value={filterValue}
                onChange={(e) => setFilterValue(e.target.value)}
                className="w-40 h-9 bg-white border-gray-200"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleManualAdd();
                }}
              />
              
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={handleManualAdd}
                  disabled={!selectedField || !filterValue}
                  className="h-9 px-4"
                >
                  Add
                </Button>
                
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setShowAddFilter(false);
                    setSelectedField('');
                    setFilterValue('');
                  }}
                  className="h-9 px-3 text-gray-500 hover:text-gray-700"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        )}
      
        {/* AI input */}
        <div className="border-t border-gray-100 pt-4">
          <form onSubmit={handleAiSubmit} className="relative">
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-purple-500" />
                <span className="text-sm font-medium text-gray-700">AI Filter</span>
              </div>
              <Input
                ref={aiInputRef}
                placeholder="Describe the data you want to see... (e.g., 'only VIP customers from Brazil')"
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                onKeyDown={handleAiKeyDown}
                disabled={isAiLoading}
                className="pl-24 pr-24 h-12 bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200 focus:border-purple-400 focus:ring-purple-400/20 placeholder:text-gray-500"
              />
              <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                {isAiLoading && <Loader2 className="h-4 w-4 animate-spin text-purple-500" />}
                <kbd className="text-xs text-gray-500 bg-white border border-gray-200 px-2 py-1 rounded shadow-sm">⌥+Enter</kbd>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 