import { usePreview } from '../hooks/usePreview';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '../components/ui/sheet';
import { PaginatedTable } from './PaginatedTable';

export function DataDrawer() {
  const { isOpen, closePreview, metadata, data } = usePreview();

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && closePreview()}>
      <SheetContent 
        side="right" 
        className="w-full sm:max-w-5xl lg:max-w-6xl overflow-y-auto p-0"
      >
        <div className="p-6 pb-0">
          <SheetHeader className="space-y-4">
            <div className="flex items-start justify-between pr-6">
              <div className="flex items-center gap-3">
                <span className="text-3xl">{metadata?.icon}</span>
                <div>
                  <SheetTitle className="text-2xl font-bold">
                    {metadata?.title || 'Data Preview'}
                  </SheetTitle>
                  <SheetDescription className="mt-1">
                    {metadata?.description || 'Preview and explore your data'}
                  </SheetDescription>
                </div>
              </div>
            </div>
          </SheetHeader>
        </div>

        <div className="p-6">
          {data && data.length > 0 ? (
            <PaginatedTable data={data} />
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="text-6xl mb-4">📭</div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                No data available
              </h3>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                This dataset doesn't contain any records yet.
              </p>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
} 