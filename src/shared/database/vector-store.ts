import * as fs from 'fs';
import * as path from 'path';
import { Memory } from '../types';
import { BedrockEmbeddingFunction } from './bedrock-embeddings';

export interface VectorDocument {
  id: string;
  content: string;
  embedding: number[];
  metadata: {
    title: string;
    type: string;
    tags: string[];
    createdAt: string;
    updatedAt: string;
    [key: string]: any;
  };
}

export interface SearchResult {
  memoryId: string;
  similarity: number;
  metadata: any;
}

export class VectorStore {
  private documents: Map<string, VectorDocument> = new Map();
  private embeddingFunction: BedrockEmbeddingFunction;
  private storePath: string;
  private isLoaded = false;
  private cache: Map<string, SearchResult[]> = new Map();
  private cacheTTL = 5 * 60 * 1000; // 5 minutes
  private lastCacheCleanup = Date.now();
  private saveTimeout: NodeJS.Timeout | null = null;

  constructor(dataPath?: string) {
    this.storePath = dataPath || path.join(process.cwd(), 'vector-data.json');
    this.embeddingFunction = new BedrockEmbeddingFunction();
  }

  async initialize(): Promise<void> {
    try {
      console.log('Initializing local vector store...');
      
      // Test Bedrock connection
      const hasBedrockAccess = await this.embeddingFunction.testConnection();
      if (hasBedrockAccess) {
        console.log('✓ AWS Bedrock embeddings available');
      } else {
        console.log('⚠ Using fallback embeddings (Bedrock not available)');
      }
      
      // Load existing data
      await this.loadFromDisk();
      console.log(`Loaded ${this.documents.size} documents from vector store`);
      
      this.isLoaded = true;
    } catch (error) {
      console.error('Failed to initialize vector store:', error);
      throw error;
    }
  }

  async addMemory(memory: Memory): Promise<void> {
    if (!this.isLoaded) {
      await this.initialize();
    }

    try {
      const content = `${memory.title}\n\n${memory.content}\n\nTags: ${memory.tags.join(', ')}`;
      
      // Generate embedding
      const embeddings = await this.embeddingFunction.generate([content]);
      const embedding = embeddings[0];

      const document: VectorDocument = {
        id: memory.id,
        content,
        embedding,
        metadata: {
          title: memory.title,
          type: memory.type,
          tags: memory.tags,
          createdAt: memory.createdAt.toISOString(),
          updatedAt: memory.updatedAt.toISOString(),
          ...memory.metadata,
        },
      };

      this.documents.set(memory.id, document);
      this.invalidateCache();
      this.debouncedSave();
      
      console.log(`Added memory ${memory.id} to vector store`);
    } catch (error) {
      console.error('Failed to add memory to vector store:', error);
      throw error;
    }
  }

  async updateMemory(memory: Memory): Promise<void> {
    if (!this.isLoaded) {
      await this.initialize();
    }

    // Simply re-add the memory (overwrites existing)
    await this.addMemory(memory);
    console.log(`Updated memory ${memory.id} in vector store`);
  }

  async deleteMemory(memoryId: string): Promise<void> {
    if (!this.isLoaded) {
      await this.initialize();
    }

    try {
      this.documents.delete(memoryId);
      this.invalidateCache();
      this.debouncedSave();
      console.log(`Deleted memory ${memoryId} from vector store`);
    } catch (error) {
      console.warn('Failed to delete memory from vector store:', error);
    }
  }

