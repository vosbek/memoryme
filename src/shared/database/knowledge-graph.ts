import Database from 'better-sqlite3';
import { Memory } from '../types';
import { createLogger } from '../utils/logger';
import { v4 as uuidv4 } from 'uuid';

export type EntityType = 
  | 'person' 
  | 'project' 
  | 'technology' 
  | 'concept' 
  | 'organization' 
  | 'file' 
  | 'repository'
  | 'api'
  | 'database'
  | 'service'
  | 'location'
  | 'site'
  | 'document';

export type RelationType = 
  | 'works_on' 
  | 'created_by' 
  | 'depends_on' 
  | 'related_to' 
  | 'belongs_to'
  | 'implements'
  | 'uses'
  | 'calls'
  | 'extends'
  | 'contains'
  | 'manages'
  | 'collaborates_with';

export interface KnowledgeGraphEntity {
  id: string;
  name: string;
  type: EntityType;
  properties: Record<string, any>;
  observations: string[];
  confidence: number; // 0-1 confidence score for entity extraction
  createdAt: Date;
  updatedAt: Date;
  memoryIds: string[]; // Source memories that mention this entity
}

export interface KnowledgeGraphRelation {
  id: string;
  fromEntityId: string;
  toEntityId: string;
  type: RelationType;
  properties: Record<string, any>;
  strength: number; // 0-1 relationship strength
  confidence: number; // 0-1 confidence score for relationship inference
  createdAt: Date;
  updatedAt: Date;
  memoryIds: string[]; // Source memories that support this relationship
}

export interface EntitySearchResult {
  entity: KnowledgeGraphEntity;
  relevanceScore: number;
  relationshipCount: number;
}

export interface RelationshipPath {
  entities: KnowledgeGraphEntity[];
  relationships: KnowledgeGraphRelation[];
  pathStrength: number;
  pathLength: number;
}

/**
 * Knowledge Graph implementation for DevMemory
 * Provides entity-relationship modeling with graph traversal capabilities
 * Enhances memory connections beyond simple tagging
 */
export class KnowledgeGraphManager {
  private db: Database.Database;
  private logger = createLogger('KnowledgeGraphManager');

  constructor(db: Database.Database) {
    this.db = db;
    this.initializeSchema();
  }

  private initializeSchema(): void {
    this.logger.info('Initializing knowledge graph schema');
    
    try {
      this.db.exec(`
        -- Entities table
        CREATE TABLE IF NOT EXISTS kg_entities (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          type TEXT NOT NULL,
          properties TEXT, -- JSON object
          observations TEXT, -- JSON array of strings
          confidence REAL NOT NULL DEFAULT 1.0,
          created_at INTEGER NOT NULL,
          updated_at INTEGER NOT NULL,
          memory_ids TEXT -- JSON array of memory IDs
        );

        -- Relations table
        CREATE TABLE IF NOT EXISTS kg_relations (
          id TEXT PRIMARY KEY,
          from_entity_id TEXT NOT NULL,
          to_entity_id TEXT NOT NULL,
          type TEXT NOT NULL,
          properties TEXT, -- JSON object
          strength REAL NOT NULL DEFAULT 0.5,
          confidence REAL NOT NULL DEFAULT 1.0,
          created_at INTEGER NOT NULL,
          updated_at INTEGER NOT NULL,
          memory_ids TEXT, -- JSON array of memory IDs
          FOREIGN KEY (from_entity_id) REFERENCES kg_entities(id) ON DELETE CASCADE,
          FOREIGN KEY (to_entity_id) REFERENCES kg_entities(id) ON DELETE CASCADE
        );

        -- Indexes for performance
        CREATE INDEX IF NOT EXISTS idx_kg_entities_name ON kg_entities(name);
        CREATE INDEX IF NOT EXISTS idx_kg_entities_type ON kg_entities(type);
        CREATE INDEX IF NOT EXISTS idx_kg_entities_updated_at ON kg_entities(updated_at);
        CREATE INDEX IF NOT EXISTS idx_kg_relations_from ON kg_relations(from_entity_id);
        CREATE INDEX IF NOT EXISTS idx_kg_relations_to ON kg_relations(to_entity_id);
        CREATE INDEX IF NOT EXISTS idx_kg_relations_type ON kg_relations(type);
        CREATE INDEX IF NOT EXISTS idx_kg_relations_strength ON kg_relations(strength);

        -- Full-text search for entities
        CREATE VIRTUAL TABLE IF NOT EXISTS kg_entities_fts USING fts5(
          id UNINDEXED,
          name,
          observations,
          content='kg_entities',
          content_rowid='rowid'
        );

        -- Triggers for FTS synchronization
        CREATE TRIGGER IF NOT EXISTS kg_entities_ai AFTER INSERT ON kg_entities BEGIN
          INSERT INTO kg_entities_fts(id, name, observations)
          VALUES (new.id, new.name, new.observations);
        END;

        CREATE TRIGGER IF NOT EXISTS kg_entities_au AFTER UPDATE ON kg_entities BEGIN
          INSERT INTO kg_entities_fts(kg_entities_fts, id, name, observations)
          VALUES ('delete', old.id, old.name, old.observations);
          INSERT INTO kg_entities_fts(id, name, observations)
          VALUES (new.id, new.name, new.observations);
        END;

        CREATE TRIGGER IF NOT EXISTS kg_entities_ad AFTER DELETE ON kg_entities BEGIN
          INSERT INTO kg_entities_fts(kg_entities_fts, id, name, observations)
          VALUES ('delete', old.id, old.name, old.observations);
        END;
      `);

      this.logger.info('Knowledge graph schema initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize knowledge graph schema', error);
      throw error;
    }
  }

