import { m365GraphClient } from './m365-graph-client';
import { createLogger } from '../utils/logger';

/**
 * SharePoint Document Intelligence Service
 * Comprehensive SharePoint integration for document, site, and list processing
 */

export interface SharePointSite {
  id: string;
  displayName: string;
  description?: string;
  webUrl: string;
  createdDateTime: string;
  lastModifiedDateTime: string;
  siteCollection?: {
    hostname: string;
    dataLocationCode: string;
  };
  metadata: {
    template?: string;
    classification?: string;
    sensitivity?: string;
    hubSiteId?: string;
  };
}

export interface SharePointList {
  id: string;
  displayName: string;
  description?: string;
  webUrl: string;
  createdDateTime: string;
  lastModifiedDateTime: string;
  siteId: string;
  listType: 'documentLibrary' | 'genericList' | 'survey' | 'links' | 'announcements' | 'contacts' | 'events' | 'tasks' | 'discussionBoard' | 'pictureLibrary' | 'dataSources' | 'webTemplateCatalog' | 'userInformation' | 'workflowProcess' | 'webPartCatalog' | 'customGrid' | 'solutionCatalog' | 'noCodeWorkflows' | 'personalDocuments' | 'unknown';
  templateTypeKind: number;
  metadata: {
    itemCount: number;
    contentTypesEnabled: boolean;
    versioningEnabled: boolean;
    majorVersionLimit?: number;
    minorVersionLimit?: number;
  };
}

export interface SharePointDocument {
  id: string;
  name: string;
  webUrl: string;
  createdDateTime: string;
  lastModifiedDateTime: string;
  size: number;
  siteId: string;
  listId?: string;
  createdBy: {
    user: {
      displayName: string;
      email: string;
    };
  };
  lastModifiedBy: {
    user: {
      displayName: string;
      email: string;
    };
  };
  file?: {
    mimeType: string;
    processingMetadata?: boolean;
  };
  parentReference: {
    driveId: string;
    driveType: string;
    path: string;
  };
  content?: string; // Extracted content for supported file types
  metadata: {
    fileType: string;
    extension: string;
    contentType?: string;
    classification?: string;
    sensitivity?: string;
    version?: string;
    checkoutUser?: string;
    approvalStatus?: string;
    tags?: string[];
  };
}

export interface SharePointListItem {
  id: string;
  createdDateTime: string;
  lastModifiedDateTime: string;
  webUrl: string;
  createdBy: {
    user: {
      displayName: string;
      email: string;
    };
  };
  lastModifiedBy: {
    user: {
      displayName: string;
      email: string;
    };
  };
  siteId: string;
  listId: string;
  fields: Record<string, any>;
  contentType?: {
    id: string;
    name: string;
  };
}

export interface SharePointSearchResult {
  hitId: string;
  rank: number;
  summary: string;
  resource: {
    '@odata.type': string;
    id: string;
    webUrl: string;
    name?: string;
    title?: string;
    created?: string;
    lastModified?: string;
    author?: string;
    size?: number;
  };
}

export interface SharePointPermissions {
  canRead: boolean;
  canWrite: boolean;
  canDelete: boolean;
  canShare: boolean;
  roles: string[];
  inheritedFrom?: string;
  grantedToIdentities?: Array<{
    displayName: string;
    id: string;
    type: 'user' | 'group';
  }>;
}

export class SharePointService {
  private logger = createLogger('SharePointService');

  constructor() {
    this.logger.info('SharePoint service initialized');
  }

