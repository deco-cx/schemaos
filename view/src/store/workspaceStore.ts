import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import type { Team, Workspace, Project } from '../types/project';
import type { IProjectRepository } from '../repositories/IProjectRepository';
import { LocalProjectRepository } from '../repositories/LocalProjectRepository';

interface WorkspaceState {
  // Current selections
  currentWorkspaceId: string | null;
  currentProjectId: string | null;
  currentProject: Project | null;

  // Data
  teams: Team[];
  workspaces: Workspace[];
  projects: Record<string, Project[]>; // indexed by workspaceId

  // UI State
  isLoading: boolean;
  error: string | null;

  // Repository
  repository: IProjectRepository;

  // Actions
  actions: {
    // Initialization
    initialize: () => Promise<void>;
    
    // Teams
    fetchTeams: () => Promise<void>;
    syncTeamsToWorkspaces: () => Promise<void>;

    // Workspaces
    switchWorkspace: (id: string) => Promise<void>;
    createWorkspace: (name: string, teamId?: number) => Promise<Workspace>;
    renameWorkspace: (id: string, name: string) => Promise<void>;
    deleteWorkspace: (id: string) => Promise<void>;

    // Projects
    switchProject: (id: string) => Promise<void>;
    createProject: (name: string) => Promise<Project>;
    duplicateProject: (id: string) => Promise<Project>;
    renameProject: (id: string, name: string) => Promise<void>;
    deleteProject: (id: string) => Promise<void>;
    saveCurrentProject: (data: Partial<Project['data']>) => Promise<void>;

    // Utils
    clearError: () => void;
  };
}

