import { client } from '../lib/rpc';
import type { Team, Workspace, Project, ProjectData } from '../types/project';
import type { IProjectRepository, SessionState } from './IProjectRepository';

const STORAGE_KEY = 'schemaos.v2';
const SESSION_KEY = 'schemaos.session';

interface StorageData {
  version: number;
  workspaces: Workspace[];
  projects: Project[];
  lastMigration?: string;
}

export class LocalProjectRepository implements IProjectRepository {
  private storage: StorageData;

  constructor() {
    this.storage = this.loadStorage();
    this.migrateIfNeeded();
  }

  private loadStorage(): StorageData {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (data) {
        return JSON.parse(data);
      }
    } catch (error) {
      console.error('Failed to load storage:', error);
    }

    // Return default storage structure
    return {
      version: 2,
      workspaces: [],
      projects: [],
    };
  }

  private saveStorage(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.storage));
    } catch (error) {
      console.error('Failed to save storage:', error);
      throw new Error('Failed to save data to localStorage');
    }
  }

  private migrateIfNeeded(): void {
    // Check if we need to migrate from v1 (single project) to v2 (workspaces)
    const oldData = localStorage.getItem('schemaos.v1');
    if (oldData && this.storage.workspaces.length === 0) {
      try {
        const parsed = JSON.parse(oldData);
        
        // Create default workspace
        const defaultWorkspace: Workspace = {
          id: crypto.randomUUID(),
          name: 'My Workspace',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          isLocal: true,
        };

        // Create project from old data
        const defaultProject: Project = {
          id: crypto.randomUUID(),
          workspaceId: defaultWorkspace.id,
          name: 'Untitled Project',
          data: parsed as ProjectData,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        this.storage.workspaces.push(defaultWorkspace);
        this.storage.projects.push(defaultProject);
        this.storage.lastMigration = new Date().toISOString();
        this.saveStorage();

        // Save session state
        this.saveSessionState({
          currentWorkspaceId: defaultWorkspace.id,
          currentProjectId: defaultProject.id,
          lastUpdated: new Date().toISOString(),
        });

        console.log('Migrated from v1 to v2 storage');
      } catch (error) {
        console.error('Migration failed:', error);
      }
    }
  }

  /* Teams */
  async listTeams(): Promise<Team[]> {
    try {
      // Call the RPC to get teams from Deco
      const response = await client.TEAMS_LIST({});
      // The API returns an object with an items property containing the teams array
      const teamsResponse = response as unknown as { items: Team[] };
      return teamsResponse?.items || [];
    } catch (error) {
      console.error('Failed to list teams:', error);
      return [];
    }
  }

  async syncTeamsToWorkspaces(teams: Team[]): Promise<void> {
    const existingTeamIds = new Set(
      this.storage.workspaces
        .filter(w => !w.isLocal && w.teamId)
        .map(w => w.teamId)
    );

    // Create workspaces for new teams
    for (const team of teams) {
      if (!existingTeamIds.has(team.id)) {
        const workspace: Workspace = {
          id: crypto.randomUUID(),
          name: team.name,
          teamId: team.id,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          isLocal: false,
        };
        this.storage.workspaces.push(workspace);
      }
    }

    // Update names for existing team workspaces
    for (const workspace of this.storage.workspaces) {
      if (!workspace.isLocal && workspace.teamId) {
        const team = teams.find(t => t.id === workspace.teamId);
        if (team && team.name !== workspace.name) {
          workspace.name = team.name;
          workspace.updatedAt = new Date().toISOString();
        }
      }
    }

    this.saveStorage();
  }

  /* Workspaces */
  async listWorkspaces(): Promise<Workspace[]> {
    return [...this.storage.workspaces];
  }

  async createWorkspace(name: string, teamId?: number): Promise<Workspace> {
    const workspace: Workspace = {
      id: crypto.randomUUID(),
      name,
      teamId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isLocal: !teamId,
    };

    this.storage.workspaces.push(workspace);
    this.saveStorage();
    return workspace;
  }

  async renameWorkspace(id: string, name: string): Promise<void> {
    const workspace = this.storage.workspaces.find(w => w.id === id);
    if (!workspace) {
      throw new Error(`Workspace ${id} not found`);
    }

    workspace.name = name;
    workspace.updatedAt = new Date().toISOString();
    this.saveStorage();
  }

  async deleteWorkspace(id: string): Promise<void> {
    const index = this.storage.workspaces.findIndex(w => w.id === id);
    if (index === -1) {
      throw new Error(`Workspace ${id} not found`);
    }

    // Delete all projects in this workspace
    this.storage.projects = this.storage.projects.filter(
      p => p.workspaceId !== id
    );

    // Delete the workspace
    this.storage.workspaces.splice(index, 1);
    this.saveStorage();
  }

  async getWorkspaceByTeamId(teamId: number): Promise<Workspace | null> {
    return this.storage.workspaces.find(w => w.teamId === teamId) || null;
  }

  /* Projects */
  async listProjects(workspaceId: string): Promise<Project[]> {
    return this.storage.projects.filter(p => p.workspaceId === workspaceId);
  }

  async createProject(workspaceId: string, name: string): Promise<Project> {
    const workspace = this.storage.workspaces.find(w => w.id === workspaceId);
    if (!workspace) {
      throw new Error(`Workspace ${workspaceId} not found`);
    }

    const project: Project = {
      id: crypto.randomUUID(),
      workspaceId,
      name,
      data: {
        nodes: [],
        edges: [],
        explorer: {},
        preview: {},
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.storage.projects.push(project);
    this.saveStorage();
    return project;
  }

  async duplicateProject(projectId: string): Promise<Project> {
    const original = this.storage.projects.find(p => p.id === projectId);
    if (!original) {
      throw new Error(`Project ${projectId} not found`);
    }

    const duplicate: Project = {
      ...original,
      id: crypto.randomUUID(),
      name: `${original.name} (Copy)`,
      data: JSON.parse(JSON.stringify(original.data)), // Deep clone
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.storage.projects.push(duplicate);
    this.saveStorage();
    return duplicate;
  }

  async renameProject(id: string, name: string): Promise<void> {
    const project = this.storage.projects.find(p => p.id === id);
    if (!project) {
      throw new Error(`Project ${id} not found`);
    }

    project.name = name;
    project.updatedAt = new Date().toISOString();
    this.saveStorage();
  }

  async deleteProject(id: string): Promise<void> {
    const index = this.storage.projects.findIndex(p => p.id === id);
    if (index === -1) {
      throw new Error(`Project ${id} not found`);
    }

    this.storage.projects.splice(index, 1);
    this.saveStorage();
  }

  async loadProject(id: string): Promise<Project> {
    const project = this.storage.projects.find(p => p.id === id);
    if (!project) {
      throw new Error(`Project ${id} not found`);
    }
    return { ...project };
  }

  async saveProject(project: Project): Promise<void> {
    const index = this.storage.projects.findIndex(p => p.id === project.id);
    if (index === -1) {
      throw new Error(`Project ${project.id} not found`);
    }

    project.updatedAt = new Date().toISOString();
    this.storage.projects[index] = project;
    this.saveStorage();
  }

  /* Session */
  async getSessionState(): Promise<SessionState | null> {
    try {
      const data = localStorage.getItem(SESSION_KEY);
      if (data) {
        return JSON.parse(data);
      }
    } catch (error) {
      console.error('Failed to load session state:', error);
    }
    return null;
  }

  async saveSessionState(state: SessionState): Promise<void> {
    try {
      localStorage.setItem(SESSION_KEY, JSON.stringify(state));
    } catch (error) {
      console.error('Failed to save session state:', error);
    }
  }
}