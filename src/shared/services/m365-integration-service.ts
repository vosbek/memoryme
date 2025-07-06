import { m365GraphClient } from './m365-graph-client';
import { m365AuthService } from './m365-auth';
import { sharepointService, SharePointSite, SharePointDocument, SharePointList } from './sharepoint-service';
import { createLogger } from '../utils/logger';

/**
 * Unified Microsoft 365 Integration Service
 * Provides high-level operations for M365 data integration with DevMemory
 */

export interface M365Content {
  id: string;
  type: 'email' | 'event' | 'file' | 'team' | 'site' | 'message' | 'document' | 'list' | 'listItem';
  title: string;
  content: string;
  metadata: {
    source: string;
    lastModified: Date;
    author?: string;
    participants?: string[];
    url?: string;
    parentId?: string;
    tags?: string[];
    siteId?: string;
    listId?: string;
    fileSize?: number;
    fileType?: string;
    itemCount?: number;
  };
  permissions?: {
    canRead: boolean;
    canWrite: boolean;
    canDelete?: boolean;
    canShare?: boolean;
    sensitivity?: string;
  };
}

export interface SyncOptions {
  includeTypes?: M365Content['type'][];
  maxItems?: number;
  since?: Date;
  includeArchived?: boolean;
  siteIds?: string[];
  includeDocuments?: boolean;
  includeLists?: boolean;
  includeListItems?: boolean;
  documentTypes?: string[];
}

export interface SyncResult {
  success: boolean;
  itemsProcessed: number;
  itemsUpdated: number;
  itemsCreated: number;
  errors: Array<{
    item: string;
    error: string;
  }>;
  nextSyncToken?: string;
}

export class M365IntegrationService {
  private logger = createLogger('M365IntegrationService');
  private isInitialized = false;

  constructor() {
    this.logger.info('M365 Integration Service created');
  }

  /**
   * Initialize the integration service
   */
  async initialize(): Promise<void> {
    try {
      this.logger.info('Initializing M365 Integration Service');

      // Ensure authentication service is ready
      if (!m365AuthService.isReady()) {
        await m365AuthService.initialize();
      }

      // Ensure Graph client is ready
      if (!m365GraphClient.isReady()) {
        await m365GraphClient.initialize();
      }

      // Verify connectivity
      const connectionTest = await m365GraphClient.testConnection();
      if (!connectionTest.success) {
        throw new Error(`M365 connectivity test failed: ${connectionTest.error}`);
      }

      this.isInitialized = true;
      this.logger.info('✓ M365 Integration Service initialized successfully');

    } catch (error) {
      this.logger.error('Failed to initialize M365 Integration Service', error);
      throw error;
    }
  }

  /**
   * Check if service is ready for operations
   */
  isReady(): boolean {
    return this.isInitialized && m365AuthService.isReady() && m365GraphClient.isReady();
  }

  /**
   * Get comprehensive M365 content for synchronization
   */
  async getAllContent(options: SyncOptions = {}): Promise<M365Content[]> {
    if (!this.isReady()) {
      throw new Error('M365 Integration Service not initialized');
    }

    try {
      this.logger.info('Fetching M365 content', options);

      const content: M365Content[] = [];
      const includeTypes = options.includeTypes || ['email', 'event', 'file', 'team', 'site', 'document', 'list'];
      const maxItemsPerType = Math.floor((options.maxItems || 100) / includeTypes.length);

      // Fetch emails
      if (includeTypes.includes('email')) {
        const emails = await this.getEmailContent(maxItemsPerType);
        content.push(...emails);
      }

      // Fetch calendar events
      if (includeTypes.includes('event')) {
        const events = await this.getCalendarContent(maxItemsPerType);
        content.push(...events);
      }

      // Fetch files
      if (includeTypes.includes('file')) {
        const files = await this.getFileContent(maxItemsPerType);
        content.push(...files);
      }

      // Fetch teams
      if (includeTypes.includes('team')) {
        const teams = await this.getTeamsContent(maxItemsPerType);
        content.push(...teams);
      }

      // Fetch SharePoint sites
      if (includeTypes.includes('site')) {
        const sites = await this.getSharePointSitesContent(maxItemsPerType, options.siteIds);
        content.push(...sites);
      }

      // Fetch SharePoint documents
      if (includeTypes.includes('document') || options.includeDocuments) {
        const documents = await this.getSharePointDocumentsContent(maxItemsPerType, options);
        content.push(...documents);
      }

      // Fetch SharePoint lists
      if (includeTypes.includes('list') || options.includeLists) {
        const lists = await this.getSharePointListsContent(maxItemsPerType, options.siteIds);
        content.push(...lists);
      }

      // Fetch SharePoint list items
      if (includeTypes.includes('listItem') || options.includeListItems) {
        const listItems = await this.getSharePointListItemsContent(maxItemsPerType, options.siteIds);
        content.push(...listItems);
      }

      this.logger.info(`✓ Retrieved ${content.length} M365 items`);
      return content;

    } catch (error) {
      this.logger.error('Failed to get M365 content', error);
      throw error;
    }
  }

