import { app, BrowserWindow, ipcMain, Menu, shell } from 'electron';
import * as path from 'path';
import { SQLiteManager } from '../shared/database/sqlite';
import { Memory, MemoryType, SearchQuery, AppConfig } from '../shared/types';
import Store from 'electron-store';

const store = new Store();
let mainWindow: BrowserWindow | null = null;
let sqliteManager: SQLiteManager | null = null;
let databaseReady: Promise<void>;

const isDev = process.env.NODE_ENV === 'development';

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
        { role: 'selectall' },
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
  const dbPath = path.join(app.getPath('userData'), 'devmemory.db');
  try {
    // Ensure user data directory exists
    const userDataDir = app.getPath('userData');
    const fs = require('fs');
    if (!fs.existsSync(userDataDir)) {
      fs.mkdirSync(userDataDir, { recursive: true });
    }
    
    sqliteManager = new SQLiteManager(dbPath);
    console.log('Database initialized at:', dbPath);
  } catch (error) {
    console.error('Database initialization failed:', error);
    throw error;
  }
}

// IPC Handlers
ipcMain.handle('create-memory', async (event, memory: Omit<Memory, 'id' | 'createdAt' | 'updatedAt'>) => {
  await databaseReady;
  if (!sqliteManager) throw new Error('Database not initialized');
  try {
    return await sqliteManager.createMemory(memory);
  } catch (error) {
    console.error('Failed to create memory:', error);
    throw error;
  }
});

ipcMain.handle('get-memory', async (event, id: string) => {
  if (!sqliteManager) throw new Error('Database not initialized');
  return await sqliteManager.getMemory(id);
});

ipcMain.handle('update-memory', async (event, id: string, updates: Partial<Omit<Memory, 'id' | 'createdAt'>>) => {
  if (!sqliteManager) throw new Error('Database not initialized');
  return await sqliteManager.updateMemory(id, updates);
});

ipcMain.handle('delete-memory', async (event, id: string) => {
  if (!sqliteManager) throw new Error('Database not initialized');
  return await sqliteManager.deleteMemory(id);
});

ipcMain.handle('search-memories', async (event, query: string, limit?: number, offset?: number) => {
  if (!sqliteManager) throw new Error('Database not initialized');
  return await sqliteManager.searchMemories(query, limit, offset);
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