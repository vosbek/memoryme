import React, { useState, useEffect } from 'react';
import { Memory, MemoryType } from '../../shared/types';
import { Search, X, Filter, Calendar, Tag, FileText } from 'lucide-react';
import { format } from 'date-fns';

interface SearchViewProps {
  onSearch: (query: string) => void;
  onClose: () => void;
  onMemorySelect: (memory: Memory) => void;
}

const SearchView: React.FC<SearchViewProps> = ({
  onSearch,
  onClose,
  onMemorySelect,
}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Memory[]>([]);
  const [loading, setLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    type: '' as MemoryType | '',
    tags: [] as string[],
    dateRange: {
      start: '',
      end: '',
    },
  });

  useEffect(() => {
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
      searchInput.focus();
    }
  }, []);

  const handleSearch = async (searchQuery: string = query) => {
    if (!searchQuery.trim()) {
      setResults([]);
      return;
    }

    setLoading(true);
    try {
      const searchResults = await window.electronAPI.searchMemories(searchQuery.trim(), { limit: 50 });
      setResults(searchResults);
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
    if (e.key === 'Escape') {
      onClose();
    }
  };

  const handleFilterChange = (key: string, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
    }));
  };

  const clearFilters = () => {
    setFilters({
      type: '',
      tags: [],
      dateRange: {
        start: '',
        end: '',
      },
    });
  };

  return (
    <div className="flex-1 flex flex-col bg-white">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <h2 className="text-lg font-medium text-gray-900">Search Memories</h2>
        <button
          onClick={onClose}
          className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Search Input */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              id="search-input"
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyPress={handleKeyPress}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Search memories, tags, content..."
            />
          </div>
          <button
            onClick={() => handleSearch()}
            className="btn-primary"
          >
            Search
          </button>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`btn-secondary ${showFilters ? 'bg-blue-50 text-blue-700' : ''}`}
          >
            <Filter className="w-4 h-4" />
          </button>
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="mt-4 p-4 bg-gray-50 rounded-md">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Type
                </label>
                <select
                  value={filters.type}
                  onChange={(e) => handleFilterChange('type', e.target.value)}
                  className="select-field"
                >
                  <option value="">All Types</option>
                  {Object.values(MemoryType).map(type => (
                    <option key={type} value={type}>
                      {type.replace('_', ' ')}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  From Date
                </label>
                <input
                  type="date"
                  value={filters.dateRange.start}
                  onChange={(e) => handleFilterChange('dateRange', {
                    ...filters.dateRange,
                    start: e.target.value
                  })}
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  To Date
                </label>
                <input
                  type="date"
                  value={filters.dateRange.end}
                  onChange={(e) => handleFilterChange('dateRange', {
                    ...filters.dateRange,
                    end: e.target.value
                  })}
                  className="input-field"
                />
              </div>
            </div>

            <div className="flex gap-2 mt-4">
              <button
                onClick={clearFilters}
                className="btn-secondary text-sm"
              >
                Clear Filters
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Results */}
      <div className="flex-1 overflow-y-auto p-4">
        {loading && (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-sm text-gray-600">Searching...</p>
          </div>
        )}

        {!loading && results.length === 0 && query.trim() && (
          <div className="text-center py-8">
            <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No results found</h3>
            <p className="text-gray-600">Try adjusting your search terms or filters</p>
          </div>
        )}

        {!loading && results.length === 0 && !query.trim() && (
          <div className="text-center py-8">
            <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Start searching</h3>
            <p className="text-gray-600">Enter a query to search through your memories</p>
          </div>
        )}

        {!loading && results.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">
                {results.length} result{results.length !== 1 ? 's' : ''}
              </h3>
            </div>

            <div className="grid gap-4">
              {results.map((memory) => (
                <div
                  key={memory.id}
                  onClick={() => onMemorySelect(memory)}
                  className="memory-card cursor-pointer"
                >
                  <div className="flex items-start gap-3">
                    <FileText className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <h4 className="text-lg font-medium text-gray-900 mb-1">
                        {memory.title}
                      </h4>
                      <p className="text-gray-600 line-clamp-3 mb-3">
                        {memory.content}
                      </p>
                      
                      <div className="flex items-center gap-3 text-sm text-gray-500 mb-2">
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
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <span className={`memory-type-badge memory-type-${memory.type}`}>
                          {memory.type.replace('_', ' ')}
                        </span>
                        
                        {memory.tags.slice(0, 3).map((tag) => (
                          <div key={tag} className="flex items-center gap-1 px-2 py-1 bg-gray-100 rounded-full">
                            <Tag className="w-3 h-3 text-gray-500" />
                            <span className="text-xs text-gray-600">{tag}</span>
                          </div>
                        ))}
                        
                        {memory.tags.length > 3 && (
                          <span className="text-xs text-gray-500">
                            +{memory.tags.length - 3} more
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchView;