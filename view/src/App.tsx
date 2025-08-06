import { useEffect, useState } from 'react';
import { RotateCcw, Download, Upload, Sparkles, CheckCircle, Clock, ChevronLeft, ChevronRight, PanelLeftClose, PanelRightClose } from 'lucide-react';
import Canvas from './canvas/Canvas';
import Palette from './sidebar/Palette';
import PropertyPanel from './sidebar/PropertyPanel';
import { ExplorerDrawer } from './explorer/ExplorerDrawer';
import { DataSourceModal } from './components/DataSourceModal';
import { WorkspaceSwitcher } from './components/WorkspaceSwitcher';
import { ProjectSwitcher } from './components/ProjectSwitcher';
import { useSchemaStore } from './store';
import { useWorkspaceStore } from './store/workspaceStore';
import { useSchemaIntegration } from './hooks/useSchemaIntegration';
import { Button } from './components/ui/button';

function App() {
  const { loadFromLocalStorage, saveToLocalStorage, reset, nodes, edges, openNodeAIModal } = useSchemaStore();
  const { 
    actions: workspaceActions, 
    isLoading: workspaceLoading, 
    error: workspaceError,
    currentProject 
  } = useWorkspaceStore();
  
  // Integration hook for auto-save and project switching
  const { isAutoSaving, lastSaved } = useSchemaIntegration();

  // Sidebar collapse state
  const [isLeftSidebarCollapsed, setIsLeftSidebarCollapsed] = useState(false);
  const [isRightSidebarCollapsed, setIsRightSidebarCollapsed] = useState(false);

  // Initialize workspaces on mount
  useEffect(() => {
    workspaceActions.initialize();
  }, []);

  // Legacy fallback - Load saved schema if no workspace system
  useEffect(() => {
    // Only load from legacy storage if no current project
    if (!currentProject) {
      // Uncomment the line below to clear localStorage during development
      // localStorage.removeItem('schema_v1');
      loadFromLocalStorage();
    }
  }, [currentProject, loadFromLocalStorage]);

  // Keyboard shortcuts for sidebar toggles
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case '1':
            e.preventDefault();
            setIsLeftSidebarCollapsed(prev => !prev);
            break;
          case '2':
            e.preventDefault();
            setIsRightSidebarCollapsed(prev => !prev);
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleExport = () => {
    const schema = {
      nodes,
      edges,
      version: '1.0',
      exportedAt: new Date().toISOString(),
    };
    
    const blob = new Blob([JSON.stringify(schema, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `schema-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      
      try {
        const text = await file.text();
        const data = JSON.parse(text);
        
        // In a real app, you'd validate the schema here
        if (data.nodes && data.edges) {
          reset();
          // Would need to implement an import method in the store
          window.location.reload(); // Quick hack to reset and reload
        }
      } catch (error) {
        console.error('Failed to import schema:', error);
      }
    };
    input.click();
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 bg-white border-b border-gray-200">
        <div className="flex items-center gap-4">
          <div className="flex flex-col gap-1">
            <h1 className="text-xl font-bold text-gray-900">SchemaOS</h1>
            <span className="text-sm text-gray-500">AI-Powered Data Schema Editor</span>
          </div>
          
          {/* Workspace and Project Switchers */}
          <div className="flex items-center gap-3">
            <WorkspaceSwitcher />
            <span className="text-gray-300">→</span>
            <ProjectSwitcher />
          </div>
          
          {/* Save Status & Info */}
          <div className="flex flex-col items-end gap-1 text-xs">
            {/* Save Status */}
            <div className="flex items-center gap-1">
              {isAutoSaving ? (
                <>
                  <Clock className="h-3 w-3 text-amber-500" />
                  <span className="text-amber-600">Saving...</span>
                </>
              ) : lastSaved ? (
                <>
                  <CheckCircle className="h-3 w-3 text-green-500" />
                  <span className="text-green-600">Saved</span>
                </>
              ) : null}
            </div>
            
            {/* Local Storage Message */}
            <div className="text-gray-500">All data is saved locally</div>
            
            {/* Loading/Error States */}
            {workspaceLoading && (
              <div className="text-amber-600">Loading workspaces...</div>
            )}
            {workspaceError && (
              <div className="text-red-600">Error: {workspaceError}</div>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            onClick={() => openNodeAIModal('create')}
            size="sm"
            className="h-8 bg-purple-600 hover:bg-purple-700 text-white"
          >
            <Sparkles className="w-3 h-3 mr-1" />
            AI Schema
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            className="h-8"
          >
            <Download className="w-3 h-3 mr-1" />
            Export
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleImport}
            className="h-8"
          >
            <Upload className="w-3 h-3 mr-1" />
            Import
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={reset}
            className="h-8 text-red-600 hover:text-red-700"
          >
            <RotateCcw className="w-3 h-3 mr-1" />
            Reset
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - Palette */}
        <aside className={`${isLeftSidebarCollapsed ? 'w-0' : 'w-64'} bg-white border-r border-gray-200 overflow-hidden transition-all duration-300 relative`}>
          <div className={`${isLeftSidebarCollapsed ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300 h-full overflow-y-auto`}>
            <Palette />
          </div>
          
          {/* Left Sidebar Toggle */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsLeftSidebarCollapsed(!isLeftSidebarCollapsed)}
            className="absolute top-2 right-2 h-7 w-7 p-0 hover:bg-gray-100 bg-white/80 shadow-sm z-10"
            title={isLeftSidebarCollapsed ? "Show palette (Ctrl+1)" : "Hide palette (Ctrl+1)"}
          >
            {isLeftSidebarCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        </aside>

        {/* Canvas */}
        <main className="flex-1 relative">
          <Canvas />
          
          {/* Floating toggle for collapsed left sidebar */}
          {isLeftSidebarCollapsed && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsLeftSidebarCollapsed(false)}
              className="absolute top-4 left-4 h-10 w-10 p-0 bg-white shadow-lg hover:bg-gray-50 z-50 border-2"
              title="Show palette"
            >
              <PanelLeftClose className="h-5 w-5" />
            </Button>
          )}
          
          {/* Floating toggle for collapsed right sidebar */}
          {isRightSidebarCollapsed && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsRightSidebarCollapsed(false)}
              className="absolute top-4 right-4 h-10 w-10 p-0 bg-white shadow-lg hover:bg-gray-50 z-50 border-2"
              title="Show properties"
            >
              <PanelRightClose className="h-5 w-5" />
            </Button>
          )}
        </main>

        {/* Right Sidebar - Properties */}
        <aside className={`${isRightSidebarCollapsed ? 'w-0' : 'w-96'} bg-white border-l border-gray-200 overflow-hidden transition-all duration-300 relative`}>
          <div className={`${isRightSidebarCollapsed ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300 h-full overflow-y-auto`}>
            <PropertyPanel />
          </div>
          
          {/* Right Sidebar Toggle */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsRightSidebarCollapsed(!isRightSidebarCollapsed)}
            className="absolute top-2 left-2 h-7 w-7 p-0 hover:bg-gray-100 bg-white/80 shadow-sm z-10"
            title={isRightSidebarCollapsed ? "Show properties (Ctrl+2)" : "Hide properties (Ctrl+2)"}
          >
            {isRightSidebarCollapsed ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </Button>
        </aside>
      </div>

      {/* Empty State Overlay */}
      {nodes.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center">
            <div className="w-32 h-32 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
              <svg
                className="w-16 h-16 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-1">Start building your schema</h3>
            <p className="text-sm text-gray-500">Drag a table from the left panel to get started</p>
          </div>
        </div>
      )}
      
      {/* Preview Drawer */}
      <ExplorerDrawer />
      
      {/* Data Source Modal */}
      <DataSourceModal />
    </div>
  );
}

export default App;
