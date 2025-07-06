import { m365IntegrationService, M365Content, SyncOptions, SyncResult } from './m365-integration-service';
import { m365EntityMapper, M365EntityMapping } from './m365-entity-mapper';
import { HybridDatabaseManager } from '../database/hybrid-database-manager';
import { createLogger } from '../utils/logger';

/**
 * Microsoft 365 Synchronization Engine
 * Coordinates the synchronization of M365 content into DevMemory's knowledge graph
 */

export interface SyncConfiguration {
  enabled: boolean;
  autoSync: boolean;
  syncInterval: number; // minutes
  maxItemsPerSync: number;
  contentTypes: Array<'email' | 'event' | 'file' | 'team' | 'site'>;
  retentionDays?: number;
  conflictResolution: 'local' | 'remote' | 'merge';
}

export interface SyncProgress {
  phase: 'initializing' | 'fetching' | 'mapping' | 'storing' | 'indexing' | 'completed' | 'error';
  itemsTotal: number;
  itemsProcessed: number;
  currentItem?: string;
  errors: Array<{
    item: string;
    error: string;
    timestamp: Date;
  }>;
  startTime: Date;
  endTime?: Date;
}

export interface SyncStats {
  lastSync: Date;
  totalItems: number;
  itemsByType: Record<string, number>;
  successRate: number;
  averageSyncTime: number;
  lastErrors: Array<{
    error: string;
    timestamp: Date;
  }>;
}

export class M365SyncEngine {
  private logger = createLogger('M365SyncEngine');
  private isInitialized = false;
  private databaseManager: HybridDatabaseManager | null = null;
  private syncInProgress = false;
  private syncConfiguration: SyncConfiguration = {
    enabled: true,
    autoSync: false,
    syncInterval: 60, // 1 hour
    maxItemsPerSync: 100,
    contentTypes: ['email', 'event', 'team'],
    conflictResolution: 'merge'
  };
  private syncStats: SyncStats = {
    lastSync: new Date(0),
    totalItems: 0,
    itemsByType: {},
    successRate: 1.0,
    averageSyncTime: 0,
    lastErrors: []
  };

  constructor() {
    this.logger.info('M365 Sync Engine created');
  }

  /**
   * Initialize the synchronization engine
   */
  async initialize(databaseManager: HybridDatabaseManager): Promise<void> {
    try {
      this.logger.info('Initializing M365 Sync Engine');

      this.databaseManager = databaseManager;

      // Ensure M365 integration service is ready
      if (!m365IntegrationService.isReady()) {
        await m365IntegrationService.initialize();
      }

      // Load previous sync stats
      await this.loadSyncStats();

      this.isInitialized = true;
      this.logger.info('✓ M365 Sync Engine initialized successfully');

    } catch (error) {
      this.logger.error('Failed to initialize M365 Sync Engine', error);
      throw error;
    }
  }

  /**
   * Check if sync engine is ready
   */
  isReady(): boolean {
    return this.isInitialized && 
           this.databaseManager !== null && 
           m365IntegrationService.isReady();
  }