export const useWorkspaceStore = create<WorkspaceState>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        currentWorkspaceId: null,
        currentProjectId: null,
        currentProject: null,
        teams: [],
        workspaces: [],
        projects: {},
        isLoading: false,
        error: null,
        repository: new LocalProjectRepository(),

        actions: {
          initialize: async () => {
            const { repository } = get();
            set({ isLoading: true, error: null });

            try {
              // Load workspaces
              const workspaces = await repository.listWorkspaces();
              set({ workspaces });

              // Load session state
              const session = await repository.getSessionState();
              
              if (session?.currentWorkspaceId) {
                // Load projects for current workspace
                const projects = await repository.listProjects(session.currentWorkspaceId);
                set({ 
                  currentWorkspaceId: session.currentWorkspaceId,
                  projects: { [session.currentWorkspaceId]: projects }
                });

                // Load current project if exists
                if (session.currentProjectId) {
                  const project = projects.find(p => p.id === session.currentProjectId);
                  if (project) {
                    set({ 
                      currentProjectId: session.currentProjectId,
                      currentProject: project 
                    });
                  }
                }
              } else if (workspaces.length > 0) {
                // No session, select first workspace
                const firstWorkspace = workspaces[0];
                const projects = await repository.listProjects(firstWorkspace.id);
                set({ 
                  currentWorkspaceId: firstWorkspace.id,
                  projects: { [firstWorkspace.id]: projects }
                });

                // Select first project if exists
                if (projects.length > 0) {
                  set({ 
                    currentProjectId: projects[0].id,
                    currentProject: projects[0]
                  });
                }
              }

              // Fetch teams in background
              get().actions.fetchTeams();
            } catch (error) {
              console.error('Failed to initialize workspace:', error);
              set({ error: 'Failed to initialize workspace' });
            } finally {
              set({ isLoading: false });
            }
          },

          fetchTeams: async () => {
            const { repository } = get();
            try {
              const teams = await repository.listTeams();
              set({ teams });
              
              // Auto-sync teams to workspaces
              if (teams.length > 0) {
                await get().actions.syncTeamsToWorkspaces();
              }
            } catch (error) {
              console.error('Failed to fetch teams:', error);
              // Don't set error state for background fetch
            }
          },

          syncTeamsToWorkspaces: async () => {
            const { repository, teams } = get();
            try {
              await repository.syncTeamsToWorkspaces(teams);
              const workspaces = await repository.listWorkspaces();
              set({ workspaces });
            } catch (error) {
              console.error('Failed to sync teams:', error);
            }
          },

          switchWorkspace: async (id: string) => {
            const { repository, projects } = get();
            set({ isLoading: true, error: null });

            try {
              set({ currentWorkspaceId: id });

              // Load projects if not cached
              if (!projects[id]) {
                const workspaceProjects = await repository.listProjects(id);
                set({ 
                  projects: { ...projects, [id]: workspaceProjects }
                });

                // Select first project
                if (workspaceProjects.length > 0) {
                  set({ 
                    currentProjectId: workspaceProjects[0].id,
                    currentProject: workspaceProjects[0]
                  });
                } else {
                  set({ currentProjectId: null, currentProject: null });
                }
              } else {
                // Use cached projects
                const workspaceProjects = projects[id];
                if (workspaceProjects.length > 0) {
                  set({ 
                    currentProjectId: workspaceProjects[0].id,
                    currentProject: workspaceProjects[0]
                  });
                } else {
                  set({ currentProjectId: null, currentProject: null });
                }
              }

              // Save session
              await repository.saveSessionState({
                currentWorkspaceId: id,
                currentProjectId: get().currentProjectId,
                lastUpdated: new Date().toISOString(),
              });
            } catch (error) {
              console.error('Failed to switch workspace:', error);
              set({ error: 'Failed to switch workspace' });
            } finally {
              set({ isLoading: false });
            }
          },

          createWorkspace: async (name: string, teamId?: number) => {
            const { repository, workspaces } = get();
            set({ isLoading: true, error: null });

            try {
              const workspace = await repository.createWorkspace(name, teamId);
              set({ workspaces: [...workspaces, workspace] });
              
              // Switch to new workspace
              await get().actions.switchWorkspace(workspace.id);
              
              return workspace;
            } catch (error) {
              console.error('Failed to create workspace:', error);
              set({ error: 'Failed to create workspace' });
              throw error;
            } finally {
              set({ isLoading: false });
            }
          },

          renameWorkspace: async (id: string, name: string) => {
            const { repository, workspaces } = get();
            
            try {
              await repository.renameWorkspace(id, name);
              const updated = workspaces.map(w => 
                w.id === id ? { ...w, name, updatedAt: new Date().toISOString() } : w
              );
              set({ workspaces: updated });
            } catch (error) {
              console.error('Failed to rename workspace:', error);
              set({ error: 'Failed to rename workspace' });
              throw error;
            }
          },

          deleteWorkspace: async (id: string) => {
            const { repository, workspaces, projects, currentWorkspaceId } = get();
            
            try {
              await repository.deleteWorkspace(id);
              
              // Remove from state
              const updated = workspaces.filter(w => w.id !== id);
              const updatedProjects = { ...projects };
              delete updatedProjects[id];
              
              set({ 
                workspaces: updated,
                projects: updatedProjects
              });

              // If deleting current workspace, switch to another
              if (currentWorkspaceId === id && updated.length > 0) {
                await get().actions.switchWorkspace(updated[0].id);
              } else if (updated.length === 0) {
                set({ 
                  currentWorkspaceId: null,
                  currentProjectId: null,
                  currentProject: null
                });
              }
            } catch (error) {
              console.error('Failed to delete workspace:', error);
              set({ error: 'Failed to delete workspace' });
              throw error;
            }
          },

          switchProject: async (id: string) => {
            const { repository, currentWorkspaceId, projects } = get();
            if (!currentWorkspaceId) return;

            set({ isLoading: true, error: null });

            try {
              const workspaceProjects = projects[currentWorkspaceId] || [];
              const project = workspaceProjects.find(p => p.id === id);
              
              if (project) {
                set({ 
                  currentProjectId: id,
                  currentProject: project
                });

                // Save session
                await repository.saveSessionState({
                  currentWorkspaceId,
                  currentProjectId: id,
                  lastUpdated: new Date().toISOString(),
                });
              }
            } catch (error) {
              console.error('Failed to switch project:', error);
              set({ error: 'Failed to switch project' });
            } finally {
              set({ isLoading: false });
            }
          },

          createProject: async (name: string) => {
            const { repository, currentWorkspaceId, projects } = get();
            if (!currentWorkspaceId) throw new Error('No workspace selected');

            set({ isLoading: true, error: null });

            try {
              const project = await repository.createProject(currentWorkspaceId, name);
              
              // Update projects cache
              const workspaceProjects = projects[currentWorkspaceId] || [];
              set({ 
                projects: {
                  ...projects,
                  [currentWorkspaceId]: [...workspaceProjects, project]
                }
              });

              // Switch to new project
              await get().actions.switchProject(project.id);
              
              return project;
            } catch (error) {
              console.error('Failed to create project:', error);
              set({ error: 'Failed to create project' });
              throw error;
            } finally {
              set({ isLoading: false });
            }
          },

          duplicateProject: async (id: string) => {
            const { repository, currentWorkspaceId, projects } = get();
            if (!currentWorkspaceId) throw new Error('No workspace selected');

            set({ isLoading: true, error: null });

            try {
              const duplicate = await repository.duplicateProject(id);
              
              // Update projects cache
              const workspaceProjects = projects[currentWorkspaceId] || [];
              set({ 
                projects: {
                  ...projects,
                  [currentWorkspaceId]: [...workspaceProjects, duplicate]
                }
              });

              // Switch to duplicated project
              await get().actions.switchProject(duplicate.id);
              
              return duplicate;
            } catch (error) {
              console.error('Failed to duplicate project:', error);
              set({ error: 'Failed to duplicate project' });
              throw error;
            } finally {
              set({ isLoading: false });
            }
          },

          renameProject: async (id: string, name: string) => {
            const { repository, currentWorkspaceId, projects, currentProject } = get();
            if (!currentWorkspaceId) return;

            try {
              await repository.renameProject(id, name);
              
              // Update projects cache
              const workspaceProjects = projects[currentWorkspaceId] || [];
              const updated = workspaceProjects.map(p => 
                p.id === id ? { ...p, name, updatedAt: new Date().toISOString() } : p
              );
              
              set({ 
                projects: {
                  ...projects,
                  [currentWorkspaceId]: updated
                }
              });

              // Update current project if it's the one being renamed
              if (currentProject?.id === id) {
                set({ 
                  currentProject: { 
                    ...currentProject, 
                    name, 
                    updatedAt: new Date().toISOString() 
                  }
                });
              }
            } catch (error) {
              console.error('Failed to rename project:', error);
              set({ error: 'Failed to rename project' });
              throw error;
            }
          },

          deleteProject: async (id: string) => {
            const { repository, currentWorkspaceId, projects, currentProjectId } = get();
            if (!currentWorkspaceId) return;

            try {
              await repository.deleteProject(id);
              
              // Update projects cache
              const workspaceProjects = projects[currentWorkspaceId] || [];
              const updated = workspaceProjects.filter(p => p.id !== id);
              
              set({ 
                projects: {
                  ...projects,
                  [currentWorkspaceId]: updated
                }
              });

              // If deleting current project, switch to another
              if (currentProjectId === id) {
                if (updated.length > 0) {
                  await get().actions.switchProject(updated[0].id);
                } else {
                  set({ currentProjectId: null, currentProject: null });
                }
              }
            } catch (error) {
              console.error('Failed to delete project:', error);
              set({ error: 'Failed to delete project' });
              throw error;
            }
          },

          saveCurrentProject: async (data: Partial<Project['data']>) => {
            const { repository, currentProject, currentWorkspaceId, projects } = get();
            if (!currentProject || !currentWorkspaceId) return;

            try {
              const updated: Project = {
                ...currentProject,
                data: { ...currentProject.data, ...data },
                updatedAt: new Date().toISOString(),
              };

              await repository.saveProject(updated);
              
              // Update state
              set({ currentProject: updated });

              // Update projects cache
              const workspaceProjects = projects[currentWorkspaceId] || [];
              const updatedProjects = workspaceProjects.map(p => 
                p.id === updated.id ? updated : p
              );
              
              set({ 
                projects: {
                  ...projects,
                  [currentWorkspaceId]: updatedProjects
                }
              });
            } catch (error) {
              console.error('Failed to save project:', error);
              set({ error: 'Failed to save project' });
              throw error;
            }
          },

          clearError: () => set({ error: null }),
        },
      }),
      {
        name: 'workspace-store',
        partialize: (state) => ({
          // Only persist session-related state
          currentWorkspaceId: state.currentWorkspaceId,
          currentProjectId: state.currentProjectId,
        }),
      }
    )
  )
);