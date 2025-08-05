import { useEffect } from 'react';
import { RotateCcw, Save, Download, Upload, Sparkles } from 'lucide-react';
import Canvas from './canvas/Canvas';
import Palette from './sidebar/Palette';
import PropertyPanel from './sidebar/PropertyPanel';
import { ExplorerDrawer } from './explorer/ExplorerDrawer';
import { DataSourceModal } from './components/DataSourceModal';
import { useSchemaStore } from './store';
import { Button } from './components/ui/button';

function App() {
  const { loadFromLocalStorage, saveToLocalStorage, reset, nodes, edges, openNodeAIModal } = useSchemaStore();

  // Load saved schema on mount
  useEffect(() => {
    // Uncomment the line below to clear localStorage during development
    // localStorage.removeItem('schema_v1');
    loadFromLocalStorage();
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
          <h1 className="text-xl font-bold text-gray-900">SchemaOS</h1>
          <span className="text-sm text-gray-500">AI-s Data Schema Editor</span>
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
            onClick={saveToLocalStorage}
            className="h-8"
          >
            <Save className="w-3 h-3 mr-1" />
            Save
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
        <aside className="w-64 bg-white border-r border-gray-200 overflow-y-auto">
          <Palette />
        </aside>

        {/* Canvas */}
        <main className="flex-1">
          <Canvas />
        </main>

        {/* Right Sidebar - Properties */}
        <aside className="w-96 bg-white border-l border-gray-200 overflow-hidden">
          <PropertyPanel />
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
