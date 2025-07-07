import { SQLiteManager, DatabaseOptions } from './sqlite';
import { ChromaDBVectorStore } from './chromadb-vector-store';
import { VectorStore } from './vector-store';
import { KnowledgeGraphManager } from './knowledge-graph';
import { Memory, MemoryType } from '../types';
import { createLogger } from '../utils/logger';
import Database from 'better-sqlite3';
import * as path from 'path';
import * as fs from 'fs';

export interface HybridSearchResult {
  memory: Memory;
  similarity?: number;
  relationshipContext?: {
    connectedEntities: string[];
    relationshipPaths: string[];
  };
  searchMethod: 'vector' | 'text' | 'graph' | 'hybrid';
}

export interface DatabaseHealth {
  sqlite: boolean;
  vectorStore: boolean;
  chromaDB: boolean;
  knowledgeGraph: boolean;
  overall: boolean;
}

/**
 * Hybrid Database Manager for DevMemory
 * Orchestrates SQLite, ChromaDB vector store, and Knowledge Graph
 * Provides unified interface with intelligent query routing
 */
export class HybridDatabaseManager {
  private sqliteManager: SQLiteManager;
  private legacyVectorStore: VectorStore;
  private chromaVectorStore: ChromaDBVectorStore;
  private knowledgeGraph: KnowledgeGraphManager;
  private logger = createLogger('HybridDatabaseManager');
  private useChromaDB = false; // Feature flag for ChromaDB migration
  private isInitialized = false;

  constructor(dataPath: string, options: { enableEncryption?: boolean } = {}) {
    const dbPath = path.join(dataPath, 'devmemory.db');
    const vectorPath = path.join(dataPath, 'vector-data.json');
    const chromaPath = path.join(dataPath, 'chromadb');

    // Ensure data directory exists
    if (!fs.existsSync(dataPath)) {
      fs.mkdirSync(dataPath, { recursive: true });
    }

    // Initialize components with encryption support
    const dbOptions: DatabaseOptions = {
      enableEncryption: options.enableEncryption || false
    };
    
    this.sqliteManager = new SQLiteManager(dbPath, dbOptions);
    this.legacyVectorStore = new VectorStore(vectorPath);
    this.chromaVectorStore = new ChromaDBVectorStore(chromaPath);
    
    // Initialize knowledge graph with same SQLite instance
    const db = new Database(dbPath);
    this.knowledgeGraph = new KnowledgeGraphManager(db);

    this.logger.info('Hybrid database manager initialized', { 
      dbPath, 
      vectorPath, 
      chromaPath,
      encrypted: dbOptions.enableEncryption
    });
  }

  async initialize(): Promise<void> {
    try {
      this.logger.info('Initializing hybrid database system...');

      // Initialize legacy vector store first (for migration)
      await this.legacyVectorStore.initialize();
      this.logger.info('✓ Legacy vector store initialized');

      // Try to initialize ChromaDB
      try {
        await this.chromaVectorStore.initialize();
        this.useChromaDB = true;
        this.logger.info('✓ ChromaDB vector store initialized');

        // Check if migration is needed
        const legacyInfo = await this.legacyVectorStore.getCollectionInfo();
        const chromaInfo = await this.chromaVectorStore.getCollectionInfo();
        
        if (legacyInfo.count > 0 && chromaInfo.count === 0) {
          this.logger.info('Starting migration from legacy vector store to ChromaDB');
          await this.migrateLegacyVectorStore();
        }
      } catch (error) {
        this.logger.warn('ChromaDB initialization failed, using legacy vector store', error);
        this.useChromaDB = false;
      }

      this.logger.info('✓ Knowledge graph initialized');
      this.isInitialized = true;
      
      this.logger.info('Hybrid database system initialization completed', {
        useChromaDB: this.useChromaDB
      });
    } catch (error) {
      this.logger.error('Failed to initialize hybrid database system', error);
      throw error;
    }
  }

  async createMemory(memory: Omit<Memory, 'id' | 'createdAt' | 'updatedAt'>): Promise<Memory> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      // 1. Create in SQLite (primary storage)
      const newMemory = await this.sqliteManager.createMemory(memory);
      this.logger.debug('Memory created in SQLite', { id: newMemory.id });

      // 2. Add to vector store (parallel operations)
      const vectorPromises: Promise<void>[] = [];
      
      if (this.useChromaDB) {
        vectorPromises.push(
          this.chromaVectorStore.addMemory(newMemory).catch(error => {
            this.logger.warn('Failed to add memory to ChromaDB', error);
          })
        );
      } else {
        vectorPromises.push(
          this.legacyVectorStore.addMemory(newMemory).catch(error => {
            this.logger.warn('Failed to add memory to legacy vector store', error);
          })
        );
      }