  /**
   * Get all accessible SharePoint sites
   */
  async getSites(limit: number = 50): Promise<SharePointSite[]> {
    try {
      this.logger.info('Fetching SharePoint sites', { limit });

      const client = m365GraphClient.getClient();
      if (!client) {
        throw new Error('Graph client not available');
      }

      const response = await client
        .api('/sites')
        .select('id,displayName,description,webUrl,createdDateTime,lastModifiedDateTime,siteCollection')
        .top(limit)
        .get();

      const sites: SharePointSite[] = response.value.map((site: any) => ({
        id: site.id,
        displayName: site.displayName,
        description: site.description,
        webUrl: site.webUrl,
        createdDateTime: site.createdDateTime,
        lastModifiedDateTime: site.lastModifiedDateTime,
        siteCollection: site.siteCollection,
        metadata: {
          template: site.webTemplate,
          classification: site.classification,
          sensitivity: site.sensitivityLabelInfo?.displayName,
          hubSiteId: site.sharepointIds?.tenantId
        }
      }));

      this.logger.info(`✓ Retrieved ${sites.length} SharePoint sites`);
      return sites;

    } catch (error) {
      this.logger.error('Failed to fetch SharePoint sites', error);
      throw error;
    }
  }

  /**
   * Get specific site details with enhanced metadata
   */
  async getSiteDetails(siteId: string): Promise<SharePointSite | null> {
    try {
      this.logger.debug('Fetching site details', { siteId });

      const client = m365GraphClient.getClient();
      if (!client) {
        throw new Error('Graph client not available');
      }

      const site = await client
        .api(`/sites/${siteId}`)
        .select('id,displayName,description,webUrl,createdDateTime,lastModifiedDateTime,siteCollection,webTemplate,classification,sensitivityLabelInfo')
        .get();

      return {
        id: site.id,
        displayName: site.displayName,
        description: site.description,
        webUrl: site.webUrl,
        createdDateTime: site.createdDateTime,
        lastModifiedDateTime: site.lastModifiedDateTime,
        siteCollection: site.siteCollection,
        metadata: {
          template: site.webTemplate,
          classification: site.classification,
          sensitivity: site.sensitivityLabelInfo?.displayName,
          hubSiteId: site.sharepointIds?.tenantId
        }
      };

    } catch (error) {
      this.logger.error('Failed to fetch site details', error);
      return null;
    }
  }

  /**
   * Get lists from a SharePoint site
   */
  async getSiteLists(siteId: string, includeHidden: boolean = false): Promise<SharePointList[]> {
    try {
      this.logger.debug('Fetching site lists', { siteId, includeHidden });

      const client = m365GraphClient.getClient();
      if (!client) {
        throw new Error('Graph client not available');
      }

      let query = client
        .api(`/sites/${siteId}/lists`)
        .select('id,displayName,description,webUrl,createdDateTime,lastModifiedDateTime,list,contentTypesEnabled,versioningEnabled,majorVersionLimit,minorVersionLimit');

      if (!includeHidden) {
        query = query.filter('hidden eq false');
      }

      const response = await query.get();

      const lists: SharePointList[] = response.value.map((list: any) => ({
        id: list.id,
        displayName: list.displayName,
        description: list.description,
        webUrl: list.webUrl,
        createdDateTime: list.createdDateTime,
        lastModifiedDateTime: list.lastModifiedDateTime,
        siteId: siteId,
        listType: this.mapListTemplate(list.list?.template),
        templateTypeKind: list.list?.template || 0,
        metadata: {
          itemCount: list.list?.itemCount || 0,
          contentTypesEnabled: list.contentTypesEnabled || false,
          versioningEnabled: list.versioningEnabled || false,
          majorVersionLimit: list.majorVersionLimit,
          minorVersionLimit: list.minorVersionLimit
        }
      }));

      this.logger.debug(`✓ Retrieved ${lists.length} lists from site`);
      return lists;

    } catch (error) {
      this.logger.error('Failed to fetch site lists', error);
      throw error;
    }
  }