  /**
   * Transform email messages to M365Content format
   */
  private async getEmailContent(limit: number): Promise<M365Content[]> {
    try {
      const emails = await m365GraphClient.getRecentEmails(limit);
      
      return emails.map(email => ({
        id: email.id,
        type: 'email' as const,
        title: email.subject || 'No Subject',
        content: this.extractTextContent(email.body?.content || ''),
        metadata: {
          source: 'outlook',
          lastModified: new Date(email.receivedDateTime),
          author: email.from?.emailAddress?.address,
          participants: [
            ...(email.toRecipients || []).map((r: any) => r.emailAddress?.address),
            ...(email.ccRecipients || []).map((r: any) => r.emailAddress?.address)
          ].filter(Boolean),
          tags: ['email', email.importance?.toLowerCase()].filter(Boolean)
        },
        permissions: {
          canRead: true,
          canWrite: false,
          sensitivity: email.sensitivity
        }
      }));

    } catch (error) {
      this.logger.warn('Failed to fetch email content', error);
      return [];
    }
  }

  /**
   * Transform calendar events to M365Content format
   */
  private async getCalendarContent(limit: number): Promise<M365Content[]> {
    try {
      const events = await m365GraphClient.getRecentEvents(limit);
      
      return events.map(event => ({
        id: event.id,
        type: 'event' as const,
        title: event.subject || 'No Title',
        content: this.extractTextContent(event.body?.content || ''),
        metadata: {
          source: 'calendar',
          lastModified: new Date(event.lastModifiedDateTime || event.createdDateTime),
          author: event.organizer?.emailAddress?.address,
          participants: (event.attendees || []).map((a: any) => a.emailAddress?.address).filter(Boolean),
          url: event.webLink,
          tags: ['meeting', 'calendar', event.importance?.toLowerCase()].filter(Boolean)
        },
        permissions: {
          canRead: true,
          canWrite: false
        }
      }));

    } catch (error) {
      this.logger.warn('Failed to fetch calendar content', error);
      return [];
    }
  }

  /**
   * Transform OneDrive files to M365Content format
   */
  private async getFileContent(limit: number): Promise<M365Content[]> {
    try {
      this.logger.debug('Fetching OneDrive files', { limit });
      
      // Get recent files from OneDrive
      const files = await m365GraphClient.getRecentFiles(limit);
      
      return files.map(file => ({
        id: file.id,
        type: 'file' as const,
        title: file.name || 'Unnamed File',
        content: file.description || `OneDrive file: ${file.name}. Size: ${this.formatFileSize(file.size || 0)}`,
        metadata: {
          source: 'onedrive',
          lastModified: file.lastModifiedDateTime ? new Date(file.lastModifiedDateTime) : new Date(),
          author: file.lastModifiedBy?.user?.displayName || 'Unknown',
          onedrive: {
            id: file.id,
            name: file.name,
            size: file.size,
            mimeType: file.mimeType,
            webUrl: file.webUrl,
            downloadUrl: file['@microsoft.graph.downloadUrl'],
            lastModifiedBy: file.lastModifiedBy,
            createdBy: file.createdBy,
            parentReference: file.parentReference
          }
        }
      }));

    } catch (error) {
      this.logger.warn('Failed to fetch OneDrive files', error);
      return [];
    }
  }

