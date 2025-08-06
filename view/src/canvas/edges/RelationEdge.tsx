import React from 'react';
import { getBezierPath, EdgeLabelRenderer } from 'reactflow';
import type { EdgeProps } from 'reactflow';
import type { RelationEdgeData } from '../../store';

function RelationEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  markerEnd,
}: EdgeProps<RelationEdgeData>) {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const getLabelStyle = (label: '1-1' | '1-N' | 'N-N') => {
    const styles: Record<'1-1' | '1-N' | 'N-N', string> = {
      '1-1': 'bg-blue-100 text-blue-700 border-blue-200',
      '1-N': 'bg-emerald-100 text-emerald-700 border-emerald-200',
      'N-N': 'bg-purple-100 text-purple-700 border-purple-200',
    };
    return styles[label];
  };

  return (
    <>
      <path
        id={id}
        className="stroke-2 fill-none stroke-gray-400 hover:stroke-gray-600 transition-colors"
        d={edgePath}
        markerEnd={markerEnd}
      />
      <EdgeLabelRenderer>
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            pointerEvents: 'all',
          }}
        >
          <div
            className={`px-2 py-0.5 text-xs font-medium rounded-full border ${
              data?.label ? getLabelStyle(data.label) : 'bg-gray-100 text-gray-700'
            } shadow-sm hover:shadow-md transition-shadow cursor-pointer`}
          >
            {data?.label || '?'}
          </div>
        </div>
      </EdgeLabelRenderer>
    </>
  );
}

export default RelationEdge; 