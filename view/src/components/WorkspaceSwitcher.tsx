import React, { useState, useMemo } from 'react';
import { ChevronDown, Plus, Settings, Users, FolderOpen, Search } from 'lucide-react';
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

export function WorkspaceSwitcher() {
  const { 
    currentWorkspaceId, 
    workspaces = [],  // Default to empty array if undefined
    teams = [],  // Default to empty array if undefined
    actions 
  } = useWorkspaceStore();
  
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newWorkspaceName, setNewWorkspaceName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const currentWorkspace = Array.isArray(workspaces) ? workspaces.find(w => w.id === currentWorkspaceId) : undefined;

  const handleCreateWorkspace = async () => {
    if (!newWorkspaceName.trim()) return;

    setIsCreating(true);
    try {
      await actions.createWorkspace(newWorkspaceName.trim());
      setIsCreateDialogOpen(false);
      setNewWorkspaceName('');
    } catch (error) {
      console.error('Failed to create workspace:', error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleSwitchWorkspace = async (workspaceId: string) => {
    if (workspaceId !== currentWorkspaceId) {
      await actions.switchWorkspace(workspaceId);
    }
  };

  // Filter and separate workspaces by type
  const filteredWorkspaces = useMemo(() => {
    if (!searchQuery.trim()) {
      return {
        team: workspaces.filter(w => !w.isLocal),
        local: workspaces.filter(w => w.isLocal)
      };
    }

    const query = searchQuery.toLowerCase().trim();
    return {
      team: workspaces.filter(w => 
        !w.isLocal && w.name.toLowerCase().includes(query)
      ),
      local: workspaces.filter(w => 
        w.isLocal && w.name.toLowerCase().includes(query)
      )
    };
  }, [workspaces, searchQuery]);

  const { team: teamWorkspaces, local: localWorkspaces } = filteredWorkspaces;

  return (
    <>
      <DropdownMenu 
        modal={false}
        onOpenChange={(open) => {
          if (!open) {
            setSearchQuery(''); // Clear search when dropdown closes
          }
        }}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="justify-between px-3 h-8 text-sm font-medium min-w-[160px]"
          >
            <div className="flex items-center gap-2 truncate">
              {currentWorkspace?.isLocal ? (
                <FolderOpen className="h-4 w-4" />
              ) : (
                <Users className="h-4 w-4" />
              )}
              <span className="truncate">
                {currentWorkspace?.name || 'Select Workspace'}
              </span>
            </div>
            <ChevronDown className="h-4 w-4 opacity-50 flex-shrink-0" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent 
          align="start" 
          className="w-[280px] max-h-[400px] overflow-hidden" 
          style={{ zIndex: 100 }}
          onCloseAutoFocus={(e) => e.preventDefault()}>
          {/* Search Input */}
          <div 
            className="p-2 border-b"
            onKeyDown={(e) => {
              // Prevent all keyboard navigation in the search area
              e.stopPropagation();
            }}
          >
            <div className="relative">
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search workspaces..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  // Stop all key events from bubbling to dropdown menu
                  e.stopPropagation();
                  
                  // Allow Enter key to work for workspace selection if there's a single result
                  if (e.key === 'Enter' && searchQuery.trim()) {
                    const allFiltered = [...teamWorkspaces, ...localWorkspaces];
                    if (allFiltered.length === 1) {
                      handleSwitchWorkspace(allFiltered[0].id);
                    }
                  }
                }}
                className="pl-8 h-8 text-sm"
                autoFocus
              />
            </div>
          </div>
          
          {/* Scrollable Content */}
          <div className="max-h-[300px] overflow-y-auto">
          {teamWorkspaces.length > 0 && (
            <>
              <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                Team Workspaces
              </div>
              {teamWorkspaces.map((workspace) => {
                const team = Array.isArray(teams) ? teams.find(t => t.id === workspace.teamId) : undefined;
                return (
                  <DropdownMenuItem
                    key={workspace.id}
                    onClick={() => handleSwitchWorkspace(workspace.id)}
                    className="cursor-pointer"
                  >
                    <div className="flex items-center gap-2 w-full">
                      {team?.avatar_url ? (
                        <img 
                          src={team.avatar_url} 
                          alt={workspace.name}
                          className="h-4 w-4 rounded"
                        />
                      ) : (
                        <Users className="h-4 w-4" />
                      )}
                      <span className="truncate">{workspace.name}</span>
                      {workspace.id === currentWorkspaceId && (
                        <div className="ml-auto h-2 w-2 rounded-full bg-primary" />
                      )}
                    </div>
                  </DropdownMenuItem>
                );
              })}
            </>
          )}
          
          {teamWorkspaces.length > 0 && localWorkspaces.length > 0 && (
            <DropdownMenuSeparator />
          )}
          
          {localWorkspaces.length > 0 && (
            <>
              <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                Local Workspaces
              </div>
              {localWorkspaces.map((workspace) => (
                <DropdownMenuItem
                  key={workspace.id}
                  onClick={() => handleSwitchWorkspace(workspace.id)}
                  className="cursor-pointer"
                >
                  <div className="flex items-center gap-2 w-full">
                    <FolderOpen className="h-4 w-4" />
                    <span className="truncate">{workspace.name}</span>
                    {workspace.id === currentWorkspaceId && (
                      <div className="ml-auto h-2 w-2 rounded-full bg-primary" />
                    )}
                  </div>
                </DropdownMenuItem>
              ))}
            </>
          )}
          
          {/* No Results Message */}
          {teamWorkspaces.length === 0 && localWorkspaces.length === 0 && searchQuery.trim() && (
            <div className="px-2 py-4 text-sm text-muted-foreground text-center">
              No workspaces found for "{searchQuery}"
            </div>
          )}
          
          </div>
          
          <DropdownMenuSeparator />
          
          <DropdownMenuItem
            onClick={() => {
              setIsCreateDialogOpen(true);
              setSearchQuery(''); // Clear search when creating new workspace
            }}
            className="cursor-pointer"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Workspace
          </DropdownMenuItem>
          
          {currentWorkspace && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="cursor-pointer">
                <Settings className="h-4 w-4 mr-2" />
                Workspace Settings
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Workspace</DialogTitle>
            <DialogDescription>
              Create a new local workspace to organize your projects.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="workspace-name">Workspace Name</Label>
              <Input
                id="workspace-name"
                value={newWorkspaceName}
                onChange={(e) => setNewWorkspaceName(e.target.value)}
                placeholder="My Workspace"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleCreateWorkspace();
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
                setNewWorkspaceName('');
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateWorkspace}
              disabled={!newWorkspaceName.trim() || isCreating}
            >
              {isCreating ? 'Creating...' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}