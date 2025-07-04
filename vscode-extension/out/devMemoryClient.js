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
exports.DevMemoryClient = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const os = __importStar(require("os"));
class DevMemoryClient {
    constructor() {
        this.isElectronRunning = false;
        // Try to find the DevMemory database
        this.dbPath = this.findDatabasePath();
        this.checkElectronApp();
    }
    findDatabasePath() {
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
    async checkElectronApp() {
        try {
            // Try to ping the Electron app on a known port
            // This is a placeholder - in reality, you'd implement IPC or HTTP communication
            this.isElectronRunning = false;
        }
        catch (error) {
            this.isElectronRunning = false;
        }
    }
    async createMemory(memory) {
        try {
            if (this.isElectronRunning) {
                // If Electron app is running, use IPC or HTTP API
                return await this.createMemoryViaAPI(memory);
            }
            else {
                // Direct database access
                return await this.createMemoryDirect(memory);
            }
        }
        catch (error) {
            console.error('Error creating memory:', error);
            return false;
        }
    }
    async createMemoryViaAPI(memory) {
        try {
            // This would communicate with the Electron app's IPC or HTTP API
            // For now, we'll use direct database access
            return await this.createMemoryDirect(memory);
        }
        catch (error) {
            console.error('API communication failed:', error);
            return false;
        }
    }
    async createMemoryDirect(memory) {
        try {
            // For now, we'll store memories in a simple JSON file
            // In a real implementation, you'd use SQLite or communicate with the Electron app
            const memoriesFile = path.join(path.dirname(this.dbPath), 'vscode-memories.json');
            let memories = [];
            if (fs.existsSync(memoriesFile)) {
                const data = fs.readFileSync(memoriesFile, 'utf8');
                memories = JSON.parse(data);
            }
            const newMemory = {
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
        }
        catch (error) {
            console.error('Error saving memory directly:', error);
            return false;
        }
    }
    async searchMemories(query, limit = 20) {
        try {
            const memoriesFile = path.join(path.dirname(this.dbPath), 'vscode-memories.json');
            if (!fs.existsSync(memoriesFile)) {
                return [];
            }
            const data = fs.readFileSync(memoriesFile, 'utf8');
            const memories = JSON.parse(data);
            // Simple text search - in a real implementation, you'd use the vector database
            const results = memories.filter(memory => {
                const searchText = `${memory.title} ${memory.content} ${memory.tags.join(' ')}`.toLowerCase();
                return searchText.includes(query.toLowerCase());
            });
            return results.slice(0, limit).map(memory => ({
                id: memory.id,
                title: memory.title,
                content: memory.content,
                type: memory.type,
                tags: memory.tags,
                metadata: memory.metadata,
                score: this.calculateScore(memory, query)
            }));
        }
        catch (error) {
            console.error('Error searching memories:', error);
            return [];
        }
    }
    async getRecentMemories(limit = 20) {
        try {
            const memoriesFile = path.join(path.dirname(this.dbPath), 'vscode-memories.json');
            if (!fs.existsSync(memoriesFile)) {
                return [];
            }
            const data = fs.readFileSync(memoriesFile, 'utf8');
            const memories = JSON.parse(data);
            return memories.slice(0, limit);
        }
        catch (error) {
            console.error('Error getting recent memories:', error);
            return [];
        }
    }
    async getMemoriesByTag(tag) {
        try {
            const memoriesFile = path.join(path.dirname(this.dbPath), 'vscode-memories.json');
            if (!fs.existsSync(memoriesFile)) {
                return [];
            }
            const data = fs.readFileSync(memoriesFile, 'utf8');
            const memories = JSON.parse(data);
            return memories.filter(memory => memory.tags.some(t => t.toLowerCase().includes(tag.toLowerCase())));
        }
        catch (error) {
            console.error('Error getting memories by tag:', error);
            return [];
        }
    }
    async deleteMemory(id) {
        try {
            const memoriesFile = path.join(path.dirname(this.dbPath), 'vscode-memories.json');
            if (!fs.existsSync(memoriesFile)) {
                return false;
            }
            const data = fs.readFileSync(memoriesFile, 'utf8');
            let memories = JSON.parse(data);
            const initialLength = memories.length;
            memories = memories.filter(memory => memory.id !== id);
            if (memories.length < initialLength) {
                fs.writeFileSync(memoriesFile, JSON.stringify(memories, null, 2));
                return true;
            }
            return false;
        }
        catch (error) {
            console.error('Error deleting memory:', error);
            return false;
        }
    }
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }
    calculateScore(memory, query) {
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
    async syncWithElectronApp() {
        try {
            // This would implement synchronization with the main DevMemory app
            // For now, just return true
            return true;
        }
        catch (error) {
            console.error('Error syncing with Electron app:', error);
            return false;
        }
    }
    getDatabasePath() {
        return this.dbPath;
    }
    isConnected() {
        return fs.existsSync(path.dirname(this.dbPath));
    }
}
exports.DevMemoryClient = DevMemoryClient;
//# sourceMappingURL=devMemoryClient.js.map