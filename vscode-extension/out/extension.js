"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = activate;
exports.deactivate = deactivate;
const vscode = __importStar(require("vscode"));
const devMemoryClient_1 = require("./devMemoryClient");
const memoryTreeProvider_1 = require("./memoryTreeProvider");
const quickCapturePanel_1 = require("./quickCapturePanel");
let devMemoryClient;
let memoryTreeProvider;
function activate(context) {
    console.log('DevMemory extension is now active!');
    // Initialize the DevMemory client
    devMemoryClient = new devMemoryClient_1.DevMemoryClient();
    // Initialize tree provider for the explorer view
    memoryTreeProvider = new memoryTreeProvider_1.MemoryTreeProvider(devMemoryClient);
    vscode.window.registerTreeDataProvider('devmemoryExplorer', memoryTreeProvider);
    // Register all commands
    registerCommands(context);
    // Set up auto-capture if enabled
    setupAutoCapture(context);
    // Show welcome message
    vscode.window.showInformationMessage('DevMemory extension activated! Use Ctrl+Shift+M to capture code.');
}
function registerCommands(context) {
    // Capture selection as memory
    const captureSelection = vscode.commands.registerCommand('devmemory.captureSelection', async () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showErrorMessage('No active editor found');
            return;
        }
        const selection = editor.selection;
        if (selection.isEmpty) {
            vscode.window.showErrorMessage('No text selected');
            return;
        }
        const selectedText = editor.document.getText(selection);
        const fileName = editor.document.fileName;
        const language = editor.document.languageId;
        await captureCodeSnippet(selectedText, fileName, language);
    });
    // Capture entire file
    const captureFile = vscode.commands.registerCommand('devmemory.captureFile', async () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showErrorMessage('No active editor found');
            return;
        }
        const fileContent = editor.document.getText();
        const fileName = editor.document.fileName;
        const language = editor.document.languageId;
        await captureCodeSnippet(fileContent, fileName, language, true);
    });
    // Search memories
    const searchMemories = vscode.commands.registerCommand('devmemory.searchMemories', async () => {
        const query = await vscode.window.showInputBox({
            prompt: 'Search your memories',
            placeHolder: 'Enter search terms...'
        });
        if (query) {
            await searchAndShowMemories(query);
        }
    });
    // Open DevMemory app
    const openApp = vscode.commands.registerCommand('devmemory.openApp', async () => {
        await openDevMemoryApp();
    });
    // Quick capture panel
    const quickCapture = vscode.commands.registerCommand('devmemory.quickCapture', async () => {
        quickCapturePanel_1.QuickCapturePanel.createOrShow(context.extensionUri, devMemoryClient);
    });
    // Insert memory at cursor
    const insertMemory = vscode.commands.registerCommand('devmemory.insertMemory', async () => {
        await insertMemoryAtCursor();
    });
    // Refresh tree view
    const refreshTree = vscode.commands.registerCommand('devmemory.refreshTree', () => {
        memoryTreeProvider.refresh();
    });
    // Register all commands
    context.subscriptions.push(captureSelection, captureFile, searchMemories, openApp, quickCapture, insertMemory, refreshTree);
}
async function captureCodeSnippet(content, fileName, language, isFullFile = false) {
    try {
        const title = await vscode.window.showInputBox({
            prompt: `Enter title for ${isFullFile ? 'file' : 'code snippet'}`,
            value: generateDefaultTitle(fileName, isFullFile)
        });
        if (!title) {
            return;
        }
        const tags = await vscode.window.showInputBox({
            prompt: 'Enter tags (comma-separated)',
            value: `${language}, vscode`
        });
        const memory = {
            title,
            content,
            type: 'code_snippet',
            tags: tags ? tags.split(',').map(t => t.trim()) : [language, 'vscode'],
            metadata: {
                source: 'vscode',
                language,
                fileName: fileName.split('/').pop() || '',
                fullPath: fileName,
                isFullFile,
                capturedAt: new Date().toISOString()
            }
        };
        const success = await devMemoryClient.createMemory(memory);
        if (success) {
            vscode.window.showInformationMessage(`Memory "${title}" captured successfully!`);
            memoryTreeProvider.refresh();
        }
        else {
            vscode.window.showErrorMessage('Failed to capture memory');
        }
    }
    catch (error) {
        console.error('Error capturing memory:', error);
        vscode.window.showErrorMessage('Error capturing memory: ' + error.message);
    }
}
function generateDefaultTitle(fileName, isFullFile) {
    const baseName = fileName.split('/').pop() || 'code';
    const prefix = isFullFile ? 'File: ' : 'Snippet: ';
    return prefix + baseName;
}
async function searchAndShowMemories(query) {
    try {
        const memories = await devMemoryClient.searchMemories(query);
        if (memories.length === 0) {
            vscode.window.showInformationMessage('No memories found for: ' + query);
            return;
        }
        const items = memories.map(memory => ({
            label: memory.title,
            description: memory.type,
            detail: memory.content.substring(0, 100) + (memory.content.length > 100 ? '...' : ''),
            memory
        }));
        const selected = await vscode.window.showQuickPick(items, {
            placeHolder: 'Select a memory to view or insert'
        });
        if (selected) {
            const action = await vscode.window.showQuickPick([
                'Insert at cursor',
                'Copy to clipboard',
                'Open in DevMemory app'
            ], {
                placeHolder: 'What would you like to do with this memory?'
            });
            switch (action) {
                case 'Insert at cursor':
                    await insertTextAtCursor(selected.memory.content);
                    break;
                case 'Copy to clipboard':
                    await vscode.env.clipboard.writeText(selected.memory.content);
                    vscode.window.showInformationMessage('Memory copied to clipboard');
                    break;
                case 'Open in DevMemory app':
                    await openDevMemoryApp();
                    break;
            }
        }
    }
    catch (error) {
        console.error('Error searching memories:', error);
        vscode.window.showErrorMessage('Error searching memories: ' + error.message);
    }
}
async function insertMemoryAtCursor() {
    try {
        const memories = await devMemoryClient.getRecentMemories(20);
        if (memories.length === 0) {
            vscode.window.showInformationMessage('No memories found');
            return;
        }
        const items = memories.map(memory => ({
            label: memory.title,
            description: memory.type,
            detail: memory.content.substring(0, 100) + (memory.content.length > 100 ? '...' : ''),
            memory
        }));
        const selected = await vscode.window.showQuickPick(items, {
            placeHolder: 'Select a memory to insert'
        });
        if (selected) {
            await insertTextAtCursor(selected.memory.content);
        }
    }
    catch (error) {
        console.error('Error inserting memory:', error);
        vscode.window.showErrorMessage('Error inserting memory: ' + error.message);
    }
}
async function insertTextAtCursor(text) {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        vscode.window.showErrorMessage('No active editor found');
        return;
    }
    const position = editor.selection.active;
    await editor.edit(editBuilder => {
        editBuilder.insert(position, text);
    });
    vscode.window.showInformationMessage('Memory inserted successfully');
}
async function openDevMemoryApp() {
    const config = vscode.workspace.getConfiguration('devmemory');
    const appPath = config.get('appPath');
    if (!appPath) {
        const action = await vscode.window.showWarningMessage('DevMemory app path not configured. Would you like to set it now?', 'Configure Path');
        if (action === 'Configure Path') {
            vscode.commands.executeCommand('workbench.action.openSettings', 'devmemory.appPath');
        }
        return;
    }
    try {
        const { exec } = require('child_process');
        exec(`"${appPath}"`, (error) => {
            if (error) {
                vscode.window.showErrorMessage('Failed to open DevMemory app: ' + error.message);
            }
        });
    }
    catch (error) {
        vscode.window.showErrorMessage('Failed to open DevMemory app: ' + error.message);
    }
}
function setupAutoCapture(context) {
    const config = vscode.workspace.getConfiguration('devmemory');
    if (config.get('autoCapture')) {
        // Set up clipboard monitoring for auto-capture
        const disposable = vscode.workspace.onDidChangeTextDocument(async (event) => {
            // Auto-capture logic can be implemented here
            // For now, just log the event
            console.log('Text document changed:', event.document.fileName);
        });
        context.subscriptions.push(disposable);
    }
    if (config.get('captureCommands')) {
        // Set up terminal command capture
        const disposable = vscode.window.onDidOpenTerminal(async (terminal) => {
            console.log('Terminal opened:', terminal.name);
            // Terminal command capture logic can be implemented here
        });
        context.subscriptions.push(disposable);
    }
}
function deactivate() {
    console.log('DevMemory extension deactivated');
}
//# sourceMappingURL=extension.js.map