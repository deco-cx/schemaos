import { create } from 'zustand';

interface PreviewState {
  isOpen: boolean;
  nodeId: string | null;
  bindingId: string | null;
  data: any[] | null;
  metadata: {
    title: string;
    description: string;
    icon: string;
  } | null;
  
  // Actions
  openPreview: (nodeId: string, bindingId: string) => void;
  closePreview: () => void;
}

export const usePreview = create<PreviewState>((set) => ({
  isOpen: false,
  nodeId: null,
  bindingId: null,
  data: null,
  metadata: null,
  
  openPreview: (nodeId: string, bindingId: string) => {
    // TODO: Implement real data preview using SQL queries
    // For now, just open with empty data
    set({
      isOpen: true,
      nodeId,
      bindingId,
      data: [],
      metadata: {
        title: 'Data Preview',
        description: 'Live data preview will be available soon',
        icon: 'Database',
      },
    });
  },
  
  closePreview: () => {
    set({
      isOpen: false,
      nodeId: null,
      bindingId: null,
      data: null,
      metadata: null,
    });
  },
})); 