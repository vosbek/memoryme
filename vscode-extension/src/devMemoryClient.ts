import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

interface Memory {
    id?: string;
    title: string;
    content: string;
    type: string;
    tags: string[];
    metadata: any;
    createdAt?: Date;
    updatedAt?: Date;
}

interface MemorySearchResult {
    id: string;
    title: string;
    content: string;
    type: string;
    tags: string[];
    metadata: any;
    score?: number;
}

export class DevMemoryClient {
    private dbPath: string;
    private isElectronRunning: boolean = false;
    
    constructor() {
        // Try to find the DevMemory database
        this.dbPath = this.findDatabasePath();
        this.checkElectronApp();
    }
    
    private findDatabasePath(): string {
        const userDataDir = path.join(os.homedir(), 'AppData', 'Roaming', 'devmemory');
        const dbPath = path.join(userDataDir, 'devmemory.db');
        
        // Alternative paths for different OS
        const alternatives = [
            path.join(os.homedir(), '.devmemory', 'devmemory.db'),
            path.join(os.homedir(), 'Library', 'Application Support', 'devmemory', 'devmemory.db'),
            path.join(os.homedir(), '.config', 'devmemory', 'devmemory.db')
        ];
        
        if (fs.existsSync(dbPath)) {
            return dbPath;
        }
        
        for (const altPath of alternatives) {
            if (fs.existsSync(altPath)) {
                return altPath;
            }
        }
        
        // Return default path even if it doesn't exist
        return dbPath;
    }
    
    private async checkElectronApp(): Promise<void> {
        try {
            // Try to ping the Electron app on a known port
            // This is a placeholder - in reality, you'd implement IPC or HTTP communication
            this.isElectronRunning = false;
        } catch (error) {
            this.isElectronRunning = false;
        }
    }
    
    async createMemory(memory: Omit<Memory, 'id' | 'createdAt' | 'updatedAt'>): Promise<boolean> {
        try {
            if (this.isElectronRunning) {
                // If Electron app is running, use IPC or HTTP API
                return await this.createMemoryViaAPI(memory);
            } else {
                // Direct database access
                return await this.createMemoryDirect(memory);
            }
        } catch (error) {
            console.error('Error creating memory:', error);
            return false;
        }
    }
    
    private async createMemoryViaAPI(memory: Omit<Memory, 'id' | 'createdAt' | 'updatedAt'>): Promise<boolean> {
        try {
            // This would communicate with the Electron app's IPC or HTTP API
            // For now, we'll use direct database access
            return await this.createMemoryDirect(memory);
        } catch (error) {
            console.error('API communication failed:', error);
            return false;
        }
    }
    
    private async createMemoryDirect(memory: Omit<Memory, 'id' | 'createdAt' | 'updatedAt'>): Promise<boolean> {
        try {
            // For now, we'll store memories in a simple JSON file
            // In a real implementation, you'd use SQLite or communicate with the Electron app
            const memoriesFile = path.join(path.dirname(this.dbPath), 'vscode-memories.json');
            
            let memories: Memory[] = [];
            if (fs.existsSync(memoriesFile)) {
                const data = fs.readFileSync(memoriesFile, 'utf8');
                memories = JSON.parse(data);
            }
            
            const newMemory: Memory = {
                ...memory,
                id: this.generateId(),
                createdAt: new Date(),
                updatedAt: new Date()
            };
            
            memories.unshift(newMemory);
            
            // Keep only the last 1000 memories
            if (memories.length > 1000) {
                memories = memories.slice(0, 1000);
            }
            
            // Ensure directory exists
            const dir = path.dirname(memoriesFile);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
            
            fs.writeFileSync(memoriesFile, JSON.stringify(memories, null, 2));
            return true;
        } catch (error) {
            console.error('Error saving memory directly:', error);
            return false;
        }
    }
    
