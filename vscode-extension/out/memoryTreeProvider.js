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
exports.MemoryItem = exports.MemoryTreeProvider = void 0;
const vscode = __importStar(require("vscode"));
class MemoryTreeProvider {
    constructor(devMemoryClient) {
        this.devMemoryClient = devMemoryClient;
        this._onDidChangeTreeData = new vscode.EventEmitter();
        this.onDidChangeTreeData = this._onDidChangeTreeData.event;
    }
    refresh() {
        this._onDidChangeTreeData.fire();
    }
    getTreeItem(element) {
        return element;
    }
    async getChildren(element) {
        if (!this.devMemoryClient.isConnected()) {
            return [new MemoryItem('DevMemory not connected', '', vscode.TreeItemCollapsibleState.None, 'error')];
        }
        if (!element) {
            // Root level - show categories
            return [
                new MemoryItem('Recent Memories', 'recent', vscode.TreeItemCollapsibleState.Expanded, 'category'),
                new MemoryItem('By Type', 'types', vscode.TreeItemCollapsibleState.Collapsed, 'category'),
                new MemoryItem('By Tags', 'tags', vscode.TreeItemCollapsibleState.Collapsed, 'category'),
                new MemoryItem('Search', 'search', vscode.TreeItemCollapsibleState.None, 'search')
            ];
        }
        switch (element.contextValue) {
            case 'recent':
                return await this.getRecentMemories();
            case 'types':
                return await this.getMemoryTypes();
            case 'tags':
                return await this.getMemoryTags();
            case 'type':
                return await this.getMemoriesByType(element.label);
            case 'tag':
                return await this.getMemoriesByTag(element.label);
            default:
                return [];
        }
    }
    async getRecentMemories() {
        try {
            const memories = await this.devMemoryClient.getRecentMemories(10);
            return memories.map(memory => new MemoryItem(memory.title || 'Untitled', memory.id || '', vscode.TreeItemCollapsibleState.None, 'memory', memory));
        }
        catch (error) {
            console.error('Error getting recent memories:', error);
            return [new MemoryItem('Error loading memories', '', vscode.TreeItemCollapsibleState.None, 'error')];
        }
    }
    async getMemoryTypes() {
        try {
            const memories = await this.devMemoryClient.getRecentMemories(100);
            const types = [...new Set(memories.map(m => m.type).filter(type => type))];
            return types.map(type => new MemoryItem(this.formatType(type), type || '', vscode.TreeItemCollapsibleState.Collapsed, 'type'));
        }
        catch (error) {
            console.error('Error getting memory types:', error);
            return [];
        }
    }
    async getMemoryTags() {
        try {
            const memories = await this.devMemoryClient.getRecentMemories(100);
            const allTags = memories.flatMap(m => m.tags);
            const uniqueTags = [...new Set(allTags)];
            return uniqueTags.slice(0, 20).map(tag => new MemoryItem(tag || '', tag || '', vscode.TreeItemCollapsibleState.Collapsed, 'tag'));
        }
        catch (error) {
            console.error('Error getting memory tags:', error);
            return [];
        }
    }
    async getMemoriesByType(type) {
        try {
            const memories = await this.devMemoryClient.getRecentMemories(100);
            const filteredMemories = memories.filter(m => m.type && m.type === type);
            return filteredMemories.slice(0, 10).map(memory => new MemoryItem(memory.title || 'Untitled', memory.id || '', vscode.TreeItemCollapsibleState.None, 'memory', memory));
        }
        catch (error) {
            console.error('Error getting memories by type:', error);
            return [];
        }
    }
    async getMemoriesByTag(tag) {
        try {
            const memories = await this.devMemoryClient.getMemoriesByTag(tag);
            return memories.slice(0, 10).map(memory => new MemoryItem(memory.title || 'Untitled', memory.id || '', vscode.TreeItemCollapsibleState.None, 'memory', memory));
        }
        catch (error) {
            console.error('Error getting memories by tag:', error);
            return [];
        }
    }
    formatType(type) {
        return type.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    }
}
exports.MemoryTreeProvider = MemoryTreeProvider;
class MemoryItem extends vscode.TreeItem {
    constructor(label, id, collapsibleState, contextValue, memory) {
        super(label, collapsibleState);
        this.label = label;
        this.id = id;
        this.collapsibleState = collapsibleState;
        this.contextValue = contextValue;
        this.memory = memory;
        this.tooltip = this.getTooltip();
        this.description = this.getDescription();
        this.iconPath = this.getIcon();
        if (contextValue === 'memory' && memory) {
            this.command = {
                command: 'devmemory.viewMemory',
                title: 'View Memory',
                arguments: [memory]
            };
        }
        else if (contextValue === 'search') {
            this.command = {
                command: 'devmemory.searchMemories',
                title: 'Search Memories'
            };
        }
    }
    getTooltip() {
        if (this.memory) {
            const content = this.memory.content || '';
            const preview = content.substring(0, 200);
            return `${this.memory.title || 'Untitled'}\n\nType: ${this.memory.type || 'Unknown'}\nTags: ${this.memory.tags.join(', ')}\n\n${preview}${content.length > 200 ? '...' : ''}`;
        }
        return this.label;
    }
    getDescription() {
        if (this.memory) {
            const date = this.memory.updatedAt ? new Date(this.memory.updatedAt) : new Date();
            const timeAgo = this.getTimeAgo(date);
            return `${this.memory.type || 'Unknown'} • ${timeAgo}`;
        }
        return '';
    }
    getIcon() {
        switch (this.contextValue) {
            case 'memory':
                return this.getMemoryTypeIcon(this.memory?.type || '');
            case 'category':
                return new vscode.ThemeIcon('folder');
            case 'type':
                return new vscode.ThemeIcon('symbol-class');
            case 'tag':
                return new vscode.ThemeIcon('tag');
            case 'search':
                return new vscode.ThemeIcon('search');
            case 'error':
                return new vscode.ThemeIcon('error');
            default:
                return new vscode.ThemeIcon('file');
        }
    }
    getMemoryTypeIcon(type) {
        switch (type) {
            case 'code_snippet':
                return new vscode.ThemeIcon('code');
            case 'documentation':
                return new vscode.ThemeIcon('book');
            case 'meeting_notes':
                return new vscode.ThemeIcon('comment-discussion');
            case 'decision':
                return new vscode.ThemeIcon('checklist');
            case 'api_call':
                return new vscode.ThemeIcon('globe');
            case 'debug_session':
                return new vscode.ThemeIcon('debug');
            case 'project_context':
                return new vscode.ThemeIcon('project');
            case 'kubernetes_resource':
                return new vscode.ThemeIcon('server');
            case 'command':
                return new vscode.ThemeIcon('terminal');
            case 'link':
                return new vscode.ThemeIcon('link');
            default:
                return new vscode.ThemeIcon('note');
        }
    }
    getTimeAgo(date) {
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);
        if (diffMins < 1) {
            return 'just now';
        }
        else if (diffMins < 60) {
            return `${diffMins}m ago`;
        }
        else if (diffHours < 24) {
            return `${diffHours}h ago`;
        }
        else if (diffDays < 7) {
            return `${diffDays}d ago`;
        }
        else {
            return date.toLocaleDateString();
        }
    }
}
exports.MemoryItem = MemoryItem;
//# sourceMappingURL=memoryTreeProvider.js.map