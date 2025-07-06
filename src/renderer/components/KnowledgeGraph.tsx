import React, { useState, useEffect, useRef } from 'react';
import { Memory } from '../../shared/types';
import { X, RefreshCw, ZoomIn, ZoomOut, Filter, Search, Info } from 'lucide-react';

interface KnowledgeGraphProps {
  memories: Memory[];
  onClose: () => void;
  onMemorySelect: (memory: Memory) => void;
}

interface Entity {
  id: string;
  name: string;
  type: 'person' | 'project' | 'technology' | 'concept' | 'organization' | 'file' | 'repository' | 'api' | 'database' | 'service';
  confidence: number;
  memoryIds: string[];
}

interface Relation {
  id: string;
  fromEntityId: string;
  toEntityId: string;
  type: 'works_on' | 'created_by' | 'depends_on' | 'related_to' | 'belongs_to' | 'implements' | 'uses' | 'calls' | 'extends' | 'contains' | 'manages' | 'collaborates_with';
  strength: number;
  confidence: number;
}

interface Node {
  id: string;
  label: string;
  type: 'memory' | 'entity';
  entityType?: Entity['type'];
  x: number;
  y: number;
  memory?: Memory;
  entity?: Entity;
  connections: string[];
  size: number;
  color: string;
  detailedRelationships?: any[];
}

interface Edge {
  from: string;
  to: string;
  type: 'memory_entity' | 'entity_relation';
  relationshipType?: Relation['type'];
  strength?: number;
  width: number;
  color: string;
}