    async searchMemories(query: string, limit: number = 20): Promise<MemorySearchResult[]> {
        try {
            const memoriesFile = path.join(path.dirname(this.dbPath), 'vscode-memories.json');
            
            if (!fs.existsSync(memoriesFile)) {
                return [];
            }
            
            const data = fs.readFileSync(memoriesFile, 'utf8');
            const memories: Memory[] = JSON.parse(data);
            
            // Simple text search - in a real implementation, you'd use the vector database
            const results = memories.filter(memory => {
                const searchText = `${memory.title} ${memory.content} ${memory.tags.join(' ')}`.toLowerCase();
                return searchText.includes(query.toLowerCase());
            });
            
            return results.slice(0, limit).map(memory => ({
                id: memory.id!,
                title: memory.title,
                content: memory.content,
                type: memory.type,
                tags: memory.tags,
                metadata: memory.metadata,
                score: this.calculateScore(memory, query)
            }));
        } catch (error) {
            console.error('Error searching memories:', error);
            return [];
        }
    }
    
    async getRecentMemories(limit: number = 20): Promise<Memory[]> {
        try {
            const memoriesFile = path.join(path.dirname(this.dbPath), 'vscode-memories.json');
            
            if (!fs.existsSync(memoriesFile)) {
                return [];
            }
            
            const data = fs.readFileSync(memoriesFile, 'utf8');
            const memories: Memory[] = JSON.parse(data);
            
            return memories.slice(0, limit);
        } catch (error) {
            console.error('Error getting recent memories:', error);
            return [];
        }
    }
    
    async getMemoriesByTag(tag: string): Promise<Memory[]> {
        try {
            const memoriesFile = path.join(path.dirname(this.dbPath), 'vscode-memories.json');
            
            if (!fs.existsSync(memoriesFile)) {
                return [];
            }
            
            const data = fs.readFileSync(memoriesFile, 'utf8');
            const memories: Memory[] = JSON.parse(data);
            
            return memories.filter(memory => 
                memory.tags.some(t => t.toLowerCase().includes(tag.toLowerCase()))
            );
        } catch (error) {
            console.error('Error getting memories by tag:', error);
            return [];
        }
    }
    
    async deleteMemory(id: string): Promise<boolean> {
        try {
            const memoriesFile = path.join(path.dirname(this.dbPath), 'vscode-memories.json');
            
            if (!fs.existsSync(memoriesFile)) {
                return false;
            }
            
            const data = fs.readFileSync(memoriesFile, 'utf8');
            let memories: Memory[] = JSON.parse(data);
            
            const initialLength = memories.length;
            memories = memories.filter(memory => memory.id !== id);
            
            if (memories.length < initialLength) {
                fs.writeFileSync(memoriesFile, JSON.stringify(memories, null, 2));
                return true;
            }
            
            return false;
        } catch (error) {
            console.error('Error deleting memory:', error);
            return false;
        }
    }
    
    private generateId(): string {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }
    
    private calculateScore(memory: Memory, query: string): number {
        const queryLower = query.toLowerCase();
        let score = 0;
        
        // Title match gets high score
        if (memory.title.toLowerCase().includes(queryLower)) {
            score += 10;
        }
        
        // Tag match gets medium score
        if (memory.tags.some(tag => tag.toLowerCase().includes(queryLower))) {
            score += 5;
        }
        
        // Content match gets low score
        if (memory.content.toLowerCase().includes(queryLower)) {
            score += 1;
        }
        
        return score;
    }
    
    async syncWithElectronApp(): Promise<boolean> {
        try {
            // This would implement synchronization with the main DevMemory app
            // For now, just return true
            return true;
        } catch (error) {
            console.error('Error syncing with Electron app:', error);
            return false;
        }
    }
    
    getDatabasePath(): string {
        return this.dbPath;
    }
    
    isConnected(): boolean {
        return fs.existsSync(path.dirname(this.dbPath));
    }
}