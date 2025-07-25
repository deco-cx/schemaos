import React, { useMemo, useState, useEffect } from 'react';
import { X, Settings, Database, Zap, ExternalLink } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '../components/ui/sheet';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { useExplorer } from '../hooks/useExplorer';
import FilterBar from './FilterBar';
import { PaginatedTable } from '../preview/PaginatedTable';
import { evaluateFilters } from './filterDsl';
import { DATASET_METADATA } from '../mockData/datasets';

export const ExplorerDrawer: React.FC = () => {
  const { isOpen, query, close, addFilter, removeFilter, updateFilter, clearFilters } = useExplorer();
  const [showWorkflowModal, setShowWorkflowModal] = useState(false);

  if (!isOpen || !query) return null;

  // Get entity data and metadata
  const entityParts = query.entityId.split('.');
  const entityName = entityParts[entityParts.length - 1];
  const entityMetadata = DATASET_METADATA[query.entityId as keyof typeof DATASET_METADATA];
  const entityData = entityMetadata?.data || [];

  // Apply filters to data
  const filteredData = useMemo(() => {
    if (!query.filters || query.filters.length === 0) {
      return entityData;
    }
    return entityData.filter((row: any) => evaluateFilters(row, query.filters));
  }, [entityData, query.filters]);

  const hasData = entityData.length > 0;

  return (
    <>
      <Sheet open={isOpen} onOpenChange={(open) => !open && close()}>
        <SheetContent className="w-[800px] max-w-[90vw] p-0 flex flex-col">
          {/* Header */}
          <SheetHeader className="px-6 py-4 border-b flex-row items-center justify-between">
            <div className="flex items-center gap-3">
              <Database className="h-5 w-5 text-gray-500" />
              <SheetTitle className="flex items-center gap-2">
                <Badge variant="secondary">{entityName}</Badge>
                <span className="text-sm text-gray-500">
                  {filteredData.length} of {entityData.length} records
                </span>
              </SheetTitle>
            </div>
            <div className="flex items-center gap-2">
              {hasData && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowWorkflowModal(true)}
                  className="text-gray-600"
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

          {/* Data Table */}
          <div className="flex-1 overflow-hidden">
            {filteredData.length > 0 ? (
              <PaginatedTable
                data={filteredData}
                className="h-full"
              />
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
        </SheetContent>
      </Sheet>

      {/* Workflow Start Modal */}
      {showWorkflowModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Zap className="h-5 w-5 text-purple-600" />
                  Start Workflow
                </h3>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowWorkflowModal(false)}
                  className="h-8 w-8"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <div className="text-center py-8">
                <Zap className="h-16 w-16 text-purple-600 mx-auto mb-4" />
                <h4 className="text-lg font-medium mb-2">Ready to automate {entityName}?</h4>
                <p className="text-gray-600 mb-6">
                  Create powerful workflows to automate actions when data changes in this collection.
                </p>
                <Button
                  size="lg"
                  onClick={() => window.open('https://ordenado.deco.page', '_blank')}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  <ExternalLink className="h-5 w-5 mr-2" />
                  Start Workflow
                </Button>
                <p className="text-xs text-gray-500 mt-4">
                  You'll be redirected to Ordenado to create and manage your workflow
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ExplorerDrawer; 