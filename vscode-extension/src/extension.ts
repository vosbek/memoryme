import * as vscode from 'vscode';
import { DevMemoryClient } from './devMemoryClient';
import { QuickCapturePanel } from './quickCapturePanel';

let devMemoryClient: DevMemoryClient;

export function activate(context: vscode.ExtensionContext) {
    console.log('DevMemory extension is now active!');
    
    // Initialize the DevMemory client
    devMemoryClient = new DevMemoryClient();
    
    // Register minimal commands for keyboard shortcuts
    registerCommands(context);
    
    // Show welcome message
    vscode.window.showInformationMessage('DevMemory extension activated! Use Ctrl+Alt+M to open the memory panel.');
}

function registerCommands(context: vscode.ExtensionContext) {
    // Simplified command registration - main functionality moved to panel
    
    // Quick capture via keyboard shortcut
    const quickCapture = vscode.commands.registerCommand('devmemory.quickCapture', async () => {
        QuickCapturePanel.createOrShow(context.extensionUri, devMemoryClient);
    });
    
    // Register commands
    context.subscriptions.push(quickCapture);
}


export function deactivate() {
    console.log('DevMemory extension deactivated');
}