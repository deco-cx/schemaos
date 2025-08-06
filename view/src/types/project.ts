// Import types from schema store
import type { ObjectNode, RelationEdge } from '../store';

// Team structure from Deco API TEAMS_LIST
export interface Team {
  id: number;
  name: string;
  slug: string;
  theme?: {
    picture?: string;
    variables?: Record<string, string>;
  };
  created_at: string;
  avatar_url?: string;
}

// Workspace can be linked to a Deco Team or be local
export interface Workspace {
  id: string;        // uuid local
  name: string;
  teamId?: number;   // Deco team ID (optional, null = local)
  createdAt: string; // ISO
  updatedAt: string;
  isLocal: boolean;  // true = localStorage, false = linked to Deco
}

// Project data structure (reusing existing app state)
export interface ProjectData {
  nodes: ObjectNode[];  // Schema nodes
  edges: RelationEdge[];  // Relations between nodes
  explorer?: {
    filters?: Record<string, unknown>;
    settings?: Record<string, unknown>;
  };
  preview?: {
    dataSources?: Record<string, unknown>[];
    currentView?: string;
  };
  // Add other existing app state as needed
}

export interface Project {
  id: string;        // uuid
  workspaceId: string;
  name: string;
  data: ProjectData; // Schema, nodes, edges, explorer filters...
  createdAt: string;
  updatedAt: string;
}

// Session state for quick restoration
export interface SessionState {
  currentWorkspaceId: string | null;
  currentProjectId: string | null;
  lastUpdated: string;
}