const KnowledgeGraph: React.FC<KnowledgeGraphProps> = ({
  memories,
  onClose,
  onMemorySelect
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [entities, setEntities] = useState<Entity[]>([]);
  const [relations, setRelations] = useState<Relation[]>([]);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [showMemories, setShowMemories] = useState(true);
  const [showEntities, setShowEntities] = useState(true);
  const [filterEntityType, setFilterEntityType] = useState<Entity['type'] | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [graphStats, setGraphStats] = useState<any>(null);

  // Entity type colors
  const entityColors: Record<Entity['type'], string> = {
    person: '#f59e0b',
    project: '#3b82f6',
    technology: '#10b981',
    concept: '#8b5cf6',
    organization: '#ef4444',
    file: '#6b7280',
    repository: '#14b8a6',
    api: '#f97316',
    database: '#84cc16',
    service: '#ec4899'
  };

  // Relationship type colors
  const relationshipColors: Record<Relation['type'], string> = {
    works_on: '#3b82f6',
    created_by: '#f59e0b',
    depends_on: '#ef4444',
    related_to: '#6b7280',
    belongs_to: '#8b5cf6',
    implements: '#10b981',
    uses: '#14b8a6',
    calls: '#f97316',
    extends: '#84cc16',
    contains: '#ec4899',
    manages: '#f59e0b',
    collaborates_with: '#3b82f6'
  };

  useEffect(() => {
    fetchKnowledgeGraphData();
    fetchGraphStatistics();
  }, []);

  const fetchGraphStatistics = async () => {
    try {
      const stats = await window.electronAPI.getGraphStatistics();
      setGraphStats(stats);
      console.log('Graph statistics:', stats);
    } catch (error) {
      console.error('Failed to fetch graph statistics:', error);
    }
  };

  useEffect(() => {
    generateGraph();
  }, [memories, entities, relations, showMemories, showEntities, filterEntityType, searchQuery]);

  // Enhanced search functionality
  useEffect(() => {
    if (searchQuery.trim()) {
      performEntitySearch(searchQuery);
    } else {
      fetchKnowledgeGraphData(); // Reset to all data when search is cleared
    }
  }, [searchQuery]);

  const performEntitySearch = async (query: string) => {
    if (!query.trim()) return;
    
    setIsLoading(true);
    try {
      const searchResults = await window.electronAPI.searchEntities(query, 50, filterEntityType === 'all' ? undefined : filterEntityType);
      
      // Transform search results to entities
      const searchEntities: Entity[] = searchResults.map(result => ({
        id: result.entity.id,
        name: result.entity.name,
        type: result.entity.type,
        confidence: result.entity.confidence,
        memoryIds: result.entity.memoryIds || []
      }));

      // Get relationships for found entities
      const entityIds = searchEntities.map(e => e.id);
      const allRelationships = await window.electronAPI.getAllRelationships();
      const relevantRelations = allRelationships.filter(rel => 
        entityIds.includes(rel.fromEntityId) || entityIds.includes(rel.toEntityId)
      );

      const transformedRelations: Relation[] = relevantRelations.map(relation => ({
        id: relation.id,
        fromEntityId: relation.fromEntityId,
        toEntityId: relation.toEntityId,
        type: relation.type,
        strength: relation.strength,
        confidence: relation.confidence
      }));

      setEntities(searchEntities);
      setRelations(transformedRelations);
      
      console.log(`Search "${query}" found ${searchEntities.length} entities and ${transformedRelations.length} relationships`);
    } catch (error) {
      console.error('Entity search failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    drawGraph();
  }, [nodes, edges, hoveredNode, selectedNode, zoom, pan]);

  const fetchKnowledgeGraphData = async () => {
    setIsLoading(true);
    try {
      // Fetch real data from the hybrid database manager
      const [entitiesData, relationshipsData] = await Promise.all([
        window.electronAPI.getAllEntities(),
        window.electronAPI.getAllRelationships()
      ]);

      // Transform the data to match our component interfaces
      const transformedEntities: Entity[] = entitiesData.map(entity => ({
        id: entity.id,
        name: entity.name,
        type: entity.type,
        confidence: entity.confidence,
        memoryIds: entity.memoryIds || []
      }));

      const transformedRelations: Relation[] = relationshipsData.map(relation => ({
        id: relation.id,
        fromEntityId: relation.fromEntityId,
        toEntityId: relation.toEntityId,
        type: relation.type,
        strength: relation.strength,
        confidence: relation.confidence
      }));

      setEntities(transformedEntities);
      setRelations(transformedRelations);

      console.log(`Loaded ${transformedEntities.length} entities and ${transformedRelations.length} relationships`);
    } catch (error) {
      console.error('Failed to fetch knowledge graph data:', error);
      // Fallback to empty state on error
      setEntities([]);
      setRelations([]);
    } finally {
      setIsLoading(false);
    }
  };

  const generateGraph = () => {
    const allNodes: Node[] = [];
    const newEdges: Edge[] = [];

    // Filter entities based on search and type filter
    const filteredEntities = entities.filter(entity => {
      const matchesSearch = searchQuery === '' || 
        entity.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesType = filterEntityType === 'all' || entity.type === filterEntityType;
      return matchesSearch && matchesType && showEntities;
    });

    // Filter memories based on search
    const filteredMemories = memories.filter(memory => {
      return searchQuery === '' || 
        memory.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        memory.content.toLowerCase().includes(searchQuery.toLowerCase());
    });

    // Create memory nodes
    if (showMemories) {
      filteredMemories.forEach((memory, index) => {
        const angle = (index / Math.max(filteredMemories.length, 1)) * 2 * Math.PI;
        const radius = 250;
        allNodes.push({
          id: `memory-${memory.id}`,
          label: memory.title.length > 20 ? memory.title.substring(0, 20) + '...' : memory.title,
          type: 'memory',
          x: Math.cos(angle) * radius,
          y: Math.sin(angle) * radius,
          memory,
          connections: [],
          size: 8,
          color: '#ef4444'
        });
      });
    }

    // Create entity nodes
    if (showEntities) {
      filteredEntities.forEach((entity, index) => {
        const angle = (index / Math.max(filteredEntities.length, 1)) * 2 * Math.PI;
        const radius = 150;
        // Size based on confidence and number of connections
        const connectionCount = relations.filter(r => 
          r.fromEntityId === entity.id || r.toEntityId === entity.id
        ).length;
        const size = Math.max(6, Math.min(16, 6 + entity.confidence * 5 + connectionCount));
        
        allNodes.push({
          id: `entity-${entity.id}`,
          label: entity.name.length > 15 ? entity.name.substring(0, 15) + '...' : entity.name,
          type: 'entity',
          entityType: entity.type,
          x: Math.cos(angle) * radius,
          y: Math.sin(angle) * radius,
          entity,
          connections: [],
          size,
          color: entityColors[entity.type]
        });
      });
    }

    // Create edges for entity relationships
    relations.forEach(relation => {
      const fromNode = allNodes.find(n => n.id === `entity-${relation.fromEntityId}`);
      const toNode = allNodes.find(n => n.id === `entity-${relation.toEntityId}`);
      
      if (fromNode && toNode) {
        newEdges.push({
          from: fromNode.id,
          to: toNode.id,
          type: 'entity_relation',
          relationshipType: relation.type,
          strength: relation.strength,
          width: Math.max(1, relation.strength * 3),
          color: relationshipColors[relation.type]
        });
      }
    });

    // Create edges between memories and entities (if both are shown)
    if (showMemories && showEntities) {
      filteredMemories.forEach(memory => {
        // Find entities mentioned in this memory
        filteredEntities.forEach(entity => {
          if (entity.memoryIds.includes(memory.id)) {
            newEdges.push({
              from: `memory-${memory.id}`,
              to: `entity-${entity.id}`,
              type: 'memory_entity',
              width: 1,
              color: '#94a3b8'
            });
          }
        });
      });
    }

    setNodes(allNodes);
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
        
        ctx.strokeStyle = edge.color;
        ctx.lineWidth = edge.width;
        
        // Add transparency for better visual appeal
        ctx.globalAlpha = edge.type === 'memory_entity' ? 0.4 : 0.7;
        ctx.stroke();
        ctx.globalAlpha = 1;

        // Draw relationship label for entity relations
        if (edge.type === 'entity_relation' && edge.relationshipType && zoom > 0.8) {
          const midX = (fromNode.x + toNode.x) / 2;
          const midY = (fromNode.y + toNode.y) / 2;
          
          ctx.fillStyle = '#374151';
          ctx.font = '10px system-ui';
          ctx.textAlign = 'center';
          ctx.fillText(edge.relationshipType.replace(/_/g, ' '), midX, midY - 5);
        }
      }
    });

    // Draw nodes
    nodes.forEach(node => {
      const isHovered = hoveredNode === node.id;
      const isSelected = selectedNode?.id === node.id;
      const radius = isHovered || isSelected ? node.size + 3 : node.size;
      
      // Draw selection/hover ring
      if (isHovered || isSelected) {
        ctx.beginPath();
        ctx.arc(node.x, node.y, radius + 2, 0, 2 * Math.PI);
        ctx.strokeStyle = isSelected ? '#fbbf24' : '#94a3b8';
        ctx.lineWidth = 2;
        ctx.stroke();
      }
      
      // Draw node
      ctx.beginPath();
      ctx.arc(node.x, node.y, radius, 0, 2 * Math.PI);
      ctx.fillStyle = node.color;
      ctx.fill();
      
      // Draw border
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1;
      ctx.stroke();
      
      // Draw label
      if (isHovered || isSelected || zoom > 1.2) {
        ctx.fillStyle = '#000';
        ctx.font = `${Math.max(10, 12 * zoom)}px system-ui`;
        ctx.textAlign = 'center';
        ctx.fillText(node.label, node.x, node.y - radius - 8);
        
        // Draw additional info for entities
        if (node.type === 'entity' && node.entity && (isHovered || isSelected)) {
          ctx.font = `${Math.max(8, 10 * zoom)}px system-ui`;
          ctx.fillStyle = '#6b7280';
          ctx.fillText(`${node.entity.type} (${Math.round(node.entity.confidence * 100)}%)`, 
                      node.x, node.y - radius - 22);
        }
      }
    });

    ctx.restore();
  };

  const handleCanvasClick = async (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = (event.clientX - rect.left - canvas.width / 2 - pan.x) / zoom;
    const y = (event.clientY - rect.top - canvas.height / 2 - pan.y) / zoom;

    // Find clicked node
    const clickedNode = nodes.find(node => {
      const distance = Math.sqrt((node.x - x) ** 2 + (node.y - y) ** 2);
      return distance <= node.size + 5;
    });

    if (clickedNode) {
      setSelectedNode(clickedNode);
      
      // If it's a memory node, open the memory
      if (clickedNode.memory) {
        onMemorySelect(clickedNode.memory);
      }
      
      // If it's an entity node, load detailed relationship information
      if (clickedNode.entity) {
        try {
          const entityRelationships = await window.electronAPI.getEntityRelationships(clickedNode.entity.id, 'both');
          console.log(`Loaded ${entityRelationships.length} relationships for entity: ${clickedNode.entity.name}`);
          
          // Update the node with detailed relationship information
          const enhancedNode = {
            ...clickedNode,
            detailedRelationships: entityRelationships
          };
          setSelectedNode(enhancedNode);
        } catch (error) {
          console.error('Failed to load entity relationships:', error);
        }
      }
    } else {
      setSelectedNode(null);
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
      return distance <= node.size + 5;
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
      {/* Header with controls */}
      <div className="flex justify-between items-center p-4 border-b border-gray-200">
        <div className="flex items-center space-x-4">
          <h2 className="text-xl font-semibold text-gray-900">Knowledge Graph</h2>
          {isLoading && (
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Loading graph data...</span>
            </div>
          )}
        </div>
        
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

      {/* Filters and controls */}
      <div className="flex items-center space-x-4 p-4 border-b border-gray-200 bg-gray-50">
        {/* Search */}
        <div className="flex items-center space-x-2">
          <Search size={16} className="text-gray-500" />
          <input
            type="text"
            placeholder="Search entities and memories..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="px-3 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Toggle controls */}
        <div className="flex items-center space-x-4">
          <label className="flex items-center space-x-1 text-sm">
            <input
              type="checkbox"
              checked={showMemories}
              onChange={(e) => setShowMemories(e.target.checked)}
              className="rounded"
            />
            <span>Memories</span>
          </label>
          <label className="flex items-center space-x-1 text-sm">
            <input
              type="checkbox"
              checked={showEntities}
              onChange={(e) => setShowEntities(e.target.checked)}
              className="rounded"
            />
            <span>Entities</span>
          </label>
        </div>

        {/* Entity type filter */}
        <div className="flex items-center space-x-2">
          <Filter size={16} className="text-gray-500" />
          <select
            value={filterEntityType}
            onChange={(e) => setFilterEntityType(e.target.value as Entity['type'] | 'all')}
            className="px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Types</option>
            <option value="person">Person</option>
            <option value="project">Project</option>
            <option value="technology">Technology</option>
            <option value="concept">Concept</option>
            <option value="organization">Organization</option>
            <option value="file">File</option>
            <option value="repository">Repository</option>
            <option value="api">API</option>
            <option value="database">Database</option>
            <option value="service">Service</option>
          </select>
        </div>

        {/* Stats */}
        <div className="ml-auto text-sm text-gray-500 space-x-4">
          <span>{nodes.length} nodes, {edges.length} connections</span>
          {graphStats && (
            <span className="text-xs text-gray-400">
              | Total: {graphStats.entityCount} entities, {graphStats.relationCount} relations
            </span>
          )}
        </div>
      </div>

      {/* Main graph area */}
      <div className="flex flex-1">
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
          
          {(memories.length === 0 && entities.length === 0) && (
            <div className="absolute inset-0 flex items-center justify-center">
              <p className="text-gray-500">No data to display in graph</p>
            </div>
          )}
        </div>

        {/* Side panel for selected node details */}
        {selectedNode && (
          <div className="w-80 border-l border-gray-200 bg-gray-50 p-4 overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">Node Details</h3>
              <button
                onClick={() => setSelectedNode(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={16} />
              </button>
            </div>
            
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-700">Name</label>
                <p className="text-sm text-gray-900">{selectedNode.label}</p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-700">Type</label>
                <p className="text-sm text-gray-900 capitalize">
                  {selectedNode.type === 'entity' ? selectedNode.entityType : selectedNode.type}
                </p>
              </div>
              
              {selectedNode.entity && (
                <>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Confidence</label>
                    <p className="text-sm text-gray-900">
                      {Math.round(selectedNode.entity.confidence * 100)}%
                    </p>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-700">Connected Memories</label>
                    <p className="text-sm text-gray-900">
                      {selectedNode.entity.memoryIds.length} memories
                    </p>
                  </div>
                </>
              )}
              
              {selectedNode.memory && (
                <>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Content Preview</label>
                    <p className="text-sm text-gray-900 line-clamp-3">
                      {selectedNode.memory.content.substring(0, 150)}...
                    </p>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-700">Tags</label>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {selectedNode.memory.tags.map(tag => (
                        <span key={tag} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </>
              )}
              
              {/* Show connected relationships */}
              {selectedNode.type === 'entity' && (
                <div>
                  <label className="text-sm font-medium text-gray-700">Relationships</label>
                  <div className="space-y-1 mt-1">
                    {selectedNode.detailedRelationships && selectedNode.detailedRelationships.length > 0 ? (
                      selectedNode.detailedRelationships.map(relation => {
                        const isOutgoing = relation.fromEntityId === selectedNode.entity?.id;
                        const otherEntityId = isOutgoing ? relation.toEntityId : relation.fromEntityId;
                        const otherEntity = entities.find(e => e.id === otherEntityId);
                        
                        return (
                          <div key={relation.id} className="text-xs text-gray-600">
                            <div className="flex items-center justify-between">
                              <span>
                                {isOutgoing ? '→' : '←'} {relation.type.replace(/_/g, ' ')} {otherEntity?.name || 'Unknown'}
                              </span>
                              <span className="text-gray-400">
                                {Math.round(relation.strength * 100)}%
                              </span>
                            </div>
                            {relation.confidence && (
                              <div className="text-xs text-gray-400 ml-2">
                                Confidence: {Math.round(relation.confidence * 100)}%
                              </div>
                            )}
                          </div>
                        );
                      })
                    ) : (
                      // Fallback to the existing static display
                      relations.filter(r => 
                        r.fromEntityId === selectedNode.entity?.id || r.toEntityId === selectedNode.entity?.id
                      ).map(relation => {
                        const isOutgoing = relation.fromEntityId === selectedNode.entity?.id;
                        const otherEntityId = isOutgoing ? relation.toEntityId : relation.fromEntityId;
                        const otherEntity = entities.find(e => e.id === otherEntityId);
                        
                        return (
                          <div key={relation.id} className="text-xs text-gray-600">
                            {isOutgoing ? '→' : '←'} {relation.type.replace(/_/g, ' ')} {otherEntity?.name}
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="p-4 border-t border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-6 text-sm">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <span className="text-gray-600">Memories</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <span className="text-gray-600">Projects</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
              <span className="text-gray-600">Technologies</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-amber-500 rounded-full"></div>
              <span className="text-gray-600">People</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
              <span className="text-gray-600">Organizations</span>
            </div>
          </div>
          <div className="text-gray-500 text-sm">
            <Info size={14} className="inline mr-1" />
            Click nodes to select, hover for details
          </div>
        </div>
      </div>
    </div>
  );
};

export default KnowledgeGraph;