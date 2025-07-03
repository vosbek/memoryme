import React from 'react';
import { Memory } from '../../shared/types';
import { Plus, Search, Settings, FileText, Clock, Hash } from 'lucide-react';
import { format } from 'date-fns';

interface SidebarProps {
  memories: Memory[];
  onMemorySelect: (memory: Memory) => void;
  onNewMemory: () => void;
  onSearch: () => void;
  onSettings: () => void;
  selectedMemory: Memory | null;
}

const Sidebar: React.FC<SidebarProps> = ({
  memories,
  onMemorySelect,
  onNewMemory,
  onSearch,
  onSettings,
  selectedMemory,
}) => {
  const recentMemories = memories.slice(0, 10);

  return (
    <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <h1 className="text-xl font-bold text-gray-900">DevMemory</h1>
        <p className="text-sm text-gray-600">Enterprise Developer Memory</p>
      </div>

      {/* Actions */}
      <div className="p-4 space-y-2">
        <button
          onClick={onNewMemory}
          className="w-full flex items-center gap-2 px-3 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Memory
        </button>
        
        <button
          onClick={onSearch}
          className="w-full flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
        >
          <Search className="w-4 h-4" />
          Search
        </button>
      </div>

      {/* Recent Memories */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <Clock className="w-4 h-4 text-gray-500" />
            <h2 className="text-sm font-medium text-gray-900">Recent</h2>
          </div>
          
          <div className="space-y-2">
            {recentMemories.map((memory) => (
              <div
                key={memory.id}
                onClick={() => onMemorySelect(memory)}
                className={`p-3 rounded-md cursor-pointer transition-colors ${
                  selectedMemory?.id === memory.id
                    ? 'bg-blue-50 border-blue-200 border'
                    : 'hover:bg-gray-50'
                }`}
              >
                <div className="flex items-start gap-2">
                  <FileText className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 text-truncate">
                      {memory.title}
                    </p>
                    <p className="text-xs text-gray-500 line-clamp-2 mt-1">
                      {memory.content}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className={`memory-type-badge memory-type-${memory.type}`}>
                        {memory.type.replace('_', ' ')}
                      </span>
                      <span className="text-xs text-gray-400">
                        {format(new Date(memory.updatedAt), 'MMM d')}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {recentMemories.length === 0 && (
            <div className="text-center py-8">
              <FileText className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-500">No memories yet</p>
              <p className="text-xs text-gray-400">Create your first memory to get started</p>
            </div>
          )}
        </div>
      </div>

      {/* Settings */}
      <div className="p-4 border-t border-gray-200">
        <button
          onClick={onSettings}
          className="w-full flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
        >
          <Settings className="w-4 h-4" />
          Settings
        </button>
      </div>
    </div>
  );
};

export default Sidebar;