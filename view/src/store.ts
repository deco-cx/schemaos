import { create } from 'zustand'
import type { Node, Edge, NodeChange, EdgeChange } from 'reactflow'
import { applyNodeChanges, applyEdgeChanges } from 'reactflow'
import type { Field } from './lib/schema-types'

export type MockCapability = 'PaginatedList' | 'WebhookSource' | 'BulkExport'

export interface MockBinding {
  id: string
  provider: string
  capabilities: MockCapability[]
  schema?: any // JSON Schema
}

// Field interface is now imported from schema-types.ts
// This ensures consistency between store and AI generation

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
  
  // Multi-selection state
  selectedNodeIds: Set<string>
  isSelectionMode: boolean
  isNodeAIModalOpen: boolean
  nodeAIMode: 'create' | 'edit' | 'sql' | 'import' | null

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
  
  // Bulk operations
  addMany: (nodes: ObjectNode[], edges: RelationEdge[]) => void
  
  // Selection
  setSelectedNode: (id: string | null) => void
  
  // Multi-selection operations
  toggleNodeSelection: (id: string) => void
  selectNodes: (ids: string[]) => void
  clearSelection: () => void
  setSelectionMode: (mode: boolean) => void
  openNodeAIModal: (mode: 'create' | 'edit' | 'sql') => void
  closeNodeAIModal: () => void
  
  // Field operations
  addField: (nodeId: string, field: Field) => void
  updateField: (nodeId: string, fieldId: string, updates: Partial<Field>) => void
  deleteField: (nodeId: string, fieldId: string) => void
  toggleFieldExpansion: (nodeId: string, fieldId: string) => void
  
  // UI operations
  toggleShowAllFields: (nodeId: string) => void
  
  // Edge sync
  syncEdgesWithRelations: () => void
  
  // Persistence
  saveToLocalStorage: () => void
  loadFromLocalStorage: () => void
  loadProjectData: (projectData: { nodes?: ObjectNode[], edges?: RelationEdge[] } | null) => void
  getProjectData: () => { nodes: ObjectNode[], edges: RelationEdge[] }
  reset: () => void
}

export const useSchemaStore = create<SchemaStore>((set, get) => ({
  nodes: [],
  edges: [],
  selectedNodeId: null,
  
  // Multi-selection state
  selectedNodeIds: new Set<string>(),
  isSelectionMode: false,
  isNodeAIModalOpen: false,
  nodeAIMode: null,

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
    set((state) => {
      const newSelection = new Set(state.selectedNodeIds);
      newSelection.delete(id);
      return {
        nodes: state.nodes.filter((node) => node.id !== id),
        edges: state.edges.filter((edge) => edge.source !== id && edge.target !== id),
        selectedNodeId: state.selectedNodeId === id ? null : state.selectedNodeId,
        selectedNodeIds: newSelection,
      };
    });
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

  // Bulk operations
  addMany: (nodes, edges) => {
    set((state) => ({
      nodes: [...state.nodes, ...nodes.map(node => ({ ...node, type: 'custom' } as ObjectNode))],
      edges: [...state.edges, ...edges],
    }));
    get().saveToLocalStorage();
  },

  // Selection
  setSelectedNode: (id) => {
    set({ selectedNodeId: id });
  },

  // Multi-selection operations
  toggleNodeSelection: (id) => {
    set((state) => {
      const newSelection = new Set(state.selectedNodeIds);
      if (newSelection.has(id)) {
        newSelection.delete(id);
      } else {
        newSelection.add(id);
      }
      return { selectedNodeIds: newSelection };
    });
  },

  selectNodes: (ids) => {
    set({ selectedNodeIds: new Set(ids) });
  },

  clearSelection: () => {
    set({ selectedNodeIds: new Set<string>() });
  },

  setSelectionMode: (mode) => {
    set({ isSelectionMode: mode });
    if (!mode) {
      get().clearSelection();
    }
  },

  openNodeAIModal: (mode) => {
    set({ isNodeAIModalOpen: true, nodeAIMode: mode });
  },

  closeNodeAIModal: () => {
    set({ isNodeAIModalOpen: false, nodeAIMode: null });
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
    // Sync edges if the new field has a relation
    if (field.relation) {
      get().syncEdgesWithRelations();
    }
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
    // Sync edges after field update (relations might have changed)
    get().syncEdgesWithRelations();
  },

  deleteField: (nodeId, fieldId) => {
    // Check if the field being deleted has a relation
    const node = get().nodes.find(n => n.id === nodeId);
    const fieldHasRelation = node?.data.fields.find(f => f.id === fieldId)?.relation;
    
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
    
    // Sync edges if the deleted field had a relation
    if (fieldHasRelation) {
      get().syncEdgesWithRelations();
    }
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

  // Sync edges based on field relations
  syncEdgesWithRelations: () => {
    const { nodes } = get();
    const expectedEdges = new Map<string, RelationEdge>();
    
    // Build expected edges from field relations
    nodes.forEach(sourceNode => {
      sourceNode.data.fields.forEach(field => {
        if (field.relation) {
          // Find target node by name
          const targetNode = nodes.find(n => n.data.name === field.relation!.targetEntity);
          if (targetNode) {
            const edgeKey = `${sourceNode.id}-${targetNode.id}`;
            const label = field.relation.isArray ? 'N-N' : field.relation.storage === 'join-table' ? 'N-N' : '1-N';
            
            expectedEdges.set(edgeKey, {
              id: `relation_${edgeKey}`,
              source: sourceNode.id,
              target: targetNode.id,
              type: 'relation',
              data: {
                label: label as '1-1' | '1-N' | 'N-N'
              }
            });
          }
        }
      });
    });
    
    // Get current edges (only relation edges)
    const currentEdges = get().edges.filter(e => e.type === 'relation');
    const currentEdgeKeys = new Set(currentEdges.map(e => `${e.source}-${e.target}`));
    
    // Determine edges to add and remove
    const edgesToAdd: RelationEdge[] = [];
    const edgesToRemove: string[] = [];
    
    // Find edges to add
    expectedEdges.forEach((edge, key) => {
      if (!currentEdgeKeys.has(key)) {
        edgesToAdd.push(edge);
      }
    });
    
    // Find edges to remove
    currentEdges.forEach(edge => {
      const key = `${edge.source}-${edge.target}`;
      if (!expectedEdges.has(key)) {
        edgesToRemove.push(edge.id);
      }
    });
    
    // Apply changes
    if (edgesToAdd.length > 0 || edgesToRemove.length > 0) {
      set(state => ({
        edges: [
          ...state.edges.filter(e => !edgesToRemove.includes(e.id)),
          ...edgesToAdd
        ]
      }));
      get().saveToLocalStorage();
    }
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

  // New methods for workspace integration
  loadProjectData: (projectData) => {
    const { nodes = [], edges = [] } = projectData || {};
    set({ 
      nodes, 
      edges,
      selectedNodeId: null,
      selectedNodeIds: new Set<string>(),
      isSelectionMode: false,
    });
  },

  getProjectData: () => {
    const { nodes, edges } = get();
    return { nodes, edges };
  },

  reset: () => {
    set({ 
      nodes: [], 
      edges: [], 
      selectedNodeId: null,
      selectedNodeIds: new Set<string>(),
      isSelectionMode: false,
      isNodeAIModalOpen: false,
      nodeAIMode: null,
    });
    localStorage.removeItem('schema_v1');
  },
})); 