import React, { useMemo, useEffect } from 'react';
import { X, Database } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '../components/ui/sheet';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { useExplorer } from '../hooks/useExplorer';
import { FilterBar } from './FilterBar';
import { PaginatedTable } from '../preview/PaginatedTable';
import { evaluateFilters } from './filterDsl';
import { datasets } from '../mockData/datasets';

export function ExplorerDrawer() {
  const { isOpen, query, close, addFilter, removeFilter, updateFilter } = useExplorer();
  
  // Get mock data based on entityId
  const entityData = useMemo(() => {
    if (!query?.entityId) return null;
    
    // Map entityId to mock dataset
    const entityMap: Record<string, { data: any[]; name: string; fields?: any[] }> = {
      'shopify.orders': {
        data: datasets.shopify.orders,
        name: 'Orders',
        fields: [
          { name: 'orderNumber', type: 'string' },
          { name: 'customerName', type: 'string' },
          { name: 'total', type: 'number' },
          { name: 'status', type: 'string' },
          { name: 'date', type: 'date' },
        ],
      },
      'crm.customers': {
        data: datasets.crm.customers,
        name: 'Customers',
        fields: [
          { name: 'name', type: 'string' },
          { name: 'email', type: 'string' },
          { name: 'segment', type: 'string' },
          { name: 'score', type: 'number' },
          { name: 'totalSpent', type: 'number' },
        ],
      },
      'analytics.events': {
        data: datasets.analytics.events,
        name: 'Events',
        fields: [
          { name: 'eventType', type: 'string' },
          { name: 'userId', type: 'string' },
          { name: 'timestamp', type: 'date' },
          { name: 'value', type: 'number' },
        ],
      },
      'stripe.payments': {
        data: datasets.stripe.payments,
        name: 'Payments',
        fields: [
          { name: 'id', type: 'string' },
          { name: 'amount', type: 'number' },
          { name: 'currency', type: 'string' },
          { name: 'status', type: 'string' },
          { name: 'description', type: 'string' },
        ],
      },
      'mailchimp.campaigns': {
        data: datasets.mailchimp.campaigns,
        name: 'Campaigns',
        fields: [
          { name: 'name', type: 'string' },
          { name: 'status', type: 'string' },
          { name: 'sentCount', type: 'number' },
          { name: 'openRate', type: 'number' },
          { name: 'clickRate', type: 'number' },
        ],
      },
    };
    
    return entityMap[query.entityId] || null;
  }, [query?.entityId]);
  
  // Apply filters to data
  const filteredData = useMemo(() => {
    if (!entityData || !query) return [];
    
    return entityData.data.filter(row => evaluateFilters(row, query.filters));
  }, [entityData, query]);
  
  // Save query to sessionStorage on change
  useEffect(() => {
    if (query) {
      sessionStorage.setItem('explorer_v1', JSON.stringify(query));
    }
  }, [query]);
  
  // Load query from sessionStorage on mount
  useEffect(() => {
    const savedQuery = sessionStorage.getItem('explorer_v1');
    if (savedQuery && !query) {
      try {
        const parsed = JSON.parse(savedQuery);
        // Don't auto-open, just have it ready if they open explorer
      } catch (e) {
        console.error('Failed to parse saved query:', e);
      }
    }
  }, []);
  
  if (!query || !entityData) return null;
  
  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && close()}>
      <SheetContent 
        className="!w-[1600px] !max-w-[95vw] p-0 flex flex-col" 
        style={{ width: '1600px', maxWidth: '95vw' }}
      >
        <SheetHeader className="px-8 py-6 border-b bg-gray-50/50">
          <div className="flex items-center gap-4">
            <div className="p-2 bg-white rounded-lg border shadow-sm">
              <Database className="h-5 w-5 text-gray-600" />
            </div>
            <div>
              <SheetTitle className="text-xl font-semibold text-gray-900 mb-1">
                {entityData.name}
              </SheetTitle>
              <div className="flex items-center gap-3">
                <Badge variant="secondary" className="text-xs font-medium">
                  Data Explorer
                </Badge>
                <div className="text-sm text-gray-500">
                  {filteredData.length.toLocaleString()} {filteredData.length === 1 ? 'row' : 'rows'}
                </div>
              </div>
            </div>
          </div>
        </SheetHeader>
        
        <FilterBar
          entityId={query.entityId}
          entityName={entityData.name}
          filters={query.filters}
          onAddFilter={addFilter}
          onRemoveFilter={removeFilter}
          onUpdateFilter={updateFilter}
          availableFields={entityData.fields}
        />
        
        <div className="flex-1 overflow-hidden bg-white">
          {filteredData.length > 0 ? (
            <div className="h-full p-8 pt-6">
              <PaginatedTable
                data={filteredData}
                className="h-full"
              />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center px-8">
              <div className="p-4 bg-gray-50 rounded-full mb-6">
                <Database className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No matching rows</h3>
              <p className="text-gray-500 mb-6 max-w-md">
                Your current filters don't match any data. Try adjusting or removing some filters to see results.
              </p>
              {query.filters.length > 0 && (
                <div className="flex flex-wrap gap-2 justify-center">
                  {query.filters.map((_, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      size="sm"
                      onClick={() => removeFilter(index)}
                      className="text-sm border-gray-200 hover:bg-gray-50"
                    >
                      Remove filter {index + 1}
                    </Button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
} 