  /**
   * Transform Teams data to M365Content format
   */
  private async getTeamsContent(limit: number): Promise<M365Content[]> {
    try {
      const teams = await m365GraphClient.getTeams();
      
      return teams.slice(0, limit).map(team => ({
        id: team.id,
        type: 'team' as const,
        title: team.displayName || 'Unnamed Team',
        content: team.description || '',
        metadata: {
          source: 'teams',
          lastModified: new Date(), // Teams API doesn't provide lastModified
          url: team.webUrl,
          tags: ['team', 'collaboration']
        },
        permissions: {
          canRead: true,
          canWrite: false
        }
      }));

    } catch (error) {
      this.logger.warn('Failed to fetch teams content', error);
      return [];
    }
  }

  /**
   * Transform SharePoint sites to M365Content format
   */
  private async getSharePointSitesContent(limit: number, siteIds?: string[]): Promise<M365Content[]> {
    try {
      let sites: SharePointSite[];
      
      if (siteIds && siteIds.length > 0) {
        // Get specific sites
        sites = [];
        for (const siteId of siteIds.slice(0, limit)) {
          const site = await sharepointService.getSiteDetails(siteId);
          if (site) sites.push(site);
        }
      } else {
        // Get all accessible sites
        sites = await sharepointService.getSites(limit);
      }
      
      return sites.map(site => ({
        id: site.id,
        type: 'site' as const,
        title: site.displayName || 'Unnamed Site',
        content: site.description || `SharePoint site: ${site.displayName}`,
        metadata: {
          source: 'sharepoint',
          lastModified: new Date(site.lastModifiedDateTime),
          url: site.webUrl,
          tags: ['sharepoint', 'site', 'collaboration', ...(site.metadata.classification ? [site.metadata.classification] : [])]
        },
        permissions: {
          canRead: true,
          canWrite: false
        }
      }));

    } catch (error) {
      this.logger.warn('Failed to fetch SharePoint sites', error);
      return [];
    }
  }

  /**
   * Transform SharePoint documents to M365Content format
   */
  private async getSharePointDocumentsContent(limit: number, options: SyncOptions): Promise<M365Content[]> {
    try {
      const documents: M365Content[] = [];
      let sitesToProcess: SharePointSite[];

      if (options.siteIds && options.siteIds.length > 0) {
        // Get specific sites
        sitesToProcess = [];
        for (const siteId of options.siteIds) {
          const site = await sharepointService.getSiteDetails(siteId);
          if (site) sitesToProcess.push(site);
        }
      } else {
        // Get top sites
        sitesToProcess = await sharepointService.getSites(10);
      }

      const docsPerSite = Math.ceil(limit / Math.max(sitesToProcess.length, 1));

      for (const site of sitesToProcess) {
        try {
          const siteDocuments = await sharepointService.getDocuments(site.id, undefined, undefined, docsPerSite);
          
          for (const doc of siteDocuments) {
            // Filter by document types if specified
            if (options.documentTypes && options.documentTypes.length > 0) {
              if (!options.documentTypes.includes(doc.metadata.extension)) {
                continue;
              }
            }

            documents.push({
              id: doc.id,
              type: 'document' as const,
              title: `${doc.name} (${site.displayName})`,
              content: doc.content || `Document: ${doc.name}\nType: ${doc.metadata.fileType}\nSize: ${this.formatFileSize(doc.size)}`,
              metadata: {
                source: 'sharepoint',
                lastModified: new Date(doc.lastModifiedDateTime),
                author: doc.lastModifiedBy.user.displayName,
                url: doc.webUrl,
                siteId: site.id,
                fileSize: doc.size,
                fileType: doc.metadata.fileType,
                tags: ['sharepoint', 'document', doc.metadata.fileType, doc.metadata.extension]
              },
              permissions: {
                canRead: true,
                canWrite: false
              }
            });

            if (documents.length >= limit) break;
          }
          if (documents.length >= limit) break;
        } catch (error) {
          this.logger.debug(`Failed to get documents from site ${site.displayName}`, error);
        }
      }

      return documents;

    } catch (error) {
      this.logger.warn('Failed to fetch SharePoint documents', error);
      return [];
    }
  }

