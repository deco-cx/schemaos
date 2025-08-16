import React, { useMemo, useState, useEffect } from 'react';
import { X, Settings, Database, Zap, ExternalLink } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '../components/ui/sheet';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { useExplorer } from '../hooks/useExplorer';
import FilterBar from './FilterBar';
import { PaginatedTable } from '../preview/PaginatedTable';
import { evaluateFilters } from './filterDsl';

export const ExplorerDrawer: React.FC = () => {
  const { isOpen, query, close, addFilter, removeFilter, updateFilter, clearFilters } = useExplorer();
  const [showWorkflowPanel, setShowWorkflowPanel] = useState(false);

  // Get entity data and metadata
  const entityParts = query?.entityId.split('.') || [];
  const entityName = entityParts[entityParts.length - 1] || '';
  // TODO: Fetch real data from database using SQL queries
  const entityData: any[] = [];

  // Apply filters to data
  const filteredData = useMemo(() => {
    if (!query?.filters || query.filters.length === 0) {
      return entityData;
    }
    return entityData.filter((row: any) => evaluateFilters(row, query.filters));
  }, [entityData, query?.filters]);

  const hasData = entityData.length > 0;

  if (!isOpen || !query) return null;

  return (
          <>
        <Sheet open={isOpen} onOpenChange={(open) => !open && close()}>
          <SheetContent 
            side="right"
            className="!w-[85vw] !max-w-[1800px] p-0 flex flex-col overflow-hidden !sm:max-w-none"
            style={{ maxWidth: '1800px', width: '85vw' }}
          >
          {/* Header */}
          <SheetHeader className="px-6 py-5 border-b bg-gray-50/50 flex-row items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white rounded-lg border shadow-sm">
                <Database className="h-5 w-5 text-gray-600" />
              </div>
              <div>
                <SheetTitle className="text-xl font-semibold text-gray-900 mb-1">
                  {entityName}
                </SheetTitle>
                <div className="flex items-center gap-3">
                  <Badge variant="secondary" className="text-xs">
                    Data Explorer
                  </Badge>
                  <span className="text-sm text-gray-500">
                    {filteredData.length.toLocaleString()} of {entityData.length.toLocaleString()} records
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {hasData && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowWorkflowPanel(!showWorkflowPanel)}
                  className={showWorkflowPanel ? "text-purple-600 bg-purple-50" : "text-gray-600"}
                >
                  <Settings className="h-4 w-4 mr-1" />
                  Automations
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                onClick={close}
                className="h-8 w-8"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </SheetHeader>

          {/* Filter Bar */}
          <FilterBar
            filters={query.filters}
            entityId={query.entityId}
            entityName={entityName}
            data={entityData}
            onAddFilter={addFilter}
            onRemoveFilter={removeFilter}
            onUpdateFilter={updateFilter}
            onClearFilters={clearFilters}
          />

          {/* Data Table and Workflow Panel */}
          <div className="flex-1 flex overflow-hidden">
            {/* Main Data View */}
            <div className={`flex-1 overflow-hidden p-6 transition-all duration-300 ${showWorkflowPanel ? 'pr-3' : ''}`}>
              {filteredData.length > 0 ? (
                <div className="h-full bg-white rounded-lg border shadow-sm">
                  <PaginatedTable
                    data={filteredData}
                    className="h-full"
                  />
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-gray-500">
                  <Database className="h-12 w-12 mb-4 text-gray-300" />
                  <p className="text-lg font-medium">No matching records</p>
                  <p className="text-sm mt-2">Try adjusting your filters</p>
                  {query.filters.length > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={clearFilters}
                      className="mt-4"
                    >
                      Clear all filters
                    </Button>
                  )}
                </div>
              )}
            </div>

            {/* Workflow Side Panel */}
            {showWorkflowPanel && (
              <div className="w-[400px] border-l bg-gray-50 p-6 overflow-y-auto">
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold flex items-center gap-2 mb-2">
                      <Zap className="h-5 w-5 text-purple-600" />
                      Workflow Automation
                    </h3>
                    <p className="text-sm text-gray-600">
                      Create automated workflows that trigger when data changes in {entityName}.
                    </p>
                  </div>

                  <div className="bg-white rounded-lg border p-6">
                    <div className="text-center">
                      <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Zap className="h-8 w-8 text-purple-600" />
                      </div>
                      <h4 className="font-medium mb-2">No workflows yet</h4>
                      <p className="text-sm text-gray-600 mb-6">
                        Set up your first automation to streamline your data operations.
                      </p>
                      <Button
                        onClick={() => window.open('https://ordenado.deco.page', '_blank')}
                        className="w-full bg-purple-600 hover:bg-purple-700"
                      >
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Create Workflow
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h4 className="text-sm font-medium text-gray-700">Popular Automations</h4>
                    <div className="space-y-2">
                      <div className="bg-white rounded-lg border p-3 hover:border-purple-300 cursor-pointer transition-colors">
                        <h5 className="font-medium text-sm">New Row Alert</h5>
                        <p className="text-xs text-gray-600 mt-1">Send notifications when new data is added</p>
                      </div>
                      <div className="bg-white rounded-lg border p-3 hover:border-purple-300 cursor-pointer transition-colors">
                        <h5 className="font-medium text-sm">Status Change Trigger</h5>
                        <p className="text-xs text-gray-600 mt-1">React to status field updates automatically</p>
                      </div>
                      <div className="bg-white rounded-lg border p-3 hover:border-purple-300 cursor-pointer transition-colors">
                        <h5 className="font-medium text-sm">Data Sync</h5>
                        <p className="text-xs text-gray-600 mt-1">Keep multiple systems in sync</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
};

export default ExplorerDrawer; 