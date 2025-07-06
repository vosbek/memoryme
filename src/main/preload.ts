import { contextBridge, ipcRenderer } from 'electron';
import { Memory, MemoryType, AppConfig } from '../shared/types';

export interface ElectronAPI {
  // Memory operations
  createMemory: (memory: Omit<Memory, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Memory>;
  getMemory: (id: string) => Promise<Memory | null>;
  updateMemory: (id: string, updates: Partial<Omit<Memory, 'id' | 'createdAt'>>) => Promise<Memory | null>;
  deleteMemory: (id: string) => Promise<boolean>;
  searchMemories: (query: string, options?: { 
    limit?: number; 
    offset?: number; 
    searchMethod?: 'auto' | 'vector' | 'text' | 'graph' | 'hybrid';
    threshold?: number;
  }) => Promise<Memory[]>;
  getMemoriesByType: (type: MemoryType, limit?: number, offset?: number) => Promise<Memory[]>;
  getMemoriesByTags: (tags: string[], limit?: number, offset?: number) => Promise<Memory[]>;
  getRecentMemories: (limit?: number) => Promise<Memory[]>;
  getAllMemories: () => Promise<Memory[]>;
  getMemoryCount: () => Promise<number>;
  getAllTags: () => Promise<string[]>;

  // App configuration
  getAppConfig: () => Promise<AppConfig>;
  setAppConfig: (config: AppConfig) => Promise<AppConfig>;
  getAppVersion: () => Promise<string>;
  getVectorInfo: () => Promise<{count: number, name: string, healthy: boolean}>;

  // Knowledge Graph operations
  searchEntities: (query: string, limit?: number, entityType?: string) => Promise<any[]>;
  getGraphStatistics: () => Promise<any>;
  getEntity: (id: string) => Promise<any>;
  getEntityRelationships: (entityId: string, direction?: 'incoming' | 'outgoing' | 'both') => Promise<any[]>;
  getEntitiesByType: (entityType: string, limit?: number) => Promise<any[]>;
  findRelationshipPath: (fromEntityId: string, toEntityId: string, maxDepth?: number) => Promise<any[]>;
  getAllEntities: () => Promise<any[]>;
  getAllRelationships: () => Promise<any[]>;

  // M365 Authentication operations
  m365Initialize: () => Promise<{ success: boolean; error?: string }>;
  m365Login: (scopes?: string[]) => Promise<any>;
  m365Logout: () => Promise<boolean>;
  m365GetStatus: () => Promise<any>;
  m365RefreshToken: () => Promise<boolean>;
  m365GetConfig: () => Promise<any>;

  // Microsoft Graph API operations
  m365TestConnection: () => Promise<any>;
  m365GetUserProfile: () => Promise<any>;
  m365GetRecentEmails: (limit?: number) => Promise<any[]>;
  m365GetRecentEvents: (limit?: number) => Promise<any[]>;
  m365GetTeams: () => Promise<any[]>;
  m365SearchContent: (query: string, entityTypes?: string[]) => Promise<any[]>;

  // M365 Synchronization operations
  m365SyncStart: (options?: any) => Promise<any>;
  m365SyncIncremental: () => Promise<any>;
  m365SyncStatus: () => Promise<any>;
  m365SyncConfigUpdate: (config: any) => Promise<any>;

  // SharePoint operations
  sharepointGetSites: (limit?: number) => Promise<any[]>;
  sharepointGetSiteDetails: (siteId: string) => Promise<any>;
  sharepointGetSiteLists: (siteId: string, includeHidden?: boolean) => Promise<any[]>;
  sharepointGetDocuments: (siteId: string, driveId?: string, folderId?: string, limit?: number) => Promise<any[]>;
  sharepointGetListItems: (siteId: string, listId: string, limit?: number) => Promise<any[]>;
  sharepointSearchContent: (query: string, siteIds?: string[], fileTypes?: string[]) => Promise<any[]>;
  sharepointGetPermissions: (siteId: string, itemId: string, itemType: 'site' | 'list' | 'driveItem') => Promise<any>;
  sharepointGetAnalytics: (siteId: string, period?: 'D7' | 'D30' | 'D90' | 'D180') => Promise<any>;

  // Utility operations
  openExternal: (url: string) => Promise<{ success: boolean; error?: string }>;

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
  searchMemories: (query, options) => ipcRenderer.invoke('search-memories', query, options),
  getMemoriesByType: (type, limit, offset) => ipcRenderer.invoke('get-memories-by-type', type, limit, offset),
  getMemoriesByTags: (tags, limit, offset) => ipcRenderer.invoke('get-memories-by-tags', tags, limit, offset),
  getRecentMemories: (limit) => ipcRenderer.invoke('get-recent-memories', limit),
  getAllMemories: () => ipcRenderer.invoke('get-all-memories'),
  getMemoryCount: () => ipcRenderer.invoke('get-memory-count'),
  getAllTags: () => ipcRenderer.invoke('get-all-tags'),

  // App configuration
  getAppConfig: () => ipcRenderer.invoke('get-app-config'),
  setAppConfig: (config) => ipcRenderer.invoke('set-app-config', config),
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  getVectorInfo: () => ipcRenderer.invoke('get-vector-info'),

  // Knowledge Graph operations
  searchEntities: (query, limit, entityType) => ipcRenderer.invoke('search-entities', query, limit, entityType),
  getGraphStatistics: () => ipcRenderer.invoke('get-graph-statistics'),
  getEntity: (id) => ipcRenderer.invoke('get-entity', id),
  getEntityRelationships: (entityId, direction) => ipcRenderer.invoke('get-entity-relationships', entityId, direction),
  getEntitiesByType: (entityType, limit) => ipcRenderer.invoke('get-entities-by-type', entityType, limit),
  findRelationshipPath: (fromEntityId, toEntityId, maxDepth) => ipcRenderer.invoke('find-relationship-path', fromEntityId, toEntityId, maxDepth),
  getAllEntities: () => ipcRenderer.invoke('get-all-entities'),
  getAllRelationships: () => ipcRenderer.invoke('get-all-relationships'),

  // M365 Authentication operations
  m365Initialize: () => ipcRenderer.invoke('m365-initialize'),
  m365Login: (scopes) => ipcRenderer.invoke('m365-login', scopes),
  m365Logout: () => ipcRenderer.invoke('m365-logout'),
  m365GetStatus: () => ipcRenderer.invoke('m365-get-status'),
  m365RefreshToken: () => ipcRenderer.invoke('m365-refresh-token'),
  m365GetConfig: () => ipcRenderer.invoke('m365-get-config'),

  // Microsoft Graph API operations
  m365TestConnection: () => ipcRenderer.invoke('m365-test-connection'),
  m365GetUserProfile: () => ipcRenderer.invoke('m365-get-user-profile'),
  m365GetRecentEmails: (limit) => ipcRenderer.invoke('m365-get-recent-emails', limit),
  m365GetRecentEvents: (limit) => ipcRenderer.invoke('m365-get-recent-events', limit),
  m365GetTeams: () => ipcRenderer.invoke('m365-get-teams'),
  m365SearchContent: (query, entityTypes) => ipcRenderer.invoke('m365-search-content', query, entityTypes),

  // M365 Synchronization operations
  m365SyncStart: (options) => ipcRenderer.invoke('m365-sync-start', options),
  m365SyncIncremental: () => ipcRenderer.invoke('m365-sync-incremental'),
  m365SyncStatus: () => ipcRenderer.invoke('m365-sync-status'),
  m365SyncConfigUpdate: (config) => ipcRenderer.invoke('m365-sync-config-update', config),

  // SharePoint operations
  sharepointGetSites: (limit) => ipcRenderer.invoke('sharepoint-get-sites', limit),
  sharepointGetSiteDetails: (siteId) => ipcRenderer.invoke('sharepoint-get-site-details', siteId),
  sharepointGetSiteLists: (siteId, includeHidden) => ipcRenderer.invoke('sharepoint-get-site-lists', siteId, includeHidden),
  sharepointGetDocuments: (siteId, driveId, folderId, limit) => ipcRenderer.invoke('sharepoint-get-documents', siteId, driveId, folderId, limit),
  sharepointGetListItems: (siteId, listId, limit) => ipcRenderer.invoke('sharepoint-get-list-items', siteId, listId, limit),
  sharepointSearchContent: (query, siteIds, fileTypes) => ipcRenderer.invoke('sharepoint-search-content', query, siteIds, fileTypes),
  sharepointGetPermissions: (siteId, itemId, itemType) => ipcRenderer.invoke('sharepoint-get-permissions', siteId, itemId, itemType),
  sharepointGetAnalytics: (siteId, period) => ipcRenderer.invoke('sharepoint-get-analytics', siteId, period),

  // Utility operations
  openExternal: (url) => ipcRenderer.invoke('open-external', url),

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