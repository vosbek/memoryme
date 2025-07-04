import * as vscode from 'vscode';
import { DevMemoryClient } from './devMemoryClient';

interface Memory {
    id?: string;
    title?: string;
    content?: string;
    type?: string;
    tags: string[];
    metadata?: any;
    createdAt?: Date;
    updatedAt?: Date;
}

export class MemoryTreeProvider implements vscode.TreeDataProvider<MemoryItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<MemoryItem | undefined | null | void> = new vscode.EventEmitter<MemoryItem | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<MemoryItem | undefined | null | void> = this._onDidChangeTreeData.event;

    constructor(private devMemoryClient: DevMemoryClient) {}

    refresh(): void {
        this._onDidChangeTreeData.fire();
    }

    getTreeItem(element: MemoryItem): vscode.TreeItem {
        return element;
    }

    async getChildren(element?: MemoryItem): Promise<MemoryItem[]> {
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
                return await this.getMemoriesByType(element.label as string);
            case 'tag':
                return await this.getMemoriesByTag(element.label as string);
            default:
                return [];
        }
    }

    private async getRecentMemories(): Promise<MemoryItem[]> {
        try {
            const memories = await this.devMemoryClient.getRecentMemories(10);
            return memories.map(memory => 
                new MemoryItem(
                    memory.title || 'Untitled',
                    memory.id || '',
                    vscode.TreeItemCollapsibleState.None,
                    'memory',
                    memory
                )
            );
        } catch (error) {
            console.error('Error getting recent memories:', error);
            return [new MemoryItem('Error loading memories', '', vscode.TreeItemCollapsibleState.None, 'error')];
        }
    }

    private async getMemoryTypes(): Promise<MemoryItem[]> {
        try {
            const memories = await this.devMemoryClient.getRecentMemories(100);
            const types = [...new Set(memories.map(m => m.type).filter(type => type))];
            
            return types.map(type =>
                new MemoryItem(
                    this.formatType(type),
                    type || '',
                    vscode.TreeItemCollapsibleState.Collapsed,
                    'type'
                )
            );
        } catch (error) {
            console.error('Error getting memory types:', error);
            return [];
        }
    }

    private async getMemoryTags(): Promise<MemoryItem[]> {
        try {
            const memories = await this.devMemoryClient.getRecentMemories(100);
            const allTags = memories.flatMap(m => m.tags);
            const uniqueTags = [...new Set(allTags)];
            
            return uniqueTags.slice(0, 20).map(tag =>
                new MemoryItem(
                    tag || '',
                    tag || '',
                    vscode.TreeItemCollapsibleState.Collapsed,
                    'tag'
                )
            );
        } catch (error) {
            console.error('Error getting memory tags:', error);
            return [];
        }
    }

    private async getMemoriesByType(type: string): Promise<MemoryItem[]> {
        try {
            const memories = await this.devMemoryClient.getRecentMemories(100);
            const filteredMemories = memories.filter(m => m.type && m.type === type);
            
            return filteredMemories.slice(0, 10).map(memory =>
                new MemoryItem(
                    memory.title || 'Untitled',
                    memory.id || '',
                    vscode.TreeItemCollapsibleState.None,
                    'memory',
                    memory
                )
            );
        } catch (error) {
            console.error('Error getting memories by type:', error);
            return [];
        }
    }

    private async getMemoriesByTag(tag: string): Promise<MemoryItem[]> {
        try {
            const memories = await this.devMemoryClient.getMemoriesByTag(tag);
            
            return memories.slice(0, 10).map(memory =>
                new MemoryItem(
                    memory.title || 'Untitled',
                    memory.id || '',
                    vscode.TreeItemCollapsibleState.None,
                    'memory',
                    memory
                )
            );
        } catch (error) {
            console.error('Error getting memories by tag:', error);
            return [];
        }
    }

    private formatType(type: string): string {
        return type.split('_').map(word => 
            word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' ');
    }
}

export class MemoryItem extends vscode.TreeItem {
    constructor(
        public readonly label: string,
        public readonly id: string,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState,
        public readonly contextValue: string,
        public readonly memory?: Memory
    ) {
        super(label, collapsibleState);
        
        this.tooltip = this.getTooltip();
        this.description = this.getDescription();
        this.iconPath = this.getIcon();
        
        if (contextValue === 'memory' && memory) {
            this.command = {
                command: 'devmemory.viewMemory',
                title: 'View Memory',
                arguments: [memory]
            };
        } else if (contextValue === 'search') {
            this.command = {
                command: 'devmemory.searchMemories',
                title: 'Search Memories'
            };
        }
    }

    private getTooltip(): string {
        if (this.memory) {
            const content = this.memory.content || '';
            const preview = content.substring(0, 200);
            return `${this.memory.title || 'Untitled'}\n\nType: ${this.memory.type || 'Unknown'}\nTags: ${this.memory.tags.join(', ')}\n\n${preview}${content.length > 200 ? '...' : ''}`;
        }
        return this.label;
    }

    private getDescription(): string {
        if (this.memory) {
            const date = this.memory.updatedAt ? new Date(this.memory.updatedAt) : new Date();
            const timeAgo = this.getTimeAgo(date);
            return `${this.memory.type || 'Unknown'} • ${timeAgo}`;
        }
        return '';
    }

    private getIcon(): vscode.ThemeIcon {
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

    private getMemoryTypeIcon(type: string): vscode.ThemeIcon {
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

    private getTimeAgo(date: Date): string {
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);

        if (diffMins < 1) {
            return 'just now';
        } else if (diffMins < 60) {
            return `${diffMins}m ago`;
        } else if (diffHours < 24) {
            return `${diffHours}h ago`;
        } else if (diffDays < 7) {
            return `${diffDays}d ago`;
        } else {
            return date.toLocaleDateString();
        }
    }
}