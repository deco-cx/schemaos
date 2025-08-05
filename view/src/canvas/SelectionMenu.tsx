import React from 'react';
import { Bot, FileText, X } from 'lucide-react';
import { Button } from '../components/ui/button';

interface SelectionMenuProps {
  count: number;
  onEditAI: () => void;
  onGenerateSQL: () => void;
  onClear: () => void;
}

export default function SelectionMenu({ count, onEditAI, onGenerateSQL, onClear }: SelectionMenuProps) {
  if (count === 0) return null;

  return (
    <div className="absolute top-4 right-4 z-50 bg-white border border-gray-200 rounded-lg shadow-lg p-3">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-sky-500 rounded-full"></div>
          <span className="text-sm font-medium text-gray-700">
            {count} node{count > 1 ? 's' : ''} selected
          </span>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={onEditAI}
            className="flex items-center gap-2"
          >
            <Bot className="w-4 h-4" />
            Edit with AI
          </Button>
          
          <Button
            size="sm"
            variant="outline"
            onClick={onGenerateSQL}
            className="flex items-center gap-2"
          >
            <FileText className="w-4 h-4" />
            Generate SQL
          </Button>
          
          <Button
            size="sm"
            variant="ghost"
            onClick={onClear}
            className="flex items-center gap-1 text-gray-500 hover:text-gray-700"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}