  /**
   * Transform SharePoint lists to M365Content format
   */
  private async getSharePointListsContent(limit: number, siteIds?: string[]): Promise<M365Content[]> {
    try {
      const lists: M365Content[] = [];
      let sitesToProcess: SharePointSite[];

      if (siteIds && siteIds.length > 0) {
        sitesToProcess = [];
        for (const siteId of siteIds) {
          const site = await sharepointService.getSiteDetails(siteId);
          if (site) sitesToProcess.push(site);
        }
      } else {
        sitesToProcess = await sharepointService.getSites(10);
      }

      const listsPerSite = Math.ceil(limit / Math.max(sitesToProcess.length, 1));

      for (const site of sitesToProcess) {
        try {
          const siteLists = await sharepointService.getSiteLists(site.id, false);
          
          for (const list of siteLists.slice(0, listsPerSite)) {
            lists.push({
              id: list.id,
              type: 'list' as const,
              title: `${list.displayName} (${site.displayName})`,
              content: list.description || `${list.listType} with ${list.metadata.itemCount} items`,
              metadata: {
                source: 'sharepoint',
                lastModified: new Date(list.lastModifiedDateTime),
                url: list.webUrl,
                siteId: site.id,
                itemCount: list.metadata.itemCount,
                tags: ['sharepoint', 'list', list.listType]
              },
              permissions: {
                canRead: true,
                canWrite: false
              }
            });

            if (lists.length >= limit) break;
          }
          if (lists.length >= limit) break;
        } catch (error) {
          this.logger.debug(`Failed to get lists from site ${site.displayName}`, error);
        }
      }

      return lists;

    } catch (error) {
      this.logger.warn('Failed to fetch SharePoint lists', error);
      return [];
    }
  }

  /**
   * Transform SharePoint list items to M365Content format
   */
  private async getSharePointListItemsContent(limit: number, siteIds?: string[]): Promise<M365Content[]> {
    try {
      const listItems: M365Content[] = [];
      let sitesToProcess: SharePointSite[];

      if (siteIds && siteIds.length > 0) {
        sitesToProcess = [];
        for (const siteId of siteIds) {
          const site = await sharepointService.getSiteDetails(siteId);
          if (site) sitesToProcess.push(site);
        }
      } else {
        sitesToProcess = await sharepointService.getSites(5); // Fewer sites for list items
      }

      const itemsPerSite = Math.ceil(limit / Math.max(sitesToProcess.length, 1));

      for (const site of sitesToProcess) {
        try {
          const siteLists = await sharepointService.getSiteLists(site.id, false);
          const itemsPerList = Math.ceil(itemsPerSite / Math.max(siteLists.length, 1));
          
          for (const list of siteLists) {
            try {
              const items = await sharepointService.getListItems(site.id, list.id, itemsPerList);
              
              for (const item of items) {
                const titleField = item.fields?.Title || item.fields?.Name || item.fields?.Subject || `Item ${item.id}`;
                
                listItems.push({
                  id: item.id,
                  type: 'listItem' as const,
                  title: `${titleField} (${list.displayName})`,
                  content: this.generateListItemContent(item),
                  metadata: {
                    source: 'sharepoint',
                    lastModified: new Date(item.lastModifiedDateTime),
                    author: item.lastModifiedBy.user.displayName,
                    url: item.webUrl,
                    siteId: site.id,
                    listId: list.id,
                    tags: ['sharepoint', 'listitem', list.listType]
                  },
                  permissions: {
                    canRead: true,
                    canWrite: false
                  }
                });

                if (listItems.length >= limit) break;
              }
              if (listItems.length >= limit) break;
            } catch (error) {
              this.logger.debug(`Failed to get items from list ${list.displayName}`, error);
            }
          }
          if (listItems.length >= limit) break;
        } catch (error) {
          this.logger.debug(`Failed to get lists from site ${site.displayName}`, error);
        }
      }

      return listItems;

    } catch (error) {
      this.logger.warn('Failed to fetch SharePoint list items', error);
      return [];
    }
  }