  /**
   * Get documents from a SharePoint document library
   */
  async getDocuments(siteId: string, driveId?: string, folderId?: string, limit: number = 100): Promise<SharePointDocument[]> {
    try {
      this.logger.debug('Fetching SharePoint documents', { siteId, driveId, folderId, limit });

      const client = m365GraphClient.getClient();
      if (!client) {
        throw new Error('Graph client not available');
      }

      let apiPath: string;
      if (driveId && folderId) {
        apiPath = `/sites/${siteId}/drives/${driveId}/items/${folderId}/children`;
      } else if (driveId) {
        apiPath = `/sites/${siteId}/drives/${driveId}/root/children`;
      } else {
        // Get default document library
        apiPath = `/sites/${siteId}/drive/root/children`;
      }

      const response = await client
        .api(apiPath)
        .select('id,name,webUrl,createdDateTime,lastModifiedDateTime,size,createdBy,lastModifiedBy,file,parentReference,@microsoft.graph.downloadUrl')
        .filter('file ne null') // Only get files, not folders
        .top(limit)
        .get();

      const documents: SharePointDocument[] = await Promise.all(
        response.value.map(async (item: any) => {
          const doc: SharePointDocument = {
            id: item.id,
            name: item.name,
            webUrl: item.webUrl,
            createdDateTime: item.createdDateTime,
            lastModifiedDateTime: item.lastModifiedDateTime,
            size: item.size || 0,
            siteId: siteId,
            createdBy: item.createdBy,
            lastModifiedBy: item.lastModifiedBy,
            file: item.file,
            parentReference: item.parentReference,
            metadata: {
              fileType: this.getFileType(item.name),
              extension: this.getFileExtension(item.name),
              contentType: item.file?.mimeType,
              version: item.file?.processingMetadata ? 'processed' : 'raw'
            }
          };

          // Try to extract text content for supported file types
          if (this.isTextExtractable(doc.metadata.extension)) {
            try {
              doc.content = await this.extractDocumentContent(item['@microsoft.graph.downloadUrl'], doc.metadata.extension);
            } catch (error) {
              this.logger.debug(`Failed to extract content from ${item.name}`, error);
            }
          }

          return doc;
        })
      );

      this.logger.debug(`✓ Retrieved ${documents.length} documents`);
      return documents;

    } catch (error) {
      this.logger.error('Failed to fetch SharePoint documents', error);
      throw error;
    }
  }

  /**
   * Get list items from a SharePoint list
   */
  async getListItems(siteId: string, listId: string, limit: number = 100): Promise<SharePointListItem[]> {
    try {
      this.logger.debug('Fetching list items', { siteId, listId, limit });

      const client = m365GraphClient.getClient();
      if (!client) {
        throw new Error('Graph client not available');
      }

      const response = await client
        .api(`/sites/${siteId}/lists/${listId}/items`)
        .select('id,createdDateTime,lastModifiedDateTime,webUrl,createdBy,lastModifiedBy,fields,contentType')
        .expand('fields')
        .top(limit)
        .get();

      const items: SharePointListItem[] = response.value.map((item: any) => ({
        id: item.id,
        createdDateTime: item.createdDateTime,
        lastModifiedDateTime: item.lastModifiedDateTime,
        webUrl: item.webUrl,
        createdBy: item.createdBy,
        lastModifiedBy: item.lastModifiedBy,
        siteId: siteId,
        listId: listId,
        fields: item.fields || {},
        contentType: item.contentType
      }));

      this.logger.debug(`✓ Retrieved ${items.length} list items`);
      return items;

    } catch (error) {
      this.logger.error('Failed to fetch list items', error);
      throw error;
    }
  }

  /**
   * Search SharePoint content across sites
   */
  async searchContent(query: string, siteIds?: string[], fileTypes?: string[]): Promise<SharePointSearchResult[]> {
    try {
      this.logger.debug('Searching SharePoint content', { query, siteIds, fileTypes });

      const client = m365GraphClient.getClient();
      if (!client) {
        throw new Error('Graph client not available');
      }

      let searchQuery = query;
      
      // Add site restrictions
      if (siteIds && siteIds.length > 0) {
        const siteFilter = siteIds.map(id => `site:${id}`).join(' OR ');
        searchQuery += ` AND (${siteFilter})`;
      }

      // Add file type restrictions
      if (fileTypes && fileTypes.length > 0) {
        const typeFilter = fileTypes.map(type => `filetype:${type}`).join(' OR ');
        searchQuery += ` AND (${typeFilter})`;
      }

      const searchRequest = {
        requests: [{
          entityTypes: ['site', 'drive', 'driveItem', 'list', 'listItem'],
          query: {
            queryString: searchQuery
          },
          from: 0,
          size: 50
        }]
      };

      const response = await client
        .api('/search/query')
        .post(searchRequest);

      const results: SharePointSearchResult[] = [];
      
      if (response.value && response.value[0] && response.value[0].hitsContainers) {
        const hits = response.value[0].hitsContainers[0].hits || [];
        
        results.push(...hits.map((hit: any) => ({
          hitId: hit.hitId,
          rank: hit.rank,
          summary: hit.summary,
          resource: hit.resource
        })));
      }

      this.logger.debug(`✓ Found ${results.length} search results`);
      return results;

    } catch (error) {
      this.logger.error('Failed to search SharePoint content', error);
      throw error;
    }
  }

