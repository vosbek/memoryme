import { app, BrowserWindow, ipcMain, Menu, shell } from 'electron';
import * as path from 'path';
import { HybridDatabaseManager } from '../shared/database/hybrid-database-manager';
import { Memory, MemoryType, SearchQuery, AppConfig } from '../shared/types';
import { m365AuthService, M365AuthResult, M365Status } from '../shared/services/m365-auth';
import { m365GraphClient, ConnectionTestResult } from '../shared/services/m365-graph-client';
import { m365SyncEngine } from '../shared/services/m365-sync-engine';
import { sharepointService } from '../shared/services/sharepoint-service';
import ElectronStore from 'electron-store';
import { createLogger } from '../shared/utils/logger';

const store = new ElectronStore();
const logger = createLogger('Main');
let mainWindow: BrowserWindow | null = null;
let databaseManager: HybridDatabaseManager | null = null;
let databaseReady: Promise<void>;

const isDev = process.env.NODE_ENV === 'development';

logger.info('Application starting', { isDev, platform: process.platform });

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
    titleBarStyle: 'hiddenInset',
    show: false,
  });

  if (isDev) {
    mainWindow.loadURL('http://localhost:3000');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, 'index.html'));
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

function createMenu() {
  const template: Electron.MenuItemConstructorOptions[] = [
    {
      label: 'File',
      submenu: [
        {
          label: 'New Memory',
          accelerator: 'CmdOrCtrl+N',
          click: () => {
            mainWindow?.webContents.send('menu-new-memory');
          },
        },
        {
          label: 'Search',
          accelerator: 'CmdOrCtrl+F',
          click: () => {
            mainWindow?.webContents.send('menu-search');
          },
        },
        { type: 'separator' },
        {
          label: 'Settings',
          accelerator: 'CmdOrCtrl+,',
          click: () => {
            mainWindow?.webContents.send('menu-settings');
          },
        },
        { type: 'separator' },
        {
          label: 'Quit',
          accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
          click: () => {
            app.quit();
          },
        },
      ],
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { role: 'selectAll' },
      ],
    },
    {
      label: 'View',
      submenu: [
        {
          label: 'Knowledge Graph',
          accelerator: 'CmdOrCtrl+G',
          click: () => {
            mainWindow?.webContents.send('menu-knowledge-graph');
          },
        },
        {
          label: 'Memory List',
          accelerator: 'CmdOrCtrl+L',
          click: () => {
            mainWindow?.webContents.send('menu-memory-list');
          },
        },
        { type: 'separator' },
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' },
      ],
    },
    {
      label: 'Window',
      submenu: [
        { role: 'minimize' },
        { role: 'close' },
      ],
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'About DevMemory',
          click: () => {
            mainWindow?.webContents.send('menu-about');
          },
        },
        {
          label: 'Learn More',
          click: () => {
            shell.openExternal('https://github.com/enterprise/devmemory');
          },
        },
      ],
    },
  ];

  if (process.platform === 'darwin') {
    template.unshift({
      label: 'DevMemory',
      submenu: [
        { role: 'about' },
        { type: 'separator' },
        { role: 'services', submenu: [] },
        { type: 'separator' },
        { role: 'hide' },
        { role: 'hideOthers' },
        { role: 'unhide' },
        { type: 'separator' },
        { role: 'quit' },
      ],
    });
  }

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

async function initializeDatabase() {
  const userDataDir = app.getPath('userData');
  
  try {
    logger.info('Initializing hybrid database system', { userDataDir });
    
    // Initialize hybrid database manager
    databaseManager = new HybridDatabaseManager(userDataDir);
    await databaseManager.initialize();
    
    logger.info('Hybrid database system initialized successfully');
    
    // Log system health
    const health = await databaseManager.getSystemHealth();
    logger.info('Database system health check', health);

    // Initialize M365 sync engine
    try {
      await m365SyncEngine.initialize(databaseManager);
      logger.info('M365 sync engine initialized successfully');
    } catch (error) {
      logger.warn('M365 sync engine initialization failed (will continue without M365 sync)', error);
    }
    
  } catch (error) {
    logger.error('Database initialization failed', error);
    throw error;
  }
}

