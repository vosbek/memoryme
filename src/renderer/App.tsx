import React, { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { Memory, MemoryType } from '../shared/types';
import Sidebar from './components/Sidebar';
import MemoryList from './components/MemoryList';
import MemoryEditor from './components/MemoryEditor';
import SearchView from './components/SearchView';
import SettingsView from './components/SettingsView';
import ErrorBoundary from './components/ErrorBoundary';
import { Search, Plus, Settings } from 'lucide-react';

const App: React.FC = () => {
  const [memories, setMemories] = useState<Memory[]>([]);
  const [selectedMemory, setSelectedMemory] = useState<Memory | null>(null);
  const [showEditor, setShowEditor] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRecentMemories();
    setupMenuListeners();
    return () => {
      // Clean up all event listeners
      window.electronAPI.removeAllListeners('menu-new-memory');
      window.electronAPI.removeAllListeners('menu-search');
      window.electronAPI.removeAllListeners('menu-settings');
      window.electronAPI.removeAllListeners('menu-knowledge-graph');
      window.electronAPI.removeAllListeners('menu-memory-list');
      window.electronAPI.removeAllListeners('menu-about');
    };
  }, []);

  const loadRecentMemories = async () => {
    try {
      const recentMemories = await window.electronAPI.getRecentMemories(50);
      setMemories(recentMemories);
    } catch (error) {
      console.error('Failed to load memories:', error);
    } finally {
      setLoading(false);
    }
  };

  const setupMenuListeners = () => {
    window.electronAPI.onMenuNewMemory(() => {
      handleNewMemory();
    });

    window.electronAPI.onMenuSearch(() => {
      setShowSearch(true);
    });

    window.electronAPI.onMenuSettings(() => {
      setShowSettings(true);
    });
  };

  const handleNewMemory = () => {
    setSelectedMemory(null);
    setShowEditor(true);
  };

  const handleMemorySelect = (memory: Memory) => {
    setSelectedMemory(memory);
    setShowEditor(true);
  };

  const handleMemorySave = async (memory: Memory) => {
    try {
      let savedMemory: Memory;
      if (memory.id) {
        savedMemory = await window.electronAPI.updateMemory(memory.id, memory) || memory;
      } else {
        savedMemory = await window.electronAPI.createMemory(memory);
      }
      
      // Update the memories list
      setMemories(prev => {
        const existing = prev.find(m => m.id === savedMemory.id);
        if (existing) {
          return prev.map(m => m.id === savedMemory.id ? savedMemory : m);
        } else {
          return [savedMemory, ...prev];
        }
      });
      
      setSelectedMemory(savedMemory);
      setShowEditor(false);
    } catch (error) {
      console.error('Failed to save memory:', error);
    }
  };

  const handleMemoryDelete = async (memoryId: string) => {
    try {
      await window.electronAPI.deleteMemory(memoryId);
      setMemories(prev => prev.filter(m => m.id !== memoryId));
      if (selectedMemory?.id === memoryId) {
        setSelectedMemory(null);
      }
    } catch (error) {
      console.error('Failed to delete memory:', error);
    }
  };

  const handleSearch = async (query: string) => {
    try {
      const results = await window.electronAPI.searchMemories(query, 50);
      setMemories(results);
    } catch (error) {
      console.error('Failed to search memories:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-sm text-gray-600">Loading DevMemory...</p>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="flex h-screen bg-gray-50">
        <ErrorBoundary>
          <Sidebar
            memories={memories}
            onMemorySelect={handleMemorySelect}
            onNewMemory={handleNewMemory}
            onSearch={() => setShowSearch(true)}
            onSettings={() => setShowSettings(true)}
            selectedMemory={selectedMemory}
          />
        </ErrorBoundary>
        
        <main className="flex-1 flex flex-col">
          {showEditor && (
            <ErrorBoundary>
              <MemoryEditor
                memory={selectedMemory}
                onSave={handleMemorySave}
                onCancel={() => setShowEditor(false)}
              />
            </ErrorBoundary>
          )}
          
          {showSearch && (
            <ErrorBoundary>
              <SearchView
                onSearch={handleSearch}
                onClose={() => setShowSearch(false)}
                onMemorySelect={handleMemorySelect}
              />
            </ErrorBoundary>
          )}
          
          {showSettings && (
            <ErrorBoundary>
              <SettingsView
                onClose={() => setShowSettings(false)}
              />
            </ErrorBoundary>
          )}
          
          {!showEditor && !showSearch && !showSettings && (
            <ErrorBoundary>
              <MemoryList
                memories={memories}
                onMemorySelect={handleMemorySelect}
                onMemoryDelete={handleMemoryDelete}
                selectedMemory={selectedMemory}
              />
            </ErrorBoundary>
          )}
        </main>
      </div>
    </ErrorBoundary>
  );
};

export default App;