  /**
   * Perform full synchronization
   */
  async performSync(options?: Partial<SyncOptions>): Promise<SyncResult> {
    if (!this.isReady()) {
      throw new Error('Sync engine not initialized');
    }

    if (this.syncInProgress) {
      throw new Error('Synchronization already in progress');
    }

    this.syncInProgress = true;
    const startTime = new Date();
    
    const progress: SyncProgress = {
      phase: 'initializing',
      itemsTotal: 0,
      itemsProcessed: 0,
      errors: [],
      startTime
    };

    try {
      this.logger.info('Starting M365 synchronization', options);

      // Phase 1: Fetch M365 content
      progress.phase = 'fetching';
      const syncOptions: SyncOptions = {
        includeTypes: options?.includeTypes || this.syncConfiguration.contentTypes,
        maxItems: options?.maxItems || this.syncConfiguration.maxItemsPerSync,
        since: options?.since || this.getLastSyncTime()
      };

      const m365Content = await m365IntegrationService.getAllContent(syncOptions);
      progress.itemsTotal = m365Content.length;
      
      this.logger.info(`✓ Fetched ${m365Content.length} M365 items`);

      // Phase 2: Map content to entities
      progress.phase = 'mapping';
      const mappings: M365EntityMapping[] = [];
      
      for (let i = 0; i < m365Content.length; i++) {
        const content = m365Content[i];
        progress.currentItem = content.title;
        progress.itemsProcessed = i;

        try {
          const mapping = await m365EntityMapper.mapContent(content);
          mappings.push(mapping);
        } catch (error) {
          progress.errors.push({
            item: content.title,
            error: error instanceof Error ? error.message : 'Mapping failed',
            timestamp: new Date()
          });
          this.logger.warn(`Failed to map content: ${content.title}`, error);
        }
      }

      this.logger.info(`✓ Mapped ${mappings.length}/${m365Content.length} items`);

      // Phase 3: Store in database
      progress.phase = 'storing';
      let itemsCreated = 0;
      let itemsUpdated = 0;

      for (let i = 0; i < mappings.length; i++) {
        const mapping = mappings[i];
        progress.currentItem = mapping.memory.title;
        progress.itemsProcessed = i;

        try {
          const result = await this.storeMapping(mapping);
          if (result.created) itemsCreated++;
          if (result.updated) itemsUpdated++;
        } catch (error) {
          progress.errors.push({
            item: mapping.memory.title,
            error: error instanceof Error ? error.message : 'Storage failed',
            timestamp: new Date()
          });
          this.logger.warn(`Failed to store mapping: ${mapping.memory.title}`, error);
        }
      }

      // Phase 4: Update indexes
      progress.phase = 'indexing';
      await this.updateSearchIndexes();

      // Phase 5: Complete
      progress.phase = 'completed';
      progress.endTime = new Date();
      progress.itemsProcessed = mappings.length;

      const result: SyncResult = {
        success: true,
        itemsProcessed: mappings.length,
        itemsCreated,
        itemsUpdated,
        errors: progress.errors.map(e => ({ item: e.item, error: e.error }))
      };

      // Update statistics
      await this.updateSyncStats(result, startTime, progress.endTime);

      this.logger.info('✓ M365 synchronization completed', result);
      return result;

    } catch (error) {
      progress.phase = 'error';
      progress.endTime = new Date();
      
      this.logger.error('M365 synchronization failed', error);
      
      return {
        success: false,
        itemsProcessed: progress.itemsProcessed,
        itemsCreated: 0,
        itemsUpdated: 0,
        errors: [
          ...progress.errors.map(e => ({ item: e.item, error: e.error })),
          { item: 'sync-engine', error: error instanceof Error ? error.message : 'Unknown error' }
        ]
      };

    } finally {
      this.syncInProgress = false;
    }
  }

  /**
   * Store a mapped M365 item in the database
   */
  private async storeMapping(mapping: M365EntityMapping): Promise<{ created: boolean; updated: boolean }> {
    if (!this.databaseManager) {
      throw new Error('Database manager not available');
    }

    try {
      // Check if memory already exists (by M365 ID)
      const existingMemory = await this.findExistingMemory(mapping);
      
      let memoryId: string;
      let created = false;
      let updated = false;

      if (existingMemory) {
        // Update existing memory
        if (this.shouldUpdateMemory(existingMemory, mapping)) {
          const updatedMemory = await this.databaseManager.updateMemory(
            existingMemory.id,
            {
              title: mapping.memory.title,
              content: mapping.memory.content,
              tags: mapping.memory.tags,
              metadata: mapping.memory.metadata
            }
          );
          memoryId = updatedMemory!.id;
          updated = true;
        } else {
          memoryId = existingMemory.id;
        }
      } else {
        // Create new memory
        const newMemory = await this.databaseManager.createMemory(mapping.memory);
        memoryId = newMemory.id;
        created = true;
      }

      // Store entities and relationships
      for (const entity of mapping.entities) {
        await this.databaseManager.createEntity({
          ...entity,
          properties: {
            ...entity.properties,
            memoryId
          }
        });
      }

      for (const relationship of mapping.relationships) {
        await this.databaseManager.createRelationship(relationship);
      }

      return { created, updated };

    } catch (error) {
      this.logger.error(`Failed to store mapping for ${mapping.memory.title}`, error);
      throw error;
    }
  }

