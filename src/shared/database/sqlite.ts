import Database from 'better-sqlite3';
import { Memory, MemoryType, MemoryMetadata } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { createLogger } from '../utils/logger';

export class SQLiteManager {
  private db: Database.Database;
  private logger = createLogger('SQLiteManager');

  constructor(dbPath: string) {
    this.logger.info('Initializing SQLite database', { dbPath });
    try {
      this.db = new Database(dbPath);
      this.logger.info('Database connection established');
      this.init();
      this.logger.info('Database initialization completed');
    } catch (error) {
      this.logger.error('Database initialization failed', error);
      throw new Error(`Failed to initialize database at ${dbPath}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private init() {
    this.db.exec(`
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

      CREATE VIRTUAL TABLE IF NOT EXISTS memories_fts USING fts5(
        id UNINDEXED,
        title,
        content,
        tags,
        content='memories',
        content_rowid='rowid'
      );

      CREATE TRIGGER IF NOT EXISTS memories_ai AFTER INSERT ON memories BEGIN
        INSERT INTO memories_fts(id, title, content, tags)
        VALUES (new.id, new.title, new.content, new.tags);
      END;

      CREATE TRIGGER IF NOT EXISTS memories_ad AFTER DELETE ON memories BEGIN
        INSERT INTO memories_fts(memories_fts, id, title, content, tags)
        VALUES ('delete', old.id, old.title, old.content, old.tags);
      END;

      CREATE TRIGGER IF NOT EXISTS memories_au AFTER UPDATE ON memories BEGIN
        INSERT INTO memories_fts(memories_fts, id, title, content, tags)
        VALUES ('delete', old.id, old.title, old.content, old.tags);
        INSERT INTO memories_fts(id, title, content, tags)
        VALUES (new.id, new.title, new.content, new.tags);
      END;

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
    `);
  }

  async createMemory(memory: Omit<Memory, 'id' | 'createdAt' | 'updatedAt'>): Promise<Memory> {
    this.logger.debug('Creating new memory', { title: memory.title, type: memory.type });
    
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

      const result = stmt.run(
        newMemory.id,
        newMemory.title,
        newMemory.content,
        newMemory.type,
        JSON.stringify(newMemory.tags || []),
        JSON.stringify(newMemory.metadata || {}),
        newMemory.createdAt.getTime(),
        newMemory.updatedAt.getTime()
      );

      this.logger.info('Memory created successfully', { 
        id: newMemory.id, 
        title: newMemory.title,
        changes: result.changes 
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
    const stmt = this.db.prepare('SELECT * FROM memories WHERE id = ?');
    const row = stmt.get(id) as any;
    
    if (!row) return null;
    
    return this.rowToMemory(row);
  }

  async updateMemory(id: string, updates: Partial<Omit<Memory, 'id' | 'createdAt'>>): Promise<Memory | null> {
    const existing = await this.getMemory(id);
    if (!existing) return null;

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

    stmt.run(
      updated.title,
      updated.content,
      updated.type,
      JSON.stringify(updated.tags),
      JSON.stringify(updated.metadata),
      updated.updatedAt.getTime(),
      id
    );

    return updated;
  }

  async deleteMemory(id: string): Promise<boolean> {
    const stmt = this.db.prepare('DELETE FROM memories WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  }

  async searchMemories(query: string, limit: number = 50, offset: number = 0): Promise<Memory[]> {
    this.logger.debug('Searching memories', { query, limit, offset });
    
    try {
      // Use simple LIKE search for reliability
      const searchPattern = `%${query}%`;
      const stmt = this.db.prepare(`
        SELECT * FROM memories 
        WHERE title LIKE ? OR content LIKE ? OR tags LIKE ?
        ORDER BY updated_at DESC
        LIMIT ? OFFSET ?
      `);
      
      const rows = stmt.all(searchPattern, searchPattern, searchPattern, limit, offset) as any[];
      const results = rows.map(row => this.rowToMemory(row));
      
      this.logger.info('Search completed', { 
        query, 
        resultsCount: results.length,
        totalRows: rows.length 
      });
      
      return results;
    } catch (error) {
      this.logger.error('Search failed completely', error);
      return []; // Return empty array instead of throwing
    }
  }

  async getMemoriesByType(type: MemoryType, limit: number = 50, offset: number = 0): Promise<Memory[]> {
    const stmt = this.db.prepare(`
      SELECT * FROM memories 
      WHERE type = ? 
      ORDER BY updated_at DESC 
      LIMIT ? OFFSET ?
    `);

    const rows = stmt.all(type, limit, offset) as any[];
    return rows.map(row => this.rowToMemory(row));
  }

  async getMemoriesByTags(tags: string[], limit: number = 50, offset: number = 0): Promise<Memory[]> {
    const placeholders = tags.map(() => 'JSON_EXTRACT(tags, "$[*]") LIKE ?').join(' OR ');
    const stmt = this.db.prepare(`
      SELECT * FROM memories 
      WHERE ${placeholders}
      ORDER BY updated_at DESC 
      LIMIT ? OFFSET ?
    `);

    const params = [...tags.map(tag => `%${tag}%`), limit, offset];
    const rows = stmt.all(...params) as any[];
    return rows.map(row => this.rowToMemory(row));
  }

  async getAllTags(): Promise<string[]> {
    const stmt = this.db.prepare('SELECT DISTINCT name FROM tags ORDER BY name');
    const rows = stmt.all() as any[];
    return rows.map(row => row.name);
  }

  async getRecentMemories(limit: number = 20): Promise<Memory[]> {
    this.logger.debug('Getting recent memories', { limit });
    
    try {
      const stmt = this.db.prepare(`
        SELECT * FROM memories 
        ORDER BY updated_at DESC 
        LIMIT ?
      `);

      const rows = stmt.all(limit) as any[];
      const results = rows.map(row => this.rowToMemory(row));
      
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
    
    try {
      const stmt = this.db.prepare(`
        SELECT * FROM memories 
        ORDER BY updated_at DESC
      `);

      const rows = stmt.all() as any[];
      const results = rows.map(row => this.rowToMemory(row));
      
      this.logger.info('Retrieved all memories', { count: results.length });
      
      return results;
    } catch (error) {
      this.logger.error('Failed to get all memories', error);
      return [];
    }
  }

  async getMemoryCount(): Promise<number> {
    try {
      const stmt = this.db.prepare('SELECT COUNT(*) as count FROM memories');
      const result = stmt.get() as any;
      const count = result.count || 0;
      
      this.logger.debug('Memory count retrieved', { count });
      return count;
    } catch (error) {
      this.logger.error('Failed to get memory count', error);
      return 0;
    }
  }

  private safeJsonParse(jsonString: string, fallback: any): any {
    try {
      return JSON.parse(jsonString || JSON.stringify(fallback));
    } catch (error) {
      console.warn('Failed to parse JSON, using fallback:', jsonString, error);
      return fallback;
    }
  }

  private rowToMemory(row: any): Memory {
    return {
      id: row.id,
      title: row.title,
      content: row.content,
      type: row.type as MemoryType,
      tags: this.safeJsonParse(row.tags, []),
      metadata: this.safeJsonParse(row.metadata, {}),
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };
  }

  close() {
    this.db.close();
  }
}