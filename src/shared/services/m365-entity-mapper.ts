import { Memory, MemoryType } from '../types';
import { KnowledgeGraphEntity, KnowledgeGraphRelation } from '../database/knowledge-graph';
import { M365Content } from './m365-integration-service';
import { sharepointEntityMapper, SharePointEntityMapping } from './sharepoint-entity-mapper';
import { createLogger } from '../utils/logger';

/**
 * Microsoft 365 Entity Mapper
 * Transforms M365 content into DevMemory entities and relationships
 */

export interface M365EntityMapping {
  memory: Omit<Memory, 'id' | 'createdAt' | 'updatedAt'>;
  entities: Array<Omit<KnowledgeGraphEntity, 'id' | 'createdAt' | 'updatedAt' | 'memoryIds' | 'observations' | 'confidence'>>;
  relationships: Array<{
    fromEntityName: string;
    toEntityName: string;
    type: string;
    properties: Record<string, any>;
  }>;
}

export interface EntityExtractionResult {
  people: string[];
  organizations: string[];
  projects: string[];
  technologies: string[];
  locations: string[];
  keywords: string[];
}

export class M365EntityMapper {
  private logger = createLogger('M365EntityMapper');

  constructor() {
    this.logger.info('M365 Entity Mapper initialized');
  }

  /**
   * Transform M365 content into DevMemory format
   */
  async mapContent(content: M365Content): Promise<M365EntityMapping> {
    try {
      this.logger.debug(`Mapping M365 content: ${content.type}/${content.id}`);

      // Create the base memory
      const memory = this.createMemoryFromContent(content);

      // Extract entities from content
      const extractedEntities = this.extractEntities(content);

      // Create entity objects
      const entities = this.createEntitiesFromExtraction(extractedEntities, content);

      // Create relationships
      const relationships = this.createRelationships(entities, content);

      this.logger.debug(`✓ Mapped content to ${entities.length} entities, ${relationships.length} relationships`);

      return {
        memory,
        entities,
        relationships
      };

    } catch (error) {
      this.logger.error(`Failed to map M365 content ${content.id}`, error);
      throw error;
    }
  }