      // 3. Extract entities and create knowledge graph entries
      vectorPromises.push(
        this.knowledgeGraph.extractEntitiesFromMemory(newMemory).catch(error => {
          this.logger.warn('Failed to extract entities from memory', error);
          return [];
        }).then(() => {})
      );

      // Wait for all operations to complete
      await Promise.all(vectorPromises);

      this.logger.info('Memory created successfully across all systems', { 
        id: newMemory.id,
        title: newMemory.title 
      });

      return newMemory;
    } catch (error) {
      this.logger.error('Failed to create memory', error);
      throw error;
    }
  }

  async updateMemory(id: string, updates: Partial<Omit<Memory, 'id' | 'createdAt'>>): Promise<Memory | null> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      // 1. Update in SQLite
      const updatedMemory = await this.sqliteManager.updateMemory(id, updates);
      if (!updatedMemory) {
        return null;
      }

      // 2. Update in vector store
      const updatePromises: Promise<void>[] = [];
      
      if (this.useChromaDB) {
        updatePromises.push(
          this.chromaVectorStore.updateMemory(updatedMemory).catch(error => {
            this.logger.warn('Failed to update memory in ChromaDB', error);
          })
        );
      } else {
        updatePromises.push(
          this.legacyVectorStore.updateMemory(updatedMemory).catch(error => {
            this.logger.warn('Failed to update memory in legacy vector store', error);
          })
        );
      }

      // 3. Re-extract entities (simple approach - can be optimized)
      updatePromises.push(
        this.knowledgeGraph.extractEntitiesFromMemory(updatedMemory).catch(error => {
          this.logger.warn('Failed to update entities for memory', error);
          return [];
        }).then(() => {})
      );

      await Promise.all(updatePromises);

      this.logger.debug('Memory updated across all systems', { id });
      return updatedMemory;
    } catch (error) {
      this.logger.error('Failed to update memory', error);
      throw error;
    }
  }

  async deleteMemory(id: string): Promise<boolean> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      // Delete from all systems (parallel operations)
      const deletePromises = [
        this.sqliteManager.deleteMemory(id),
        this.useChromaDB ? 
          this.chromaVectorStore.deleteMemory(id) : 
          this.legacyVectorStore.deleteMemory(id)
      ];

      const [sqliteResult] = await Promise.all(deletePromises);
      
      // Note: Knowledge graph entities are not automatically deleted
      // as they might be referenced by other memories
      
      this.logger.debug('Memory deleted from all systems', { id });
      return sqliteResult || false;
    } catch (error) {
      this.logger.error('Failed to delete memory', error);
      return false;
    }
  }

  async searchMemories(
    query: string, 
    options: {
      limit?: number;
      threshold?: number;
      searchMethod?: 'auto' | 'vector' | 'text' | 'graph' | 'hybrid';
      filters?: Record<string, any>;
    } = {}
  ): Promise<HybridSearchResult[]> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    const { 
      limit = 20, 
      threshold = 0.5, 
      searchMethod = 'auto',
      filters 
    } = options;

    try {
      let searchResults: HybridSearchResult[] = [];

      if (searchMethod === 'auto' || searchMethod === 'hybrid') {
        // Intelligent search routing based on query characteristics
        if (query.length > 50 && searchMethod === 'auto') {
          // Long queries benefit from vector search
          searchResults = await this.performVectorSearch(query, limit, threshold, filters);
        } else {
          // Hybrid approach: combine multiple search methods
          searchResults = await this.performHybridSearch(query, limit, threshold, filters);
        }
      } else {
        // Specific search method requested
        switch (searchMethod) {
          case 'vector':
            searchResults = await this.performVectorSearch(query, limit, threshold, filters);
            break;
          case 'text':
            searchResults = await this.performTextSearch(query, limit);
            break;
          case 'graph':
            searchResults = await this.performGraphSearch(query, limit);
            break;
        }
      }

      this.logger.debug('Search completed', { 
        query: query.substring(0, 50) + '...', 
        method: searchMethod,
        resultsCount: searchResults.length 
      });

      return searchResults;
    } catch (error) {
      this.logger.error('Search failed', error);
      return [];
    }
  }

  async getMemory(id: string): Promise<Memory | null> {
    return this.sqliteManager.getMemory(id);
  }

  async getRecentMemories(limit: number = 20): Promise<Memory[]> {
    return this.sqliteManager.getRecentMemories(limit);
  }

  async getMemoriesByType(type: MemoryType, limit: number = 50): Promise<Memory[]> {
    return this.sqliteManager.getMemoriesByType(type, limit);
  }

  async getMemoriesByTags(tags: string[], limit: number = 50, offset: number = 0): Promise<Memory[]> {
    return this.sqliteManager.getMemoriesByTags(tags, limit, offset);
  }

  async getSystemHealth(): Promise<DatabaseHealth> {
    const health: DatabaseHealth = {
      sqlite: true,
      vectorStore: false,
      chromaDB: false,
      knowledgeGraph: true,
      overall: false
    };

    try {
      // Test SQLite
      await this.sqliteManager.getMemoryCount();
      health.sqlite = true;
    } catch (error) {
      health.sqlite = false;
    }

    try {
      // Test vector stores
      if (this.useChromaDB) {
        health.chromaDB = this.chromaVectorStore.isHealthy();
        health.vectorStore = health.chromaDB;
      } else {
        health.vectorStore = this.legacyVectorStore.isHealthy();
      }
    } catch (error) {
      health.vectorStore = false;
      health.chromaDB = false;
    }

    try {
      // Test knowledge graph
      await this.knowledgeGraph.getGraphStatistics();
      health.knowledgeGraph = true;
    } catch (error) {
      health.knowledgeGraph = false;
    }

    health.overall = health.sqlite && health.vectorStore && health.knowledgeGraph;
    
    return health;
  }

  private async performVectorSearch(
    query: string, 
    limit: number, 
    threshold: number,
    filters?: Record<string, any>
  ): Promise<HybridSearchResult[]> {
    try {
      if (this.useChromaDB) {
        const chromaResults = await this.chromaVectorStore.searchSimilar(query, limit, threshold, filters);
        const results: HybridSearchResult[] = [];

        for (const result of chromaResults) {
          const memory = await this.sqliteManager.getMemory(result.memoryId);
          if (memory) {
            results.push({
              memory,
              similarity: result.similarity,
              searchMethod: 'vector'
            });
          }
        }

        return results;
      } else {
        const legacyResults = await this.legacyVectorStore.searchSimilar(query, limit, threshold);
        const results: HybridSearchResult[] = [];

        for (const result of legacyResults) {
          const memory = await this.sqliteManager.getMemory(result.memoryId);
          if (memory) {
            results.push({
              memory,
              similarity: result.similarity,
              searchMethod: 'vector'
            });
          }
        }

        return results;
      }
    } catch (error) {
      this.logger.warn('Vector search failed, falling back to text search', error);
      return this.performTextSearch(query, limit);
    }
  }

  private async performTextSearch(query: string, limit: number): Promise<HybridSearchResult[]> {
    const memories = await this.sqliteManager.searchMemories(query, limit);
    return memories.map(memory => ({
      memory,
      searchMethod: 'text' as const
    }));
  }

  private async performGraphSearch(query: string, limit: number): Promise<HybridSearchResult[]> {
    try {
      const entityResults = await this.knowledgeGraph.searchEntities(query, limit);
      const results: HybridSearchResult[] = [];

      for (const entityResult of entityResults) {
        const entity = entityResult.entity;
        
        // Get memories that reference this entity
        for (const memoryId of entity.memoryIds) {
          const memory = await this.sqliteManager.getMemory(memoryId);
          if (memory) {
            results.push({
              memory,
              relationshipContext: {
                connectedEntities: [entity.name],
                relationshipPaths: [`Found entity: ${entity.name} (${entity.type})`]
              },
              searchMethod: 'graph'
            });
          }
        }
      }

      return results.slice(0, limit);
    } catch (error) {
      this.logger.warn('Graph search failed', error);
      return [];
    }
  }

  private async performHybridSearch(
    query: string, 
    limit: number, 
    threshold: number,
    filters?: Record<string, any>
  ): Promise<HybridSearchResult[]> {
    try {
      // Run multiple search methods in parallel
      const [vectorResults, textResults, graphResults] = await Promise.all([
        this.performVectorSearch(query, Math.ceil(limit * 0.6), threshold, filters),
        this.performTextSearch(query, Math.ceil(limit * 0.3)),
        this.performGraphSearch(query, Math.ceil(limit * 0.1))
      ]);

      // Combine and deduplicate results
      const combinedResults = new Map<string, HybridSearchResult>();

      // Add vector results (highest priority)
      vectorResults.forEach(result => {
        combinedResults.set(result.memory.id, result);
      });

      // Add text results (if not already present)
      textResults.forEach(result => {
        if (!combinedResults.has(result.memory.id)) {
          combinedResults.set(result.memory.id, result);
        }
      });

      // Add graph results (if not already present)
      graphResults.forEach(result => {
        if (!combinedResults.has(result.memory.id)) {
          combinedResults.set(result.memory.id, result);
        } else {
          // Enhance existing result with relationship context
          const existing = combinedResults.get(result.memory.id)!;
          existing.relationshipContext = result.relationshipContext;
          existing.searchMethod = 'hybrid';
        }
      });

      // Sort by similarity (if available) and limit results
      const sortedResults = Array.from(combinedResults.values())
        .sort((a, b) => {
          if (a.similarity && b.similarity) {
            return b.similarity - a.similarity;
          }
          if (a.similarity) return -1;
          if (b.similarity) return 1;
          return b.memory.updatedAt.getTime() - a.memory.updatedAt.getTime();
        })
        .slice(0, limit);

      return sortedResults;
    } catch (error) {
      this.logger.error('Hybrid search failed', error);
      return this.performTextSearch(query, limit);
    }
  }

  private async migrateLegacyVectorStore(): Promise<void> {
    try {
      this.logger.info('Starting migration from legacy vector store to ChromaDB');
      
      // Get all memories from SQLite
      const allMemories = await this.sqliteManager.getAllMemories();
      
      // Recreate vector embeddings in ChromaDB
      let migrated = 0;
      for (const memory of allMemories) {
        try {
          await this.chromaVectorStore.addMemory(memory);
          migrated++;
          
          if (migrated % 100 === 0) {
            this.logger.info('Migration progress', { migrated, total: allMemories.length });
          }
        } catch (error) {
          this.logger.warn('Failed to migrate memory to ChromaDB', { memoryId: memory.id, error });
        }
      }

      this.logger.info('Migration completed', { 
        totalMemories: allMemories.length, 
        migrated 
      });
    } catch (error) {
      this.logger.error('Migration failed', error);
      throw error;
    }
  }

  // === Knowledge Graph Public Methods ===

  async searchEntities(query: string, limit: number = 20, entityType?: string): Promise<any[]> {
    // Note: entityType filtering would need to be implemented in knowledge-graph.ts
    return await this.knowledgeGraph.searchEntities(query, limit);
  }

  async getGraphStatistics(): Promise<any> {
    return await this.knowledgeGraph.getGraphStatistics();
  }

  async getEntity(id: string): Promise<any> {
    return await this.knowledgeGraph.getEntity(id);
  }

  async getEntityRelationships(entityId: string, direction: 'incoming' | 'outgoing' | 'both' = 'both'): Promise<any[]> {
    return await this.knowledgeGraph.getEntityRelationships(entityId, direction);
  }

  async getEntitiesByType(entityType: string, limit: number = 50): Promise<any[]> {
    return await this.knowledgeGraph.getEntitiesByType(entityType as any, limit);
  }

  async findRelationshipPath(fromEntityId: string, toEntityId: string, maxDepth: number = 3): Promise<any[]> {
    return await this.knowledgeGraph.findRelationshipPath(fromEntityId, toEntityId, maxDepth);
  }

  async getAllEntities(): Promise<any[]> {
    return await this.knowledgeGraph.getAllEntities();
  }

  async getAllRelationships(): Promise<any[]> {
    return await this.knowledgeGraph.getAllRelationships();
  }

  /**
   * Create a new entity in the knowledge graph
   */
  async createEntity(entity: any): Promise<any> {
    return await this.knowledgeGraph.createEntity(entity);
  }

  /**
   * Create a new relationship in the knowledge graph
   */
  async createRelationship(relationship: any): Promise<any> {
    try {
      let finalRelationship = { ...relationship };

      // Handle relationships that use entity names instead of IDs
      if (relationship.fromEntityName || relationship.toEntityName) {
        this.logger.debug('Converting entity names to IDs for relationship creation', {
          fromName: relationship.fromEntityName,
          toName: relationship.toEntityName
        });

        // Lookup fromEntity ID
        if (relationship.fromEntityName) {
          const fromEntity = await this.knowledgeGraph.findEntityByName(relationship.fromEntityName);
          if (!fromEntity) {
            this.logger.debug('From entity not found by name, skipping relationship', {
              name: relationship.fromEntityName
            });
            return null;
          }
          finalRelationship.fromEntityId = fromEntity.id;
          delete finalRelationship.fromEntityName;
        }

        // Lookup toEntity ID
        if (relationship.toEntityName) {
          const toEntity = await this.knowledgeGraph.findEntityByName(relationship.toEntityName);
          if (!toEntity) {
            this.logger.debug('To entity not found by name, skipping relationship', {
              name: relationship.toEntityName
            });
            return null;
          }
          finalRelationship.toEntityId = toEntity.id;
          delete finalRelationship.toEntityName;
        }
      }

      // Ensure we have valid entity IDs
      if (!finalRelationship.fromEntityId || !finalRelationship.toEntityId) {
        this.logger.debug('Missing entity IDs for relationship creation', finalRelationship);
        return null;
      }

      return await this.knowledgeGraph.createRelation(finalRelationship);
    } catch (error) {
      this.logger.warn('Failed to create relationship', error);
      return null;
    }
  }

  async close(): Promise<void> {
    try {
      this.sqliteManager.close();
      
      if (this.useChromaDB) {
        await this.chromaVectorStore.close();
      }
      
      this.logger.info('Hybrid database manager closed');
    } catch (error) {
      this.logger.error('Error closing database connections', error);
    }
  }
}