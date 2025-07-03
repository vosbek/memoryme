import Database from 'better-sqlite3';
import { Memory, MemoryType, MemoryMetadata } from '../types';
import { v4 as uuidv4 } from 'uuid';

export class SQLiteManager {
  private db: Database.Database;

  constructor(dbPath: string) {
    try {
      this.db = new Database(dbPath);
      this.init();
    } catch (error) {
      console.error('Database initialization failed:', error);
      throw new Error(`Failed to initialize database at ${dbPath}: ${error.message}`);
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

    stmt.run(
      newMemory.id,
      newMemory.title,
      newMemory.content,
      newMemory.type,
      JSON.stringify(newMemory.tags),
      JSON.stringify(newMemory.metadata),
      newMemory.createdAt.getTime(),
      newMemory.updatedAt.getTime()
    );

    return newMemory;
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
    const stmt = this.db.prepare(`
      SELECT m.* FROM memories m
      JOIN memories_fts fts ON m.id = fts.id
      WHERE memories_fts MATCH ?
      ORDER BY rank
      LIMIT ? OFFSET ?
    `);

    const rows = stmt.all(query, limit, offset) as any[];
    return rows.map(row => this.rowToMemory(row));
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
    const stmt = this.db.prepare(`
      SELECT * FROM memories 
      ORDER BY updated_at DESC 
      LIMIT ?
    `);

    const rows = stmt.all(limit) as any[];
    return rows.map(row => this.rowToMemory(row));
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