import React, { useState, useRef, useEffect } from 'react';
import { X, Plus, Sparkles, ChevronDown } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import type { Filter, FilterOperator } from './filterDsl';
import { filterToString, getFieldsFromData } from './filterDsl';
import { translateToFilter, getAISuggestions } from './aiFilter';

interface FilterBarProps {
  filters: Filter[];
  entityId: string;
  entityName: string;
  data: any[];
  onAddFilter: (filter: Filter) => void;
  onRemoveFilter: (index: number) => void;
  onUpdateFilter: (index: number, filter: Filter) => void;
  onClearFilters: () => void;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  filters,
  entityId,
  entityName,
  data,
  onAddFilter,
  onRemoveFilter,
  onUpdateFilter,
  onClearFilters
}) => {
  const [showAddFilter, setShowAddFilter] = useState(false);
  const [aiInput, setAiInput] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const aiInputRef = useRef<HTMLInputElement>(null);

  const availableFields = getFieldsFromData(data);

  useEffect(() => {
    setSuggestions(getAISuggestions(entityId));
  }, [entityId]);

  const handleAiSubmit = async () => {
    if (!aiInput.trim() || isAiLoading) return;

    setIsAiLoading(true);
    try {
      const newFilters = await translateToFilter(aiInput, availableFields);
      newFilters.forEach(filter => {
        onAddFilter(filter);
        // Animate the new filter chip
        setTimeout(() => {
          const chips = document.querySelectorAll('.filter-chip');
          const lastChip = chips[chips.length - 1];
          if (lastChip) {
            lastChip.classList.add('animate-pulse');
            setTimeout(() => lastChip.classList.remove('animate-pulse'), 1000);
          }
        }, 100);
      });
      setAiInput('');
    } catch (error) {
      console.error('AI filter error:', error);
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleAddManualFilter = () => {
    if (availableFields.length > 0) {
      const newFilter: Filter = {
        field: availableFields[0],
        op: 'eq',
        value: ''
      };
      onAddFilter(newFilter);
      setEditingIndex(filters.length);
    }
    setShowAddFilter(false);
  };

  return (
    <div className="border-b border-gray-100 bg-white px-6 py-4">
      <div className="flex flex-wrap items-center gap-2">
        {/* Entity filter (locked) */}
        <Badge variant="secondary" className="filter-chip">
          Entity = {entityName}
        </Badge>

        {/* User filters */}
        {filters.map((filter, index) => (
          <Badge
            key={index}
            variant="outline"
            className="filter-chip cursor-pointer hover:bg-gray-100 transition-colors"
            onClick={() => setEditingIndex(editingIndex === index ? null : index)}
          >
            {editingIndex === index ? (
              <FilterEditor
                filter={filter}
                availableFields={availableFields}
                onSave={(updated) => {
                  onUpdateFilter(index, updated);
                  setEditingIndex(null);
                }}
                onCancel={() => setEditingIndex(null)}
              />
            ) : (
              <>
                <span className="mr-1">{filterToString(filter)}</span>
                <X
                  className="h-3 w-3 cursor-pointer hover:text-red-500"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemoveFilter(index);
                  }}
                />
              </>
            )}
          </Badge>
        ))}

        {/* Add filter dropdown */}
        <div className="relative">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowAddFilter(!showAddFilter)}
            className="h-7"
          >
            <Plus className="h-3 w-3 mr-1" />
            Add filter
          </Button>
          {showAddFilter && (
            <div className="absolute top-full left-0 mt-1 bg-white border rounded-md shadow-lg p-2 z-10">
              <button
                className="block w-full text-left px-3 py-1 hover:bg-gray-100 rounded text-sm"
                onClick={handleAddManualFilter}
              >
                Manual filter
              </button>
              <button
                className="block w-full text-left px-3 py-1 hover:bg-gray-100 rounded text-sm"
                onClick={() => {
                  setShowAddFilter(false);
                  setTimeout(() => aiInputRef.current?.focus(), 100);
                }}
              >
                AI filter
              </button>
            </div>
          )}
        </div>

        {/* AI input */}
        <div className="flex-1 max-w-md relative">
          <Input
            ref={aiInputRef}
            type="text"
            placeholder="Ask AI... (⌥+Enter)"
            value={aiInput}
            onChange={(e) => setAiInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.metaKey || e.altKey)) {
                handleAiSubmit();
              }
            }}
            className="pl-8 pr-4 h-8"
            disabled={isAiLoading}
          />
          <Sparkles className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          {isAiLoading && (
            <div className="absolute right-2 top-1/2 -translate-y-1/2">
              <div className="animate-spin h-4 w-4 border-2 border-gray-300 border-t-gray-600 rounded-full" />
            </div>
          )}
        </div>

        {/* Clear all */}
        {filters.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearFilters}
            className="h-7 text-gray-500"
          >
            Clear all
          </Button>
        )}
      </div>

      {/* AI suggestions */}
      {aiInput.length === 0 && suggestions.length > 0 && (
        <div className="mt-2 flex gap-2 flex-wrap">
          <span className="text-xs text-gray-500">Try:</span>
          {suggestions.map((suggestion, index) => (
            <button
              key={index}
              className="text-xs text-blue-600 hover:underline"
              onClick={() => setAiInput(suggestion)}
            >
              "{suggestion}"
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// Mini inline filter editor
const FilterEditor: React.FC<{
  filter: Filter;
  availableFields: string[];
  onSave: (filter: Filter) => void;
  onCancel: () => void;
}> = ({ filter, availableFields, onSave, onCancel }) => {
  const [field, setField] = useState('field' in filter ? filter.field : '');
  const [op, setOp] = useState<FilterOperator>('op' in filter && filter.op !== 'and' && filter.op !== 'or' ? filter.op : 'eq');
  const [value, setValue] = useState('value' in filter ? String(filter.value) : '');

  const operators: { value: FilterOperator; label: string }[] = [
    { value: 'eq', label: '=' },
    { value: 'neq', label: '≠' },
    { value: 'gt', label: '>' },
    { value: 'lt', label: '<' },
    { value: 'gte', label: '≥' },
    { value: 'lte', label: '≤' },
    { value: 'contains', label: 'contains' },
    { value: 'startsWith', label: 'starts with' },
    { value: 'endsWith', label: 'ends with' }
  ];

  return (
    <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
      <select
        value={field}
        onChange={(e) => setField(e.target.value)}
        className="text-xs border rounded px-1 py-0.5"
      >
        {availableFields.map(f => (
          <option key={f} value={f}>{f}</option>
        ))}
      </select>
      <select
        value={op}
        onChange={(e) => setOp(e.target.value as FilterOperator)}
        className="text-xs border rounded px-1 py-0.5"
      >
        {operators.map(o => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="text-xs border rounded px-1 py-0.5 w-20"
        placeholder="value"
      />
      <button
        onClick={() => onSave({ field, op, value: isNaN(Number(value)) ? value : Number(value) })}
        className="text-xs text-green-600 hover:underline"
      >
        ✓
      </button>
      <button
        onClick={onCancel}
        className="text-xs text-red-600 hover:underline"
      >
        ✗
      </button>
    </div>
  );
};

export default FilterBar; 