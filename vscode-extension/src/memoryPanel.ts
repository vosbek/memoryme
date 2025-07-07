import * as vscode from 'vscode';
import { DevMemoryClient } from './devMemoryClient';

export class MemoryPanel implements vscode.WebviewViewProvider {
    public static readonly viewType = 'devmemory.panel';
    private _view?: vscode.WebviewView;

    constructor(
        private readonly _extensionUri: vscode.Uri,
        private readonly _devMemoryClient: DevMemoryClient
    ) {}

    public resolveWebviewView(
        webviewView: vscode.WebviewView,
        context: vscode.WebviewViewResolveContext,
        _token: vscode.CancellationToken,
    ) {
        this._view = webviewView;

        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [this._extensionUri]
        };

        webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

        webviewView.webview.onDidReceiveMessage(
            async message => {
                switch (message.command) {
                    case 'captureSelection':
                        await this.captureSelection();
                        break;
                    case 'searchMemories':
                        await this.searchMemories();
                        break;
                    case 'quickNote':
                        await this.quickNote();
                        break;
                    case 'openApp':
                        await this.openApp();
                        break;
                }
            },
            undefined,
            []
        );
    }

    private async captureSelection() {
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

        const title = await vscode.window.showInputBox({
            prompt: 'Enter title for code snippet',
            value: `${language} snippet from ${fileName.split('/').pop()}`
        });

        if (!title) return;

        const memory = {
            title,
            content: selectedText,
            type: 'code_snippet',
            tags: [language, 'vscode', 'selection'],
            metadata: {
                source: 'vscode',
                language,
                fileName: fileName.split('/').pop() || '',
                fullPath: fileName,
                capturedAt: new Date().toISOString()
            }
        };

        const success = await this._devMemoryClient.createMemory(memory);
        if (success) {
            vscode.window.showInformationMessage(`Memory "${title}" captured!`);
        } else {
            vscode.window.showErrorMessage('Failed to capture memory');
        }
    }

    private async searchMemories() {
        const query = await vscode.window.showInputBox({
            prompt: 'Search your memories',
            placeHolder: 'Enter search terms...'
        });

        if (!query) return;

        const memories = await this._devMemoryClient.searchMemories(query);
        
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
            placeHolder: 'Select a memory to insert or copy'
        });

        if (selected) {
            const action = await vscode.window.showQuickPick([
                'Insert at cursor',
                'Copy to clipboard'
            ], {
                placeHolder: 'What would you like to do?'
            });

            if (action === 'Insert at cursor') {
                await this.insertTextAtCursor(selected.memory.content);
            } else if (action === 'Copy to clipboard') {
                await vscode.env.clipboard.writeText(selected.memory.content);
                vscode.window.showInformationMessage('Memory copied to clipboard');
            }
        }
    }

    private async quickNote() {
        const content = await vscode.window.showInputBox({
            prompt: 'Enter your quick note',
            placeHolder: 'Type your note here...'
        });

        if (!content) return;

        const title = content.length > 50 ? content.substring(0, 47) + '...' : content;

        const memory = {
            title: `Note: ${title}`,
            content,
            type: 'note',
            tags: ['note', 'quick', 'vscode'],
            metadata: {
                source: 'vscode-quick',
                capturedAt: new Date().toISOString()
            }
        };

        const success = await this._devMemoryClient.createMemory(memory);
        if (success) {
            vscode.window.showInformationMessage('Quick note saved!');
        } else {
            vscode.window.showErrorMessage('Failed to save note');
        }
    }

    private async openApp() {
        const config = vscode.workspace.getConfiguration('devmemory');
        const appPath = config.get<string>('appPath');

        if (!appPath) {
            const action = await vscode.window.showWarningMessage(
                'DevMemory app path not configured. Set it in settings?',
                'Open Settings'
            );
            
            if (action === 'Open Settings') {
                vscode.commands.executeCommand('workbench.action.openSettings', 'devmemory.appPath');
            }
            return;
        }

        try {
            const { exec } = require('child_process');
            exec(`"${appPath}"`, (error: any) => {
                if (error) {
                    vscode.window.showErrorMessage('Failed to open DevMemory app: ' + error.message);
                }
            });
        } catch (error) {
            vscode.window.showErrorMessage('Failed to open DevMemory app: ' + (error as Error).message);
        }
    }

    private async insertTextAtCursor(text: string) {
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

    private _getHtmlForWebview(webview: vscode.Webview) {
        return `<!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>DevMemory</title>
            <style>
                body {
                    padding: 10px;
                    margin: 0;
                    font-family: var(--vscode-font-family);
                    font-size: var(--vscode-font-size);
                    color: var(--vscode-foreground);
                    background: var(--vscode-editor-background);
                }
                
                .container {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 8px;
                    max-width: 200px;
                }
                
                .button {
                    padding: 12px 8px;
                    border: 1px solid var(--vscode-button-border);
                    background: var(--vscode-button-background);
                    color: var(--vscode-button-foreground);
                    cursor: pointer;
                    border-radius: 4px;
                    text-align: center;
                    font-size: 11px;
                    font-weight: 500;
                    transition: background-color 0.2s;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 4px;
                    min-height: 60px;
                    justify-content: center;
                }
                
                .button:hover {
                    background: var(--vscode-button-hoverBackground);
                }
                
                .button:active {
                    background: var(--vscode-button-secondaryBackground);
                }
                
                .icon {
                    font-size: 16px;
                    line-height: 1;
                }
                
                .label {
                    font-size: 10px;
                    line-height: 1.2;
                }
                
                .title {
                    font-size: 12px;
                    font-weight: 600;
                    margin-bottom: 12px;
                    text-align: center;
                    color: var(--vscode-titleBar-activeForeground);
                }
            </style>
        </head>
        <body>
            <div class="title">DevMemory</div>
            <div class="container">
                <button class="button" onclick="captureSelection()">
                    <div class="icon">📝</div>
                    <div class="label">Capture<br>Selection</div>
                </button>
                
                <button class="button" onclick="searchMemories()">
                    <div class="icon">🔍</div>
                    <div class="label">Search<br>Memories</div>
                </button>
                
                <button class="button" onclick="quickNote()">
                    <div class="icon">💡</div>
                    <div class="label">Quick<br>Note</div>
                </button>
                
                <button class="button" onclick="openApp()">
                    <div class="icon">🚀</div>
                    <div class="label">Open<br>App</div>
                </button>
            </div>
            
            <script>
                const vscode = acquireVsCodeApi();
                
                function captureSelection() {
                    vscode.postMessage({ command: 'captureSelection' });
                }
                
                function searchMemories() {
                    vscode.postMessage({ command: 'searchMemories' });
                }
                
                function quickNote() {
                    vscode.postMessage({ command: 'quickNote' });
                }
                
                function openApp() {
                    vscode.postMessage({ command: 'openApp' });
                }
            </script>
        </body>
        </html>`;
    }
}