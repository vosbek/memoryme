import * as vscode from 'vscode';
import { DevMemoryClient } from './devMemoryClient';

export class QuickCapturePanel {
    public static currentPanel: QuickCapturePanel | undefined;
    public static readonly viewType = 'devmemoryQuickCapture';

    private readonly _panel: vscode.WebviewPanel;
    private readonly _extensionUri: vscode.Uri;
    private _disposables: vscode.Disposable[] = [];

    public static createOrShow(extensionUri: vscode.Uri, devMemoryClient: DevMemoryClient) {
        const column = vscode.window.activeTextEditor
            ? vscode.window.activeTextEditor.viewColumn
            : undefined;

        if (QuickCapturePanel.currentPanel) {
            QuickCapturePanel.currentPanel._panel.reveal(column);
            return;
        }

        const panel = vscode.window.createWebviewPanel(
            QuickCapturePanel.viewType,
            'Quick Capture - DevMemory',
            column || vscode.ViewColumn.One,
            {
                enableScripts: true,
                localResourceRoots: [
                    vscode.Uri.joinPath(extensionUri, 'media')
                ]
            }
        );

        QuickCapturePanel.currentPanel = new QuickCapturePanel(panel, extensionUri, devMemoryClient);
    }

    private constructor(
        panel: vscode.WebviewPanel,
        extensionUri: vscode.Uri,
        private devMemoryClient: DevMemoryClient
    ) {
        this._panel = panel;
        this._extensionUri = extensionUri;

        this._update();

        this._panel.onDidDispose(() => this.dispose(), null, this._disposables);

        this._panel.webview.onDidReceiveMessage(
            async (message) => {
                switch (message.command) {
                    case 'captureMemory':
                        await this.handleCaptureMemory(message.data);
                        break;
                    case 'searchMemories':
                        await this.handleSearchMemories(message.query);
                        break;
                    case 'getRecentMemories':
                        await this.handleGetRecentMemories();
                        break;
                }
            },
            null,
            this._disposables
        );
    }

    private async handleCaptureMemory(data: any) {
        try {
            const success = await this.devMemoryClient.createMemory(data);
            
            this._panel.webview.postMessage({
                command: 'captureResult',
                success,
                message: success ? 'Memory captured successfully!' : 'Failed to capture memory'
            });
        } catch (error) {
            this._panel.webview.postMessage({
                command: 'captureResult',
                success: false,
                message: 'Error: ' + (error as Error).message
            });
        }
    }

    private async handleSearchMemories(query: string) {
        try {
            const memories = await this.devMemoryClient.searchMemories(query, 10);
            
            this._panel.webview.postMessage({
                command: 'searchResults',
                memories
            });
        } catch (error) {
            console.error('Error searching memories:', error);
        }
    }

    private async handleGetRecentMemories() {
        try {
            const memories = await this.devMemoryClient.getRecentMemories(10);
            
            this._panel.webview.postMessage({
                command: 'recentMemories',
                memories
            });
        } catch (error) {
            console.error('Error getting recent memories:', error);
        }
    }

    public dispose() {
        QuickCapturePanel.currentPanel = undefined;

        this._panel.dispose();

        while (this._disposables.length) {
            const x = this._disposables.pop();
            if (x) {
                x.dispose();
            }
        }
    }

    private _update() {
        const webview = this._panel.webview;
        this._panel.webview.html = this._getHtmlForWebview(webview);
    }

