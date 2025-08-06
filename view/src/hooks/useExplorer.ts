import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ExplorerQuery, Filter } from '../explorer/filterDsl';

interface ExplorerState {
  isOpen: boolean;
  query: ExplorerQuery | null;
  
  // Actions
  open: (entityId: string, initialFilters?: Filter[]) => void;
  close: () => void;
  setQuery: (query: ExplorerQuery) => void;
  addFilter: (filter: Filter) => void;
  removeFilter: (index: number) => void;
  updateFilter: (index: number, filter: Filter) => void;
  clearFilters: () => void;
}

export const useExplorer = create<ExplorerState>()(
  persist(
    (set) => ({
      isOpen: false,
      query: null,

      open: (entityId, initialFilters = []) => {
        set({
          isOpen: true,
          query: {
            entityId,
            filters: initialFilters
          }
        });
      },

      close: () => {
        set({ isOpen: false });
      },

      setQuery: (query) => {
        set({ query });
      },

      addFilter: (filter) => {
        set((state) => ({
          query: state.query
            ? {
                ...state.query,
                filters: [...state.query.filters, filter]
              }
            : null
        }));
      },

      removeFilter: (index) => {
        set((state) => ({
          query: state.query
            ? {
                ...state.query,
                filters: state.query.filters.filter((_, i) => i !== index)
              }
            : null
        }));
      },

      updateFilter: (index, filter) => {
        set((state) => ({
          query: state.query
            ? {
                ...state.query,
                filters: state.query.filters.map((f, i) => (i === index ? filter : f))
              }
            : null
        }));
      },

      clearFilters: () => {
        set((state) => ({
          query: state.query
            ? {
                ...state.query,
                filters: []
              }
            : null
        }));
      }
    }),
    {
      name: 'explorer_v1',
      partialize: (state) => ({ query: state.query }) // Only persist query
    }
  )
); 