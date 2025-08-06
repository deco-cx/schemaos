import React, { useState } from 'react';
import { ChevronDown, Plus, Copy, Trash2, Edit2, FileText } from 'lucide-react';
import { useWorkspaceStore } from '../store/workspaceStore';
import { Button } from './ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';

export function ProjectSwitcher() {
  const { 
    currentWorkspaceId,
    currentProjectId,
    currentProject,
    projects,
    actions 
  } = useWorkspaceStore();
  
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isRenameDialogOpen, setIsRenameDialogOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [renameProjectName, setRenameProjectName] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const workspaceProjects = currentWorkspaceId ? (projects[currentWorkspaceId] || []) : [];

  const handleCreateProject = async () => {
    if (!newProjectName.trim()) return;

    setIsProcessing(true);
    try {
      await actions.createProject(newProjectName.trim());
      setIsCreateDialogOpen(false);
      setNewProjectName('');
    } catch (error) {
      console.error('Failed to create project:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRenameProject = async () => {
    if (!renameProjectName.trim() || !currentProjectId) return;

    setIsProcessing(true);
    try {
      await actions.renameProject(currentProjectId, renameProjectName.trim());
      setIsRenameDialogOpen(false);
      setRenameProjectName('');
    } catch (error) {
      console.error('Failed to rename project:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDuplicateProject = async () => {
    if (!currentProjectId) return;
    
    setIsProcessing(true);
    try {
      await actions.duplicateProject(currentProjectId);
    } catch (error) {
      console.error('Failed to duplicate project:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeleteProject = async () => {
    if (!currentProjectId) return;
    
    const confirmed = window.confirm(
      `Are you sure you want to delete "${currentProject?.name}"? This action cannot be undone.`
    );
    
    if (!confirmed) return;
    
    setIsProcessing(true);
    try {
      await actions.deleteProject(currentProjectId);
    } catch (error) {
      console.error('Failed to delete project:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSwitchProject = async (projectId: string) => {
    if (projectId !== currentProjectId) {
      await actions.switchProject(projectId);
    }
  };

  const openRenameDialog = () => {
    setRenameProjectName(currentProject?.name || '');
    setIsRenameDialogOpen(true);
  };

  if (!currentWorkspaceId) {
    return (
      <Button
        variant="ghost"
        className="justify-between px-3 h-8 text-sm min-w-[160px]"
        disabled
      >
        <span className="text-muted-foreground">No workspace selected</span>
      </Button>
    );
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="justify-between px-3 h-8 text-sm min-w-[160px]"
          >
            <div className="flex items-center gap-2 truncate">
              <FileText className="h-4 w-4" />
              <span className="truncate">
                {currentProject?.name || 'Select Project'}
              </span>
            </div>
            <ChevronDown className="h-4 w-4 opacity-50 flex-shrink-0" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-[250px]">
          {workspaceProjects.length > 0 ? (
            <>
              <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                Projects
              </div>
              {workspaceProjects.map((project) => (
                <DropdownMenuItem
                  key={project.id}
                  onClick={() => handleSwitchProject(project.id)}
                  className="cursor-pointer"
                >
                  <div className="flex items-center gap-2 w-full">
                    <FileText className="h-4 w-4" />
                    <span className="truncate">{project.name}</span>
                    {project.id === currentProjectId && (
                      <div className="ml-auto h-2 w-2 rounded-full bg-primary" />
                    )}
                  </div>
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
            </>
          ) : (
            <>
              <div className="px-2 py-4 text-sm text-muted-foreground text-center">
                No projects yet
              </div>
              <DropdownMenuSeparator />
            </>
          )}
          
          <DropdownMenuItem
            onClick={() => setIsCreateDialogOpen(true)}
            className="cursor-pointer"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Project
          </DropdownMenuItem>
          
          {currentProject && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={openRenameDialog}
                className="cursor-pointer"
              >
                <Edit2 className="h-4 w-4 mr-2" />
                Rename
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={handleDuplicateProject}
                className="cursor-pointer"
                disabled={isProcessing}
              >
                <Copy className="h-4 w-4 mr-2" />
                Duplicate
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={handleDeleteProject}
                className="cursor-pointer text-destructive"
                disabled={isProcessing}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Project</DialogTitle>
            <DialogDescription>
              Create a new project in the current workspace.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="project-name">Project Name</Label>
              <Input
                id="project-name"
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
                placeholder="My Project"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleCreateProject();
                  }
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsCreateDialogOpen(false);
                setNewProjectName('');
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateProject}
              disabled={!newProjectName.trim() || isProcessing}
            >
              {isProcessing ? 'Creating...' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isRenameDialogOpen} onOpenChange={setIsRenameDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename Project</DialogTitle>
            <DialogDescription>
              Enter a new name for the project.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="rename-project">Project Name</Label>
              <Input
                id="rename-project"
                value={renameProjectName}
                onChange={(e) => setRenameProjectName(e.target.value)}
                placeholder="Project Name"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleRenameProject();
                  }
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsRenameDialogOpen(false);
                setRenameProjectName('');
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleRenameProject}
              disabled={!renameProjectName.trim() || isProcessing}
            >
              {isProcessing ? 'Renaming...' : 'Rename'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}