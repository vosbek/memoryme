import { Memory, MemoryType } from '../types';
import { KnowledgeGraphEntity, KnowledgeGraphRelation } from '../database/knowledge-graph';
import { SharePointSite, SharePointDocument, SharePointList, SharePointListItem } from './sharepoint-service';
import { createLogger } from '../utils/logger';

/**
 * SharePoint Entity Mapper
 * Transforms SharePoint content into DevMemory entities and relationships
 */

export interface SharePointEntityMapping {
  memory: Omit<Memory, 'id' | 'createdAt' | 'updatedAt'>;
  entities: Array<Omit<KnowledgeGraphEntity, 'id' | 'createdAt' | 'updatedAt' | 'memoryIds' | 'observations' | 'confidence'>>;
  relationships: Array<{
    fromEntityName: string;
    toEntityName: string;
    type: string;
    properties: Record<string, any>;
  }>;
}

export interface SharePointEntityExtractionResult {
  sites: string[];
  documents: string[];
  authors: string[];
  technologies: string[];
  projects: string[];
  departments: string[];
  keywords: string[];
  fileTypes: string[];
}

export class SharePointEntityMapper {
  private logger = createLogger('SharePointEntityMapper');

  constructor() {
    this.logger.info('SharePoint Entity Mapper initialized');
  }

  /**
   * Map SharePoint site to DevMemory format
   */
  async mapSite(site: SharePointSite): Promise<SharePointEntityMapping> {
    try {
      this.logger.debug(`Mapping SharePoint site: ${site.displayName}`);

      const memory = this.createSiteMemory(site);
      const extractedEntities = this.extractSiteEntities(site);
      const entities = this.createSiteEntities(extractedEntities, site);
      const relationships = this.createSiteRelationships(entities, site);

      return {
        memory,
        entities,
        relationships
      };

    } catch (error) {
      this.logger.error(`Failed to map SharePoint site ${site.id}`, error);
      throw error;
    }
  }

  /**
   * Map SharePoint document to DevMemory format
   */
  async mapDocument(document: SharePointDocument, siteName?: string): Promise<SharePointEntityMapping> {
    try {
      this.logger.debug(`Mapping SharePoint document: ${document.name}`);

      const memory = this.createDocumentMemory(document, siteName);
      const extractedEntities = this.extractDocumentEntities(document);
      const entities = this.createDocumentEntities(extractedEntities, document);
      const relationships = this.createDocumentRelationships(entities, document);

      return {
        memory,
        entities,
        relationships
      };

    } catch (error) {
      this.logger.error(`Failed to map SharePoint document ${document.id}`, error);
      throw error;
    }
  }

  /**
   * Map SharePoint list to DevMemory format
   */
  async mapList(list: SharePointList, siteName?: string): Promise<SharePointEntityMapping> {
    try {
      this.logger.debug(`Mapping SharePoint list: ${list.displayName}`);

      const memory = this.createListMemory(list, siteName);
      const extractedEntities = this.extractListEntities(list);
      const entities = this.createListEntities(extractedEntities, list);
      const relationships = this.createListRelationships(entities, list);

      return {
        memory,
        entities,
        relationships
      };

    } catch (error) {
      this.logger.error(`Failed to map SharePoint list ${list.id}`, error);
      throw error;
    }
  }

  /**
   * Map SharePoint list item to DevMemory format
   */
  async mapListItem(item: SharePointListItem, listName?: string, siteName?: string): Promise<SharePointEntityMapping> {
    try {
      this.logger.debug(`Mapping SharePoint list item: ${item.id}`);

      const memory = this.createListItemMemory(item, listName, siteName);
      const extractedEntities = this.extractListItemEntities(item);
      const entities = this.createListItemEntities(extractedEntities, item);
      const relationships = this.createListItemRelationships(entities, item);

      return {
        memory,
        entities,
        relationships
      };

    } catch (error) {
      this.logger.error(`Failed to map SharePoint list item ${item.id}`, error);
      throw error;
    }
  }

