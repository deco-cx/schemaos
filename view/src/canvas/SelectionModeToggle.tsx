import React from 'react';
import { MousePointer, Square } from 'lucide-react';
import { Button } from '../components/ui/button';
import { useSchemaStore } from '../store';

export default function SelectionModeToggle() {
  const { isSelectionMode, setSelectionMode } = useSchemaStore();

  return (
    <div className="absolute top-4 left-4 z-40 bg-white border border-gray-200 rounded-lg shadow-sm p-1 flex">
      <Button
        size="sm"
        variant={!isSelectionMode ? "default" : "ghost"}
        onClick={() => setSelectionMode(false)}
        className="flex items-center gap-2"
        title="Pan mode (V or P)"
      >
        <MousePointer className="w-4 h-4" />
        Pan
      </Button>
      <Button
        size="sm"
        variant={isSelectionMode ? "default" : "ghost"}
        onClick={() => setSelectionMode(true)}
        className="flex items-center gap-2"
        title="Selection mode (S)"
      >
        <Square className="w-4 h-4" />
        Select
      </Button>
    </div>
  );
}