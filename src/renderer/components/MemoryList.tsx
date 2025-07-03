import React from 'react';
import { Memory } from '../../shared/types';
import { FileText, Calendar, Tag, Trash2, ExternalLink } from 'lucide-react';
import { format } from 'date-fns';

interface MemoryListProps {
  memories: Memory[];
  onMemorySelect: (memory: Memory) => void;
  onMemoryDelete: (memoryId: string) => void;
  selectedMemory: Memory | null;
}

const MemoryList: React.FC<MemoryListProps> = ({
  memories,
  onMemorySelect,
  onMemoryDelete,
  selectedMemory,
}) => {
  const handleDelete = (e: React.MouseEvent, memoryId: string) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this memory?')) {
      onMemoryDelete(memoryId);
    }
  };

  const handleExternalLink = (e: React.MouseEvent, url: string) => {
    e.stopPropagation();
    // In a real app, you'd use Electron's shell.openExternal
    console.log('Opening external link:', url);
  };

  if (memories.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No memories found</h3>
          <p className="text-gray-600 mb-6">Start capturing your development knowledge</p>
          <button
            onClick={() => onMemorySelect({} as Memory)}
            className="btn-primary"
          >
            Create your first memory
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto bg-gray-50">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">
            Memories ({memories.length})
          </h2>
        </div>

        <div className="grid gap-4">
          {memories.map((memory) => (
            <div
              key={memory.id}
              onClick={() => onMemorySelect(memory)}
              className={`memory-card cursor-pointer ${
                selectedMemory?.id === memory.id ? 'selected' : ''
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <FileText className="w-4 h-4 text-gray-400" />
                    <h3 className="text-lg font-medium text-gray-900 text-truncate">
                      {memory.title}
                    </h3>
                  </div>
                  
                  <p className="text-gray-600 line-clamp-3 mb-3">
                    {memory.content}
                  </p>
                  
                  <div className="flex items-center gap-3 text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      <span>{format(new Date(memory.updatedAt), 'MMM d, yyyy')}</span>
                    </div>
                    
                    {memory.metadata.source && (
                      <div className="flex items-center gap-1">
                        <span className="text-gray-400">•</span>
                        <span>{memory.metadata.source}</span>
                      </div>
                    )}
                    
                    {memory.metadata.project && (
                      <div className="flex items-center gap-1">
                        <span className="text-gray-400">•</span>
                        <span>{memory.metadata.project}</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2 mt-3">
                    <span className={`memory-type-badge memory-type-${memory.type}`}>
                      {memory.type.replace('_', ' ')}
                    </span>
                    
                    {memory.tags.map((tag) => (
                      <div key={tag} className="flex items-center gap-1 px-2 py-1 bg-gray-100 rounded-full">
                        <Tag className="w-3 h-3 text-gray-500" />
                        <span className="text-xs text-gray-600">{tag}</span>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="flex items-center gap-2 ml-4">
                  {memory.metadata.url && (
                    <button
                      onClick={(e) => handleExternalLink(e, memory.metadata.url)}
                      className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                      title="Open external link"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </button>
                  )}
                  
                  <button
                    onClick={(e) => handleDelete(e, memory.id)}
                    className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                    title="Delete memory"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MemoryList;