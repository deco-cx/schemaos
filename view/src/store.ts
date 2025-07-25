import { create } from 'zustand'
import type { Node, Edge, NodeChange, EdgeChange } from 'reactflow'
import { applyNodeChanges, applyEdgeChanges } from 'reactflow'
import { MockData } from './mockData'

export type MockCapability = 'PaginatedList' | 'WebhookSource' | 'BulkExport'

export interface MockBinding {
  id: string
  provider: string
  capabilities: MockCapability[]
  schema?: any // JSON Schema
}

export interface Field {
  id: string
  name: string
  type: string
  required?: boolean
  description?: string
  // For expandable fields (arrays/objects)
  schema?: any // JSON Schema for nested structure
  expanded?: boolean // UI state for expansion
}

export interface ObjectNodeData {
  id: string
  name: string
  fields: Field[]
  binding?: MockBinding
  // UI state
  showAllFields?: boolean // Whether to show all fields or just first 5
}

export interface RelationEdgeData {
  label?: '1-1' | '1-N' | 'N-N'
}

// ReactFlow node and edge types
export type ObjectNode = Node<ObjectNodeData>
export type RelationEdge = Edge<RelationEdgeData>

interface SchemaStore {
  nodes: ObjectNode[]
  edges: RelationEdge[]
  selectedNodeId: string | null

  // Node operations
  addNode: (node: ObjectNode) => void
  updateNode: (id: string, data: Partial<ObjectNodeData>) => void
  deleteNode: (id: string) => void
  onNodesChange: (changes: NodeChange[]) => void
  
  // Edge operations
  addEdge: (edge: RelationEdge) => void
  updateEdge: (id: string, data: Partial<RelationEdgeData>) => void
  deleteEdge: (id: string) => void
  onEdgesChange: (changes: EdgeChange[]) => void
  
  // Selection
  setSelectedNode: (id: string | null) => void
  
  // Field operations
  addField: (nodeId: string, field: Field) => void
  updateField: (nodeId: string, fieldId: string, updates: Partial<Field>) => void
  deleteField: (nodeId: string, fieldId: string) => void
  toggleFieldExpansion: (nodeId: string, fieldId: string) => void
  
  // UI operations
  toggleShowAllFields: (nodeId: string) => void
  
  // Persistence
  saveToLocalStorage: () => void
  loadFromLocalStorage: () => void
  reset: () => void
}

export const useSchemaStore = create<SchemaStore>((set, get) => ({
  nodes: [],
  edges: [],
  selectedNodeId: null,

  // Node operations
  addNode: (node) => {
    set((state) => ({
      nodes: [...state.nodes, { ...node, type: 'custom' } as ObjectNode],
    }));
    get().saveToLocalStorage();
  },

  updateNode: (id, data) => {
    set((state) => ({
      nodes: state.nodes.map((node) =>
        node.id === id ? { ...node, data: { ...node.data, ...data } } : node
      ),
    }));
    get().saveToLocalStorage();
  },

  deleteNode: (id) => {
    set((state) => ({
      nodes: state.nodes.filter((node) => node.id !== id),
      edges: state.edges.filter((edge) => edge.source !== id && edge.target !== id),
      selectedNodeId: state.selectedNodeId === id ? null : state.selectedNodeId,
    }));
    get().saveToLocalStorage();
  },

  onNodesChange: (changes) => {
    set((state) => ({
      nodes: applyNodeChanges(changes, state.nodes),
    }));
    get().saveToLocalStorage();
  },

  // Edge operations
  addEdge: (edge) => {
    set((state) => ({
      edges: [...state.edges, edge],
    }));
    get().saveToLocalStorage();
  },

  updateEdge: (id, data) => {
    set((state) => ({
      edges: state.edges.map((edge) =>
        edge.id === id ? { ...edge, data: { ...edge.data, ...data } } : edge
      ),
    }));
    get().saveToLocalStorage();
  },

  deleteEdge: (id) => {
    set((state) => ({
      edges: state.edges.filter((edge) => edge.id !== id),
    }));
    get().saveToLocalStorage();
  },

  onEdgesChange: (changes) => {
    set((state) => ({
      edges: applyEdgeChanges(changes, state.edges),
    }));
    get().saveToLocalStorage();
  },

  // Selection
  setSelectedNode: (id) => {
    set({ selectedNodeId: id });
  },

  // Field operations
  addField: (nodeId, field) => {
    set((state) => ({
      nodes: state.nodes.map((node) =>
        node.id === nodeId
          ? {
              ...node,
              data: {
                ...node.data,
                fields: [...node.data.fields, field],
              },
            }
          : node
      ),
    }));
    get().saveToLocalStorage();
  },

  updateField: (nodeId, fieldId, updates) => {
    set((state) => ({
      nodes: state.nodes.map((node) =>
        node.id === nodeId
          ? {
              ...node,
              data: {
                ...node.data,
                fields: node.data.fields.map((field) =>
                  field.id === fieldId ? { ...field, ...updates } : field
                ),
              },
            }
          : node
      ),
    }));
    get().saveToLocalStorage();
  },

  deleteField: (nodeId, fieldId) => {
    set((state) => ({
      nodes: state.nodes.map((node) =>
        node.id === nodeId
          ? {
              ...node,
              data: {
                ...node.data,
                fields: node.data.fields.filter((field) => field.id !== fieldId),
              },
            }
          : node
      ),
    }));
    get().saveToLocalStorage();
  },

  toggleFieldExpansion: (nodeId, fieldId) => {
    set((state) => ({
      nodes: state.nodes.map((node) =>
        node.id === nodeId
          ? {
              ...node,
              data: {
                ...node.data,
                fields: node.data.fields.map((field) =>
                  field.id === fieldId ? { ...field, expanded: !field.expanded } : field
                ),
              },
            }
          : node
      ),
    }));
    get().saveToLocalStorage();
  },

  // UI operations
  toggleShowAllFields: (nodeId) => {
    set((state) => ({
      nodes: state.nodes.map((node) =>
        node.id === nodeId
          ? {
              ...node,
              data: {
                ...node.data,
                showAllFields: !node.data.showAllFields,
              },
            }
          : node
      ),
    }));
    get().saveToLocalStorage();
  },

  // Persistence
  saveToLocalStorage: () => {
    const { nodes, edges } = get();
    localStorage.setItem('schema_v1', JSON.stringify({ nodes, edges }));
  },

  loadFromLocalStorage: () => {
    const stored = localStorage.getItem('schema_v1');
    if (stored) {
      const { nodes, edges } = JSON.parse(stored);
      set({ nodes, edges });
    }
    // Start with empty canvas if no saved data
  },

  reset: () => {
    set({ nodes: [], edges: [], selectedNodeId: null });
    localStorage.removeItem('schema_v1');
  },
})); 