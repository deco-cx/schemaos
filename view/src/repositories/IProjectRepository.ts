import type { Team, Workspace, Project } from '../types/project';

export interface IProjectRepository {
  /* Teams (from Deco API) */
  listTeams(): Promise<Team[]>;
  syncTeamsToWorkspaces(teams: Team[]): Promise<void>;

  /* Workspaces */
  listWorkspaces(): Promise<Workspace[]>;
  createWorkspace(name: string, teamId?: number): Promise<Workspace>;
  renameWorkspace(id: string, name: string): Promise<void>;
  deleteWorkspace(id: string): Promise<void>;
  getWorkspaceByTeamId(teamId: number): Promise<Workspace | null>;

  /* Projects */
  listProjects(workspaceId: string): Promise<Project[]>;
  createProject(workspaceId: string, name: string): Promise<Project>;
  duplicateProject(projectId: string): Promise<Project>;
  renameProject(id: string, name: string): Promise<void>;
  deleteProject(id: string): Promise<void>;
  loadProject(id: string): Promise<Project>;
  saveProject(project: Project): Promise<void>;

  /* Session */
  getSessionState(): Promise<SessionState | null>;
  saveSessionState(state: SessionState): Promise<void>;
}

// Type for session state
export interface SessionState {
  currentWorkspaceId: string | null;
  currentProjectId: string | null;
  lastUpdated: string;
}