// IPC Handlers
ipcMain.handle('create-memory', async (event, memory: Omit<Memory, 'id' | 'createdAt' | 'updatedAt'>) => {
  logger.info('IPC: Creating memory', { title: memory.title, type: memory.type });
  
  await databaseReady;
  if (!databaseManager) throw new Error('Database not initialized');
  
  try {
    const savedMemory = await databaseManager.createMemory(memory);
    logger.info('Memory creation completed successfully', { 
      id: savedMemory.id, 
      title: savedMemory.title 
    });
    
    return savedMemory;
  } catch (error) {
    logger.error('Failed to create memory', error);
    throw error;
  }
});

ipcMain.handle('get-memory', async (event, id: string) => {
  if (!databaseManager) throw new Error('Database not initialized');
  return await databaseManager.getMemory(id);
});

ipcMain.handle('update-memory', async (event, id: string, updates: Partial<Omit<Memory, 'id' | 'createdAt'>>) => {
  await databaseReady;
  if (!databaseManager) throw new Error('Database not initialized');
  try {
    const updatedMemory = await databaseManager.updateMemory(id, updates);
    return updatedMemory;
  } catch (error) {
    logger.error('Failed to update memory', error);
    throw error;
  }
});

ipcMain.handle('delete-memory', async (event, id: string) => {
  await databaseReady;
  if (!databaseManager) throw new Error('Database not initialized');
  try {
    const result = await databaseManager.deleteMemory(id);
    return result;
  } catch (error) {
    logger.error('Failed to delete memory', error);
    throw error;
  }
});

ipcMain.handle('search-memories', async (event, query: string, options?: { 
  limit?: number; 
  offset?: number; 
  searchMethod?: 'auto' | 'vector' | 'text' | 'graph' | 'hybrid';
  threshold?: number;
}) => {
  await databaseReady;
  if (!databaseManager) throw new Error('Database not initialized');
  
  try {
    const offset = options?.offset || 0;
    const limit = options?.limit || 20;
    
    const searchOptions = {
      limit: limit + offset, // Get enough results to handle offset
      threshold: options?.threshold || 0.5,
      searchMethod: options?.searchMethod || 'auto'
    };

    const searchResults = await databaseManager.searchMemories(query, searchOptions);
    
    // Apply pagination to search results (preserving context)
    const paginatedResults = searchResults.slice(offset, offset + limit);
    
    // Return enriched results with search context
    return paginatedResults.map(result => ({
      ...result.memory,
      searchContext: {
        similarity: result.similarity,
        searchMethod: result.searchMethod,
        relationshipContext: result.relationshipContext
      }
    }));
  } catch (error) {
    logger.error('Search failed', error);
    throw error;
  }
});

ipcMain.handle('get-memories-by-type', async (event, type: MemoryType, limit?: number, offset?: number) => {
  if (!databaseManager) throw new Error('Database not initialized');
  return await databaseManager.getMemoriesByType(type, limit);
});

ipcMain.handle('get-memories-by-tags', async (event, tags: string[], limit?: number, offset?: number) => {
  if (!databaseManager) throw new Error('Database not initialized');
  return await databaseManager.getMemoriesByTags(tags, limit, offset);
});

ipcMain.handle('get-recent-memories', async (event, limit?: number) => {
  if (!databaseManager) throw new Error('Database not initialized');
  return await databaseManager.getRecentMemories(limit);
});

ipcMain.handle('get-all-memories', async () => {
  if (!databaseManager) throw new Error('Database not initialized');
  return await databaseManager.getRecentMemories(10000); // Large limit to get all
});

ipcMain.handle('get-memory-count', async () => {
  if (!databaseManager) throw new Error('Database not initialized');
  const memories = await databaseManager.getRecentMemories(10000);
  return memories.length;
});

ipcMain.handle('get-all-tags', async () => {
  if (!databaseManager) throw new Error('Database not initialized');
  // This will need to be implemented in the HybridDatabaseManager
  // For now, extract tags from all memories
  const memories = await databaseManager.getRecentMemories(10000);
  const tagSet = new Set<string>();
  memories.forEach(memory => {
    memory.tags.forEach(tag => tagSet.add(tag));
  });
  return Array.from(tagSet).sort();
});

ipcMain.handle('get-app-config', async () => {
  return store.get('appConfig', {
    database: {
      sqlitePath: path.join(app.getPath('userData'), 'devmemory.db'),
      chromaPath: path.join(app.getPath('userData'), 'chroma'),
    },
    llm: {
      awsRegion: 'us-east-1',
      bedrockModelId: 'anthropic.claude-3-sonnet-20240229-v1:0',
      embeddingModelId: 'amazon.titan-embed-text-v1',
    },
    ui: {
      theme: 'system',
      defaultView: 'list',
    },
    integration: {
      vscode: {
        enabled: true,
        autoCapture: true,
        captureCommands: true,
        captureFiles: true,
      },
    },
  } as AppConfig);
});

