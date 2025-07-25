import { create } from 'zustand';
import { DATASET_METADATA } from '../mockData/datasets';

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
    // Look up the dataset based on bindingId
    const dataset = DATASET_METADATA[bindingId as keyof typeof DATASET_METADATA];
    
    if (dataset) {
      set({
        isOpen: true,
        nodeId,
        bindingId,
        data: dataset.data,
        metadata: {
          title: dataset.title,
          description: dataset.description,
          icon: dataset.icon,
        },
      });
    } else {
      console.warn(`No dataset found for binding ID: ${bindingId}`);
    }
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