  /**
   * Get permissions for a SharePoint item
   */
  async getItemPermissions(siteId: string, itemId: string, itemType: 'site' | 'list' | 'driveItem'): Promise<SharePointPermissions> {
    try {
      this.logger.debug('Fetching item permissions', { siteId, itemId, itemType });

      const client = m365GraphClient.getClient();
      if (!client) {
        throw new Error('Graph client not available');
      }

      let apiPath: string;
      switch (itemType) {
        case 'site':
          apiPath = `/sites/${siteId}/permissions`;
          break;
        case 'list':
          apiPath = `/sites/${siteId}/lists/${itemId}/permissions`;
          break;
        case 'driveItem':
          apiPath = `/sites/${siteId}/drive/items/${itemId}/permissions`;
          break;
        default:
          throw new Error(`Unsupported item type: ${itemType}`);
      }

      const response = await client
        .api(apiPath)
        .get();

      const permissions: SharePointPermissions = {
        canRead: true, // If we can call this API, we have read access
        canWrite: false,
        canDelete: false,
        canShare: false,
        roles: [],
        grantedToIdentities: []
      };

      // Analyze permissions from response
      if (response.value) {
        response.value.forEach((permission: any) => {
          if (permission.roles) {
            permissions.roles.push(...permission.roles);
            
            // Determine capabilities based on roles
            if (permission.roles.includes('write') || permission.roles.includes('owner')) {
              permissions.canWrite = true;
            }
            if (permission.roles.includes('owner')) {
              permissions.canDelete = true;
              permissions.canShare = true;
            }
          }

          if (permission.grantedToV2) {
            permissions.grantedToIdentities?.push({
              displayName: permission.grantedToV2.user?.displayName || permission.grantedToV2.group?.displayName || 'Unknown',
              id: permission.grantedToV2.user?.id || permission.grantedToV2.group?.id || 'unknown',
              type: permission.grantedToV2.user ? 'user' : 'group'
            });
          }
        });
      }

      this.logger.debug('✓ Retrieved item permissions', permissions);
      return permissions;

    } catch (error) {
      this.logger.warn('Failed to fetch item permissions', error);
      // Return minimal permissions if we can't get detailed info
      return {
        canRead: true,
        canWrite: false,
        canDelete: false,
        canShare: false,
        roles: ['read']
      };
    }
  }

  /**
   * Get comprehensive site analytics and usage data
   */
  async getSiteAnalytics(siteId: string, period: 'D7' | 'D30' | 'D90' | 'D180' = 'D30'): Promise<any> {
    try {
      this.logger.debug('Fetching site analytics', { siteId, period });

      const client = m365GraphClient.getClient();
      if (!client) {
        throw new Error('Graph client not available');
      }

      const response = await client
        .api(`/sites/${siteId}/analytics/allTime`)
        .get();

      this.logger.debug('✓ Retrieved site analytics');
      return response;

    } catch (error) {
      this.logger.debug('Site analytics not available', error);
      return null;
    }
  }