  /**
   * Batch process multiple M365 content items
   */
  async mapContentBatch(contentItems: M365Content[]): Promise<M365EntityMapping[]> {
    this.logger.info(`Mapping batch of ${contentItems.length} M365 items`);

    const results: M365EntityMapping[] = [];
    const errors: Array<{ content: M365Content; error: string }> = [];

    for (const content of contentItems) {
      try {
        const mapping = await this.mapContent(content);
        results.push(mapping);
      } catch (error) {
        this.logger.warn(`Failed to map content ${content.id}`, error);
        errors.push({
          content,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    this.logger.info(`✓ Mapped ${results.length}/${contentItems.length} items successfully`);
    if (errors.length > 0) {
      this.logger.warn(`${errors.length} items failed to map`, errors);
    }

    return results;
  }

  /**
   * Create DevMemory Memory from M365 content
   */
  private createMemoryFromContent(content: M365Content): Omit<Memory, 'id' | 'createdAt' | 'updatedAt'> {
    const memoryType = this.mapContentTypeToMemoryType(content.type);
    
    return {
      title: content.title,
      content: content.content,
      type: memoryType,
      tags: [
        `m365-${content.type}`,
        `source-${content.metadata.source}`,
        ...(content.metadata.tags || [])
      ],
      metadata: {
        m365: {
          id: content.id,
          type: content.type,
          source: content.metadata.source,
          lastModified: content.metadata.lastModified,
          url: content.metadata.url,
          author: content.metadata.author,
          participants: content.metadata.participants,
          permissions: content.permissions
        }
      }
    };
  }

  /**
   * Extract entities from M365 content using pattern recognition
   */
  private extractEntities(content: M365Content): EntityExtractionResult {
    // Use SharePoint-specific extraction for SharePoint content types
    if (['site', 'document', 'list', 'listItem'].includes(content.type)) {
      return this.extractSharePointEntities(content);
    }

    // Use standard extraction for other content types
    const text = `${content.title} ${content.content}`.toLowerCase();
    
    return {
      people: this.extractPeople(content),
      organizations: this.extractOrganizations(text),
      projects: this.extractProjects(text),
      technologies: this.extractTechnologies(text),
      locations: this.extractLocations(text),
      keywords: this.extractKeywords(text)
    };
  }

  /**
   * Extract people from M365 content
   */
  private extractPeople(content: M365Content): string[] {
    const people = new Set<string>();

    // Add author
    if (content.metadata.author) {
      people.add(this.cleanEmailToName(content.metadata.author));
    }

    // Add participants
    if (content.metadata.participants) {
      content.metadata.participants.forEach(participant => {
        people.add(this.cleanEmailToName(participant));
      });
    }

    // Extract names from content using simple patterns
    const namePattern = /\b[A-Z][a-z]+ [A-Z][a-z]+\b/g;
    const matches = content.content.match(namePattern) || [];
    matches.forEach(name => people.add(name));

    return Array.from(people);
  }

  /**
   * Extract organizations from content
   */
  private extractOrganizations(text: string): string[] {
    const organizations = new Set<string>();

    // Common organization indicators
    const orgPatterns = [
      /\b[A-Z][a-zA-Z]+ (?:Inc|LLC|Corp|Corporation|Company|Ltd|Limited)\b/g,
      /\b(?:Microsoft|Google|Amazon|Apple|Meta|Tesla|Netflix)\b/g
    ];

    orgPatterns.forEach(pattern => {
      const matches = text.match(pattern) || [];
      matches.forEach(org => organizations.add(org));
    });

    return Array.from(organizations);
  }

  /**
   * Extract project names from content
   */
  private extractProjects(text: string): string[] {
    const projects = new Set<string>();

    // Look for project indicators
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

  /**
   * Extract technologies from content
   */
  private extractTechnologies(text: string): string[] {
    const technologies = new Set<string>();

    // Common technology terms
    const techKeywords = [
      'react', 'angular', 'vue', 'nodejs', 'python', 'java', 'javascript', 'typescript',
      'aws', 'azure', 'gcp', 'kubernetes', 'docker', 'redis', 'mongodb', 'postgresql',
      'github', 'gitlab', 'jenkins', 'terraform', 'ansible', 'elasticsearch', 'kafka'
    ];

    techKeywords.forEach(tech => {
      if (text.includes(tech)) {
        technologies.add(tech);
      }
    });

    return Array.from(technologies);
  }

  /**
   * Extract locations from content
   */
  private extractLocations(text: string): string[] {
    const locations = new Set<string>();

    // Simple location patterns
    const locationPatterns = [
      /\b(?:New York|Los Angeles|Chicago|Houston|Seattle|San Francisco|Boston|Austin|Denver)\b/gi,
      /\b(?:USA|United States|UK|United Kingdom|Canada|Germany|France|Japan|Australia)\b/gi
    ];

    locationPatterns.forEach(pattern => {
      const matches = text.match(pattern) || [];
      matches.forEach(location => locations.add(location));
    });

    return Array.from(locations);
  }

  /**
   * Extract important keywords from content
   */
  private extractKeywords(text: string): string[] {
    // Remove common words and extract meaningful terms
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

    // Count word frequency and return top keywords
    const wordCount = new Map<string, number>();
    words.forEach(word => {
      wordCount.set(word, (wordCount.get(word) || 0) + 1);
    });

    return Array.from(wordCount.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([word]) => word);
  }

  /**
   * Create entity objects from extracted data
   */
  private createEntitiesFromExtraction(
    extraction: EntityExtractionResult, 
    content: M365Content
  ): Array<Omit<KnowledgeGraphEntity, 'id' | 'createdAt' | 'updatedAt' | 'memoryIds' | 'observations' | 'confidence'>> {
    const entities: Array<Omit<KnowledgeGraphEntity, 'id' | 'createdAt' | 'updatedAt' | 'memoryIds' | 'observations' | 'confidence'>> = [];

    // Create person entities
    extraction.people.forEach(person => {
      entities.push({
        name: person,
        type: 'person',
        properties: {
          source: 'm365',
          contentType: content.type,
          extractedFrom: content.id
        }
      });
    });

    // Create organization entities
    extraction.organizations.forEach(org => {
      entities.push({
        name: org,
        type: 'organization',
        properties: {
          source: 'm365',
          contentType: content.type,
          extractedFrom: content.id
        }
      });
    });

    // Create project entities
    extraction.projects.forEach(project => {
      entities.push({
        name: project,
        type: 'project',
        properties: {
          source: 'm365',
          contentType: content.type,
          extractedFrom: content.id
        }
      });
    });

    // Create technology entities
    extraction.technologies.forEach(tech => {
      entities.push({
        name: tech,
        type: 'technology',
        properties: {
          source: 'm365',
          contentType: content.type,
          extractedFrom: content.id
        }
      });
    });

    // Create location entities
    extraction.locations.forEach(location => {
      entities.push({
        name: location,
        type: 'location',
        properties: {
          source: 'm365',
          contentType: content.type,
          extractedFrom: content.id
        }
      });
    });

    // Create keyword entities
    extraction.keywords.forEach(keyword => {
      entities.push({
        name: keyword,
        type: 'concept',
        properties: {
          source: 'm365',
          contentType: content.type,
          extractedFrom: content.id,
          category: 'keyword'
        }
      });
    });

    return entities;
  }

  /**
   * Create relationships between entities
   */
  private createRelationships(
    entities: Array<Omit<KnowledgeGraphEntity, 'id' | 'createdAt' | 'updatedAt' | 'memoryIds' | 'observations' | 'confidence'>>, 
    content: M365Content
  ): Array<{
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

    // Create relationships based on content type
    if (['site', 'document', 'list', 'listItem'].includes(content.type)) {
      this.createSharePointRelationships(entities, content, relationships);
    } else {
      switch (content.type) {
        case 'email':
          this.createEmailRelationships(entities, content, relationships);
          break;
        case 'event':
          this.createEventRelationships(entities, content, relationships);
          break;
        case 'team':
          this.createTeamRelationships(entities, content, relationships);
          break;
        default:
          this.createGenericRelationships(entities, content, relationships);
      }
    }

    return relationships;
  }

  /**
   * Create email-specific relationships
   */
  private createEmailRelationships(
    entities: Array<Omit<KnowledgeGraphEntity, 'id' | 'createdAt' | 'updatedAt' | 'memoryIds' | 'observations' | 'confidence'>>,
    content: M365Content,
    relationships: Array<{
    fromEntityName: string;
    toEntityName: string;
    type: string;
    properties: Record<string, any>;
  }>
  ): void {
    const people = entities.filter(e => e.type === 'person');
    
    // Create "COMMUNICATED_WITH" relationships between people
    for (let i = 0; i < people.length; i++) {
      for (let j = i + 1; j < people.length; j++) {
        relationships.push({
          fromEntityName: people[i].name,
          toEntityName: people[j].name,
          type: 'COMMUNICATED_WITH',
          properties: {
            context: 'email',
            date: content.metadata.lastModified,
            source: content.id
          }
        });
      }
    }
  }

  /**
   * Create event-specific relationships
   */
  private createEventRelationships(
    entities: Array<Omit<KnowledgeGraphEntity, 'id' | 'createdAt' | 'updatedAt' | 'memoryIds' | 'observations' | 'confidence'>>,
    content: M365Content,
    relationships: Array<{
    fromEntityName: string;
    toEntityName: string;
    type: string;
    properties: Record<string, any>;
  }>
  ): void {
    const people = entities.filter(e => e.type === 'person');
    
    // Create "ATTENDED_MEETING" relationships
    people.forEach(person => {
      relationships.push({
        fromEntityName: person.name,
        toEntityName: content.title,
        type: 'ATTENDED_MEETING',
        properties: {
          context: 'calendar',
          date: content.metadata.lastModified,
          source: content.id
        }
      });
    });
  }

  /**
   * Create team-specific relationships
   */
  private createTeamRelationships(
    entities: Array<Omit<KnowledgeGraphEntity, 'id' | 'createdAt' | 'updatedAt' | 'memoryIds' | 'observations' | 'confidence'>>,
    content: M365Content,
    relationships: Array<{
    fromEntityName: string;
    toEntityName: string;
    type: string;
    properties: Record<string, any>;
  }>
  ): void {
    const people = entities.filter(e => e.type === 'person');
    
    // Create "MEMBER_OF" relationships
    people.forEach(person => {
      relationships.push({
        fromEntityName: person.name,
        toEntityName: content.title,
        type: 'MEMBER_OF',
        properties: {
          context: 'team',
          source: content.id
        }
      });
    });
  }

  /**
   * Create generic relationships
   */
  private createGenericRelationships(
    entities: Array<Omit<KnowledgeGraphEntity, 'id' | 'createdAt' | 'updatedAt' | 'memoryIds' | 'observations' | 'confidence'>>,
    content: M365Content,
    relationships: Array<{
    fromEntityName: string;
    toEntityName: string;
    type: string;
    properties: Record<string, any>;
  }>
  ): void {
    // Create "MENTIONED_IN" relationships for all entities
    entities.forEach(entity => {
      relationships.push({
        fromEntityName: entity.name,
        toEntityName: content.title,
        type: 'MENTIONED_IN',
        properties: {
          context: content.type,
          date: content.metadata.lastModified,
          source: content.id
        }
      });
    });
  }

  /**
   * Map M365 content type to DevMemory type
   */
  private mapContentTypeToMemoryType(contentType: M365Content['type']): MemoryType {
    switch (contentType) {
      case 'email': return MemoryType.NOTE;
      case 'event': return MemoryType.MEETING_NOTES;
      case 'file': return MemoryType.DOCUMENTATION;
      case 'team': return MemoryType.PROJECT_CONTEXT;
      case 'site': return MemoryType.LINK;
      case 'message': return MemoryType.NOTE;
      case 'document': return MemoryType.DOCUMENTATION;
      case 'list': return MemoryType.LINK;
      case 'listItem': return MemoryType.NOTE;
      default: return MemoryType.NOTE;
    }
  }

  /**
   * Enhanced entity extraction for SharePoint content
   */
  private extractSharePointEntities(content: M365Content): EntityExtractionResult {
    const text = `${content.title} ${content.content}`.toLowerCase();
    
    const result: EntityExtractionResult = {
      people: this.extractSharePointPeople(content),
      organizations: this.extractOrganizations(text),
      projects: this.extractProjects(text),
      technologies: this.extractSharePointTechnologies(content),
      locations: this.extractLocations(text),
      keywords: this.extractKeywords(text)
    };

    // Add SharePoint-specific entities
    if (content.type === 'site') {
      result.organizations.push(content.title);
    }

    if (content.metadata.fileType) {
      result.technologies.push(content.metadata.fileType);
    }

    return result;
  }

  /**
   * Extract people from SharePoint content
   */
  private extractSharePointPeople(content: M365Content): string[] {
    const people = new Set<string>();

    // Add author from metadata
    if (content.metadata.author) {
      people.add(this.cleanEmailToName(content.metadata.author));
    }

    // Add participants from metadata
    if (content.metadata.participants) {
      content.metadata.participants.forEach(participant => {
        people.add(this.cleanEmailToName(participant));
      });
    }

    // Extract names from content using patterns
    const namePattern = /\b[A-Z][a-z]+ [A-Z][a-z]+\b/g;
    const matches = content.content.match(namePattern) || [];
    matches.forEach(name => people.add(name));

    return Array.from(people);
  }

  /**
   * Extract technologies from SharePoint content
   */
  private extractSharePointTechnologies(content: M365Content): string[] {
    const text = `${content.title} ${content.content}`.toLowerCase();
    const technologies = this.extractTechnologies(text);

    // Add SharePoint-specific technologies
    technologies.push('sharepoint');

    if (content.metadata.fileType) {
      technologies.push(content.metadata.fileType);
    }

    if (content.type === 'document' && content.metadata.tags) {
      content.metadata.tags.forEach(tag => {
        if (this.isTechnologyTag(tag)) {
          technologies.push(tag);
        }
      });
    }

    return Array.from(new Set(technologies));
  }

  /**
   * Check if a tag represents a technology
   */
  private isTechnologyTag(tag: string): boolean {
    const techTags = [
      'office', 'word', 'excel', 'powerpoint', 'pdf', 'html', 'xml', 'json',
      'javascript', 'typescript', 'python', 'java', 'csharp', 'sql'
    ];
    return techTags.includes(tag.toLowerCase());
  }

  /**
   * Create SharePoint-specific relationships
   */
  private createSharePointRelationships(
    entities: Array<Omit<KnowledgeGraphEntity, 'id' | 'createdAt' | 'updatedAt' | 'memoryIds' | 'observations' | 'confidence'>>, 
    content: M365Content, 
    relationships: Array<{
    fromEntityName: string;
    toEntityName: string;
    type: string;
    properties: Record<string, any>;
  }>
  ): void {
    switch (content.type) {
      case 'site':
        this.createSiteRelationships(entities, content, relationships);
        break;
      case 'document':
        this.createDocumentRelationships(entities, content, relationships);
        break;
      case 'list':
        this.createListRelationships(entities, content, relationships);
        break;
      case 'listItem':
        this.createListItemRelationships(entities, content, relationships);
        break;
      default:
        this.createGenericSharePointRelationships(entities, content, relationships);
    }
  }

  /**
   * Create site-specific relationships
   */
  private createSiteRelationships(
    entities: Array<Omit<KnowledgeGraphEntity, 'id' | 'createdAt' | 'updatedAt' | 'memoryIds' | 'observations' | 'confidence'>>,
    content: M365Content,
    relationships: Array<{
    fromEntityName: string;
    toEntityName: string;
    type: string;
    properties: Record<string, any>;
  }>
  ): void {
    // Create HOSTED_ON relationships for all entities
    entities.forEach(entity => {
      if (entity.name !== content.title) {
        relationships.push({
          fromEntityName: entity.name,
          toEntityName: content.title,
          type: 'HOSTED_ON',
          properties: {
            context: 'sharepoint-site',
            date: content.metadata.lastModified,
            source: content.id
          }
        });
      }
    });
  }

  /**
   * Create document-specific relationships
   */
  private createDocumentRelationships(
    entities: Array<Omit<KnowledgeGraphEntity, 'id' | 'createdAt' | 'updatedAt' | 'memoryIds' | 'observations' | 'confidence'>>,
    content: M365Content,
    relationships: Array<{
    fromEntityName: string;
    toEntityName: string;
    type: string;
    properties: Record<string, any>;
  }>
  ): void {
    const people = entities.filter(e => e.type === 'person');
    
    // Create AUTHORED relationships
    people.forEach(person => {
      relationships.push({
        fromEntityName: person.name,
        toEntityName: content.title,
        type: 'AUTHORED',
        properties: {
          context: 'sharepoint-document',
          date: content.metadata.lastModified,
          source: content.id,
          fileType: content.metadata.fileType
        }
      });
    });

    // Create CONTAINS relationships for technologies/concepts
    const technologies = entities.filter(e => e.type === 'technology' || e.type === 'concept');
    technologies.forEach(tech => {
      relationships.push({
        fromEntityName: content.title,
        toEntityName: tech.name,
        type: 'CONTAINS',
        properties: {
          context: 'sharepoint-document',
          source: content.id
        }
      });
    });
  }

  /**
   * Create list-specific relationships
   */
  private createListRelationships(
    entities: Array<Omit<KnowledgeGraphEntity, 'id' | 'createdAt' | 'updatedAt' | 'memoryIds' | 'observations' | 'confidence'>>,
    content: M365Content,
    relationships: Array<{
    fromEntityName: string;
    toEntityName: string;
    type: string;
    properties: Record<string, any>;
  }>
  ): void {
    // Create MANAGES relationships
    entities.forEach(entity => {
      if (entity.name !== content.title) {
        relationships.push({
          fromEntityName: content.title,
          toEntityName: entity.name,
          type: 'MANAGES',
          properties: {
            context: 'sharepoint-list',
            date: content.metadata.lastModified,
            source: content.id,
            itemCount: content.metadata.itemCount
          }
        });
      }
    });
  }

  /**
   * Create list item-specific relationships
   */
  private createListItemRelationships(
    entities: Array<Omit<KnowledgeGraphEntity, 'id' | 'createdAt' | 'updatedAt' | 'memoryIds' | 'observations' | 'confidence'>>,
    content: M365Content,
    relationships: Array<{
    fromEntityName: string;
    toEntityName: string;
    type: string;
    properties: Record<string, any>;
  }>
  ): void {
    const people = entities.filter(e => e.type === 'person');
    
    // Create CREATED relationships
    people.forEach(person => {
      relationships.push({
        fromEntityName: person.name,
        toEntityName: content.title,
        type: 'CREATED',
        properties: {
          context: 'sharepoint-listitem',
          date: content.metadata.lastModified,
          source: content.id
        }
      });
    });
  }

  /**
   * Create generic SharePoint relationships
   */
  private createGenericSharePointRelationships(
    entities: Array<Omit<KnowledgeGraphEntity, 'id' | 'createdAt' | 'updatedAt' | 'memoryIds' | 'observations' | 'confidence'>>,
    content: M365Content,
    relationships: Array<{
    fromEntityName: string;
    toEntityName: string;
    type: string;
    properties: Record<string, any>;
  }>
  ): void {
    entities.forEach(entity => {
      relationships.push({
        fromEntityName: entity.name,
        toEntityName: content.title,
        type: 'REFERENCED_IN',
        properties: {
          context: `sharepoint-${content.type}`,
          date: content.metadata.lastModified,
          source: content.id
        }
      });
    });
  }

  /**
   * Convert email address to display name
   */
  private cleanEmailToName(email: string): string {
    // Extract name before @ symbol and clean it up
    const namePart = email.split('@')[0];
    return namePart
      .replace(/[._-]/g, ' ')
      .replace(/\b\w/g, char => char.toUpperCase())
      .trim();
  }
}

// Export singleton instance
export const m365EntityMapper = new M365EntityMapper();