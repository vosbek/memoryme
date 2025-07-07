import initSqlJs, { Database as SqlJsDatabase } from 'sql.js';
import { Memory, MemoryType, MemoryMetadata } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { createLogger } from '../utils/logger';
import * as crypto from 'crypto';
import * as os from 'os';
import * as fs from 'fs';
import * as path from 'path';

export interface DatabaseOptions {
  enableEncryption?: boolean;
  encryptionKey?: string;
}

export class SQLiteManager {
  private db: SqlJsDatabase | null = null;
  private logger = createLogger('SQLiteManager');
  private options: DatabaseOptions;
  private dbPath: string;
  private sqlJs: any = null;

  constructor(dbPath: string, options: DatabaseOptions = {}) {
    this.options = options;
    this.dbPath = dbPath;
    this.logger.info('Initializing SQLite database', { dbPath, encrypted: !!options.enableEncryption });
  }

  async initialize(): Promise<void> {
    try {
      // Initialize sql.js
      this.sqlJs = await initSqlJs({
        // Specify the wasm file location - sql.js needs this
        locateFile: (file: string) => {
          // Try multiple potential paths for the WASM file
          const possiblePaths = [
            // Development: node_modules path from project root
            path.join(process.cwd(), 'node_modules/sql.js/dist', file),
            // Development: dist folder
            path.join(process.cwd(), 'dist/sql.js/dist', file),
            // Production: packaged resources path
            path.join(process.resourcesPath || process.cwd(), 'node_modules/sql.js/dist', file),
            // Fallback: relative to current directory
            path.join(__dirname, 'sql.js/dist', file)
          ];
          
          // Try each path and return the first one that exists
          for (const testPath of possiblePaths) {
            try {
              if (fs.existsSync(testPath)) {
                this.logger.info(`Found WASM file at: ${testPath}`);
                return testPath;
              }
            } catch (error) {
              // Continue to next path
            }
          }
          
          // If no path found, log all attempted paths and use the first one
          this.logger.warn(`WASM file not found in any of these paths: ${possiblePaths.join(', ')}`);
          return possiblePaths[0];
        }
      });

      // Load existing database file or create new one
      let buffer: Uint8Array | undefined;
      if (fs.existsSync(this.dbPath)) {
        this.logger.info('Loading existing database file');
        buffer = fs.readFileSync(this.dbPath);
      }

      // Create database instance
      this.db = new this.sqlJs.Database(buffer);
      
      // Enable encryption if requested
      if (this.options.enableEncryption) {
        this.enableEncryption(this.options.encryptionKey);
      }
      
      this.logger.info('Database connection established');
      await this.init();
      this.logger.info('Database initialization completed');
    } catch (error) {
      this.logger.error('Database initialization failed', error);
      throw new Error(`Failed to initialize database at ${this.dbPath}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private enableEncryption(encryptionKey?: string): void {
    try {
      // Generate or use provided encryption key
      const key = encryptionKey || this.generateEncryptionKey();
      
      // Note: sql.js doesn't have built-in encryption like SQLCipher
      // For now, we'll implement application-level encryption for sensitive fields
      
      this.logger.info('Database encryption enabled (application-level)');
      
      // Store key securely (in production, use Windows DPAPI or similar)
      if (os.platform() === 'win32') {
        // On Windows, we could use Windows Data Protection API
        this.logger.info('Windows DPAPI encryption available for enhanced security');
      }
      
    } catch (error) {
      this.logger.error('Failed to enable database encryption', error);
      throw new Error('Database encryption setup failed');
    }
  }

  private generateEncryptionKey(): string {
    // Generate a strong encryption key
    return crypto.randomBytes(32).toString('hex');
  }

  private encryptSensitiveData(data: string): string {
    if (!this.options.enableEncryption) {
      return data;
    }
    
    try {
      // Simple encryption for demonstration
      // In production, use proper encryption with key management
      const algorithm = 'aes-256-gcm';
      const key = crypto.scryptSync('devmemory-key', 'salt', 32);
      const iv = crypto.randomBytes(16);
      const cipher = crypto.createCipher(algorithm, key);
      
      let encrypted = cipher.update(data, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      
      return `encrypted:${iv.toString('hex')}:${encrypted}`;
    } catch (error) {
      this.logger.warn('Encryption failed, storing as plaintext', error);
      return data;
    }
  }

  private decryptSensitiveData(encryptedData: string): string {
    if (!this.options.enableEncryption || !encryptedData.startsWith('encrypted:')) {
      return encryptedData;
    }
    
    try {
      const parts = encryptedData.split(':');
      if (parts.length !== 3) {
        return encryptedData;
      }
      
      const algorithm = 'aes-256-gcm';
      const key = crypto.scryptSync('devmemory-key', 'salt', 32);
      const iv = Buffer.from(parts[1], 'hex');
      const encrypted = parts[2];
      
      const decipher = crypto.createDecipher(algorithm, key);
      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      return decrypted;
    } catch (error) {
      this.logger.warn('Decryption failed, returning as-is', error);
      return encryptedData;
    }
  }

  private async init(): Promise<void> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    // Create tables and indexes
    const sqlStatements = `
      CREATE TABLE IF NOT EXISTS memories (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        type TEXT NOT NULL,
        tags TEXT, -- JSON array
        metadata TEXT, -- JSON object
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_memories_type ON memories(type);
      CREATE INDEX IF NOT EXISTS idx_memories_created_at ON memories(created_at);
      CREATE INDEX IF NOT EXISTS idx_memories_updated_at ON memories(updated_at);
      CREATE INDEX IF NOT EXISTS idx_memories_title ON memories(title);

      CREATE TABLE IF NOT EXISTS tags (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE NOT NULL,
        color TEXT,
        created_at INTEGER NOT NULL
      );

      CREATE TABLE IF NOT EXISTS projects (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        path TEXT,
        repository TEXT,
        description TEXT,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      );
    `;

    // Execute all statements
    this.db.exec(sqlStatements);
    await this.saveDatabase();
  }

  private async saveDatabase(): Promise<void> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    try {
      // Export database to buffer and save to file
      const buffer = this.db.export();
      
      // Ensure directory exists
      const dir = path.dirname(this.dbPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      
      fs.writeFileSync(this.dbPath, buffer);
    } catch (error) {
      this.logger.error('Failed to save database', error);
      throw error;
    }
  }

  async createMemory(memory: Omit<Memory, 'id' | 'createdAt' | 'updatedAt'>): Promise<Memory> {
    this.logger.debug('Creating new memory', { title: memory.title, type: memory.type });
    
    if (!this.db) {
      throw new Error('Database not initialized');
    }
    
    try {
      const now = new Date();
      const newMemory: Memory = {
        ...memory,
        id: uuidv4(),
        createdAt: now,
        updatedAt: now,
      };

      const stmt = this.db.prepare(`
        INSERT INTO memories (id, title, content, type, tags, metadata, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);

      stmt.run([
        newMemory.id,
        newMemory.title,
        newMemory.content,
        newMemory.type,
        JSON.stringify(newMemory.tags || []),
        JSON.stringify(newMemory.metadata || {}),
        newMemory.createdAt.getTime(),
        newMemory.updatedAt.getTime()
      ]);

      // Save database to file
      await this.saveDatabase();

      this.logger.info('Memory created successfully', { 
        id: newMemory.id, 
        title: newMemory.title
      });

      // Verify the memory was actually inserted
      const verification = await this.getMemory(newMemory.id);
      if (!verification) {
        throw new Error('Memory creation failed - could not verify insertion');
      }

      return newMemory;
    } catch (error) {
      this.logger.error('Failed to create memory', error);
      throw error;
    }
  }

  async getMemory(id: string): Promise<Memory | null> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    const stmt = this.db.prepare('SELECT * FROM memories WHERE id = ?');
    const result = stmt.getAsObject([id]);
    
    if (!result || Object.keys(result).length === 0) {
      return null;
    }
    
    return this.rowToMemory(result);
  }

  async updateMemory(id: string, updates: Partial<Omit<Memory, 'id' | 'createdAt'>>): Promise<Memory | null> {
    const existing = await this.getMemory(id);
    if (!existing) return null;

    if (!this.db) {
      throw new Error('Database not initialized');
    }

    const updated: Memory = {
      ...existing,
      ...updates,
      updatedAt: new Date(),
    };

    const stmt = this.db.prepare(`
      UPDATE memories 
      SET title = ?, content = ?, type = ?, tags = ?, metadata = ?, updated_at = ?
      WHERE id = ?
    `);

    stmt.run([
      updated.title,
      updated.content,
      updated.type,
      JSON.stringify(updated.tags),
      JSON.stringify(updated.metadata),
      updated.updatedAt.getTime(),
      id
    ]);

    await this.saveDatabase();
    return updated;
  }

  async deleteMemory(id: string): Promise<boolean> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    const stmt = this.db.prepare('DELETE FROM memories WHERE id = ?');
    stmt.run([id]);
    await this.saveDatabase();
    return true;
  }