  /**
   * Extract text content from supported document types
   */
  private async extractDocumentContent(downloadUrl: string, extension: string): Promise<string | undefined> {
    try {
      if (!this.isTextExtractable(extension)) {
        return undefined;
      }

      // For plain text files, try to download and extract content
      if (['txt', 'md', 'csv', 'json', 'xml', 'html', 'htm'].includes(extension.toLowerCase())) {
        try {
          const response = await fetch(downloadUrl);
          if (response.ok) {
            const content = await response.text();
            return content.substring(0, 10000); // Limit to 10KB to prevent memory issues
          }
        } catch (downloadError) {
          this.logger.debug('Failed to download text file content', downloadError);
        }
      }

      // For other document types, provide basic content extraction
      // Note: Full text extraction would require specialized libraries
      switch (extension.toLowerCase()) {
        case 'docx':
        case 'doc':
          return `Microsoft Word document (${extension.toUpperCase()}). Contains rich text content that requires specialized parsing for full text extraction.`;
        case 'pdf':
          return `PDF document. Contains formatted text and potentially images that require specialized parsing for full text extraction.`;
        case 'xlsx':
        case 'xls':
          return `Microsoft Excel spreadsheet (${extension.toUpperCase()}). Contains tabular data and formulas that require specialized parsing for full content extraction.`;
        case 'pptx':
        case 'ppt':
          return `Microsoft PowerPoint presentation (${extension.toUpperCase()}). Contains slides with text and media that require specialized parsing for full content extraction.`;
        default:
          return `${extension.toUpperCase()} document. Text extraction not yet implemented for this file type.`;
      }

    } catch (error) {
      this.logger.debug('Failed to extract document content', error);
      return undefined;
    }
  }

  /**
   * Check if file type supports text extraction
   */
  private isTextExtractable(extension: string): boolean {
    const textExtractableTypes = [
      'txt', 'md', 'csv', 'json', 'xml', 'html', 'htm',
      'doc', 'docx', 'pdf', 'ppt', 'pptx', 'xls', 'xlsx'
    ];
    return textExtractableTypes.includes(extension.toLowerCase());
  }

  /**
   * Map SharePoint list template to friendly name
   */
  private mapListTemplate(template: number): SharePointList['listType'] {
    const templateMap: Record<number, SharePointList['listType']> = {
      100: 'genericList',
      101: 'documentLibrary',
      102: 'survey',
      103: 'links',
      104: 'announcements',
      105: 'contacts',
      106: 'events',
      107: 'tasks',
      108: 'discussionBoard',
      109: 'pictureLibrary',
      110: 'dataSources',
      111: 'webTemplateCatalog',
      112: 'userInformation',
      113: 'webPartCatalog',
      115: 'customGrid',
      116: 'solutionCatalog',
      117: 'noCodeWorkflows',
      119: 'personalDocuments'
    };

    return templateMap[template] || 'unknown';
  }

  /**
   * Get file type from filename
   */
  private getFileType(filename: string): string {
    const extension = this.getFileExtension(filename);
    
    const typeMap: Record<string, string> = {
      'doc': 'document', 'docx': 'document', 'pdf': 'document', 'txt': 'document',
      'xls': 'spreadsheet', 'xlsx': 'spreadsheet', 'csv': 'spreadsheet',
      'ppt': 'presentation', 'pptx': 'presentation',
      'jpg': 'image', 'jpeg': 'image', 'png': 'image', 'gif': 'image', 'bmp': 'image',
      'mp4': 'video', 'avi': 'video', 'mov': 'video', 'wmv': 'video',
      'mp3': 'audio', 'wav': 'audio', 'wma': 'audio',
      'zip': 'archive', 'rar': 'archive', '7z': 'archive',
      'html': 'web', 'htm': 'web', 'css': 'web', 'js': 'web',
      'xml': 'data', 'json': 'data'
    };

    return typeMap[extension.toLowerCase()] || 'file';
  }

  /**
   * Extract file extension from filename
   */
  private getFileExtension(filename: string): string {
    const lastDot = filename.lastIndexOf('.');
    return lastDot > 0 ? filename.substring(lastDot + 1) : '';
  }

  /**
   * Check if service is ready
   */
  isReady(): boolean {
    return m365GraphClient.isReady();
  }
}

// Export singleton instance
export const sharepointService = new SharePointService();