  /**
   * Generate content from list item fields
   */
  private generateListItemContent(item: any): string {
    const fields = item.fields || {};
    const fieldEntries = Object.entries(fields)
      .filter(([key, value]) => value != null && value !== '' && !key.startsWith('@'))
      .map(([key, value]) => `${key}: ${value}`)
      .join('\n');

    return fieldEntries || `SharePoint list item created on ${new Date(item.createdDateTime).toLocaleDateString()}`;
  }

  /**
   * Format file size for display
   */
  private formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Search across all M365 content
   */
  async searchContent(query: string, options: SyncOptions = {}): Promise<M365Content[]> {
    if (!this.isReady()) {
      throw new Error('M365 Integration Service not initialized');
    }

    try {
      this.logger.info('Searching M365 content', { query, options });

      const entityTypes = [];
      const includeTypes = options.includeTypes || ['email', 'event', 'file', 'team', 'site'];
      
      if (includeTypes.includes('email')) entityTypes.push('message');
      if (includeTypes.includes('event')) entityTypes.push('event');
      if (includeTypes.includes('file')) entityTypes.push('driveItem');
      if (includeTypes.includes('site')) entityTypes.push('site');

      const searchResults = await m365GraphClient.searchContent(query, entityTypes);
      
      // Transform search results to M365Content format
      const content: M365Content[] = searchResults.map(result => {
        const hit = result.hitId || result.resource;
        return {
          id: hit.id,
          type: this.mapEntityTypeToContentType(result.entityType),
          title: hit.subject || hit.name || hit.displayName || 'No Title',
          content: this.extractTextContent(hit.body?.content || hit.description || ''),
          metadata: {
            source: result.entityType,
            lastModified: new Date(hit.lastModifiedDateTime || hit.createdDateTime || Date.now()),
            author: hit.from?.emailAddress?.address || hit.createdBy?.user?.displayName,
            url: hit.webUrl || hit.webLink,
            tags: ['search', result.entityType]
          },
          permissions: {
            canRead: true,
            canWrite: false
          }
        };
      });

      this.logger.info(`✓ Search returned ${content.length} results`);
      return content;

    } catch (error) {
      this.logger.error('Failed to search M365 content', error);
      throw error;
    }
  }

  /**
   * Get user profile and organization context
   */
  async getUserContext(): Promise<{
    user: any;
    organization: any;
    permissions: any;
  }> {
    if (!this.isReady()) {
      throw new Error('M365 Integration Service not initialized');
    }

    try {
      const [userProfile, organization, connectionTest] = await Promise.all([
        m365GraphClient.getUserProfile(),
        m365GraphClient.getOrganization(),
        m365GraphClient.testConnection()
      ]);

      return {
        user: userProfile,
        organization,
        permissions: connectionTest.services
      };

    } catch (error) {
      this.logger.error('Failed to get user context', error);
      throw error;
    }
  }

  /**
   * Utility: Extract plain text from HTML content
   */
  private extractTextContent(html: string): string {
    if (!html) return '';
    
    // Basic HTML tag removal - in production, use a proper HTML parser
    return html
      .replace(/<[^>]*>/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Utility: Map Graph API entity types to content types
   */
  private mapEntityTypeToContentType(entityType: string): M365Content['type'] {
    switch (entityType) {
      case 'message': return 'email';
      case 'event': return 'event';
      case 'driveItem': return 'file';
      case 'site': return 'site';
      case 'chatMessage': return 'message';
      default: return 'file';
    }
  }
}

// Export singleton instance
export const m365IntegrationService = new M365IntegrationService();