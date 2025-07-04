import { app, BrowserWindow, ipcMain, Menu, shell } from 'electron';
import * as path from 'path';
import { SQLiteManager } from '../shared/database/sqlite';
import { VectorStore } from '../shared/database/vector-store';
import { Memory, MemoryType, SearchQuery, AppConfig } from '../shared/types';
import Store from 'electron-store';
import { createLogger } from '../shared/utils/logger';

const store = new Store();
const logger = createLogger('Main');
let mainWindow: BrowserWindow | null = null;
let sqliteManager: SQLiteManager | null = null;
let vectorStore: VectorStore | null = null;
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
  const dbPath = path.join(userDataDir, 'devmemory.db');
  const vectorPath = path.join(userDataDir, 'vector-data.json');
  
  try {
    // Ensure user data directory exists
    const fs = require('fs');
    if (!fs.existsSync(userDataDir)) {
      fs.mkdirSync(userDataDir, { recursive: true });
    }
    
    // Initialize SQLite database
    sqliteManager = new SQLiteManager(dbPath);
    console.log('SQLite database initialized at:', dbPath);
    
    // Initialize vector store
    vectorStore = new VectorStore(vectorPath);
    await vectorStore.initialize();
    console.log('Vector store initialized at:', vectorPath);
    
  } catch (error) {
    console.error('Database initialization failed:', error);
    throw error;
  }
}

// IPC Handlers
ipcMain.handle('create-memory', async (event, memory: Omit<Memory, 'id' | 'createdAt' | 'updatedAt'>) => {
  logger.info('IPC: Creating memory', { title: memory.title, type: memory.type });
  
  await databaseReady;
  if (!sqliteManager) throw new Error('SQLite database not initialized');
  
  try {
    // Create in SQLite first
    logger.debug('Creating memory in SQLite...');
    const savedMemory = await sqliteManager.createMemory(memory);
    logger.info('Memory created in SQLite successfully', { id: savedMemory.id });
    
    // Add to vector store for semantic search (optional)
    if (vectorStore) {
      try {
        logger.debug('Adding memory to vector store...');
        await vectorStore.addMemory(savedMemory);
        logger.info('Memory added to vector store successfully');
      } catch (vectorError) {
        logger.warn('Failed to add to vector store, continuing without it', vectorError);
        // Continue - SQLite save was successful
      }
    } else {
      logger.debug('Vector store not available, skipping vector indexing');
    }
    
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
  if (!sqliteManager) throw new Error('Database not initialized');
  return await sqliteManager.getMemory(id);
});

ipcMain.handle('update-memory', async (event, id: string, updates: Partial<Omit<Memory, 'id' | 'createdAt'>>) => {
  await databaseReady;
  if (!sqliteManager || !vectorStore) throw new Error('Database not initialized');
  try {
    const updatedMemory = await sqliteManager.updateMemory(id, updates);
    
    if (updatedMemory) {
      try {
        await vectorStore.updateMemory(updatedMemory);
      } catch (vectorError) {
        console.warn('Failed to update in vector store:', vectorError);
      }
    }
    
    return updatedMemory;
  } catch (error) {
    console.error('Failed to update memory:', error);
    throw error;
  }
});

ipcMain.handle('delete-memory', async (event, id: string) => {
  await databaseReady;
  if (!sqliteManager || !vectorStore) throw new Error('Database not initialized');
  try {
    const result = await sqliteManager.deleteMemory(id);
    
    if (result) {
      try {
        await vectorStore.deleteMemory(id);
      } catch (vectorError) {
        console.warn('Failed to delete from vector store:', vectorError);
      }
    }
    
    return result;
  } catch (error) {
    console.error('Failed to delete memory:', error);
    throw error;
  }
});

ipcMain.handle('search-memories', async (event, query: string, limit?: number, offset?: number) => {
  await databaseReady;
  if (!sqliteManager) throw new Error('Database not initialized');
  
  try {
    // First try semantic search with vector store
    if (vectorStore) {
      const vectorResults = await vectorStore.searchSimilar(query, limit || 20, 0.3);
      
      if (vectorResults.length > 0) {
        console.log(`Found ${vectorResults.length} semantic matches for: "${query}"`);
        
        // Get full memory objects from SQLite
        const memories: Memory[] = [];
        for (const result of vectorResults) {
          const memory = await sqliteManager.getMemory(result.memoryId);
          if (memory) {
            memories.push(memory);
          }
        }
        
        return memories.slice(offset || 0, (offset || 0) + (limit || 20));
      }
    }
    
    // Fallback to traditional full-text search
    console.log(`Using full-text search for: "${query}"`);
    return await sqliteManager.searchMemories(query, limit, offset);
  } catch (error) {
    console.error('Search failed:', error);
    // Fallback to SQLite search
    return await sqliteManager.searchMemories(query, limit, offset);
  }
});

ipcMain.handle('get-memories-by-type', async (event, type: MemoryType, limit?: number, offset?: number) => {
  if (!sqliteManager) throw new Error('Database not initialized');
  return await sqliteManager.getMemoriesByType(type, limit, offset);
});

ipcMain.handle('get-memories-by-tags', async (event, tags: string[], limit?: number, offset?: number) => {
  if (!sqliteManager) throw new Error('Database not initialized');
  return await sqliteManager.getMemoriesByTags(tags, limit, offset);
});

ipcMain.handle('get-recent-memories', async (event, limit?: number) => {
  if (!sqliteManager) throw new Error('Database not initialized');
  return await sqliteManager.getRecentMemories(limit);
});

ipcMain.handle('get-all-memories', async () => {
  if (!sqliteManager) throw new Error('Database not initialized');
  return await sqliteManager.getAllMemories();
});

ipcMain.handle('get-memory-count', async () => {
  if (!sqliteManager) throw new Error('Database not initialized');
  return await sqliteManager.getMemoryCount();
});

ipcMain.handle('get-all-tags', async () => {
  if (!sqliteManager) throw new Error('Database not initialized');
  return await sqliteManager.getAllTags();
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
  if (!vectorStore) throw new Error('Vector store not initialized');
  try {
    const info = await vectorStore.getCollectionInfo();
    return {
      ...info,
      healthy: vectorStore.isHealthy(),
    };
  } catch (error) {
    console.error('Failed to get vector info:', error);
    return { count: 0, name: 'unavailable', healthy: false };
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

app.on('before-quit', () => {
  if (sqliteManager) {
    try {
      sqliteManager.close();
    } catch (error) {
      console.error('Error closing database:', error);
    }
  }
});

// Handle protocol for deep linking (future feature)
app.setAsDefaultProtocolClient('devmemory');