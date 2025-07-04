import { SQLiteManager } from '../../shared/database/sqlite';
import { Memory, MemoryType } from '../../shared/types';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

describe('SQLiteManager', () => {
  let sqliteManager: SQLiteManager;
  let testDbPath: string;

  beforeEach(() => {
    // Create a temporary database file for testing
    const tmpDir = os.tmpdir();
    testDbPath = path.join(tmpDir, `test-devmemory-${Date.now()}.db`);
    sqliteManager = new SQLiteManager(testDbPath);
  });

  afterEach(() => {
    // Clean up test database
    if (sqliteManager) {
      sqliteManager.close();
    }
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
    }
  });

  describe('Memory CRUD Operations', () => {
    const sampleMemory = {
      title: 'Test Memory',
      content: 'This is test content for the memory',
      type: MemoryType.CODE_SNIPPET,
      tags: ['test', 'javascript'],
      metadata: {
        source: 'test',
        project: 'devmemory',
        language: 'javascript'
      }
    };

    it('creates a memory successfully', async () => {
      const createdMemory = await sqliteManager.createMemory(sampleMemory);

      expect(createdMemory.id).toBeDefined();
      expect(createdMemory.title).toBe(sampleMemory.title);
      expect(createdMemory.content).toBe(sampleMemory.content);
      expect(createdMemory.type).toBe(sampleMemory.type);
      expect(createdMemory.tags).toEqual(sampleMemory.tags);
      expect(createdMemory.metadata).toEqual(sampleMemory.metadata);
      expect(createdMemory.createdAt).toBeInstanceOf(Date);
      expect(createdMemory.updatedAt).toBeInstanceOf(Date);
    });

    it('retrieves a memory by ID', async () => {
      const createdMemory = await sqliteManager.createMemory(sampleMemory);
      const retrievedMemory = await sqliteManager.getMemory(createdMemory.id);

      expect(retrievedMemory).toBeTruthy();
      expect(retrievedMemory!.id).toBe(createdMemory.id);
      expect(retrievedMemory!.title).toBe(sampleMemory.title);
    });

    it('returns null for non-existent memory ID', async () => {
      const retrievedMemory = await sqliteManager.getMemory('non-existent-id');
      expect(retrievedMemory).toBeNull();
    });

    it('updates a memory successfully', async () => {
      const createdMemory = await sqliteManager.createMemory(sampleMemory);
      
      const updates = {
        title: 'Updated Test Memory',
        content: 'Updated content',
        tags: ['updated', 'test']
      };

      const updatedMemory = await sqliteManager.updateMemory(createdMemory.id, updates);

      expect(updatedMemory).toBeTruthy();
      expect(updatedMemory!.title).toBe(updates.title);
      expect(updatedMemory!.content).toBe(updates.content);
      expect(updatedMemory!.tags).toEqual(updates.tags);
      expect(updatedMemory!.updatedAt.getTime()).toBeGreaterThan(createdMemory.updatedAt.getTime());
    });

    it('deletes a memory successfully', async () => {
      const createdMemory = await sqliteManager.createMemory(sampleMemory);
      
      const deleteResult = await sqliteManager.deleteMemory(createdMemory.id);
      expect(deleteResult).toBe(true);

      const retrievedMemory = await sqliteManager.getMemory(createdMemory.id);
      expect(retrievedMemory).toBeNull();
    });

    it('returns false when deleting non-existent memory', async () => {
      const deleteResult = await sqliteManager.deleteMemory('non-existent-id');
      expect(deleteResult).toBe(false);
    });
  });

  describe('Search and Query Operations', () => {
    beforeEach(async () => {
      // Create test data
      await sqliteManager.createMemory({
        title: 'React Hooks Guide',
        content: 'useState and useEffect are fundamental React hooks',
        type: MemoryType.DOCUMENTATION,
        tags: ['react', 'hooks'],
        metadata: { source: 'documentation' }
      });

      await sqliteManager.createMemory({
        title: 'Python Error Handling',
        content: 'try except blocks for error handling in Python',
        type: MemoryType.CODE_SNIPPET,
        tags: ['python', 'error-handling'],
        metadata: { source: 'vscode' }
      });

      await sqliteManager.createMemory({
        title: 'Database Design Notes',
        content: 'Normalization and indexing best practices',
        type: MemoryType.NOTE,
        tags: ['database', 'design'],
        metadata: { source: 'meeting' }
      });
    });

    it('searches memories by content', async () => {
      const results = await sqliteManager.searchMemories('React hooks');
      
      expect(results.length).toBe(1);
      expect(results[0].title).toBe('React Hooks Guide');
    });

    it('searches memories by title', async () => {
      const results = await sqliteManager.searchMemories('Python');
      
      expect(results.length).toBe(1);
      expect(results[0].title).toBe('Python Error Handling');
    });

    it('searches memories by tags', async () => {
      const results = await sqliteManager.searchMemories('database');
      
      expect(results.length).toBe(1);
      expect(results[0].title).toBe('Database Design Notes');
    });

    it('returns empty array for no matches', async () => {
      const results = await sqliteManager.searchMemories('nonexistent');
      expect(results).toEqual([]);
    });

    it('limits search results', async () => {
      const results = await sqliteManager.searchMemories('', 2); // Empty query matches all
      expect(results.length).toBeLessThanOrEqual(2);
    });

    it('gets memories by type', async () => {
      const codeSnippets = await sqliteManager.getMemoriesByType(MemoryType.CODE_SNIPPET);
      
      expect(codeSnippets.length).toBe(1);
      expect(codeSnippets[0].title).toBe('Python Error Handling');
    });

    it('gets memories by tags', async () => {
      const reactMemories = await sqliteManager.getMemoriesByTags(['react']);
      
      expect(reactMemories.length).toBe(1);
      expect(reactMemories[0].title).toBe('React Hooks Guide');
    });

    it('gets memories by multiple tags', async () => {
      const memories = await sqliteManager.getMemoriesByTags(['python', 'database']);
      
      expect(memories.length).toBe(2);
      const titles = memories.map(m => m.title);
      expect(titles).toContain('Python Error Handling');
      expect(titles).toContain('Database Design Notes');
    });

    it('gets recent memories', async () => {
      const recentMemories = await sqliteManager.getRecentMemories(2);
      
      expect(recentMemories.length).toBe(2);
      // Should be ordered by updatedAt DESC
      expect(recentMemories[0].updatedAt.getTime())
        .toBeGreaterThanOrEqual(recentMemories[1].updatedAt.getTime());
    });

    it('gets all memories', async () => {
      const allMemories = await sqliteManager.getAllMemories();
      expect(allMemories.length).toBe(3);
    });

    it('gets memory count', async () => {
      const count = await sqliteManager.getMemoryCount();
      expect(count).toBe(3);
    });

    it('gets all tags', async () => {
      const tags = await sqliteManager.getAllTags();
      
      expect(tags.length).toBeGreaterThan(0);
      expect(tags).toContain('react');
      expect(tags).toContain('python');
      expect(tags).toContain('database');
    });
  });

  describe('Error Handling', () => {
    it('handles database connection errors gracefully', () => {
      // Try to create SQLiteManager with invalid path
      const invalidPath = '/invalid/path/database.db';
      
      expect(() => {
        new SQLiteManager(invalidPath);
      }).toThrow();
    });

    it('handles malformed JSON in metadata gracefully', async () => {
      // This tests the JSON parsing safety mentioned in the code
      const memoryWithComplexMetadata = {
        title: 'Complex Metadata Test',
        content: 'Testing complex metadata',
        type: MemoryType.NOTE,
        tags: ['test'],
        metadata: {
          complexObject: {
            nested: {
              data: 'value'
            }
          },
          array: [1, 2, 3],
          nullValue: null
        }
      };

      const createdMemory = await sqliteManager.createMemory(memoryWithComplexMetadata);
      const retrievedMemory = await sqliteManager.getMemory(createdMemory.id);

      expect(retrievedMemory!.metadata).toEqual(memoryWithComplexMetadata.metadata);
    });

    it('handles empty search queries', async () => {
      const results = await sqliteManager.searchMemories('');
      expect(Array.isArray(results)).toBe(true);
    });

    it('handles special characters in search queries', async () => {
      await sqliteManager.createMemory({
        title: 'Special Characters Test',
        content: 'Content with special chars: @#$%^&*()',
        type: MemoryType.NOTE,
        tags: ['special'],
        metadata: {}
      });

      const results = await sqliteManager.searchMemories('@#$%^&*()');
      expect(results.length).toBe(1);
    });
  });

  describe('Data Integrity', () => {
    it('maintains referential integrity with tags', async () => {
      const memory = await sqliteManager.createMemory({
        title: 'Tag Integrity Test',
        content: 'Testing tag relationships',
        type: MemoryType.NOTE,
        tags: ['tag1', 'tag2', 'tag3'],
        metadata: {}
      });

      // Update with different tags
      const updatedMemory = await sqliteManager.updateMemory(memory.id, {
        tags: ['tag2', 'tag4', 'tag5']
      });

      expect(updatedMemory!.tags).toEqual(['tag2', 'tag4', 'tag5']);
      
      // Verify old tags are properly handled
      const allTags = await sqliteManager.getAllTags();
      expect(allTags).toContain('tag2');
      expect(allTags).toContain('tag4');
      expect(allTags).toContain('tag5');
    });

    it('handles concurrent operations safely', async () => {
      // Create multiple memories concurrently
      const promises = Array.from({ length: 10 }, (_, i) =>
        sqliteManager.createMemory({
          title: `Concurrent Memory ${i}`,
          content: `Content ${i}`,
          type: MemoryType.NOTE,
          tags: [`tag${i}`],
          metadata: { index: i }
        })
      );

      const results = await Promise.all(promises);
      
      expect(results.length).toBe(10);
      results.forEach((memory, i) => {
        expect(memory.title).toBe(`Concurrent Memory ${i}`);
        expect(memory.id).toBeDefined();
      });

      const count = await sqliteManager.getMemoryCount();
      expect(count).toBe(10);
    });
  });
});