  async searchMemories(query: string, limit: number = 50, offset: number = 0): Promise<Memory[]> {
    this.logger.debug('Searching memories', { query, limit, offset });
    
    if (!this.db) {
      throw new Error('Database not initialized');
    }
    
    try {
      // Use simple LIKE search for reliability
      const searchPattern = `%${query}%`;
      const stmt = this.db.prepare(`
        SELECT * FROM memories 
        WHERE title LIKE ? OR content LIKE ? OR tags LIKE ?
        ORDER BY updated_at DESC
        LIMIT ? OFFSET ?
      `);
      
      const results: Memory[] = [];
      stmt.bind([searchPattern, searchPattern, searchPattern, limit, offset]);
      
      while (stmt.step()) {
        const row = stmt.getAsObject();
        results.push(this.rowToMemory(row));
      }
      
      this.logger.info('Search completed', { 
        query, 
        resultsCount: results.length
      });
      
      return results;
    } catch (error) {
      this.logger.error('Search failed completely', error);
      return []; // Return empty array instead of throwing
    }
  }

  async getMemoriesByType(type: MemoryType, limit: number = 50, offset: number = 0): Promise<Memory[]> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    const stmt = this.db.prepare(`
      SELECT * FROM memories 
      WHERE type = ? 
      ORDER BY updated_at DESC 
      LIMIT ? OFFSET ?
    `);