  async createEntity(entity: Omit<KnowledgeGraphEntity, 'id' | 'createdAt' | 'updatedAt'>): Promise<KnowledgeGraphEntity> {
    const now = new Date();
    const newEntity: KnowledgeGraphEntity = {
      ...entity,
      id: uuidv4(),
      createdAt: now,
      updatedAt: now,
    };

    try {
      const stmt = this.db.prepare(`
        INSERT INTO kg_entities (id, name, type, properties, observations, confidence, created_at, updated_at, memory_ids)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      stmt.run(
        newEntity.id,
        newEntity.name,
        newEntity.type,
        JSON.stringify(newEntity.properties),
        JSON.stringify(newEntity.observations),
        newEntity.confidence,
        newEntity.createdAt.getTime(),
        newEntity.updatedAt.getTime(),
        JSON.stringify(newEntity.memoryIds)
      );

      this.logger.debug('Created knowledge graph entity', { 
        id: newEntity.id, 
        name: newEntity.name, 
        type: newEntity.type 
      });

      return newEntity;
    } catch (error) {
      this.logger.error('Failed to create knowledge graph entity', error);
      throw error;
    }
  }

  async createRelation(relation: Omit<KnowledgeGraphRelation, 'id' | 'createdAt' | 'updatedAt'>): Promise<KnowledgeGraphRelation> {
    const now = new Date();
    const newRelation: KnowledgeGraphRelation = {
      ...relation,
      id: uuidv4(),
      createdAt: now,
      updatedAt: now,
    };

    try {
      const stmt = this.db.prepare(`
        INSERT INTO kg_relations (id, from_entity_id, to_entity_id, type, properties, strength, confidence, created_at, updated_at, memory_ids)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      stmt.run(
        newRelation.id,
        newRelation.fromEntityId,
        newRelation.toEntityId,
        newRelation.type,
        JSON.stringify(newRelation.properties),
        newRelation.strength,
        newRelation.confidence,
        newRelation.createdAt.getTime(),
        newRelation.updatedAt.getTime(),
        JSON.stringify(newRelation.memoryIds)
      );

      this.logger.debug('Created knowledge graph relation', { 
        id: newRelation.id, 
        type: newRelation.type,
        from: newRelation.fromEntityId,
        to: newRelation.toEntityId 
      });

      return newRelation;
    } catch (error) {
      this.logger.error('Failed to create knowledge graph relation', error);
      throw error;
    }
  }

  async getEntity(id: string): Promise<KnowledgeGraphEntity | null> {
    try {
      const stmt = this.db.prepare('SELECT * FROM kg_entities WHERE id = ?');
      const row = stmt.get(id) as any;
      
      if (!row) return null;
      
      return this.rowToEntity(row);
    } catch (error) {
      this.logger.error('Failed to get entity', error);
      return null;
    }
  }

  async getEntitiesByType(type: EntityType, limit: number = 50): Promise<KnowledgeGraphEntity[]> {
    try {
      const stmt = this.db.prepare(`
        SELECT * FROM kg_entities 
        WHERE type = ? 
        ORDER BY updated_at DESC 
        LIMIT ?
      `);

      const rows = stmt.all(type, limit) as any[];
      return rows.map(row => this.rowToEntity(row));
    } catch (error) {
      this.logger.error('Failed to get entities by type', error);
      return [];
    }
  }

  async searchEntities(query: string, limit: number = 20): Promise<EntitySearchResult[]> {
    try {
      // Use FTS for entity search
      const stmt = this.db.prepare(`
        SELECT e.*, COUNT(r.id) as relationship_count,
               bm25(kg_entities_fts) as relevance_score
        FROM kg_entities_fts fts
        JOIN kg_entities e ON e.id = fts.id
        LEFT JOIN kg_relations r ON (r.from_entity_id = e.id OR r.to_entity_id = e.id)
        WHERE kg_entities_fts MATCH ?
        GROUP BY e.id
        ORDER BY relevance_score ASC
        LIMIT ?
      `);

      const rows = stmt.all(query, limit) as any[];
      
      return rows.map(row => ({
        entity: this.rowToEntity(row),
        relevanceScore: 1 / (1 + Math.abs(row.relevance_score)), // Convert BM25 to 0-1 score
        relationshipCount: row.relationship_count || 0
      }));
    } catch (error) {
      this.logger.error('Failed to search entities', error);
      return [];
    }
  }

  async getEntityRelationships(entityId: string, direction: 'incoming' | 'outgoing' | 'both' = 'both'): Promise<KnowledgeGraphRelation[]> {
    try {
      let whereClause = '';
      const params = [entityId];

      switch (direction) {
        case 'incoming':
          whereClause = 'WHERE to_entity_id = ?';
          break;
        case 'outgoing':
          whereClause = 'WHERE from_entity_id = ?';
          break;
        case 'both':
          whereClause = 'WHERE from_entity_id = ? OR to_entity_id = ?';
          params.push(entityId);
          break;
      }

      const stmt = this.db.prepare(`
        SELECT * FROM kg_relations 
        ${whereClause}
        ORDER BY strength DESC, updated_at DESC
      `);

      const rows = stmt.all(...params) as any[];
      return rows.map(row => this.rowToRelation(row));
    } catch (error) {
      this.logger.error('Failed to get entity relationships', error);
      return [];
    }
  }

  async findRelationshipPath(fromEntityId: string, toEntityId: string, maxDepth: number = 3): Promise<RelationshipPath[]> {
    try {
      // Use recursive CTE to find relationship paths
      const stmt = this.db.prepare(`
        WITH RECURSIVE relationship_paths(
          from_id, to_id, path_entities, path_relations, depth, total_strength
        ) AS (
          -- Base case: direct relationships
          SELECT 
            r.from_entity_id,
            r.to_entity_id,
            json_array(r.from_entity_id, r.to_entity_id) as path_entities,
            json_array(r.id) as path_relations,
            1 as depth,
            r.strength as total_strength
          FROM kg_relations r
          WHERE r.from_entity_id = ?
          
          UNION ALL
          
          -- Recursive case: extend paths
          SELECT 
            rp.from_id,
            r.to_entity_id,
            json_insert(rp.path_entities, '$[#]', r.to_entity_id) as path_entities,
            json_insert(rp.path_relations, '$[#]', r.id) as path_relations,
            rp.depth + 1 as depth,
            rp.total_strength * r.strength as total_strength
          FROM relationship_paths rp
          JOIN kg_relations r ON r.from_entity_id = rp.to_id
          WHERE rp.depth < ? 
            AND json_extract(rp.path_entities, '$[#-1]') != r.to_entity_id -- Avoid cycles
        )
        SELECT * FROM relationship_paths 
        WHERE to_id = ?
        ORDER BY depth ASC, total_strength DESC
        LIMIT 10
      `);

      const rows = stmt.all(fromEntityId, maxDepth, toEntityId) as any[];
      
      const paths: RelationshipPath[] = [];
      
      for (const row of rows) {
        try {
          const entityIds = JSON.parse(row.path_entities);
          const relationIds = JSON.parse(row.path_relations);
          
          // Fetch entities and relationships
          const entities = await Promise.all(
            entityIds.map((id: string) => this.getEntity(id))
          );
          
          const relationships = await Promise.all(
            relationIds.map((id: string) => this.getRelation(id))
          );
          
          // Filter out any null entities or relationships
          const validEntities = entities.filter(e => e !== null) as KnowledgeGraphEntity[];
          const validRelationships = relationships.filter(r => r !== null) as KnowledgeGraphRelation[];
          
          if (validEntities.length === entityIds.length && validRelationships.length === relationIds.length) {
            paths.push({
              entities: validEntities,
              relationships: validRelationships,
              pathStrength: row.total_strength,
              pathLength: row.depth
            });
          }
        } catch (parseError) {
          this.logger.warn('Failed to parse relationship path', parseError);
        }
      }
      
      return paths;
    } catch (error) {
      this.logger.error('Failed to find relationship path', error);
      return [];
    }
  }

  async getRelation(id: string): Promise<KnowledgeGraphRelation | null> {
    try {
      const stmt = this.db.prepare('SELECT * FROM kg_relations WHERE id = ?');
      const row = stmt.get(id) as any;
      
      if (!row) return null;
      
      return this.rowToRelation(row);
    } catch (error) {
      this.logger.error('Failed to get relation', error);
      return null;
    }
  }

  async extractEntitiesFromMemory(memory: Memory): Promise<KnowledgeGraphEntity[]> {
    // Enhanced entity extraction with improved patterns and performance
    const extractedEntities: Array<Omit<KnowledgeGraphEntity, 'id' | 'createdAt' | 'updatedAt'>> = [];
    
    const content = `${memory.title} ${memory.content}`;
    const metadata = memory.metadata || {};
    
    // Enhanced patterns with better accuracy and coverage
    const patterns = {
      // Enhanced technology patterns with broader coverage
      technology: [
        // Core technologies
        /\b(React|Vue|Angular|Svelte|Next\.js|Nuxt\.js|TypeScript|JavaScript|Python|Java|Go|Rust|C\+\+|C#|PHP|Ruby|Swift|Kotlin|Dart|Scala|Clojure|Elixir|Haskell|F#|OCaml)\b/gi,
        
        // Backend frameworks
        /\b(Node\.js|Express|Fastify|Koa|NestJS|Spring|Django|Flask|FastAPI|Laravel|Symfony|Rails|Gin|Fiber|Echo|Rocket|Actix|Warp|ASP\.NET|Phoenix|Ktor|Micronaut)\b/gi,
        
        // Databases
        /\b(MongoDB|PostgreSQL|MySQL|SQLite|Redis|Elasticsearch|DynamoDB|CassandraDB|Neo4j|InfluxDB|TimescaleDB|CockroachDB|PlanetScale|Supabase|Firebase|FaunaDB)\b/gi,
        
        // Cloud & Infrastructure
        /\b(AWS|Azure|GCP|Google Cloud|Vercel|Netlify|Heroku|DigitalOcean|Linode|Cloudflare|Docker|Kubernetes|Terraform|Ansible|Jenkins|GitHub Actions|GitLab CI|CircleCI)\b/gi,
        
        // Development tools
        /\b(Git|GitHub|GitLab|Bitbucket|VS Code|IntelliJ|WebStorm|Vim|Emacs|Sublime|Atom|Webpack|Vite|Rollup|Parcel|Babel|ESLint|Prettier|Jest|Cypress|Playwright|Storybook)\b/gi,
        
        // Operating Systems & Environments
        /\b(Linux|Ubuntu|CentOS|RHEL|macOS|Windows|WSL|Alpine|Debian|Fedora|Arch|FreeBSD|OpenBSD)\b/gi,
        
        // Libraries & packages (with common patterns)
        /\b(lodash|axios|moment|date-fns|dayjs|uuid|bcrypt|jwt|passport|helmet|cors|express-rate-limit|socket\.io|ws|graphql|apollo|prisma|typeorm|sequelize|mongoose|redis|ioredis)\b/gi,
        
        // Package managers
        /\b(npm|yarn|pnpm|pip|pipenv|poetry|composer|cargo|go mod|gradle|maven|nuget|cocoapods|carthage|swift package manager)\b/gi,
      ],
      
      // Enhanced file patterns with better path detection
      file: [
        /\b([a-zA-Z0-9_-]+\.(js|ts|jsx|tsx|py|java|go|rs|md|json|yaml|yml|toml|sql|sh|bat|ps1|config|env|ini|properties|xml|html|css|scss|sass|less|vue|svelte|php|rb|swift|kt|dart|scala|clj|ex|exs|hs|fs|ml|c|cpp|h|hpp|cs|vb|pl|r|m|mm|gradle|pom|cargo|gemfile|podfile|dockerfile|makefile|rakefile|gulpfile|gruntfile|webpack|rollup|vite|tsconfig|jsconfig|eslintrc|prettierrc|babelrc|gitignore|gitattributes|license|readme))\b/gi,
        /\b([a-zA-Z0-9_.-]+\/[a-zA-Z0-9_.\/-]+\.[a-zA-Z0-9]+)\b/g, // File paths
        /\b(src\/|lib\/|app\/|components\/|pages\/|api\/|routes\/|models\/|views\/|controllers\/|services\/|utils\/|helpers\/|types\/|interfaces\/|hooks\/|store\/|config\/|public\/|assets\/|static\/|tests\/|test\/|spec\/|__tests__\/|cypress\/|e2e\/)([a-zA-Z0-9_.-]+)/g, // Common directory structures
      ],
      
      // Enhanced API patterns
      api: [
        /\b(REST API|GraphQL API|gRPC|WebSocket|SSE|Server-Sent Events|Webhook|Microservice|API Gateway|API endpoint|RESTful)\b/gi,
        /\b(GET|POST|PUT|DELETE|PATCH|HEAD|OPTIONS)\s+(\/[a-zA-Z0-9\/_-]*[a-zA-Z0-9])/g,
        /\bapi\s*[\/.]([a-zA-Z0-9_\/.-]+)/gi,
        /\b([a-zA-Z0-9_-]+)\s*(API|api|Api)\b/g,
        /\bhttps?:\/\/[a-zA-Z0-9.-]+\/api\/[a-zA-Z0-9\/_-]*/g,
      ],
      
      // Enhanced project patterns
      project: [
        ...memory.tags.filter(tag => tag.length > 2 && tag.length < 30).map(tag => new RegExp(`\\b${tag.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi')),
        /\bproject[:\s]+([a-zA-Z0-9_-]{3,30})/gi,
        /\brepo[sitory]*[:\s]+([a-zA-Z0-9_-]{3,50})/gi,
        /\b([A-Z][a-zA-Z0-9_-]{2,25})\s+(project|app|application|service|website|platform)\b/gi,
      ],
      
      // Enhanced people patterns
      person: [
        /\b([A-Z][a-z]{2,20}\s+[A-Z][a-z]{2,20}(?:\s+[A-Z][a-z]{2,20})?)\b/g, // First Last [Middle]
        /\b@([a-zA-Z0-9_-]{2,20})\b/g, // @username
        /\bby\s+([A-Z][a-z]{2,20}(?:\s+[A-Z][a-z]{2,20})?)/g, // "by John Doe"
        /\b(author|creator|developer|maintainer|contributor)[:\s]+([A-Z][a-z]{2,20}(?:\s+[A-Z][a-z]{2,20})?)/gi,
        /\b(CEO|CTO|VP|Director|Manager|Lead|Senior|Junior)\s+([A-Z][a-z]{2,20}(?:\s+[A-Z][a-z]{2,20})?)/gi,
      ],
      
      // Enhanced organization patterns
      organization: [
        /\b([A-Z][a-zA-Z\s&]{2,40})\s+(Inc\.?|Corp\.?|LLC|Ltd\.?|Company|Corporation|Technologies|Solutions|Systems|Software|Labs|Group|Team|Studio|Agency|Consulting)\b/g,
        /\b(Google|Microsoft|Apple|Amazon|Meta|Facebook|Twitter|LinkedIn|GitHub|GitLab|Atlassian|JetBrains|MongoDB|Oracle|IBM|Intel|NVIDIA|AMD|Tesla|Netflix|Spotify|Airbnb|Uber|Stripe|Shopify|Slack|Discord|Zoom|Salesforce|Adobe|Figma|Canva|Notion|Airtable|Vercel|Netlify)\b/gi,
        /\b([A-Z][a-zA-Z\s]{2,30})\s+(University|College|Institute|Foundation|Organization)\b/g,
      ],
      
      // Enhanced database patterns
      database: [
        /\b([a-zA-Z_][a-zA-Z0-9_]*)\s+(database|db|table|collection|schema|index)\b/gi,
        /\b(users|customers|products|orders|payments|accounts|profiles|sessions|logs|events|notifications|messages|posts|comments|likes|follows|friends|groups|teams|projects|tasks|files|documents|images|videos|analytics|metrics)(?:\s+(?:table|collection|model|entity|schema))?\b/gi,
      ],
      
      // Service patterns
      service: [
        /\b([A-Z][a-zA-Z0-9_-]{2,30})\s+(Service|Worker|Job|Queue|Handler|Processor|Consumer|Producer|Publisher|Subscriber|Gateway|Proxy|Balancer|Router|Middleware|Filter|Validator|Transformer|Mapper|Adapter|Repository|Factory|Builder|Manager|Controller|Provider|Client|SDK|Library|Package|Module|Plugin|Extension|Component|Widget|Hook|Utility|Helper)\b/gi,
        /\b(authentication|authorization|payment|notification|email|sms|logging|monitoring|analytics|caching|storage|backup|sync|migration|import|export|search|recommendation|suggestion|prediction|classification|detection|recognition|translation|compression|encryption|decryption|validation|verification|sanitization|optimization|parsing|rendering|serialization|deserialization)\s+(service|system|engine|provider|handler|processor|manager|client)\b/gi,
      ],
      
      // Concept patterns
      concept: [
        /\b(design pattern|algorithm|data structure|architecture|methodology|principle|practice|paradigm|strategy|approach|technique|framework|model|system|protocol|standard|specification|convention|guideline|best practice|anti-pattern|code smell|refactoring|optimization|performance|scalability|security|reliability|maintainability|testability|usability|accessibility|responsive design|mobile-first|progressive enhancement|graceful degradation|separation of concerns|single responsibility|open-closed|liskov substitution|interface segregation|dependency inversion|dry|kiss|yagni|solid|mvc|mvp|mvvm|flux|redux|observer|singleton|factory|builder|adapter|decorator|facade|proxy|command|strategy|template method|visitor|iterator|composite|bridge|flyweight|chain of responsibility|mediator|memento|state|prototype|abstract factory)\b/gi,
        /\b(agile|scrum|kanban|waterfall|devops|ci\/cd|tdd|bdd|ddd|cqrs|event sourcing|microservices|monolith|serverless|jamstack|headless|api-first|mobile-first|cloud-native|twelve-factor|container-first|infrastructure as code|gitops|chatops|shift-left|fail-fast|blue-green|canary|rolling|feature flag|circuit breaker|bulkhead|timeout|retry|rate limiting|load balancing|auto-scaling|health check|monitoring|alerting|logging|tracing|profiling|debugging|testing|staging|production|deployment|rollback|hotfix|patch|release|versioning|branching|merging|pull request|code review|pair programming|mob programming|rubber duck debugging)\b/gi,
      ],
      
      // Repository patterns
      repository: [
        /\b([a-zA-Z0-9_-]{2,50})\s+(repository|repo|git|github|gitlab|bitbucket|source code|codebase)\b/gi,
        /\bgithub\.com\/([a-zA-Z0-9_-]+\/[a-zA-Z0-9_.-]+)/gi,
        /\bgitlab\.com\/([a-zA-Z0-9_-]+\/[a-zA-Z0-9_.-]+)/gi,
        /\bbitbucket\.org\/([a-zA-Z0-9_-]+\/[a-zA-Z0-9_.-]+)/gi,
      ],
    };

    // Extract entities with enhanced confidence scoring and deduplication
    const entityMap = new Map<string, Omit<KnowledgeGraphEntity, 'id' | 'createdAt' | 'updatedAt'>>();
    
    Object.entries(patterns).forEach(([type, typePatterns]) => {
      typePatterns.forEach(pattern => {
        const matches = Array.from(content.matchAll(new RegExp(pattern.source, pattern.flags + 'g')));
        
        matches.forEach(match => {
          const fullMatch = match[0];
          const capturedGroups = match.slice(1);
          
          // Extract the actual entity name from captured groups or full match
          let entityName = capturedGroups.find(group => group && group.trim()) || fullMatch;
          entityName = this.cleanEntityName(entityName, type as EntityType);
          
          if (this.isValidEntity(entityName, type as EntityType)) {
            const entityKey = `${type}:${entityName.toLowerCase()}`;
            
            // Calculate confidence based on multiple factors
            const confidence = this.calculateEntityConfidence(entityName, type as EntityType, match, content, memory);
            
            // Get context around the match
            const matchIndex = match.index || 0;
            const context = content.substring(
              Math.max(0, matchIndex - 75), 
              matchIndex + fullMatch.length + 75
            ).trim();
            
            // Merge or create entity
            if (entityMap.has(entityKey)) {
              const existing = entityMap.get(entityKey)!;
              existing.confidence = Math.max(existing.confidence, confidence);
              existing.observations.push(`Mentioned in memory: ${memory.title} (context: ${context.substring(0, 100)}...)`);
              if (!existing.memoryIds.includes(memory.id)) {
                existing.memoryIds.push(memory.id);
              }
            } else {
              entityMap.set(entityKey, {
                name: entityName,
                type: type as EntityType,
                properties: {
                  extractedFrom: memory.type,
                  context,
                  source: fullMatch,
                  pattern: pattern.source,
                  language: metadata.language,
                  framework: metadata.framework,
                  project: metadata.project,
                  firstSeenInMemory: memory.id
                },
                observations: [`Mentioned in memory: ${memory.title} (context: ${context.substring(0, 100)}...)`],
                confidence,
                memoryIds: [memory.id]
              });
            }
          }
        });
      });
    });

    // Convert map to array and filter by minimum confidence
    const filteredEntities = Array.from(entityMap.values()).filter(entity => {
      // Apply minimum confidence thresholds by entity type
      const minConfidenceThresholds = {
        technology: 0.6,
        person: 0.5,
        organization: 0.6,
        project: 0.7,
        file: 0.8,
        api: 0.6,
        database: 0.6,
        service: 0.5,
        concept: 0.4,
        repository: 0.7,
        location: 0.6,
        site: 0.7,
        document: 0.8
      };
      
      return entity.confidence >= (minConfidenceThresholds[entity.type] || 0.5);
    });

    extractedEntities.push(...filteredEntities);

    // Create entities in database
    const createdEntities: KnowledgeGraphEntity[] = [];
    for (const entityData of extractedEntities) {
      try {
        // Check if entity already exists
        const existing = await this.findEntityByName(entityData.name, entityData.type);
        if (existing) {
          // Update existing entity with new memory reference
          if (!existing.memoryIds.includes(memory.id)) {
            existing.memoryIds.push(memory.id);
            existing.observations.push(`Mentioned in memory: ${memory.title}`);
            await this.updateEntity(existing.id, {
              memoryIds: existing.memoryIds,
              observations: existing.observations,
              updatedAt: new Date()
            });
          }
          createdEntities.push(existing);
        } else {
          // Create new entity
          const newEntity = await this.createEntity(entityData);
          createdEntities.push(newEntity);
        }
      } catch (error) {
        this.logger.warn('Failed to create entity during extraction', { entityName: entityData.name, error });
      }
    }

    // Infer relationships between extracted entities
    if (createdEntities.length > 1) {
      await this.inferRelationshipsFromMemory(memory, createdEntities);
    }

    this.logger.debug('Extracted entities from memory', { 
      memoryId: memory.id, 
      entitiesCount: createdEntities.length 
    });

    return createdEntities;
  }

  private cleanEntityName(name: string, type: EntityType): string {
    // Clean and normalize entity names based on type
    let cleaned = name.trim();
    
    switch (type) {
      case 'technology':
        // Remove common prefixes/suffixes
        cleaned = cleaned.replace(/^(the\s+|a\s+)/gi, '');
        cleaned = cleaned.replace(/\s+(framework|library|tool|language|platform)$/gi, '');
        break;
        
      case 'person':
        // Clean person names
        cleaned = cleaned.replace(/^@/, ''); // Remove @ prefix
        cleaned = cleaned.replace(/\s+(developer|engineer|manager|lead|senior|junior)$/gi, '');
        break;
        
      case 'file':
        // Normalize file paths
        cleaned = cleaned.replace(/^[.\/]+/, ''); // Remove leading dots and slashes
        break;
        
      case 'api':
        // Clean API names
        cleaned = cleaned.replace(/\s+(api|endpoint|service)$/gi, '');
        cleaned = cleaned.replace(/^(\/api\/|api\/)/gi, '');
        break;
        
      case 'organization':
        // Clean organization names
        cleaned = cleaned.replace(/\s+(inc\.?|corp\.?|llc|ltd\.?|company)$/gi, '');
        break;
        
      case 'repository':
        // Clean repository names
        cleaned = cleaned.replace(/^(github\.com\/|gitlab\.com\/|bitbucket\.org\/)/gi, '');
        break;
    }
    
    // General cleaning
    cleaned = cleaned.replace(/[^\w\s\-\.\/]/g, ''); // Remove special chars except common ones
    cleaned = cleaned.replace(/\s+/g, ' ').trim(); // Normalize whitespace
    
    return cleaned;
  }

  private isValidEntity(name: string, type: EntityType): boolean {
    // Validate entity based on type-specific rules
    if (!name || name.length < 2) return false;
    
    // Filter out common words that aren't entities
    const commonWords = new Set([
      'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by',
      'from', 'up', 'about', 'into', 'over', 'after', 'beneath', 'under', 'above',
      'this', 'that', 'these', 'those', 'is', 'are', 'was', 'were', 'be', 'been',
      'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should',
      'may', 'might', 'must', 'can', 'shall', 'new', 'old', 'first', 'last', 'other',
      'many', 'few', 'more', 'most', 'some', 'any', 'all', 'no', 'not', 'only', 'own',
      'same', 'so', 'than', 'too', 'very', 'just', 'now', 'here', 'there', 'where',
      'how', 'why', 'what', 'when', 'who', 'which', 'if', 'then', 'else', 'each',
      'every', 'both', 'either', 'neither', 'one', 'two', 'three', 'four', 'five',
      'six', 'seven', 'eight', 'nine', 'ten', 'between', 'during', 'before', 'since',
      'until', 'through', 'across', 'around', 'without', 'within', 'upon', 'against',
      'toward', 'towards', 'off', 'down', 'out', 'back', 'way', 'much', 'well',
      'also', 'still', 'even', 'again', 'once', 'always', 'never', 'often', 'sometimes',
      'usually', 'already', 'yet', 'soon', 'today', 'tomorrow', 'yesterday', 'good',
      'bad', 'big', 'small', 'long', 'short', 'high', 'low', 'right', 'left', 'next',
      'true', 'false', 'yes', 'no', 'ok', 'okay', 'sure', 'maybe', 'perhaps', 'probably'
    ]);
    
    if (commonWords.has(name.toLowerCase())) return false;
    
    // Type-specific validation
    switch (type) {
      case 'technology':
        // Must be at least 2 chars, not all numbers
        return name.length >= 2 && !/^\d+$/.test(name);
        
      case 'person':
        // Must contain at least one letter, reasonable length
        return /[a-zA-Z]/.test(name) && name.length >= 2 && name.length <= 50;
        
      case 'file':
        // Must have file extension or be a reasonable path
        return /\.[a-zA-Z0-9]+$/.test(name) || /\//.test(name);
        
      case 'api':
        // Must be reasonable API name/path
        return name.length >= 3 && name.length <= 100;
        
      case 'organization':
        // Must be reasonable organization name
        return name.length >= 3 && name.length <= 100 && /[a-zA-Z]/.test(name);
        
      case 'project':
        // Must be reasonable project name
        return name.length >= 2 && name.length <= 50 && !/^\d+$/.test(name);
        
      case 'database':
        // Must be reasonable database/table name
        return name.length >= 2 && name.length <= 50 && /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(name);
        
      case 'service':
        // Must be reasonable service name
        return name.length >= 3 && name.length <= 100;
        
      case 'concept':
        // Must be reasonable concept name
        return name.length >= 3 && name.length <= 100;
        
      case 'repository':
        // Must be reasonable repo name
        return name.length >= 3 && name.length <= 100;
        
      default:
        return name.length >= 2 && name.length <= 100;
    }
  }

  private calculateEntityConfidence(
    name: string, 
    type: EntityType, 
    match: RegExpMatchArray, 
    content: string, 
    memory: Memory
  ): number {
    let confidence = 0.5; // Base confidence
    
    // Boost confidence based on various factors
    
    // 1. Context clues
    const contextWords = {
      technology: ['using', 'built with', 'framework', 'library', 'language', 'tech stack', 'powered by'],
      person: ['by', 'author', 'developer', 'created by', 'maintained by', 'contributor'],
      organization: ['company', 'team', 'organization', 'corp', 'inc', 'founded'],
      project: ['project', 'application', 'app', 'system', 'platform', 'website'],
      api: ['endpoint', 'api', 'service', 'request', 'response', 'call'],
      database: ['database', 'table', 'collection', 'schema', 'model', 'entity'],
      service: ['service', 'microservice', 'worker', 'job', 'queue', 'handler'],
      concept: ['pattern', 'methodology', 'approach', 'principle', 'practice'],
      repository: ['repository', 'repo', 'github', 'gitlab', 'source code', 'codebase'],
      file: ['file', 'import', 'require', 'include', 'load', 'path'],
      location: ['location', 'place', 'region', 'city', 'office', 'building', 'address'],
      site: ['site', 'sharepoint', 'portal', 'website', 'collaboration', 'workspace'],
      document: ['document', 'file', 'pdf', 'word', 'excel', 'report', 'specification']
    };
    
    const typeContextWords = contextWords[type] || [];
    const surroundingText = content.substring(
      Math.max(0, (match.index || 0) - 100),
      (match.index || 0) + match[0].length + 100
    ).toLowerCase();
    
    const contextMatches = typeContextWords.filter((word: string) => 
      surroundingText.includes(word.toLowerCase())
    ).length;
    
    confidence += contextMatches * 0.1;
    
    // 2. Position in content (title mentions are more confident)
    if (memory.title.toLowerCase().includes(name.toLowerCase())) {
      confidence += 0.2;
    }
    
    // 3. Frequency in content
    const occurrences = (content.match(new RegExp(name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi')) || []).length;
    if (occurrences > 1) {
      confidence += Math.min(0.2, occurrences * 0.05);
    }
    
    // 4. Memory type relevance
    const typeRelevance = {
      technology: ['CODE_SNIPPET', 'DOCUMENTATION', 'PROJECT_CONTEXT', 'DEBUG_SESSION'],
      person: ['MEETING_NOTES', 'DECISION', 'PROJECT_CONTEXT'],
      organization: ['MEETING_NOTES', 'DECISION', 'PROJECT_CONTEXT'],
      project: ['PROJECT_CONTEXT', 'DOCUMENTATION', 'MEETING_NOTES'],
      api: ['API_CALL', 'CODE_SNIPPET', 'DOCUMENTATION'],
      database: ['CODE_SNIPPET', 'PROJECT_CONTEXT', 'DOCUMENTATION'],
      service: ['PROJECT_CONTEXT', 'CODE_SNIPPET', 'DOCUMENTATION'],
      concept: ['DOCUMENTATION', 'MEETING_NOTES', 'DECISION'],
      repository: ['PROJECT_CONTEXT', 'CODE_SNIPPET'],
      file: ['CODE_SNIPPET', 'PROJECT_CONTEXT', 'COMMAND'],
      location: ['MEETING_NOTES', 'PROJECT_CONTEXT', 'DECISION'],
      site: ['PROJECT_CONTEXT', 'DOCUMENTATION', 'MEETING_NOTES'],
      document: ['DOCUMENTATION', 'PROJECT_CONTEXT', 'MEETING_NOTES']
    };
    
    if (typeRelevance[type]?.includes(memory.type)) {
      confidence += 0.15;
    }
    
    // 5. Metadata alignment
    if (memory.metadata) {
      if (type === 'technology' && memory.metadata.language && name.toLowerCase().includes(memory.metadata.language.toLowerCase())) {
        confidence += 0.1;
      }
      if (type === 'project' && memory.metadata.project && name.toLowerCase().includes(memory.metadata.project.toLowerCase())) {
        confidence += 0.2;
      }
      if (type === 'file' && memory.metadata.filePath && name.includes(memory.metadata.filePath)) {
        confidence += 0.2;
      }
    }
    
    // 6. Pattern strength
    if (match[0].length > 20) { // Longer matches are often more specific
      confidence += 0.1;
    }
    
    // 7. Capitalization patterns (for proper nouns)
    if (type === 'person' || type === 'organization' || type === 'technology') {
      if (/^[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*$/.test(name)) {
        confidence += 0.1; // Proper capitalization
      }
    }
    
    // Cap confidence at 0.95 (never 100% certain from pattern matching)
    return Math.min(0.95, confidence);
  }

  async inferRelationshipsFromMemory(memory: Memory, entities: KnowledgeGraphEntity[]): Promise<KnowledgeGraphRelation[]> {
    const inferencedRelations: KnowledgeGraphRelation[] = [];
    const content = `${memory.title} ${memory.content}`.toLowerCase();

    // Relationship inference patterns based on content analysis
    const relationshipPatterns = {
      // Technology dependency patterns
      depends_on: [
        /(\w+)\s+(?:depends on|requires|needs|uses)\s+(\w+)/gi,
        /import\s+.*from\s+['"]([^'"]+)['"]/gi, // JS/TS imports
        /from\s+(\w+)\s+import/gi, // Python imports
        /using\s+(\w+)/gi, // C# using
      ],
      
      // Creation patterns
      created_by: [
        /(\w+)\s+(?:created|built|developed|written)\s+by\s+(\w+)/gi,
        /(\w+)\s+author[s]?\s*:\s*(\w+)/gi,
      ],
      
      // Work patterns
      works_on: [
        /(\w+)\s+(?:works on|working on|maintains|manages)\s+(\w+)/gi,
        /(\w+)\s+(?:is working on|is developing)\s+(\w+)/gi,
      ],
      
      // Implementation patterns
      implements: [
        /(\w+)\s+(?:implements|extends|inherits from)\s+(\w+)/gi,
        /class\s+(\w+)\s+extends\s+(\w+)/gi,
        /(\w+)\s+(?:interface|protocol)\s+(\w+)/gi,
      ],
      
      // Usage patterns
      uses: [
        /(\w+)\s+(?:uses|utilizes|leverages)\s+(\w+)/gi,
        /built\s+with\s+(\w+)/gi,
        /powered\s+by\s+(\w+)/gi,
      ],
      
      // API call patterns
      calls: [
        /(\w+)\s+(?:calls|invokes|requests)\s+(\w+)/gi,
        /(\w+)\.(\w+)\(/gi, // Method calls
        /(\w+)\s+api/gi,
      ],
      
      // Container/ownership patterns
      belongs_to: [
        /(\w+)\s+(?:belongs to|is part of|is in)\s+(\w+)/gi,
        /(\w+)\s+(?:project|repository|module)/gi,
      ],
      
      // Collaboration patterns
      collaborates_with: [
        /(\w+)\s+(?:collaborates with|works with|partners with)\s+(\w+)/gi,
        /(\w+)\s+and\s+(\w+)\s+(?:team|project|work)/gi,
      ],
    };

    // Infer relationships between entities based on patterns
    for (let i = 0; i < entities.length; i++) {
      for (let j = i + 1; j < entities.length; j++) {
        const entity1 = entities[i];
        const entity2 = entities[j];
        
        // Try to infer relationships using patterns
        for (const [relationType, patterns] of Object.entries(relationshipPatterns)) {
          for (const pattern of patterns) {
            const matches = content.match(pattern);
            if (matches) {
              for (const match of matches) {
                const words = match.toLowerCase().split(/\s+/);
                const entity1Name = entity1.name.toLowerCase();
                const entity2Name = entity2.name.toLowerCase();
                
                if (words.some(word => word.includes(entity1Name)) && 
                    words.some(word => word.includes(entity2Name))) {
                  
                  // Determine direction based on pattern and entity types
                  const relationship = this.determineRelationshipDirection(
                    entity1, entity2, relationType as RelationType, match
                  );
                  
                  if (relationship) {
                    try {
                      const existingRelation = await this.findExistingRelation(
                        relationship.fromEntityId, relationship.toEntityId, relationship.type
                      );
                      
                      if (!existingRelation) {
                        const newRelation = await this.createRelation(relationship);
                        inferencedRelations.push(newRelation);
                        
                        this.logger.debug('Inferred relationship', {
                          type: relationship.type,
                          from: entity1.name,
                          to: entity2.name,
                          memory: memory.title
                        });
                      }
                    } catch (error) {
                      this.logger.warn('Failed to create inferred relationship', error);
                    }
                  }
                }
              }
            }
          }
        }
        
        // Infer relationships based on entity types and co-occurrence
        const typeBasedRelation = this.inferRelationshipByType(entity1, entity2, memory);
        if (typeBasedRelation) {
          try {
            const existingRelation = await this.findExistingRelation(
              typeBasedRelation.fromEntityId, typeBasedRelation.toEntityId, typeBasedRelation.type
            );
            
            if (!existingRelation) {
              const newRelation = await this.createRelation(typeBasedRelation);
              inferencedRelations.push(newRelation);
            }
          } catch (error) {
            this.logger.warn('Failed to create type-based relationship', error);
          }
        }
      }
    }

    return inferencedRelations;
  }

  private determineRelationshipDirection(
    entity1: KnowledgeGraphEntity,
    entity2: KnowledgeGraphEntity,
    relationType: RelationType,
    context: string
  ): Omit<KnowledgeGraphRelation, 'id' | 'createdAt' | 'updatedAt'> | null {
    
    // Determine relationship direction based on entity types and context
    let fromEntity = entity1;
    let toEntity = entity2;
    let strength = 0.5; // Default strength
    let confidence = 0.6; // Default confidence for pattern-based inference

    // Relationship direction rules based on entity types
    switch (relationType) {
      case 'created_by':
        // Person creates project/technology/file
        if (entity1.type === 'person' && ['project', 'technology', 'file'].includes(entity2.type)) {
          fromEntity = entity2; toEntity = entity1; // Project created_by Person
        } else if (entity2.type === 'person' && ['project', 'technology', 'file'].includes(entity1.type)) {
          fromEntity = entity1; toEntity = entity2; // Project created_by Person
        }
        strength = 0.8;
        break;
        
      case 'depends_on':
        // Technology depends on other technology
        if (entity1.type === 'technology' && entity2.type === 'technology') {
          // Determine based on context or keep default
          strength = 0.7;
        }
        break;
        
      case 'belongs_to':
        // File belongs to project, person belongs to organization
        if (entity1.type === 'file' && entity2.type === 'project') {
          fromEntity = entity1; toEntity = entity2;
        } else if (entity2.type === 'file' && entity1.type === 'project') {
          fromEntity = entity2; toEntity = entity1;
        } else if (entity1.type === 'person' && entity2.type === 'organization') {
          fromEntity = entity1; toEntity = entity2;
        } else if (entity2.type === 'person' && entity1.type === 'organization') {
          fromEntity = entity2; toEntity = entity1;
        }
        strength = 0.9;
        break;
        
      case 'uses':
        // Project uses technology, person uses technology
        if (['project', 'person'].includes(entity1.type) && entity2.type === 'technology') {
          fromEntity = entity1; toEntity = entity2;
        } else if (['project', 'person'].includes(entity2.type) && entity1.type === 'technology') {
          fromEntity = entity2; toEntity = entity1;
        }
        strength = 0.6;
        break;
        
      case 'works_on':
        // Person works on project
        if (entity1.type === 'person' && entity2.type === 'project') {
          fromEntity = entity1; toEntity = entity2;
        } else if (entity2.type === 'person' && entity1.type === 'project') {
          fromEntity = entity2; toEntity = entity1;
        }
        strength = 0.8;
        break;
    }

    return {
      fromEntityId: fromEntity.id,
      toEntityId: toEntity.id,
      type: relationType,
      properties: {
        inferenceMethod: 'pattern-based',
        context: context.substring(0, 200),
        confidence_reason: 'Pattern matching in memory content'
      },
      strength,
      confidence,
      memoryIds: [fromEntity.memoryIds[0]] // Use the memory that created the relationship
    };
  }

  private inferRelationshipByType(
    entity1: KnowledgeGraphEntity,
    entity2: KnowledgeGraphEntity,
    memory: Memory
  ): Omit<KnowledgeGraphRelation, 'id' | 'createdAt' | 'updatedAt'> | null {
    
    // Infer relationships based on entity type combinations and memory type
    const type1 = entity1.type;
    const type2 = entity2.type;
    
    // Common type-based relationship patterns
    const typeRelationships: Array<{
      types: [EntityType, EntityType];
      relation: RelationType;
      strength: number;
      confidence: number;
    }> = [
      // Technology relationships
      { types: ['technology', 'technology'], relation: 'related_to', strength: 0.4, confidence: 0.5 },
      { types: ['project', 'technology'], relation: 'uses', strength: 0.6, confidence: 0.6 },
      { types: ['file', 'technology'], relation: 'uses', strength: 0.5, confidence: 0.5 },
      
      // Project relationships
      { types: ['project', 'file'], relation: 'contains', strength: 0.7, confidence: 0.7 },
      { types: ['project', 'api'], relation: 'contains', strength: 0.6, confidence: 0.6 },
      { types: ['project', 'repository'], relation: 'related_to', strength: 0.8, confidence: 0.8 },
      
      // Organizational relationships
      { types: ['person', 'organization'], relation: 'belongs_to', strength: 0.7, confidence: 0.6 },
      { types: ['project', 'organization'], relation: 'belongs_to', strength: 0.6, confidence: 0.6 },
      
      // API relationships
      { types: ['api', 'service'], relation: 'belongs_to', strength: 0.7, confidence: 0.7 },
      { types: ['api', 'database'], relation: 'uses', strength: 0.6, confidence: 0.6 },
    ];

    // Find matching relationship pattern
    for (const pattern of typeRelationships) {
      const [type_a, type_b] = pattern.types;
      let fromEntity = entity1;
      let toEntity = entity2;
      
      if ((type1 === type_a && type2 === type_b)) {
        // Direct match
      } else if ((type1 === type_b && type2 === type_a)) {
        // Reverse match
        fromEntity = entity2;
        toEntity = entity1;
      } else {
        continue; // No match
      }

      return {
        fromEntityId: fromEntity.id,
        toEntityId: toEntity.id,
        type: pattern.relation,
        properties: {
          inferenceMethod: 'type-based',
          memoryType: memory.type,
          confidence_reason: `Inferred from entity types: ${type1} and ${type2}`
        },
        strength: pattern.strength,
        confidence: pattern.confidence,
        memoryIds: [memory.id]
      };
    }

    return null;
  }

  private async findExistingRelation(
    fromEntityId: string,
    toEntityId: string,
    relationType: RelationType
  ): Promise<KnowledgeGraphRelation | null> {
    try {
      const stmt = this.db.prepare(`
        SELECT * FROM kg_relations 
        WHERE from_entity_id = ? AND to_entity_id = ? AND type = ?
        LIMIT 1
      `);
      
      const row = stmt.get(fromEntityId, toEntityId, relationType) as any;
      return row ? this.rowToRelation(row) : null;
    } catch (error) {
      this.logger.error('Failed to find existing relation', error);
      return null;
    }
  }

  async findEntityByName(name: string, type?: EntityType): Promise<KnowledgeGraphEntity | null> {
    try {
      let query = 'SELECT * FROM kg_entities WHERE LOWER(name) = LOWER(?)';
      const params: any[] = [name];
      
      if (type) {
        query += ' AND type = ?';
        params.push(type);
      }
      
      query += ' ORDER BY confidence DESC LIMIT 1';

      const stmt = this.db.prepare(query);
      const row = stmt.get(...params) as any;
      
      if (!row) return null;
      
      return this.rowToEntity(row);
    } catch (error) {
      this.logger.error('Failed to find entity by name', error);
      return null;
    }
  }

  async updateEntity(id: string, updates: Partial<KnowledgeGraphEntity>): Promise<KnowledgeGraphEntity | null> {
    try {
      const existing = await this.getEntity(id);
      if (!existing) return null;

      const updated = { ...existing, ...updates, updatedAt: new Date() };

      const stmt = this.db.prepare(`
        UPDATE kg_entities 
        SET name = ?, type = ?, properties = ?, observations = ?, confidence = ?, updated_at = ?, memory_ids = ?
        WHERE id = ?
      `);

      stmt.run(
        updated.name,
        updated.type,
        JSON.stringify(updated.properties),
        JSON.stringify(updated.observations),
        updated.confidence,
        updated.updatedAt.getTime(),
        JSON.stringify(updated.memoryIds),
        id
      );

      return updated;
    } catch (error) {
      this.logger.error('Failed to update entity', error);
      return null;
    }
  }

  async getGraphStatistics(): Promise<{
    entityCount: number;
    relationCount: number;
    entityTypes: Record<EntityType, number>;
    relationTypes: Record<RelationType, number>;
    avgRelationsPerEntity: number;
  }> {
    try {
      const entityCountStmt = this.db.prepare('SELECT COUNT(*) as count FROM kg_entities');
      const relationCountStmt = this.db.prepare('SELECT COUNT(*) as count FROM kg_relations');
      
      const entityTypesStmt = this.db.prepare(`
        SELECT type, COUNT(*) as count 
        FROM kg_entities 
        GROUP BY type
      `);
      
      const relationTypesStmt = this.db.prepare(`
        SELECT type, COUNT(*) as count 
        FROM kg_relations 
        GROUP BY type
      `);

      const entityCount = (entityCountStmt.get() as any).count;
      const relationCount = (relationCountStmt.get() as any).count;
      
      const entityTypeRows = entityTypesStmt.all() as any[];
      const relationTypeRows = relationTypesStmt.all() as any[];
      
      const entityTypes: Record<EntityType, number> = {} as Record<EntityType, number>;
      entityTypeRows.forEach(row => {
        entityTypes[row.type as EntityType] = row.count;
      });
      
      const relationTypes: Record<RelationType, number> = {} as Record<RelationType, number>;
      relationTypeRows.forEach(row => {
        relationTypes[row.type as RelationType] = row.count;
      });

      return {
        entityCount,
        relationCount,
        entityTypes,
        relationTypes,
        avgRelationsPerEntity: entityCount > 0 ? relationCount / entityCount : 0
      };
    } catch (error) {
      this.logger.error('Failed to get graph statistics', error);
      return {
        entityCount: 0,
        relationCount: 0,
        entityTypes: {} as Record<EntityType, number>,
        relationTypes: {} as Record<RelationType, number>,
        avgRelationsPerEntity: 0
      };
    }
  }

  private rowToEntity(row: any): KnowledgeGraphEntity {
    return {
      id: row.id,
      name: row.name,
      type: row.type as EntityType,
      properties: this.safeJsonParse(row.properties, {}),
      observations: this.safeJsonParse(row.observations, []),
      confidence: row.confidence,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
      memoryIds: this.safeJsonParse(row.memory_ids, [])
    };
  }

  private rowToRelation(row: any): KnowledgeGraphRelation {
    return {
      id: row.id,
      fromEntityId: row.from_entity_id,
      toEntityId: row.to_entity_id,
      type: row.type as RelationType,
      properties: this.safeJsonParse(row.properties, {}),
      strength: row.strength,
      confidence: row.confidence,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
      memoryIds: this.safeJsonParse(row.memory_ids, [])
    };
  }

  /**
   * Get all entities in the knowledge graph
   */
  async getAllEntities(): Promise<KnowledgeGraphEntity[]> {
    try {
      const stmt = this.db.prepare(`
        SELECT * FROM kg_entities
        ORDER BY name ASC
      `);

      const rows = stmt.all();
      return rows.map(row => this.rowToEntity(row));
    } catch (error) {
      this.logger.error('Failed to get all entities', error);
      return [];
    }
  }

  /**
   * Get all relationships in the knowledge graph
   */
  async getAllRelationships(): Promise<KnowledgeGraphRelation[]> {
    try {
      const stmt = this.db.prepare(`
        SELECT * FROM kg_relations
        ORDER BY created_at DESC
      `);

      const rows = stmt.all();
      return rows.map(row => this.rowToRelation(row));
    } catch (error) {
      this.logger.error('Failed to get all relationships', error);
      return [];
    }
  }

  private safeJsonParse(jsonString: string, fallback: any): any {
    try {
      return JSON.parse(jsonString || JSON.stringify(fallback));
    } catch (error) {
      return fallback;
    }
  }
}