  /**
   * Batch process multiple SharePoint items
   */
  async mapContentBatch(content: {
    sites?: SharePointSite[];
    documents?: { document: SharePointDocument; siteName?: string }[];
    lists?: { list: SharePointList; siteName?: string }[];
    listItems?: { item: SharePointListItem; listName?: string; siteName?: string }[];
  }): Promise<SharePointEntityMapping[]> {
    
    const results: SharePointEntityMapping[] = [];
    const errors: Array<{ type: string; id: string; error: string }> = [];

    // Process sites
    if (content.sites) {
      for (const site of content.sites) {
        try {
          const mapping = await this.mapSite(site);
          results.push(mapping);
        } catch (error) {
          errors.push({
            type: 'site',
            id: site.id,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }
    }

    // Process documents
    if (content.documents) {
      for (const { document, siteName } of content.documents) {
        try {
          const mapping = await this.mapDocument(document, siteName);
          results.push(mapping);
        } catch (error) {
          errors.push({
            type: 'document',
            id: document.id,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }
    }

    // Process lists
    if (content.lists) {
      for (const { list, siteName } of content.lists) {
        try {
          const mapping = await this.mapList(list, siteName);
          results.push(mapping);
        } catch (error) {
          errors.push({
            type: 'list',
            id: list.id,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }
    }

    // Process list items
    if (content.listItems) {
      for (const { item, listName, siteName } of content.listItems) {
        try {
          const mapping = await this.mapListItem(item, listName, siteName);
          results.push(mapping);
        } catch (error) {
          errors.push({
            type: 'listItem',
            id: item.id,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }
    }

    this.logger.info(`✓ Mapped ${results.length} SharePoint items, ${errors.length} errors`);
    if (errors.length > 0) {
      this.logger.warn('SharePoint mapping errors', errors);
    }

    return results;
  }

  /**
   * Create DevMemory Memory from SharePoint site
   */
  private createSiteMemory(site: SharePointSite): Omit<Memory, 'id' | 'createdAt' | 'updatedAt'> {
    return {
      title: `SharePoint Site: ${site.displayName}`,
      content: site.description || `SharePoint site at ${site.webUrl}`,
      type: MemoryType.LINK,
      tags: [
        'sharepoint-site',
        'collaboration',
        'enterprise',
        ...(site.metadata.template ? [`template-${site.metadata.template}`] : []),
        ...(site.metadata.classification ? [site.metadata.classification.toLowerCase()] : [])
      ],
      metadata: {
        sharepoint: {
          id: site.id,
          type: 'site',
          webUrl: site.webUrl,
          lastModified: site.lastModifiedDateTime,
          template: site.metadata.template,
          classification: site.metadata.classification,
          sensitivity: site.metadata.sensitivity,
          siteCollection: site.siteCollection
        }
      }
    };
  }

  /**
   * Create DevMemory Memory from SharePoint document
   */
  private createDocumentMemory(document: SharePointDocument, siteName?: string): Omit<Memory, 'id' | 'createdAt' | 'updatedAt'> {
    const title = siteName ? `${document.name} (${siteName})` : document.name;
    const content = document.content || `SharePoint document: ${document.name}\nSize: ${this.formatFileSize(document.size)}\nType: ${document.metadata.fileType}`;

    return {
      title,
      content,
      type: MemoryType.DOCUMENTATION,
      tags: [
        'sharepoint-document',
        document.metadata.fileType,
        document.metadata.extension,
        ...(siteName ? [`site-${this.slugify(siteName)}`] : []),
        ...(document.metadata.classification ? [document.metadata.classification.toLowerCase()] : [])
      ],
      metadata: {
        sharepoint: {
          id: document.id,
          type: 'document',
          webUrl: document.webUrl,
          lastModified: document.lastModifiedDateTime,
          siteId: document.siteId,
          size: document.size,
          fileType: document.metadata.fileType,
          extension: document.metadata.extension,
          mimeType: document.metadata.contentType,
          createdBy: document.createdBy,
          lastModifiedBy: document.lastModifiedBy,
          classification: document.metadata.classification,
          sensitivity: document.metadata.sensitivity
        }
      }
    };
  }

  /**
   * Create DevMemory Memory from SharePoint list
   */
  private createListMemory(list: SharePointList, siteName?: string): Omit<Memory, 'id' | 'createdAt' | 'updatedAt'> {
    const title = siteName ? `${list.displayName} (${siteName})` : list.displayName;
    const content = list.description || `SharePoint ${list.listType}: ${list.displayName}\nItems: ${list.metadata.itemCount}`;

    return {
      title,
      content,
      type: MemoryType.LINK,
      tags: [
        'sharepoint-list',
        list.listType,
        ...(siteName ? [`site-${this.slugify(siteName)}`] : []),
        ...(list.metadata.versioningEnabled ? ['versioned'] : []),
        ...(list.metadata.contentTypesEnabled ? ['content-types'] : [])
      ],
      metadata: {
        sharepoint: {
          id: list.id,
          type: 'list',
          webUrl: list.webUrl,
          lastModified: list.lastModifiedDateTime,
          siteId: list.siteId,
          listType: list.listType,
          templateTypeKind: list.templateTypeKind,
          itemCount: list.metadata.itemCount,
          contentTypesEnabled: list.metadata.contentTypesEnabled,
          versioningEnabled: list.metadata.versioningEnabled
        }
      }
    };
  }

  /**
   * Create DevMemory Memory from SharePoint list item
   */
  private createListItemMemory(item: SharePointListItem, listName?: string, siteName?: string): Omit<Memory, 'id' | 'createdAt' | 'updatedAt'> {
    const title = this.generateListItemTitle(item, listName, siteName);
    const content = this.generateListItemContent(item);

    return {
      title,
      content,
      type: MemoryType.NOTE,
      tags: [
        'sharepoint-item',
        ...(listName ? [`list-${this.slugify(listName)}`] : []),
        ...(siteName ? [`site-${this.slugify(siteName)}`] : []),
        ...(item.contentType ? [`type-${this.slugify(item.contentType.name)}`] : [])
      ],
      metadata: {
        sharepoint: {
          id: item.id,
          type: 'listItem',
          webUrl: item.webUrl,
          lastModified: item.lastModifiedDateTime,
          siteId: item.siteId,
          listId: item.listId,
          fields: item.fields,
          contentType: item.contentType,
          createdBy: item.createdBy,
          lastModifiedBy: item.lastModifiedBy
        }
      }
    };
  }

  /**
   * Extract entities from SharePoint site
   */
  private extractSiteEntities(site: SharePointSite): SharePointEntityExtractionResult {
    return {
      sites: [site.displayName],
      documents: [],
      authors: [],
      technologies: this.extractTechnologiesFromSite(site),
      projects: this.extractProjectsFromText(site.displayName + ' ' + (site.description || '')),
      departments: this.extractDepartmentsFromSite(site),
      keywords: this.extractKeywordsFromText(site.displayName + ' ' + (site.description || '')),
      fileTypes: []
    };
  }

  /**
   * Extract entities from SharePoint document
   */
  private extractDocumentEntities(document: SharePointDocument): SharePointEntityExtractionResult {
    const authors = [
      this.cleanEmailToName(document.createdBy.user.email),
      this.cleanEmailToName(document.lastModifiedBy.user.email)
    ].filter((name, index, array) => array.indexOf(name) === index);

    return {
      sites: [],
      documents: [document.name],
      authors,
      technologies: this.extractTechnologiesFromDocument(document),
      projects: this.extractProjectsFromText(document.name + ' ' + (document.content || '')),
      departments: this.extractDepartmentsFromDocument(document),
      keywords: this.extractKeywordsFromText(document.name + ' ' + (document.content || '')),
      fileTypes: [document.metadata.extension]
    };
  }

  /**
   * Extract entities from SharePoint list
   */
  private extractListEntities(list: SharePointList): SharePointEntityExtractionResult {
    return {
      sites: [],
      documents: [],
      authors: [],
      technologies: this.extractTechnologiesFromList(list),
      projects: this.extractProjectsFromText(list.displayName + ' ' + (list.description || '')),
      departments: this.extractDepartmentsFromList(list),
      keywords: this.extractKeywordsFromText(list.displayName + ' ' + (list.description || '')),
      fileTypes: []
    };
  }

  /**
   * Extract entities from SharePoint list item
   */
  private extractListItemEntities(item: SharePointListItem): SharePointEntityExtractionResult {
    const authors = [
      this.cleanEmailToName(item.createdBy.user.email),
      this.cleanEmailToName(item.lastModifiedBy.user.email)
    ].filter((name, index, array) => array.indexOf(name) === index);

    const fieldText = Object.values(item.fields || {}).join(' ');

    return {
      sites: [],
      documents: [],
      authors,
      technologies: this.extractTechnologiesFromText(fieldText),
      projects: this.extractProjectsFromText(fieldText),
      departments: this.extractDepartmentsFromListItem(item),
      keywords: this.extractKeywordsFromText(fieldText),
      fileTypes: []
    };
  }

  /**
   * Create entities from extracted data
   */
  private createSiteEntities(extraction: SharePointEntityExtractionResult, site: SharePointSite): Array<Omit<KnowledgeGraphEntity, 'id' | 'createdAt' | 'updatedAt' | 'memoryIds' | 'observations' | 'confidence'>> {
    return this.createEntitiesFromExtraction(extraction, 'site', site.id);
  }

  private createDocumentEntities(extraction: SharePointEntityExtractionResult, document: SharePointDocument): Array<Omit<KnowledgeGraphEntity, 'id' | 'createdAt' | 'updatedAt' | 'memoryIds' | 'observations' | 'confidence'>> {
    return this.createEntitiesFromExtraction(extraction, 'document', document.id);
  }

  private createListEntities(extraction: SharePointEntityExtractionResult, list: SharePointList): Array<Omit<KnowledgeGraphEntity, 'id' | 'createdAt' | 'updatedAt' | 'memoryIds' | 'observations' | 'confidence'>> {
    return this.createEntitiesFromExtraction(extraction, 'list', list.id);
  }

  private createListItemEntities(extraction: SharePointEntityExtractionResult, item: SharePointListItem): Array<Omit<KnowledgeGraphEntity, 'id' | 'createdAt' | 'updatedAt' | 'memoryIds' | 'observations' | 'confidence'>> {
    return this.createEntitiesFromExtraction(extraction, 'listItem', item.id);
  }

  /**
   * Generic entity creation from extraction results
   */
  private createEntitiesFromExtraction(extraction: SharePointEntityExtractionResult, sourceType: string, sourceId: string): Array<Omit<KnowledgeGraphEntity, 'id' | 'createdAt' | 'updatedAt' | 'memoryIds' | 'observations' | 'confidence'>> {
    const entities: Array<Omit<KnowledgeGraphEntity, 'id' | 'createdAt' | 'updatedAt' | 'memoryIds' | 'observations' | 'confidence'>> = [];

    // Site entities
    extraction.sites.forEach(site => {
      entities.push({
        name: site,
        type: 'site',
        properties: {
          source: 'sharepoint',
          sourceType,
          extractedFrom: sourceId
        }
      });
    });

    // Document entities
    extraction.documents.forEach(doc => {
      entities.push({
        name: doc,
        type: 'document',
        properties: {
          source: 'sharepoint',
          sourceType,
          extractedFrom: sourceId
        }
      });
    });

    // Author entities
    extraction.authors.forEach(author => {
      entities.push({
        name: author,
        type: 'person',
        properties: {
          source: 'sharepoint',
          sourceType,
          extractedFrom: sourceId,
          role: 'author'
        }
      });
    });

    // Technology entities
    extraction.technologies.forEach(tech => {
      entities.push({
        name: tech,
        type: 'technology',
        properties: {
          source: 'sharepoint',
          sourceType,
          extractedFrom: sourceId
        }
      });
    });

    // Project entities
    extraction.projects.forEach(project => {
      entities.push({
        name: project,
        type: 'project',
        properties: {
          source: 'sharepoint',
          sourceType,
          extractedFrom: sourceId
        }
      });
    });

    // Department entities
    extraction.departments.forEach(dept => {
      entities.push({
        name: dept,
        type: 'organization',
        properties: {
          source: 'sharepoint',
          sourceType,
          extractedFrom: sourceId,
          category: 'department'
        }
      });
    });

    // Keyword entities
    extraction.keywords.forEach(keyword => {
      entities.push({
        name: keyword,
        type: 'concept',
        properties: {
          source: 'sharepoint',
          sourceType,
          extractedFrom: sourceId,
          category: 'keyword'
        }
      });
    });

    // File type entities
    extraction.fileTypes.forEach(fileType => {
      entities.push({
        name: fileType,
        type: 'technology',
        properties: {
          source: 'sharepoint',
          sourceType,
          extractedFrom: sourceId,
          category: 'filetype'
        }
      });
    });

    return entities;
  }

  /**
   * Create relationships between entities
   */
  private createSiteRelationships(entities: Array<Omit<KnowledgeGraphEntity, 'id' | 'createdAt' | 'updatedAt' | 'memoryIds' | 'observations' | 'confidence'>>, site: SharePointSite): Array<{
    fromEntityName: string;
    toEntityName: string;
    type: string;
    properties: Record<string, any>;
  }> {
    return this.createGenericRelationships(entities, site.displayName, 'HOSTED_ON');
  }

  private createDocumentRelationships(entities: Array<Omit<KnowledgeGraphEntity, 'id' | 'createdAt' | 'updatedAt' | 'memoryIds' | 'observations' | 'confidence'>>, document: SharePointDocument): Array<{
    fromEntityName: string;
    toEntityName: string;
    type: string;
    properties: Record<string, any>;
  }> {
    const relationships: Array<{
    fromEntityName: string;
    toEntityName: string;
    type: string;
    properties: Record<string, any>;
  }> = [];

    // Create AUTHORED relationships
    const authors = entities.filter(e => e.type === 'person');
    authors.forEach(author => {
      relationships.push({
        fromEntityName: author.name,
        toEntityName: document.name,
        type: 'AUTHORED',
        properties: {
          context: 'sharepoint-document',
          date: document.lastModifiedDateTime,
          source: document.id
        }
      });
    });

    // Create other relationships
    relationships.push(...this.createGenericRelationships(entities, document.name, 'MENTIONED_IN'));

    return relationships;
  }

  private createListRelationships(entities: Array<Omit<KnowledgeGraphEntity, 'id' | 'createdAt' | 'updatedAt' | 'memoryIds' | 'observations' | 'confidence'>>, list: SharePointList): Array<{
    fromEntityName: string;
    toEntityName: string;
    type: string;
    properties: Record<string, any>;
  }> {
    return this.createGenericRelationships(entities, list.displayName, 'MANAGED_IN');
  }

  private createListItemRelationships(entities: Array<Omit<KnowledgeGraphEntity, 'id' | 'createdAt' | 'updatedAt' | 'memoryIds' | 'observations' | 'confidence'>>, item: SharePointListItem): Array<{
    fromEntityName: string;
    toEntityName: string;
    type: string;
    properties: Record<string, any>;
  }> {
    const relationships: Array<{
    fromEntityName: string;
    toEntityName: string;
    type: string;
    properties: Record<string, any>;
  }> = [];

    // Create CREATED relationships
    const authors = entities.filter(e => e.type === 'person');
    authors.forEach(author => {
      relationships.push({
        fromEntityName: author.name,
        toEntityName: `List Item ${item.id}`,
        type: 'CREATED',
        properties: {
          context: 'sharepoint-listitem',
          date: item.lastModifiedDateTime,
          source: item.id
        }
      });
    });

    // Create other relationships
    relationships.push(...this.createGenericRelationships(entities, `List Item ${item.id}`, 'REFERENCED_IN'));

    return relationships;
  }

  /**
   * Create generic relationships for entities
   */
  private createGenericRelationships(entities: Array<Omit<KnowledgeGraphEntity, 'id' | 'createdAt' | 'updatedAt' | 'memoryIds' | 'observations' | 'confidence'>>, targetName: string, relationshipType: string): Array<{
    fromEntityName: string;
    toEntityName: string;
    type: string;
    properties: Record<string, any>;
  }> {
    return entities
      .filter(entity => entity.name !== targetName)
      .map(entity => ({
        fromEntityName: entity.name,
        toEntityName: targetName,
        type: relationshipType,
        properties: {
          context: 'sharepoint',
          source: entity.properties?.extractedFrom
        }
      }));
  }

  // Utility methods for entity extraction
  private extractTechnologiesFromSite(site: SharePointSite): string[] {
    const text = `${site.displayName} ${site.description || ''}`.toLowerCase();
    return this.extractTechnologiesFromText(text);
  }

  private extractTechnologiesFromDocument(document: SharePointDocument): string[] {
    const text = `${document.name} ${document.content || ''}`.toLowerCase();
    const techs = this.extractTechnologiesFromText(text);
    
    // Add file type as technology
    if (document.metadata.extension) {
      techs.push(document.metadata.extension);
    }

    return techs;
  }

  private extractTechnologiesFromList(list: SharePointList): string[] {
    const text = `${list.displayName} ${list.description || ''}`.toLowerCase();
    return this.extractTechnologiesFromText(text);
  }

  private extractTechnologiesFromText(text: string): string[] {
    const technologies = new Set<string>();

    const techKeywords = [
      'sharepoint', 'office', 'excel', 'word', 'powerpoint', 'teams', 'onenote',
      'power bi', 'power apps', 'power automate', 'dynamics', 'azure',
      'javascript', 'typescript', 'react', 'angular', 'vue', 'nodejs',
      'python', 'java', 'csharp', 'dotnet', 'sql', 'database'
    ];

    techKeywords.forEach(tech => {
      if (text.includes(tech)) {
        technologies.add(tech);
      }
    });

    return Array.from(technologies);
  }

  private extractProjectsFromText(text: string): string[] {
    const projects = new Set<string>();

    const projectPatterns = [
      /\bproject\s+([a-zA-Z][\w\s]{2,30})/gi,
      /\b([A-Z][\w\s]{2,20})\s+project\b/gi,
      /\binitiative\s+([a-zA-Z][\w\s]{2,30})/gi
    ];

    projectPatterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        const projectName = match[1].trim();
        if (projectName.length > 2) {
          projects.add(projectName);
        }
      }
    });

    return Array.from(projects);
  }

  private extractDepartmentsFromSite(site: SharePointSite): string[] {
    return this.extractDepartmentsFromText(site.displayName + ' ' + (site.description || ''));
  }

  private extractDepartmentsFromDocument(document: SharePointDocument): string[] {
    return this.extractDepartmentsFromText(document.name + ' ' + (document.content || ''));
  }

  private extractDepartmentsFromList(list: SharePointList): string[] {
    return this.extractDepartmentsFromText(list.displayName + ' ' + (list.description || ''));
  }

  private extractDepartmentsFromListItem(item: SharePointListItem): string[] {
    const fieldText = Object.values(item.fields || {}).join(' ');
    return this.extractDepartmentsFromText(fieldText);
  }

  private extractDepartmentsFromText(text: string): string[] {
    const departments = new Set<string>();

    const deptKeywords = [
      'engineering', 'development', 'marketing', 'sales', 'finance', 'hr', 'human resources',
      'operations', 'support', 'customer service', 'legal', 'compliance', 'security',
      'it', 'information technology', 'research', 'design', 'product'
    ];

    deptKeywords.forEach(dept => {
      if (text.toLowerCase().includes(dept)) {
        departments.add(dept);
      }
    });

    return Array.from(departments);
  }

  private extractKeywordsFromText(text: string): string[] {
    const commonWords = new Set([
      'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by',
      'from', 'up', 'about', 'into', 'through', 'during', 'before', 'after', 'above',
      'below', 'between', 'among', 'this', 'that', 'these', 'those', 'is', 'was',
      'are', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did',
      'will', 'would', 'could', 'should', 'may', 'might', 'must', 'can', 'shall'
    ]);

    const words = text
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => 
        word.length > 3 && 
        !commonWords.has(word.toLowerCase()) &&
        !/^\d+$/.test(word)
      )
      .map(word => word.toLowerCase());

    const wordCount = new Map<string, number>();
    words.forEach(word => {
      wordCount.set(word, (wordCount.get(word) || 0) + 1);
    });

    return Array.from(wordCount.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([word]) => word);
  }

  // Utility methods
  private generateListItemTitle(item: SharePointListItem, listName?: string, siteName?: string): string {
    // Try to find a meaningful title from fields
    const titleField = item.fields?.Title || item.fields?.Name || item.fields?.Subject;
    if (titleField) {
      return listName ? `${titleField} (${listName})` : titleField;
    }

    // Fallback to ID-based title
    const baseTitle = `List Item ${item.id}`;
    if (listName && siteName) {
      return `${baseTitle} (${listName} - ${siteName})`;
    } else if (listName) {
      return `${baseTitle} (${listName})`;
    } else if (siteName) {
      return `${baseTitle} (${siteName})`;
    }
    return baseTitle;
  }

  private generateListItemContent(item: SharePointListItem): string {
    const fields = item.fields || {};
    const fieldEntries = Object.entries(fields)
      .filter(([key, value]) => value != null && value !== '')
      .map(([key, value]) => `${key}: ${value}`)
      .join('\n');

    return fieldEntries || `SharePoint list item created on ${new Date(item.createdDateTime).toLocaleDateString()}`;
  }

  private formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  private slugify(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-');
  }

  private cleanEmailToName(email: string): string {
    const namePart = email.split('@')[0];
    return namePart
      .replace(/[._-]/g, ' ')
      .replace(/\b\w/g, char => char.toUpperCase())
      .trim();
  }
}

// Export singleton instance
export const sharepointEntityMapper = new SharePointEntityMapper();