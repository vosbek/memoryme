import React, { useState, useEffect, useRef } from 'react';
import { Memory } from '../../shared/types';
import { X, RefreshCw, ZoomIn, ZoomOut } from 'lucide-react';

interface KnowledgeGraphProps {
  memories: Memory[];
  onClose: () => void;
  onMemorySelect: (memory: Memory) => void;
}

interface Node {
  id: string;
  label: string;
  type: 'memory' | 'tag' | 'project';
  x: number;
  y: number;
  memory?: Memory;
  connections: string[];
}

interface Edge {
  from: string;
  to: string;
  type: 'tag' | 'project' | 'similar';
}

const KnowledgeGraph: React.FC<KnowledgeGraphProps> = ({
  memories,
  onClose,
  onMemorySelect
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });

  useEffect(() => {
    generateGraph();
  }, [memories]);

  useEffect(() => {
    drawGraph();
  }, [nodes, edges, hoveredNode, zoom, pan]);

  const generateGraph = () => {
    const memoryNodes: Node[] = [];
    const tagNodes: Node[] = [];
    const projectNodes: Node[] = [];
    const newEdges: Edge[] = [];

    // Create memory nodes
    memories.forEach((memory, index) => {
      const angle = (index / memories.length) * 2 * Math.PI;
      const radius = 200;
      memoryNodes.push({
        id: memory.id,
        label: memory.title,
        type: 'memory',
        x: Math.cos(angle) * radius,
        y: Math.sin(angle) * radius,
        memory,
        connections: []
      });
    });

    // Create tag nodes and connections
    const tagMap = new Map<string, string[]>();
    memories.forEach(memory => {
      memory.tags.forEach(tag => {
        if (!tagMap.has(tag)) {
          tagMap.set(tag, []);
        }
        tagMap.get(tag)?.push(memory.id);
      });
    });

    Array.from(tagMap.entries()).forEach(([tag, memoryIds], index) => {
      if (memoryIds.length > 1) { // Only show tags that connect multiple memories
        const tagNodeId = `tag-${tag}`;
        const angle = (index / tagMap.size) * 2 * Math.PI;
        const radius = 100;
        
        tagNodes.push({
          id: tagNodeId,
          label: tag,
          type: 'tag',
          x: Math.cos(angle) * radius,
          y: Math.sin(angle) * radius,
          connections: memoryIds
        });

        // Create edges from tag to memories
        memoryIds.forEach(memoryId => {
          newEdges.push({
            from: tagNodeId,
            to: memoryId,
            type: 'tag'
          });
        });
      }
    });

    // Create project nodes and connections
    const projectMap = new Map<string, string[]>();
    memories.forEach(memory => {
      const project = memory.metadata?.project;
      if (project) {
        if (!projectMap.has(project)) {
          projectMap.set(project, []);
        }
        projectMap.get(project)?.push(memory.id);
      }
    });

    Array.from(projectMap.entries()).forEach(([project, memoryIds], index) => {
      if (memoryIds.length > 1) {
        const projectNodeId = `project-${project}`;
        const angle = (index / projectMap.size) * 2 * Math.PI;
        const radius = 300;
        
        projectNodes.push({
          id: projectNodeId,
          label: project,
          type: 'project',
          x: Math.cos(angle) * radius,
          y: Math.sin(angle) * radius,
          connections: memoryIds
        });

        memoryIds.forEach(memoryId => {
          newEdges.push({
            from: projectNodeId,
            to: memoryId,
            type: 'project'
          });
        });
      }
    });

    setNodes([...memoryNodes, ...tagNodes, ...projectNodes]);
    setEdges(newEdges);
  };

  const drawGraph = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Apply zoom and pan
    ctx.save();
    ctx.translate(canvas.width / 2 + pan.x, canvas.height / 2 + pan.y);
    ctx.scale(zoom, zoom);

    // Draw edges
    edges.forEach(edge => {
      const fromNode = nodes.find(n => n.id === edge.from);
      const toNode = nodes.find(n => n.id === edge.to);
      
      if (fromNode && toNode) {
        ctx.beginPath();
        ctx.moveTo(fromNode.x, fromNode.y);
        ctx.lineTo(toNode.x, toNode.y);
        
        switch (edge.type) {
          case 'tag':
            ctx.strokeStyle = '#10b981';
            ctx.lineWidth = 1;
            break;
          case 'project':
            ctx.strokeStyle = '#3b82f6';
            ctx.lineWidth = 2;
            break;
          default:
            ctx.strokeStyle = '#6b7280';
            ctx.lineWidth = 1;
        }
        
        ctx.stroke();
      }
    });

    // Draw nodes
    nodes.forEach(node => {
      const isHovered = hoveredNode === node.id;
      const radius = isHovered ? 12 : 8;
      
      ctx.beginPath();
      ctx.arc(node.x, node.y, radius, 0, 2 * Math.PI);
      
      switch (node.type) {
        case 'memory':
          ctx.fillStyle = isHovered ? '#dc2626' : '#ef4444';
          break;
        case 'tag':
          ctx.fillStyle = isHovered ? '#059669' : '#10b981';
          break;
        case 'project':
          ctx.fillStyle = isHovered ? '#1d4ed8' : '#3b82f6';
          break;
      }
      
      ctx.fill();
      
      // Draw label
      if (isHovered) {
        ctx.fillStyle = '#000';
        ctx.font = '12px system-ui';
        ctx.textAlign = 'center';
        ctx.fillText(node.label, node.x, node.y - 20);
      }
    });

    ctx.restore();
  };

  const handleCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = (event.clientX - rect.left - canvas.width / 2 - pan.x) / zoom;
    const y = (event.clientY - rect.top - canvas.height / 2 - pan.y) / zoom;

    // Find clicked node
    const clickedNode = nodes.find(node => {
      const distance = Math.sqrt((node.x - x) ** 2 + (node.y - y) ** 2);
      return distance <= 12;
    });

    if (clickedNode && clickedNode.memory) {
      onMemorySelect(clickedNode.memory);
    }
  };

  const handleCanvasMouseMove = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = (event.clientX - rect.left - canvas.width / 2 - pan.x) / zoom;
    const y = (event.clientY - rect.top - canvas.height / 2 - pan.y) / zoom;

    // Find hovered node
    const hoveredNode = nodes.find(node => {
      const distance = Math.sqrt((node.x - x) ** 2 + (node.y - y) ** 2);
      return distance <= 12;
    });

    setHoveredNode(hoveredNode?.id || null);
  };

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev * 1.2, 3));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev / 1.2, 0.3));
  };

  const handleReset = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
    generateGraph();
  };

  return (
    <div className="fixed inset-0 bg-white z-50 flex flex-col">
      <div className="flex justify-between items-center p-4 border-b border-gray-200">
        <h2 className="text-xl font-semibold text-gray-900">Knowledge Graph</h2>
        <div className="flex items-center space-x-2">
          <button
            onClick={handleZoomOut}
            className="p-2 text-gray-500 hover:text-gray-700"
            title="Zoom Out"
          >
            <ZoomOut size={20} />
          </button>
          <span className="text-sm text-gray-500">{Math.round(zoom * 100)}%</span>
          <button
            onClick={handleZoomIn}
            className="p-2 text-gray-500 hover:text-gray-700"
            title="Zoom In"
          >
            <ZoomIn size={20} />
          </button>
          <button
            onClick={handleReset}
            className="p-2 text-gray-500 hover:text-gray-700"
            title="Reset View"
          >
            <RefreshCw size={20} />
          </button>
          <button
            onClick={onClose}
            className="p-2 text-gray-500 hover:text-gray-700"
            title="Close"
          >
            <X size={20} />
          </button>
        </div>
      </div>

      <div className="flex-1 relative">
        <canvas
          ref={canvasRef}
          width={800}
          height={600}
          className="w-full h-full cursor-pointer"
          onClick={handleCanvasClick}
          onMouseMove={handleCanvasMouseMove}
          style={{ width: '100%', height: '100%' }}
        />
        
        {memories.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="text-gray-500">No memories to display in graph</p>
          </div>
        )}
      </div>

      <div className="p-4 border-t border-gray-200 bg-gray-50">
        <div className="flex items-center space-x-6 text-sm">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <span className="text-gray-600">Memories</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
            <span className="text-gray-600">Tags</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            <span className="text-gray-600">Projects</span>
          </div>
          <div className="ml-auto text-gray-500">
            Click on memory nodes to open them
          </div>
        </div>
      </div>
    </div>
  );
};

export default KnowledgeGraph;