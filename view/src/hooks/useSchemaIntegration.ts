import React, { useEffect, useCallback, useState } from 'react';
import { useSchemaStore } from '../store';
import { useWorkspaceStore } from '../store/workspaceStore';

// Debounce utility
function useDebounce<T extends (...args: Parameters<T>) => void>(
  callback: T,
  delay: number
): T {
  const timeoutRef = React.useRef<NodeJS.Timeout>();

  return useCallback((...args: Parameters<T>) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    timeoutRef.current = setTimeout(() => {
      callback(...args);
    }, delay);
  }, [callback, delay]) as T;
}

export function useSchemaIntegration() {
  const { 
    nodes, 
    edges, 
    getProjectData, 
    loadProjectData 
  } = useSchemaStore();
  
  const { 
    currentProject,
    actions: workspaceActions 
  } = useWorkspaceStore();

  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<string | null>(null);

  // Auto-save with debounce when schema changes
  const debouncedSave = useDebounce(
    useCallback(async () => {
      if (currentProject) {
        setIsAutoSaving(true);
        try {
          const projectData = getProjectData();
          await workspaceActions.saveCurrentProject(projectData);
          setLastSaved(new Date().toISOString());
        } catch (error) {
          console.error('Failed to auto-save project:', error);
        } finally {
          setIsAutoSaving(false);
        }
      }
    }, [currentProject, getProjectData, workspaceActions]),
    500 // 500ms debounce
  );

  // Save when nodes or edges change
  useEffect(() => {
    if (currentProject && (nodes.length > 0 || edges.length > 0)) {
      debouncedSave();
    }
  }, [nodes, edges, currentProject, debouncedSave]);

  // Load project data when current project changes
  useEffect(() => {
    if (currentProject) {
      loadProjectData(currentProject.data);
      setLastSaved(currentProject.updatedAt);
    } else {
      // No project selected - clear canvas
      loadProjectData(null);
      setLastSaved(null);
    }
  }, [currentProject?.id, loadProjectData]);

  return {
    isAutoSaving,
    lastSaved,
  };
}