ipcMain.handle('set-app-config', async (event, config: AppConfig) => {
  store.set('appConfig', config);
  return config;
});

ipcMain.handle('get-app-version', async () => {
  return app.getVersion();
});

ipcMain.handle('get-vector-info', async () => {
  await databaseReady;
  if (!databaseManager) throw new Error('Database not initialized');
  try {
    const health = await databaseManager.getSystemHealth();
    return {
      count: 0, // Will be updated with actual count
      name: 'hybrid-vector-store',
      healthy: health.overall,
      systems: health,
    };
  } catch (error) {
    logger.error('Failed to get vector info', error);
    return { count: 0, name: 'unavailable', healthy: false };
  }
});

// Knowledge Graph IPC handlers
ipcMain.handle('search-entities', async (event, query: string, limit?: number, entityType?: string) => {
  await databaseReady;
  if (!databaseManager) throw new Error('Database not initialized');
  try {
    const results = await databaseManager.searchEntities(query, limit || 20, entityType);
    logger.info('Entity search completed', { query, resultsCount: results.length });
    return results;
  } catch (error) {
    logger.error('Failed to search entities', error);
    return [];
  }
});

ipcMain.handle('get-graph-statistics', async () => {
  await databaseReady;
  if (!databaseManager) throw new Error('Database not initialized');
  try {
    const stats = await databaseManager.getGraphStatistics();
    logger.info('Graph statistics retrieved', stats);
    return stats;
  } catch (error) {
    logger.error('Failed to get graph statistics', error);
    return {
      entityCount: 0,
      relationCount: 0,
      entityTypes: {},
      relationTypes: {},
      avgRelationsPerEntity: 0
    };
  }
});

ipcMain.handle('get-entity', async (event, id: string) => {
  await databaseReady;
  if (!databaseManager) throw new Error('Database not initialized');
  try {
    return await databaseManager.getEntity(id);
  } catch (error) {
    logger.error('Failed to get entity', error);
    return null;
  }
});

ipcMain.handle('get-entity-relationships', async (event, entityId: string, direction?: 'incoming' | 'outgoing' | 'both') => {
  await databaseReady;
  if (!databaseManager) throw new Error('Database not initialized');
  try {
    return await databaseManager.getEntityRelationships(entityId, direction);
  } catch (error) {
    logger.error('Failed to get entity relationships', error);
    return [];
  }
});

ipcMain.handle('get-entities-by-type', async (event, entityType: string, limit?: number) => {
  await databaseReady;
  if (!databaseManager) throw new Error('Database not initialized');
  try {
    return await databaseManager.getEntitiesByType(entityType, limit);
  } catch (error) {
    logger.error('Failed to get entities by type', error);
    return [];
  }
});

ipcMain.handle('find-relationship-path', async (event, fromEntityId: string, toEntityId: string, maxDepth?: number) => {
  await databaseReady;
  if (!databaseManager) throw new Error('Database not initialized');
  try {
    return await databaseManager.findRelationshipPath(fromEntityId, toEntityId, maxDepth);
  } catch (error) {
    logger.error('Failed to find relationship path', error);
    return [];
  }
});

ipcMain.handle('get-all-entities', async () => {
  await databaseReady;
  if (!databaseManager) throw new Error('Database not initialized');
  try {
    return await databaseManager.getAllEntities();
  } catch (error) {
    logger.error('Failed to get all entities', error);
    return [];
  }
});

ipcMain.handle('get-all-relationships', async () => {
  await databaseReady;
  if (!databaseManager) throw new Error('Database not initialized');
  try {
    return await databaseManager.getAllRelationships();
  } catch (error) {
    logger.error('Failed to get all relationships', error);
    return [];
  }
});

// === M365 Authentication IPC Handlers ===