    private _getHtmlForWebview(webview: vscode.Webview) {
        const editor = vscode.window.activeTextEditor;
        const selectedText = editor?.document.getText(editor.selection) || '';
        const fileName = editor?.document.fileName || '';
        const language = editor?.document.languageId || '';

        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Quick Capture - DevMemory</title>
    <style>
        body {
            font-family: var(--vscode-font-family);
            font-size: var(--vscode-font-size);
            color: var(--vscode-foreground);
            background-color: var(--vscode-editor-background);
            padding: 20px;
            margin: 0;
        }
        
        .container {
            max-width: 800px;
            margin: 0 auto;
        }
        
        .form-group {
            margin-bottom: 15px;
        }
        
        label {
            display: block;
            margin-bottom: 5px;
            font-weight: bold;
        }
        
        input, textarea, select {
            width: 100%;
            padding: 8px;
            border: 1px solid var(--vscode-input-border);
            background-color: var(--vscode-input-background);
            color: var(--vscode-input-foreground);
            border-radius: 3px;
            font-family: inherit;
            font-size: inherit;
        }
        
        textarea {
            min-height: 200px;
            resize: vertical;
            font-family: var(--vscode-editor-font-family);
        }
        
        button {
            background-color: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
            border: none;
            padding: 10px 20px;
            border-radius: 3px;
            cursor: pointer;
            margin-right: 10px;
            margin-bottom: 10px;
        }
        
        button:hover {
            background-color: var(--vscode-button-hoverBackground);
        }
        
        .secondary-button {
            background-color: var(--vscode-button-secondaryBackground);
            color: var(--vscode-button-secondaryForeground);
        }
        
        .secondary-button:hover {
            background-color: var(--vscode-button-secondaryHoverBackground);
        }
        
        .tabs {
            display: flex;
            border-bottom: 1px solid var(--vscode-input-border);
            margin-bottom: 20px;
        }
        
        .tab {
            padding: 10px 20px;
            cursor: pointer;
            border-bottom: 2px solid transparent;
        }
        
        .tab.active {
            border-bottom-color: var(--vscode-focusBorder);
        }
        
        .tab-content {
            display: none;
        }
        
        .tab-content.active {
            display: block;
        }
        
        .memory-item {
            border: 1px solid var(--vscode-input-border);
            border-radius: 3px;
            padding: 10px;
            margin-bottom: 10px;
            cursor: pointer;
        }
        
        .memory-item:hover {
            background-color: var(--vscode-list-hoverBackground);
        }
        
        .memory-title {
            font-weight: bold;
            margin-bottom: 5px;
        }
        
        .memory-meta {
            font-size: 0.9em;
            color: var(--vscode-descriptionForeground);
            margin-bottom: 5px;
        }
        
        .memory-content {
            font-family: var(--vscode-editor-font-family);
            font-size: 0.9em;
            white-space: pre-wrap;
            max-height: 100px;
            overflow: hidden;
        }
        
        .success-message {
            color: var(--vscode-testing-iconPassed);
            margin-top: 10px;
        }
        
        .error-message {
            color: var(--vscode-errorForeground);
            margin-top: 10px;
        }
        
        .search-box {
            margin-bottom: 20px;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>DevMemory - Quick Capture</h1>
        
        <div class="tabs">
            <div class="tab active" onclick="switchTab('capture')">Capture</div>
            <div class="tab" onclick="switchTab('search')">Search</div>
            <div class="tab" onclick="switchTab('recent')">Recent</div>
        </div>
        
        <!-- Capture Tab -->
        <div id="capture-tab" class="tab-content active">
            <form id="memory-form">
                <div class="form-group">
                    <label for="title">Title *</label>
                    <input type="text" id="title" name="title" required>
                </div>
                
                <div class="form-group">
                    <label for="type">Type</label>
                    <select id="type" name="type">
                        <option value="note">Note</option>
                        <option value="code_snippet" selected>Code Snippet</option>
                        <option value="documentation">Documentation</option>
                        <option value="meeting_notes">Meeting Notes</option>
                        <option value="decision">Decision</option>
                        <option value="api_call">API Call</option>
                        <option value="debug_session">Debug Session</option>
                        <option value="project_context">Project Context</option>
                        <option value="command">Command</option>
                        <option value="link">Link</option>
                    </select>
                </div>
                
                <div class="form-group">
                    <label for="content">Content *</label>
                    <textarea id="content" name="content" required>${selectedText}</textarea>
                </div>
                
                <div class="form-group">
                    <label for="tags">Tags (comma-separated)</label>
                    <input type="text" id="tags" name="tags" value="${language}, vscode" placeholder="javascript, react, bug-fix">
                </div>
                
                <div class="form-group">
                    <label for="source">Source</label>
                    <input type="text" id="source" name="source" value="vscode" placeholder="VSCode, Terminal, Browser">
                </div>
                
                <div class="form-group">
                    <label for="project">Project</label>
                    <input type="text" id="project" name="project" placeholder="Project name">
                </div>
                
                <button type="submit">Capture Memory</button>
                <button type="button" class="secondary-button" onclick="prefillFromSelection()">Use Selection</button>
                <button type="button" class="secondary-button" onclick="clearForm()">Clear</button>
                
                <div id="capture-message"></div>
            </form>
        </div>
        
        <!-- Search Tab -->
        <div id="search-tab" class="tab-content">
            <div class="search-box">
                <input type="text" id="search-input" placeholder="Search your memories...">
                <button onclick="searchMemories()">Search</button>
            </div>
            <div id="search-results"></div>
        </div>
        
        <!-- Recent Tab -->
        <div id="recent-tab" class="tab-content">
            <div id="recent-memories"></div>
        </div>
    </div>
    
    <script>
        const vscode = acquireVsCodeApi();
        
        // Tab switching
        function switchTab(tabName) {
            document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
            
            document.querySelector(\`[onclick="switchTab('\${tabName}')"]\`).classList.add('active');
            document.getElementById(\`\${tabName}-tab\`).classList.add('active');
            
            if (tabName === 'recent') {
                loadRecentMemories();
            }
        }
        
        // Form submission
        document.getElementById('memory-form').addEventListener('submit', function(e) {
            e.preventDefault();
            
            const formData = new FormData(e.target);
            const data = {
                title: formData.get('title'),
                content: formData.get('content'),
                type: formData.get('type'),
                tags: formData.get('tags').split(',').map(tag => tag.trim()).filter(tag => tag),
                metadata: {
                    source: formData.get('source') || 'vscode',
                    project: formData.get('project'),
                    fileName: '${fileName.split('/').pop() || ''}',
                    fullPath: '${fileName}',
                    language: '${language}',
                    capturedAt: new Date().toISOString()
                }
            };
            
            vscode.postMessage({
                command: 'captureMemory',
                data: data
            });
        });
        
        // Prefill from selection
        function prefillFromSelection() {
            const fileName = '${fileName.split('/').pop() || ''}';
            if (fileName) {
                document.getElementById('title').value = 'Snippet: ' + fileName;
            }
        }
        
        // Clear form
        function clearForm() {
            document.getElementById('memory-form').reset();
            document.getElementById('capture-message').innerHTML = '';
        }
        
        // Search memories
        function searchMemories() {
            const query = document.getElementById('search-input').value;
            if (query.trim()) {
                vscode.postMessage({
                    command: 'searchMemories',
                    query: query
                });
            }
        }
        
        // Load recent memories
        function loadRecentMemories() {
            vscode.postMessage({
                command: 'getRecentMemories'
            });
        }
        
        // Insert memory into editor
        function insertMemory(content) {
            // Close the panel and insert the content
            vscode.postMessage({
                command: 'insertContent',
                content: content
            });
        }
        
        // Handle messages from extension
        window.addEventListener('message', event => {
            const message = event.data;
            
            switch (message.command) {
                case 'captureResult':
                    const messageDiv = document.getElementById('capture-message');
                    messageDiv.innerHTML = message.success 
                        ? \`<div class="success-message">\${message.message}</div>\`
                        : \`<div class="error-message">\${message.message}</div>\`;
                    
                    if (message.success) {
                        setTimeout(() => {
                            document.getElementById('memory-form').reset();
                            messageDiv.innerHTML = '';
                        }, 2000);
                    }
                    break;
                    
                case 'searchResults':
                    displaySearchResults(message.memories);
                    break;
                    
                case 'recentMemories':
                    displayRecentMemories(message.memories);
                    break;
            }
        });
        
        function displaySearchResults(memories) {
            const container = document.getElementById('search-results');
            if (memories.length === 0) {
                container.innerHTML = '<p>No memories found.</p>';
                return;
            }
            
            container.innerHTML = memories.map(memory => \`
                <div class="memory-item" onclick="insertMemory('\${escapeHtml(memory.content)}')">
                    <div class="memory-title">\${escapeHtml(memory.title)}</div>
                    <div class="memory-meta">\${memory.type} • \${memory.tags.join(', ')}</div>
                    <div class="memory-content">\${escapeHtml(memory.content.substring(0, 200))}\${memory.content.length > 200 ? '...' : ''}</div>
                </div>
            \`).join('');
        }
        
        function displayRecentMemories(memories) {
            const container = document.getElementById('recent-memories');
            if (memories.length === 0) {
                container.innerHTML = '<p>No recent memories found.</p>';
                return;
            }
            
            container.innerHTML = memories.map(memory => \`
                <div class="memory-item" onclick="insertMemory('\${escapeHtml(memory.content)}')">
                    <div class="memory-title">\${escapeHtml(memory.title)}</div>
                    <div class="memory-meta">\${memory.type} • \${memory.tags.join(', ')}</div>
                    <div class="memory-content">\${escapeHtml(memory.content.substring(0, 200))}\${memory.content.length > 200 ? '...' : ''}</div>
                </div>
            \`).join('');
        }
        
        function escapeHtml(text) {
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        }
        
        // Search on Enter key
        document.getElementById('search-input').addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                searchMemories();
            }
        });
        
        // Auto-focus title field
        document.getElementById('title').focus();
    </script>
</body>
</html>`;
    }
}