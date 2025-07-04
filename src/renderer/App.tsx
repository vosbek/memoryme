import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Routes, Route } from 'react-router-dom';
import { Memory, MemoryType } from '../shared/types';
import Sidebar from './components/Sidebar';
import MemoryList from './components/MemoryList';
import MemoryEditor from './components/MemoryEditor';
import SearchView from './components/SearchView';
import SettingsView from './components/SettingsView';
import KnowledgeGraph from './components/KnowledgeGraph';
import ErrorBoundary from './components/ErrorBoundary';
import { ToastProvider, useToast } from './components/Toast';
import { LoadingSpinner, LoadingOverlay } from './components/LoadingSpinner';
import { Search, Plus, Settings } from 'lucide-react';

const AppContent: React.FC = () => {
  const { showError, showSuccess } = useToast();
  const [memories, setMemories] = useState<Memory[]>([]);
  const [selectedMemory, setSelectedMemory] = useState<Memory | null>(null);
  const [showEditor, setShowEditor] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showKnowledgeGraph, setShowKnowledgeGraph] = useState(false);
  const [loading, setLoading] = useState(true);
  const [retryCount, setRetryCount] = useState(0);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    loadRecentMemories();
    setupMenuListeners();
    setupConnectionListeners();
    return () => {
      // Clean up all event listeners
      window.electronAPI.removeAllListeners('menu-new-memory');
      window.electronAPI.removeAllListeners('menu-search');
      window.electronAPI.removeAllListeners('menu-settings');
      window.electronAPI.removeAllListeners('menu-knowledge-graph');
      window.electronAPI.removeAllListeners('menu-memory-list');
      window.electronAPI.removeAllListeners('menu-about');
      
      // Clean up connection listeners
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const loadRecentMemories = useCallback(async (showRetryMessage = false) => {
    try {
      setLoading(true);
      const recentMemories = await window.electronAPI.getRecentMemories(50);
      setMemories(recentMemories);
      setRetryCount(0); // Reset retry count on success
      
      if (showRetryMessage) {
        showSuccess('Reconnected', 'Successfully reloaded memories.');
      }
    } catch (error) {
      console.error('Failed to load memories:', error);
      const isNetworkError = error instanceof Error && (
        error.message.includes('network') || 
        error.message.includes('connection') ||
        error.message.includes('timeout')
      );
      
      if (isNetworkError && retryCount < 3) {
        setRetryCount(prev => prev + 1);
        showError('Connection issue', `Retrying... (attempt ${retryCount + 1}/3)`);
        setTimeout(() => loadRecentMemories(true), 2000 * (retryCount + 1));
      } else {
        showError('Failed to load memories', 'Please check your database connection and try again.');
      }
    } finally {
      setLoading(false);
    }
  }, [showError, showSuccess, retryCount]);

  const setupMenuListeners = useCallback(() => {
    window.electronAPI.onMenuNewMemory(() => {
      handleNewMemory();
    });

    window.electronAPI.onMenuSearch(() => {
      setShowSearch(true);
    });

    window.electronAPI.onMenuSettings(() => {
      setShowSettings(true);
    });

    window.electronAPI.onMenuKnowledgeGraph(() => {
      setShowKnowledgeGraph(true);
    });

    window.electronAPI.onMenuMemoryList(() => {
      setShowKnowledgeGraph(false);
      setShowSearch(false);
      setShowSettings(false);
      setShowEditor(false);
    });
  }, []);

  const setupConnectionListeners = useCallback(() => {
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
  }, []);

  const handleOnline = useCallback(() => {
    setIsOnline(true);
    loadRecentMemories(true);
  }, [loadRecentMemories]);

  const handleOffline = useCallback(() => {
    setIsOnline(false);
    showError('Connection lost', 'Working offline. Some features may be limited.');
  }, [showError]);

  const handleNewMemory = useCallback(() => {
    setSelectedMemory(null);
    setShowEditor(true);
  }, []);

  const handleMemorySelect = useCallback((memory: Memory) => {
    setSelectedMemory(memory);
    setShowEditor(true);
  }, []);

  const handleMemorySave = useCallback(async (memory: Memory) => {
    try {
      let savedMemory: Memory;
      if (memory.id) {
        savedMemory = await window.electronAPI.updateMemory(memory.id, memory) || memory;
      } else {
        savedMemory = await window.electronAPI.createMemory(memory);
      }
      
      // Update the memories list optimistically
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
      showSuccess('Memory saved', 'Your memory has been saved successfully.');
    } catch (error) {
      console.error('Failed to save memory:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      showError('Failed to save memory', `Error: ${errorMessage}. Please try again.`);
    }
  }, [showError, showSuccess]);

  const handleMemoryDelete = useCallback(async (memoryId: string) => {
    try {
      // Optimistic update - remove from UI immediately
      const deletedMemory = memories.find(m => m.id === memoryId);
      setMemories(prev => prev.filter(m => m.id !== memoryId));
      if (selectedMemory?.id === memoryId) {
        setSelectedMemory(null);
      }
      
      await window.electronAPI.deleteMemory(memoryId);
      showSuccess('Memory deleted', 'The memory has been permanently deleted.');
    } catch (error) {
      console.error('Failed to delete memory:', error);
      // Revert optimistic update on error
      loadRecentMemories();
      showError('Failed to delete memory', 'The operation failed. Please try again.');
    }
  }, [memories, selectedMemory, showError, showSuccess, loadRecentMemories]);

  const handleSearch = useCallback(async (query: string) => {
    try {
      setLoading(true);
      const results = await window.electronAPI.searchMemories(query, 50);
      setMemories(results);
    } catch (error) {
      console.error('Failed to search memories:', error);
      showError('Search failed', 'Unable to search memories. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [showError]);

  const isInitialLoading = loading && memories.length === 0;
  const memoizedMemories = useMemo(() => memories, [memories]);

  if (isInitialLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <LoadingSpinner 
          size="large" 
          text="Loading DevMemory..." 
          className="p-8"
        />
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="flex h-screen bg-gray-50">
        <ErrorBoundary>
          <Sidebar
            memories={memoizedMemories}
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
          
          {showKnowledgeGraph && (
            <ErrorBoundary>
              <KnowledgeGraph
                memories={memories}
                onClose={() => setShowKnowledgeGraph(false)}
                onMemorySelect={handleMemorySelect}
              />
            </ErrorBoundary>
          )}
          
          {!showEditor && !showSearch && !showSettings && !showKnowledgeGraph && (
            <ErrorBoundary>
              <MemoryList
                memories={memoizedMemories}
                onMemorySelect={handleMemorySelect}
                onMemoryDelete={handleMemoryDelete}
                selectedMemory={selectedMemory}
              />
            </ErrorBoundary>
          )}
        </main>
        
        {/* Network status indicator */}
        {!isOnline && (
          <div className="fixed bottom-4 right-4 bg-yellow-500 text-white px-4 py-2 rounded-lg shadow-lg">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-yellow-300 rounded-full animate-pulse"></div>
              Working offline
            </div>
          </div>
        )}
        
        {/* Loading overlay for non-initial loads */}
        <LoadingOverlay 
          isVisible={loading && !isInitialLoading} 
          text="Processing..."
        />
      </div>
    </ErrorBoundary>
  );
};

const App: React.FC = () => {
  return (
    <ToastProvider>
      <AppContent />
    </ToastProvider>
  );
};

export default App;