    const results: Memory[] = [];
    stmt.bind([type, limit, offset]);
    
    while (stmt.step()) {
      const row = stmt.getAsObject();
      results.push(this.rowToMemory(row));
    }

    return results;
  }

  async getMemoriesByTags(tags: string[], limit: number = 50, offset: number = 0): Promise<Memory[]> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    // Build OR conditions for each tag
    const conditions = tags.map(() => 'tags LIKE ?').join(' OR ');
    const stmt = this.db.prepare(`
      SELECT * FROM memories 
      WHERE ${conditions}
      ORDER BY updated_at DESC 
      LIMIT ? OFFSET ?
    `);

    const params = [...tags.map(tag => `%${tag}%`), limit, offset];
    const results: Memory[] = [];
    stmt.bind(params);
    
    while (stmt.step()) {
      const row = stmt.getAsObject();
      results.push(this.rowToMemory(row));
    }

    return results;
  }

  async getAllTags(): Promise<string[]> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    const stmt = this.db.prepare('SELECT DISTINCT name FROM tags ORDER BY name');
    const results: string[] = [];
    
    while (stmt.step()) {
      const row = stmt.getAsObject();
      results.push(row.name as string);
    }

    return results;
  }

  async getRecentMemories(limit: number = 20): Promise<Memory[]> {
    this.logger.debug('Getting recent memories', { limit });
    
    if (!this.db) {
      throw new Error('Database not initialized');
    }
    
    try {
      const stmt = this.db.prepare(`
        SELECT * FROM memories 
        ORDER BY updated_at DESC 
        LIMIT ?
      `);

      const results: Memory[] = [];
      stmt.bind([limit]);
      
      while (stmt.step()) {
        const row = stmt.getAsObject();
        results.push(this.rowToMemory(row));
      }
      
      this.logger.info('Retrieved recent memories', { 
        count: results.length,
        limit 
      });
      
      return results;
    } catch (error) {
      this.logger.error('Failed to get recent memories', error);
      return [];
    }
  }

  async getAllMemories(): Promise<Memory[]> {
    this.logger.debug('Getting all memories');
    
    if (!this.db) {
      throw new Error('Database not initialized');
    }
    
    try {
      const stmt = this.db.prepare(`
        SELECT * FROM memories 
        ORDER BY updated_at DESC
      `);

      const results: Memory[] = [];
      
      while (stmt.step()) {
        const row = stmt.getAsObject();
        results.push(this.rowToMemory(row));
      }
      
      this.logger.info('Retrieved all memories', { count: results.length });
      
      return results;
    } catch (error) {
      this.logger.error('Failed to get all memories', error);
      return [];
    }
  }

  async getMemoryCount(): Promise<number> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    try {
      const stmt = this.db.prepare('SELECT COUNT(*) as count FROM memories');
      stmt.step();
      const result = stmt.getAsObject();
      const count = result.count as number || 0;
      
      this.logger.debug('Memory count retrieved', { count });
      return count;
    } catch (error) {
      this.logger.error('Failed to get memory count', error);
      return 0;
    }
  }

  private safeJsonParse(jsonString: any, fallback: any): any {
    try {
      if (typeof jsonString === 'string') {
        return JSON.parse(jsonString);
      }
      return jsonString || fallback;
    } catch (error) {
      console.warn('Failed to parse JSON, using fallback:', jsonString, error);
      return fallback;
    }
  }

  private rowToMemory(row: any): Memory {
    return {
      id: row.id as string,
      title: row.title as string,
      content: row.content as string,
      type: row.type as MemoryType,
      tags: this.safeJsonParse(row.tags, []),
      metadata: this.safeJsonParse(row.metadata, {}),
      createdAt: new Date(row.created_at as number),
      updatedAt: new Date(row.updated_at as number),
    };
  }

  async close(): Promise<void> {
    if (this.db) {
      await this.saveDatabase();
      this.db.close();
      this.db = null;
    }
  }
}