import React, { useCallback, useRef } from 'react';
import type { DragEvent } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  useReactFlow,
  ReactFlowProvider,
  addEdge,
} from 'reactflow';
import type { Node, Edge, Connection } from 'reactflow';
import 'reactflow/dist/style.css';

import { useSchemaStore } from '../store';
import type { ObjectNode, RelationEdge as RelationEdgeType, ObjectNodeData } from '../store';
import CustomNode from './nodes/CustomNode';
import RelationEdgeComponent from './edges/RelationEdge';
import { suggestRelationships } from '../aiMock';

const nodeTypes = {
  custom: CustomNode,
};

const edgeTypes = {
  relation: RelationEdgeComponent,
};

function CanvasContent() {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const { project } = useReactFlow();
  
  const {
    nodes,
    edges,
    addNode,
    deleteNode,
    setSelectedNode,
    onNodesChange,
    onEdgesChange,
    addEdge: addEdgeToStore,
  } = useSchemaStore();

  const onConnect = useCallback(
    async (params: Connection) => {
      if (!params.source || !params.target) return;
      
      const sourceNode = nodes.find(n => n.id === params.source);
      const targetNode = nodes.find(n => n.id === params.target);
      
      if (!sourceNode || !targetNode) return;

      // Get AI suggestion for relationship type
      const suggestion = await suggestRelationships(
        sourceNode.data.name,
        targetNode.data.name
      );

      const newEdge: RelationEdgeType = {
        id: `${params.source}-${params.target}`,
        source: params.source,
        target: params.target,
        type: 'relation',
        data: {
          label: suggestion.label,
        },
      };

      addEdgeToStore(newEdge);
    },
    [nodes, addEdgeToStore]
  );

  const onDrop = useCallback(
    (event: DragEvent) => {
      event.preventDefault();

      const reactFlowBounds = reactFlowWrapper.current?.getBoundingClientRect();
      const type = event.dataTransfer.getData('application/reactflow');

      if (!type || !reactFlowBounds) {
        return;
      }

      const position = project({
        x: event.clientX - reactFlowBounds.left,
        y: event.clientY - reactFlowBounds.top,
      });

      const bindingData = event.dataTransfer.getData('binding');
      const binding = bindingData ? JSON.parse(bindingData) : undefined;

      // Convert schema properties to fields
      const fields = [];
      if (binding && binding.schema && binding.schema.properties) {
        let fieldIndex = 0;
        for (const [fieldName, fieldSchema] of Object.entries(binding.schema.properties)) {
          const schema = fieldSchema as any;
          let fieldType = schema.type || 'string';
          
          // Map more complex types
          if (schema.format === 'email') fieldType = 'email';
          else if (schema.format === 'date-time') fieldType = 'datetime';
          else if (schema.format === 'date') fieldType = 'date';
          else if (schema.format === 'uri' || schema.format === 'url') fieldType = 'url';
          else if (schema.format === 'uuid') fieldType = 'uuid';
          else if (schema.enum) fieldType = 'enum';
          else if (fieldType === 'object') fieldType = 'object';
          else if (fieldType === 'integer') fieldType = 'number';
          else if (fieldType === 'array') fieldType = 'array';
          
          const field = {
            id: `field_${Date.now()}_${fieldIndex}_${Math.random().toString(36).substr(2, 9)}`,
            name: fieldName,
            type: fieldType,
            required: schema.required || false,
            description: schema.description,
            // Include nested schema for expandable fields
            schema: (fieldType === 'object' || fieldType === 'array' || fieldType === 'json') ? schema : undefined,
            expanded: false,
          };
          
          fields.push(field);
          fieldIndex++;
        }
      }

      const newNode: ObjectNode = {
        id: `node_${Date.now()}`,
        type: 'custom',
        position,
        data: {
          id: `node_${Date.now()}`,
          name: binding ? `${binding.provider} ${binding.id.split('.')[1].charAt(0).toUpperCase() + binding.id.split('.')[1].slice(1)}` : 'New Table',
          fields: fields,
          binding,
          showAllFields: false, // Start with collapsed view
        },
      };

      addNode(newNode);
      setSelectedNode(newNode.id);
    },
    [project, addNode, setSelectedNode]
  );

  const onDragOver = useCallback((event: DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      setSelectedNode(node.id);
    },
    [setSelectedNode]
  );

  const onPaneClick = useCallback(() => {
    setSelectedNode(null);
  }, [setSelectedNode]);

  return (
    <div className="flex-1 h-full" ref={reactFlowWrapper}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onNodeClick={onNodeClick}
        onPaneClick={onPaneClick}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
        className="bg-gray-50"
      >
        <Background color="#e5e7eb" gap={16} />
        <Controls className="bg-white border border-gray-200 shadow-sm" />
        <MiniMap
          className="!bg-white !border !border-gray-200 !shadow-sm"
          nodeColor={(node) => {
            const data = node.data as ObjectNodeData;
            if (data.binding) return '#3b82f6';
            if (data.fields.length > 0) return '#10b981';
            return '#6b7280';
          }}
        />
      </ReactFlow>
    </div>
  );
}

export default function Canvas() {
  return (
    <ReactFlowProvider>
      <CanvasContent />
    </ReactFlowProvider>
  );
} 