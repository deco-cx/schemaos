import { create } from 'zustand';

// Filter DSL types
export type Filter =
  | { field: string; op: "eq" | "neq" | "gt" | "lt" | "contains" | "in"; value: any }
  | { op: "and" | "or"; filters: Filter[] };

export interface ExplorerQuery {
  entityId: string;           // binding.id e.g. "shopify.orders"
  filters: Filter[];          // AND by default; optional nested ops
}

interface ExplorerState {
  isOpen: boolean;
  query: ExplorerQuery | null;
  open: (entityId: string, initialFilters?: Filter[]) => void;
  close: () => void;
  setQuery: (query: ExplorerQuery) => void;
  addFilter: (filter: Filter) => void;
  removeFilter: (index: number) => void;
  updateFilter: (index: number, filter: Filter) => void;
}

export const useExplorer = create<ExplorerState>((set) => ({
  isOpen: false,
  query: null,
  
  open: (entityId: string, initialFilters: Filter[] = []) => {
    set({
      isOpen: true,
      query: {
        entityId,
        filters: initialFilters,
      },
    });
  },
  
  close: () => {
    set({ isOpen: false, query: null });
  },
  
  setQuery: (query: ExplorerQuery) => {
    set({ query });
  },
  
  addFilter: (filter: Filter) => {
    set((state) => ({
      query: state.query
        ? { ...state.query, filters: [...state.query.filters, filter] }
        : null,
    }));
  },
  
  removeFilter: (index: number) => {
    set((state) => ({
      query: state.query
        ? {
            ...state.query,
            filters: state.query.filters.filter((_, i) => i !== index),
          }
        : null,
    }));
  },
  
  updateFilter: (index: number, filter: Filter) => {
    set((state) => ({
      query: state.query
        ? {
            ...state.query,
            filters: state.query.filters.map((f, i) => (i === index ? filter : f)),
          }
        : null,
    }));
  },
})); 