  /**
   * Find existing memory by M365 ID
   */
  private async findExistingMemory(mapping: M365EntityMapping): Promise<any | null> {
    if (!this.databaseManager) return null;

    try {
      // Search for memory with matching M365 ID
      const m365Id = mapping.memory.metadata?.m365?.id;
      if (!m365Id) return null;

      const searchResults = await this.databaseManager.searchMemories(
        `metadata.m365.id:${m365Id}`,
        { limit: 1 }
      );

      return searchResults.length > 0 ? searchResults[0].memory : null;

    } catch (error) {
      this.logger.warn('Failed to find existing memory', error);
      return null;
    }
  }

  /**
   * Determine if memory should be updated
   */
  private shouldUpdateMemory(existingMemory: any, mapping: M365EntityMapping): boolean {
    // Update if M365 content has been modified more recently
    const existingModified = existingMemory.metadata?.m365?.lastModified;
    const newModified = mapping.memory.metadata?.m365?.lastModified;

    if (!existingModified || !newModified) {
      return true; // Update if we don't have timestamp data
    }

    return new Date(newModified) > new Date(existingModified);
  }

  /**
   * Update search indexes after sync
   */
  private async updateSearchIndexes(): Promise<void> {
    try {
      // The hybrid database manager handles indexing automatically
      this.logger.debug('Search indexes updated automatically');
    } catch (error) {
      this.logger.warn('Failed to update search indexes', error);
    }
  }

  /**
   * Get the timestamp of the last successful sync
   */
  private getLastSyncTime(): Date {
    return this.syncStats.lastSync;
  }

  /**
   * Load sync statistics from storage
   */
  private async loadSyncStats(): Promise<void> {
    try {
      // In a real implementation, this would load from persistent storage
      // For now, use defaults
      this.logger.debug('Loaded sync statistics');
    } catch (error) {
      this.logger.warn('Failed to load sync statistics', error);
    }
  }

  /**
   * Update sync statistics after completion
   */
  private async updateSyncStats(result: SyncResult, startTime: Date, endTime: Date): Promise<void> {
    try {
      const syncDuration = endTime.getTime() - startTime.getTime();
      
      this.syncStats = {
        lastSync: endTime,
        totalItems: this.syncStats.totalItems + result.itemsProcessed,
        itemsByType: this.syncStats.itemsByType, // TODO: Update by type
        successRate: result.errors.length === 0 ? 1.0 : 
          (result.itemsProcessed - result.errors.length) / result.itemsProcessed,
        averageSyncTime: syncDuration,
        lastErrors: result.errors.slice(-10).map(e => ({
          error: e.error,
          timestamp: endTime
        }))
      };

      this.logger.debug('Updated sync statistics', this.syncStats);

    } catch (error) {
      this.logger.warn('Failed to update sync statistics', error);
    }
  }

  /**
   * Get current synchronization configuration
   */
  getSyncConfiguration(): SyncConfiguration {
    return { ...this.syncConfiguration };
  }

  /**
   * Update synchronization configuration
   */
  updateSyncConfiguration(config: Partial<SyncConfiguration>): void {
    this.syncConfiguration = {
      ...this.syncConfiguration,
      ...config
    };
    this.logger.info('Sync configuration updated', this.syncConfiguration);
  }

  /**
   * Get synchronization statistics
   */
  getSyncStats(): SyncStats {
    return { ...this.syncStats };
  }

  /**
   * Check if sync is currently in progress
   */
  isSyncInProgress(): boolean {
    return this.syncInProgress;
  }

  /**
   * Perform incremental sync (only changed items since last sync)
   */
  async performIncrementalSync(): Promise<SyncResult> {
    return this.performSync({
      since: this.getLastSyncTime(),
      maxItems: this.syncConfiguration.maxItemsPerSync
    });
  }
}

// Export singleton instance
export const m365SyncEngine = new M365SyncEngine();