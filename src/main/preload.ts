import { contextBridge, ipcRenderer } from 'electron';
import { Memory, MemoryType, AppConfig } from '../shared/types';

export interface ElectronAPI {
  // Memory operations
  createMemory: (memory: Omit<Memory, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Memory>;
  getMemory: (id: string) => Promise<Memory | null>;
  updateMemory: (id: string, updates: Partial<Omit<Memory, 'id' | 'createdAt'>>) => Promise<Memory | null>;
  deleteMemory: (id: string) => Promise<boolean>;
  searchMemories: (query: string, limit?: number, offset?: number) => Promise<Memory[]>;
  getMemoriesByType: (type: MemoryType, limit?: number, offset?: number) => Promise<Memory[]>;
  getMemoriesByTags: (tags: string[], limit?: number, offset?: number) => Promise<Memory[]>;
  getRecentMemories: (limit?: number) => Promise<Memory[]>;
  getAllTags: () => Promise<string[]>;

  // App configuration
  getAppConfig: () => Promise<AppConfig>;
  setAppConfig: (config: AppConfig) => Promise<AppConfig>;
  getAppVersion: () => Promise<string>;

  // Menu events
  onMenuNewMemory: (callback: () => void) => void;
  onMenuSearch: (callback: () => void) => void;
  onMenuSettings: (callback: () => void) => void;
  onMenuKnowledgeGraph: (callback: () => void) => void;
  onMenuMemoryList: (callback: () => void) => void;
  onMenuAbout: (callback: () => void) => void;

  // Utility
  removeAllListeners: (channel: string) => void;
}

const electronAPI: ElectronAPI = {
  // Memory operations
  createMemory: (memory) => ipcRenderer.invoke('create-memory', memory),
  getMemory: (id) => ipcRenderer.invoke('get-memory', id),
  updateMemory: (id, updates) => ipcRenderer.invoke('update-memory', id, updates),
  deleteMemory: (id) => ipcRenderer.invoke('delete-memory', id),
  searchMemories: (query, limit, offset) => ipcRenderer.invoke('search-memories', query, limit, offset),
  getMemoriesByType: (type, limit, offset) => ipcRenderer.invoke('get-memories-by-type', type, limit, offset),
  getMemoriesByTags: (tags, limit, offset) => ipcRenderer.invoke('get-memories-by-tags', tags, limit, offset),
  getRecentMemories: (limit) => ipcRenderer.invoke('get-recent-memories', limit),
  getAllTags: () => ipcRenderer.invoke('get-all-tags'),

  // App configuration
  getAppConfig: () => ipcRenderer.invoke('get-app-config'),
  setAppConfig: (config) => ipcRenderer.invoke('set-app-config', config),
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),

  // Menu events
  onMenuNewMemory: (callback) => ipcRenderer.on('menu-new-memory', callback),
  onMenuSearch: (callback) => ipcRenderer.on('menu-search', callback),
  onMenuSettings: (callback) => ipcRenderer.on('menu-settings', callback),
  onMenuKnowledgeGraph: (callback) => ipcRenderer.on('menu-knowledge-graph', callback),
  onMenuMemoryList: (callback) => ipcRenderer.on('menu-memory-list', callback),
  onMenuAbout: (callback) => ipcRenderer.on('menu-about', callback),

  // Utility
  removeAllListeners: (channel) => ipcRenderer.removeAllListeners(channel),
};

contextBridge.exposeInMainWorld('electronAPI', electronAPI);

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}