  async searchSimilar(
    query: string,
    limit: number = 10,
    threshold: number = 0.5
  ): Promise<SearchResult[]> {
    if (!this.isLoaded) {
      await this.initialize();
    }

    try {
      // Check cache first
      const cacheKey = `${query}-${limit}-${threshold}`;
      if (this.cache.has(cacheKey)) {
        return this.cache.get(cacheKey)!;
      }

      // Clean up old cache entries periodically
      if (Date.now() - this.lastCacheCleanup > this.cacheTTL) {
        this.cleanupCache();
      }

      // Generate embedding for the query
      const queryEmbeddings = await this.embeddingFunction.generate([query]);
      const queryEmbedding = queryEmbeddings[0];

      const results: SearchResult[] = [];

      // Calculate similarity with all documents - optimized loop
      for (const [id, document] of this.documents) {
        const similarity = this.calculateCosineSimilarity(queryEmbedding, document.embedding);
        
        if (similarity >= threshold) {
          results.push({
            memoryId: id,
            similarity,
            metadata: document.metadata,
          });
        }
      }

      // Sort by similarity (highest first) and limit results
      const sortedResults = results
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, limit);

      // Cache the results
      this.cache.set(cacheKey, sortedResults);
      
      return sortedResults;
    } catch (error) {
      console.error('Failed to search vector store:', error);
      return [];
    }
  }

  async getCollectionInfo(): Promise<{count: number, name: string}> {
    if (!this.isLoaded) {
      await this.initialize();
    }

    return {
      count: this.documents.size,
      name: 'local-vector-store',
    };
  }

  async resetCollection(): Promise<void> {
    this.documents.clear();
    await this.saveToDisk();
    console.log('Reset vector store');
  }

  private calculateCosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) {
      return 0;
    }

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    // Optimized loop for better performance
    const len = a.length;
    for (let i = 0; i < len; i++) {
      const aVal = a[i];
      const bVal = b[i];
      dotProduct += aVal * bVal;
      normA += aVal * aVal;
      normB += bVal * bVal;
    }

    const magnitude = Math.sqrt(normA) * Math.sqrt(normB);
    return magnitude === 0 ? 0 : dotProduct / magnitude;
  }

  private invalidateCache(): void {
    this.cache.clear();
  }

  private cleanupCache(): void {
    this.cache.clear();
    this.lastCacheCleanup = Date.now();
  }

  private debouncedSave(): void {
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
    }
    
    this.saveTimeout = setTimeout(async () => {
      await this.saveToDisk();
      this.saveTimeout = null;
    }, 1000); // Save after 1 second of inactivity
  }

  private async loadFromDisk(): Promise<void> {
    try {
      if (fs.existsSync(this.storePath)) {
        const data = fs.readFileSync(this.storePath, 'utf-8');
        
        // Handle both array and object formats for backward compatibility
        let documentsArray: VectorDocument[];
        const parsed = JSON.parse(data);
        
        if (Array.isArray(parsed)) {
          documentsArray = parsed;
        } else if (parsed.embeddings && Array.isArray(parsed.embeddings)) {
          // Handle the new format with metadata
          documentsArray = parsed.embeddings;
        } else {
          documentsArray = [];
        }
        
        this.documents.clear();
        for (const doc of documentsArray) {
          if (doc.id && doc.embedding) {
            this.documents.set(doc.id, doc);
          }
        }
      }
    } catch (error) {
      console.warn('Failed to load vector store from disk:', error);
      // Start with empty store
      this.documents.clear();
    }
  }

  private async saveToDisk(): Promise<void> {
    try {
      const documentsArray = Array.from(this.documents.values());
      const saveData = {
        version: '1.0',
        timestamp: new Date().toISOString(),
        embeddings: documentsArray
      };
      
      // Ensure directory exists
      const dir = path.dirname(this.storePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      
      // Write to temporary file first, then rename for atomic save
      const tempPath = `${this.storePath}.tmp`;
      fs.writeFileSync(tempPath, JSON.stringify(saveData, null, 2), 'utf-8');
      fs.renameSync(tempPath, this.storePath);
      
      console.log(`Saved ${documentsArray.length} documents to vector store`);
    } catch (error) {
      console.error('Failed to save vector store to disk:', error);
    }
  }

  isHealthy(): boolean {
    return this.isLoaded;
  }
}