ipcMain.handle('m365-initialize', async () => {
  try {
    logger.info('Initializing M365 authentication service');
    await m365AuthService.initialize();
    logger.info('✓ M365 authentication service initialized');
    return { success: true };
  } catch (error) {
    logger.error('M365 initialization failed', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
});

ipcMain.handle('m365-login', async (event, scopes?: string[]): Promise<M365AuthResult> => {
  try {
    logger.info('Starting M365 login flow', { scopes });
    
    // Ensure service is initialized
    if (!m365AuthService.isReady()) {
      await m365AuthService.initialize();
    }
    
    const result = await m365AuthService.login(scopes);
    
    if (result.success) {
      logger.info('✓ M365 login successful', { 
        account: result.account?.username,
        tenant: result.account?.tenantId 
      });
    } else {
      logger.warn('M365 login failed', { error: result.error });
    }
    
    return result;
  } catch (error) {
    logger.error('M365 login error', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Authentication failed'
    };
  }
});

ipcMain.handle('m365-logout', async (): Promise<boolean> => {
  try {
    logger.info('Starting M365 logout');
    const result = await m365AuthService.logout();
    
    if (result) {
      logger.info('✓ M365 logout successful');
    } else {
      logger.warn('M365 logout failed');
    }
    
    return result;
  } catch (error) {
    logger.error('M365 logout error', error);
    return false;
  }
});

ipcMain.handle('m365-get-status', async (): Promise<M365Status> => {
  try {
    const status = await m365AuthService.getAuthStatus();
    logger.debug('M365 status retrieved', { 
      isAuthenticated: status.isAuthenticated,
      account: status.account?.username 
    });
    return status;
  } catch (error) {
    logger.error('Failed to get M365 status', error);
    return { isAuthenticated: false };
  }
});

ipcMain.handle('m365-refresh-token', async (): Promise<boolean> => {
  try {
    logger.debug('Refreshing M365 token');
    const result = await m365AuthService.refreshToken();
    
    if (result) {
      logger.debug('✓ M365 token refreshed successfully');
    } else {
      logger.debug('M365 token refresh failed');
    }
    
    return result;
  } catch (error) {
    logger.error('M365 token refresh error', error);
    return false;
  }
});

ipcMain.handle('m365-get-config', async () => {
  try {
    const config = m365AuthService.getConfig();
    logger.debug('M365 config retrieved', config);
    return config;
  } catch (error) {
    logger.error('Failed to get M365 config', error);
    return { error: 'Failed to get configuration' };
  }
});

// === Microsoft Graph IPC Handlers ===

ipcMain.handle('m365-test-connection', async (): Promise<ConnectionTestResult> => {
  try {
    logger.info('Testing M365 Graph connection');
    
    // Ensure Graph client is initialized
    if (!m365GraphClient.isReady()) {
      await m365GraphClient.initialize();
    }
    
    const result = await m365GraphClient.testConnection();
    
    if (result.success) {
      logger.info('✓ M365 Graph connection test successful', {
        user: result.userProfile?.displayName,
        organization: result.organization?.displayName,
        services: result.services
      });
    } else {
      logger.warn('M365 Graph connection test failed', { error: result.error });
    }
    
    return result;
  } catch (error) {
    logger.error('M365 Graph connection test error', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Connection test failed',
      services: {
        mail: false,
        calendar: false,
        files: false,
        teams: false,
        sharepoint: false
      }
    };
  }
});

ipcMain.handle('m365-get-user-profile', async () => {
  try {
    if (!m365GraphClient.isReady()) {
      await m365GraphClient.initialize();
    }
    
    const profile = await m365GraphClient.getUserProfile();
    logger.debug('M365 user profile retrieved', { user: profile.displayName });
    return profile;
  } catch (error) {
    logger.error('Failed to get M365 user profile', error);
    throw error;
  }
});

ipcMain.handle('m365-get-recent-emails', async (event, limit: number = 10) => {
  try {
    if (!m365GraphClient.isReady()) {
      await m365GraphClient.initialize();
    }
    
    const emails = await m365GraphClient.getRecentEmails(limit);
    logger.debug('M365 recent emails retrieved', { count: emails.length });
    return emails;
  } catch (error) {
    logger.error('Failed to get recent emails', error);
    throw error;
  }
});

ipcMain.handle('m365-get-recent-events', async (event, limit: number = 10) => {
  try {
    if (!m365GraphClient.isReady()) {
      await m365GraphClient.initialize();
    }
    
    const events = await m365GraphClient.getRecentEvents(limit);
    logger.debug('M365 recent events retrieved', { count: events.length });
    return events;
  } catch (error) {
    logger.error('Failed to get recent events', error);
    throw error;
  }
});

ipcMain.handle('m365-get-teams', async () => {
  try {
    if (!m365GraphClient.isReady()) {
      await m365GraphClient.initialize();
    }
    
    const teams = await m365GraphClient.getTeams();
    logger.debug('M365 teams retrieved', { count: teams.length });
    return teams;
  } catch (error) {
    logger.error('Failed to get teams', error);
    throw error;
  }
});

ipcMain.handle('m365-search-content', async (event, query: string, entityTypes?: string[]) => {
  try {
    if (!m365GraphClient.isReady()) {
      await m365GraphClient.initialize();
    }
    
    const results = await m365GraphClient.searchContent(query, entityTypes);
    logger.debug('M365 content search completed', { 
      query: query.substring(0, 50) + '...', 
      resultsCount: results.length 
    });
    return results;
  } catch (error) {
    logger.error('Failed to search M365 content', error);
    throw error;
  }
});

// === M365 Synchronization IPC Handlers ===

ipcMain.handle('m365-sync-start', async (event, options?: any) => {
  try {
    logger.info('Starting M365 synchronization via IPC', options);
    
    if (!m365SyncEngine.isReady()) {
      throw new Error('M365 sync engine not ready');
    }

    if (m365SyncEngine.isSyncInProgress()) {
      throw new Error('Synchronization already in progress');
    }

    const result = await m365SyncEngine.performSync(options);
    
    logger.info('✓ M365 synchronization completed via IPC', {
      itemsProcessed: result.itemsProcessed,
      itemsCreated: result.itemsCreated,
      itemsUpdated: result.itemsUpdated,
      errors: result.errors.length
    });

    return result;
  } catch (error) {
    logger.error('M365 synchronization failed via IPC', error);
    throw error;
  }
});

ipcMain.handle('m365-sync-incremental', async () => {
  try {
    logger.info('Starting M365 incremental sync via IPC');
    
    if (!m365SyncEngine.isReady()) {
      throw new Error('M365 sync engine not ready');
    }

    if (m365SyncEngine.isSyncInProgress()) {
      throw new Error('Synchronization already in progress');
    }

    const result = await m365SyncEngine.performIncrementalSync();
    
    logger.info('✓ M365 incremental sync completed via IPC', {
      itemsProcessed: result.itemsProcessed,
      errors: result.errors.length
    });

    return result;
  } catch (error) {
    logger.error('M365 incremental sync failed via IPC', error);
    throw error;
  }
});

ipcMain.handle('m365-sync-status', async () => {
  try {
    const isReady = m365SyncEngine.isReady();
    const isInProgress = m365SyncEngine.isSyncInProgress();
    const stats = m365SyncEngine.getSyncStats();
    const config = m365SyncEngine.getSyncConfiguration();

    return {
      isReady,
      isInProgress,
      stats,
      config
    };
  } catch (error) {
    logger.error('Failed to get M365 sync status', error);
    return {
      isReady: false,
      isInProgress: false,
      stats: null,
      config: null,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
});

ipcMain.handle('m365-sync-config-update', async (event, config: any) => {
  try {
    logger.info('Updating M365 sync configuration', config);
    
    if (!m365SyncEngine.isReady()) {
      throw new Error('M365 sync engine not ready');
    }

    m365SyncEngine.updateSyncConfiguration(config);
    
    return { success: true };
  } catch (error) {
    logger.error('Failed to update M365 sync configuration', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
});

// === SharePoint IPC Handlers ===

ipcMain.handle('sharepoint-get-sites', async (event, limit: number = 50) => {
  try {
    logger.info('Fetching SharePoint sites via IPC', { limit });
    
    if (!sharepointService.isReady()) {
      throw new Error('SharePoint service not ready');
    }

    const sites = await sharepointService.getSites(limit);
    
    logger.info('✓ SharePoint sites retrieved via IPC', { count: sites.length });
    return sites;
  } catch (error) {
    logger.error('Failed to fetch SharePoint sites via IPC', error);
    throw error;
  }
});

ipcMain.handle('sharepoint-get-site-details', async (event, siteId: string) => {
  try {
    logger.debug('Fetching SharePoint site details via IPC', { siteId });
    
    if (!sharepointService.isReady()) {
      throw new Error('SharePoint service not ready');
    }

    const site = await sharepointService.getSiteDetails(siteId);
    
    return site;
  } catch (error) {
    logger.error('Failed to fetch SharePoint site details via IPC', error);
    throw error;
  }
});

ipcMain.handle('sharepoint-get-site-lists', async (event, siteId: string, includeHidden: boolean = false) => {
  try {
    logger.debug('Fetching SharePoint site lists via IPC', { siteId, includeHidden });
    
    if (!sharepointService.isReady()) {
      throw new Error('SharePoint service not ready');
    }

    const lists = await sharepointService.getSiteLists(siteId, includeHidden);
    
    logger.debug('✓ SharePoint lists retrieved via IPC', { count: lists.length });
    return lists;
  } catch (error) {
    logger.error('Failed to fetch SharePoint lists via IPC', error);
    throw error;
  }
});

ipcMain.handle('sharepoint-get-documents', async (event, siteId: string, driveId?: string, folderId?: string, limit: number = 100) => {
  try {
    logger.debug('Fetching SharePoint documents via IPC', { siteId, driveId, folderId, limit });
    
    if (!sharepointService.isReady()) {
      throw new Error('SharePoint service not ready');
    }

    const documents = await sharepointService.getDocuments(siteId, driveId, folderId, limit);
    
    logger.debug('✓ SharePoint documents retrieved via IPC', { count: documents.length });
    return documents;
  } catch (error) {
    logger.error('Failed to fetch SharePoint documents via IPC', error);
    throw error;
  }
});

ipcMain.handle('sharepoint-get-list-items', async (event, siteId: string, listId: string, limit: number = 100) => {
  try {
    logger.debug('Fetching SharePoint list items via IPC', { siteId, listId, limit });
    
    if (!sharepointService.isReady()) {
      throw new Error('SharePoint service not ready');
    }

    const items = await sharepointService.getListItems(siteId, listId, limit);
    
    logger.debug('✓ SharePoint list items retrieved via IPC', { count: items.length });
    return items;
  } catch (error) {
    logger.error('Failed to fetch SharePoint list items via IPC', error);
    throw error;
  }
});

ipcMain.handle('sharepoint-search-content', async (event, query: string, siteIds?: string[], fileTypes?: string[]) => {
  try {
    logger.info('Searching SharePoint content via IPC', { query, siteIds, fileTypes });
    
    if (!sharepointService.isReady()) {
      throw new Error('SharePoint service not ready');
    }

    const results = await sharepointService.searchContent(query, siteIds, fileTypes);
    
    logger.info('✓ SharePoint search completed via IPC', { 
      query: query.substring(0, 50) + '...', 
      resultsCount: results.length 
    });
    return results;
  } catch (error) {
    logger.error('Failed to search SharePoint content via IPC', error);
    throw error;
  }
});

ipcMain.handle('sharepoint-get-permissions', async (event, siteId: string, itemId: string, itemType: 'site' | 'list' | 'driveItem') => {
  try {
    logger.debug('Fetching SharePoint permissions via IPC', { siteId, itemId, itemType });
    
    if (!sharepointService.isReady()) {
      throw new Error('SharePoint service not ready');
    }

    const permissions = await sharepointService.getItemPermissions(siteId, itemId, itemType);
    
    logger.debug('✓ SharePoint permissions retrieved via IPC');
    return permissions;
  } catch (error) {
    logger.error('Failed to fetch SharePoint permissions via IPC', error);
    throw error;
  }
});

ipcMain.handle('sharepoint-get-analytics', async (event, siteId: string, period: 'D7' | 'D30' | 'D90' | 'D180' = 'D30') => {
  try {
    logger.debug('Fetching SharePoint analytics via IPC', { siteId, period });
    
    if (!sharepointService.isReady()) {
      throw new Error('SharePoint service not ready');
    }

    const analytics = await sharepointService.getSiteAnalytics(siteId, period);
    
    logger.debug('✓ SharePoint analytics retrieved via IPC');
    return analytics;
  } catch (error) {
    logger.error('Failed to fetch SharePoint analytics via IPC', error);
    throw error;
  }
});

// === Utility IPC Handlers ===

ipcMain.handle('open-external', async (event, url: string) => {
  try {
    logger.debug('Opening external URL', { url });
    await shell.openExternal(url);
    return { success: true };
  } catch (error) {
    logger.error('Failed to open external URL', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
});

app.whenReady().then(async () => {
  try {
    databaseReady = initializeDatabase();
    await databaseReady;
    createWindow();
    createMenu();
  } catch (error) {
    console.error('Application initialization failed:', error);
    app.quit();
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', async () => {
  if (databaseManager) {
    try {
      await databaseManager.close();
      logger.info('Database connections closed successfully');
    } catch (error) {
      logger.error('Error closing database connections', error);
    }
  }
});

// Handle protocol for deep linking (future feature)
app.setAsDefaultProtocolClient('devmemory');