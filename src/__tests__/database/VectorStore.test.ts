import { VectorStore } from '../../shared/database/vector-store';
import { Memory, MemoryType } from '../../shared/types';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

describe('VectorStore', () => {
  let vectorStore: VectorStore;
  let testVectorPath: string;

  beforeEach(async () => {
    // Create a temporary vector store file for testing
    const tmpDir = os.tmpdir();
    testVectorPath = path.join(tmpDir, `test-vector-${Date.now()}.json`);
    vectorStore = new VectorStore(testVectorPath);
    await vectorStore.initialize();
  });

  afterEach(() => {
    // Clean up test files
    if (fs.existsSync(testVectorPath)) {
      fs.unlinkSync(testVectorPath);
    }
  });

  describe('Initialization', () => {
    it('initializes successfully', async () => {
      expect(vectorStore.isHealthy()).toBe(true);
      
      const info = await vectorStore.getCollectionInfo();
      expect(info.name).toBe('devmemory');
      expect(info.count).toBe(0);
    });

    it('creates vector file if it does not exist', async () => {
      expect(fs.existsSync(testVectorPath)).toBe(true);
    });

    it('loads existing vector file', async () => {
      // Add a memory to the store
      const memory: Memory = {
        id: 'test-1',
        title: 'Test Memory',
        content: 'Test content for vector storage',
        type: MemoryType.NOTE,
        tags: ['test'],
        metadata: {},
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await vectorStore.addMemory(memory);
      
      // Create a new vector store instance with the same file
      const vectorStore2 = new VectorStore(testVectorPath);
      await vectorStore2.initialize();
      
      const info = await vectorStore2.getCollectionInfo();
      expect(info.count).toBe(1);
    });
  });

  describe('Memory Operations', () => {
    const sampleMemory: Memory = {
      id: 'test-memory-1',
      title: 'React Hooks Tutorial',
      content: 'useState and useEffect are fundamental React hooks for state management and side effects',
      type: MemoryType.DOCUMENTATION,
      tags: ['react', 'hooks', 'javascript'],
      metadata: { source: 'documentation' },
      createdAt: new Date(),
      updatedAt: new Date()
    };

    it('adds memory successfully', async () => {
      await vectorStore.addMemory(sampleMemory);
      
      const info = await vectorStore.getCollectionInfo();
      expect(info.count).toBe(1);
    });

    it('updates existing memory', async () => {
      await vectorStore.addMemory(sampleMemory);
      
      const updatedMemory = {
        ...sampleMemory,
        title: 'Updated React Hooks Tutorial',
        content: 'Updated content about React hooks including useCallback and useMemo',
        updatedAt: new Date()
      };

      await vectorStore.updateMemory(updatedMemory);
      
      // Count should still be 1 (update, not add)
      const info = await vectorStore.getCollectionInfo();
      expect(info.count).toBe(1);
    });

    it('deletes memory successfully', async () => {
      await vectorStore.addMemory(sampleMemory);
      
      let info = await vectorStore.getCollectionInfo();
      expect(info.count).toBe(1);
      
      await vectorStore.deleteMemory(sampleMemory.id);
      
      info = await vectorStore.getCollectionInfo();
      expect(info.count).toBe(0);
    });

    it('handles deletion of non-existent memory', async () => {
      await vectorStore.deleteMemory('non-existent-id');
      
      const info = await vectorStore.getCollectionInfo();
      expect(info.count).toBe(0);
    });
  });

  describe('Search Operations', () => {
    beforeEach(async () => {
      // Add test memories
      const memories: Memory[] = [
        {
          id: 'react-1',
          title: 'React Hooks Guide',
          content: 'useState and useEffect are fundamental React hooks for managing state and side effects in functional components',
          type: MemoryType.DOCUMENTATION,
          tags: ['react', 'hooks', 'frontend'],
          metadata: { source: 'documentation' },
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: 'python-1',
          title: 'Python Error Handling',
          content: 'Use try-except blocks to handle exceptions and errors in Python programming',
          type: MemoryType.CODE_SNIPPET,
          tags: ['python', 'error-handling'],
          metadata: { source: 'vscode', language: 'python' },
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: 'database-1',
          title: 'SQL Optimization Tips',
          content: 'Database indexing and query optimization techniques for better performance',
          type: MemoryType.NOTE,
          tags: ['database', 'sql', 'performance'],
          metadata: { source: 'meeting' },
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      for (const memory of memories) {
        await vectorStore.addMemory(memory);
      }
    });

    it('performs semantic search successfully', async () => {
      const results = await vectorStore.searchSimilar('React state management', 5, 0.1);
      
      expect(results.length).toBeGreaterThan(0);
      
      // The React memory should be most relevant
      const reactResult = results.find(r => r.memoryId === 'react-1');
      expect(reactResult).toBeTruthy();
      expect(reactResult!.similarity).toBeGreaterThan(0);
    });

    it('returns results sorted by similarity', async () => {
      const results = await vectorStore.searchSimilar('programming', 3, 0.1);
      
      // Results should be sorted by similarity (highest first)
      for (let i = 0; i < results.length - 1; i++) {
        expect(results[i].similarity).toBeGreaterThanOrEqual(results[i + 1].similarity);
      }
    });

    it('respects similarity threshold', async () => {
      // Use a high threshold to filter out low-similarity results
      const resultsHighThreshold = await vectorStore.searchSimilar('completely unrelated topic xyz', 5, 0.8);
      const resultsLowThreshold = await vectorStore.searchSimilar('completely unrelated topic xyz', 5, 0.1);
      
      expect(resultsHighThreshold.length).toBeLessThanOrEqual(resultsLowThreshold.length);
    });

    it('respects limit parameter', async () => {
      const results = await vectorStore.searchSimilar('programming', 2, 0.1);
      expect(results.length).toBeLessThanOrEqual(2);
    });

    it('returns empty array when no memories exist', async () => {
      // Create a new empty vector store
      const emptyVectorPath = path.join(os.tmpdir(), `empty-vector-${Date.now()}.json`);
      const emptyVectorStore = new VectorStore(emptyVectorPath);
      await emptyVectorStore.initialize();
      
      const results = await emptyVectorStore.searchSimilar('test query', 5, 0.1);
      expect(results).toEqual([]);
      
      // Cleanup
      fs.unlinkSync(emptyVectorPath);
    });

    it('handles special characters in search queries', async () => {
      const results = await vectorStore.searchSimilar('React & hooks @#$%', 5, 0.1);
      expect(Array.isArray(results)).toBe(true);
    });

    it('handles empty search queries', async () => {
      const results = await vectorStore.searchSimilar('', 5, 0.1);
      expect(Array.isArray(results)).toBe(true);
    });
  });

  describe('Embedding Generation', () => {
    it('generates consistent embeddings for same text', async () => {
      const text = 'This is a test text for embedding generation';
      
      const embedding1 = await (vectorStore as any).generateEmbedding(text);
      const embedding2 = await (vectorStore as any).generateEmbedding(text);
      
      expect(embedding1).toEqual(embedding2);
    });

    it('generates different embeddings for different text', async () => {
      const text1 = 'React hooks for state management';
      const text2 = 'Python error handling techniques';
      
      const embedding1 = await (vectorStore as any).generateEmbedding(text1);
      const embedding2 = await (vectorStore as any).generateEmbedding(text2);
      
      expect(embedding1).not.toEqual(embedding2);
    });

    it('handles empty text gracefully', async () => {
      const embedding = await (vectorStore as any).generateEmbedding('');
      expect(Array.isArray(embedding)).toBe(true);
      expect(embedding.length).toBeGreaterThan(0);
    });
  });

  describe('Similarity Calculation', () => {
    it('calculates similarity correctly', () => {
      const vector1 = [1, 0, 0];
      const vector2 = [1, 0, 0];
      const vector3 = [0, 1, 0];
      
      const similarity1 = (vectorStore as any).calculateCosineSimilarity(vector1, vector2);
      const similarity2 = (vectorStore as any).calculateCosineSimilarity(vector1, vector3);
      
      expect(similarity1).toBe(1); // Identical vectors
      expect(similarity2).toBe(0); // Orthogonal vectors
    });

    it('handles zero vectors', () => {
      const vector1 = [1, 2, 3];
      const vector2 = [0, 0, 0];
      
      const similarity = (vectorStore as any).calculateCosineSimilarity(vector1, vector2);
      expect(similarity).toBe(0);
    });

    it('normalizes similarity values', () => {
      const vector1 = [1, 2, 3];
      const vector2 = [2, 4, 6]; // Scaled version
      
      const similarity = (vectorStore as any).calculateCosineSimilarity(vector1, vector2);
      expect(similarity).toBeCloseTo(1, 5); // Should be very close to 1
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('handles corrupted vector file gracefully', async () => {
      // Write invalid JSON to the vector file
      fs.writeFileSync(testVectorPath, 'invalid json content');
      
      const corruptedVectorStore = new VectorStore(testVectorPath);
      await corruptedVectorStore.initialize();
      
      // Should still be healthy and reset the file
      expect(corruptedVectorStore.isHealthy()).toBe(true);
      
      const info = await corruptedVectorStore.getCollectionInfo();
      expect(info.count).toBe(0);
    });

    it('handles memory with missing fields', async () => {
      const incompleteMemory = {
        id: 'incomplete-1',
        title: '',
        content: '',
        type: MemoryType.NOTE,
        tags: [],
        metadata: {},
        createdAt: new Date(),
        updatedAt: new Date()
      } as Memory;

      await vectorStore.addMemory(incompleteMemory);
      
      const info = await vectorStore.getCollectionInfo();
      expect(info.count).toBe(1);
    });

    it('maintains data persistence across operations', async () => {
      // Add multiple memories
      const memories = [
        {
          id: 'persist-1',
          title: 'Persistence Test 1',
          content: 'First test memory for persistence',
          type: MemoryType.NOTE,
          tags: ['test'],
          metadata: {},
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: 'persist-2',
          title: 'Persistence Test 2',
          content: 'Second test memory for persistence',
          type: MemoryType.NOTE,
          tags: ['test'],
          metadata: {},
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ] as Memory[];

      for (const memory of memories) {
        await vectorStore.addMemory(memory);
      }

      // Verify data is persisted
      expect(fs.existsSync(testVectorPath)).toBe(true);
      
      const fileContent = fs.readFileSync(testVectorPath, 'utf-8');
      const data = JSON.parse(fileContent);
      
      expect(data.embeddings).toHaveLength(2);
      expect(data.embeddings.map((e: any) => e.memoryId)).toContain('persist-1');
      expect(data.embeddings.map((e: any) => e.memoryId)).toContain('persist-2');
    });
  });

  describe('Performance and Scalability', () => {
    it('handles large numbers of memories efficiently', async () => {
      const startTime = Date.now();
      
      // Add many memories
      const promises = Array.from({ length: 50 }, (_, i) =>
        vectorStore.addMemory({
          id: `perf-${i}`,
          title: `Performance Test Memory ${i}`,
          content: `This is test content for memory number ${i} used for performance testing`,
          type: MemoryType.NOTE,
          tags: [`perf${i % 10}`],
          metadata: { index: i },
          createdAt: new Date(),
          updatedAt: new Date()
        } as Memory)
      );

      await Promise.all(promises);
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      // Should complete within reasonable time (adjust threshold as needed)
      expect(duration).toBeLessThan(30000); // 30 seconds
      
      const info = await vectorStore.getCollectionInfo();
      expect(info.count).toBe(50);
    });

    it('performs search efficiently with many memories', async () => {
      // Add test memories first
      for (let i = 0; i < 20; i++) {
        await vectorStore.addMemory({
          id: `search-perf-${i}`,
          title: `Search Performance Test ${i}`,
          content: `Content for search performance testing with various keywords and phrases ${i}`,
          type: MemoryType.NOTE,
          tags: [`search${i % 5}`],
          metadata: {},
          createdAt: new Date(),
          updatedAt: new Date()
        } as Memory);
      }

      const startTime = Date.now();
      const results = await vectorStore.searchSimilar('performance testing', 10, 0.1);
      const endTime = Date.now();
      
      const searchDuration = endTime - startTime;
      
      // Search should be fast
      expect(searchDuration).toBeLessThan(1000); // 1 second
      expect(results.length).toBeGreaterThan(0);
    });
  });
});