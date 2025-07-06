# DevMemory Architecture Documentation

## Current Architecture (Enterprise Hybrid v3.0)

### System Overview
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   VSCode Ext    │    │  Desktop App    │    │ Microsoft 365   │
│   (Capture)     │◄──►│   (Electron)    │◄──►│ (Enterprise)    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                              │                         │
                              ▼                         ▼
                    ┌─────────────────┐    ┌─────────────────┐
                    │ Hybrid Database │    │    M365 Graph   │
                    │ SQLite+ChromaDB │    │      API        │
                    └─────────────────┘    └─────────────────┘
                              │                         │
                              ▼                         ▼
                    ┌─────────────────┐    ┌─────────────────┐
                    │  Knowledge      │    │  AWS Bedrock    │
                    │     Graph       │    │ (Embeddings)    │
                    └─────────────────┘    └─────────────────┘
```

### Current Technology Stack (v3.0 - Enterprise Hybrid with M365 Integration)

#### Frontend (Renderer Process)
- **React 18** - UI framework with hooks and context
- **TypeScript** - Type safety and developer experience
- **Tailwind CSS** - Utility-first styling
- **Lucide React** - Icon library
- **React Router** - Client-side routing
- **Enhanced Knowledge Graph** - Interactive entity-relationship visualization
- **M365 Integration UI** - Enterprise authentication and sync controls

#### Backend (Main Process)
- **Electron** - Cross-platform desktop framework
- **Node.js** - JavaScript runtime
- **Hybrid Database Manager** - Orchestrates all data systems
- **better-sqlite3** - Fast, synchronous SQLite interface
- **ChromaDB** - Professional vector database with HNSW indexing
- **Knowledge Graph Engine** - Entity-relationship modeling
- **M365 Integration Services** - Enterprise content synchronization

#### Data Storage (Hybrid Architecture)
- **SQLite Database** - Primary structured storage
  - Memories table with FTS5 (Full-Text Search)
  - Knowledge graph tables (entities, relationships)
  - M365 metadata and sync tracking
  - Metadata and indexes for performance
- **ChromaDB Vector Store** - Professional semantic search
  - HNSW indexing for 10-100x performance improvement
  - Multiple embedding provider support
  - Local persistent storage with automatic migration
  - M365 content vectorization and indexing
- **Knowledge Graph System** - Entity relationships
  - Automatic entity extraction from content and M365 data
  - Relationship inference using pattern analysis
  - Graph traversal queries with confidence scoring
  - M365 entity mapping (people, organizations, projects)

#### AI Integration
- **AWS Bedrock** - Cloud embedding generation
  - Amazon Titan Text Embeddings (primary)
  - Multiple embedding provider support
  - Fallback to local hash-based embeddings
  - Graceful degradation when offline
- **Entity Extraction Engine** - Advanced pattern-based NLP
  - Technology, person, project, concept detection
  - Contextual relationship inference
  - Confidence scoring and validation
  - M365-specific entity extraction (emails, meetings, teams)

#### Enterprise Integration
- **Microsoft 365 Authentication** - MSAL-Electron based OAuth
  - Authorization Code + PKCE flow for desktop apps
  - Conditional access and MFA support
  - Enterprise security policy compliance
  - Automatic token refresh and validation
- **Microsoft Graph API Client** - Unified M365 data access
  - Email intelligence from Outlook
  - Calendar context and meeting insights
  - Teams collaboration knowledge mining
  - SharePoint document intelligence
  - Organization chart and people insights
- **M365 Synchronization Engine** - Intelligent content sync
  - Full and incremental synchronization
  - Conflict resolution strategies
  - Real-time progress tracking
  - Configurable sync options and schedules

### Data Flow Architecture (v3.0 - Enterprise Hybrid with M365)

#### Memory Creation Flow
```
1. Content Sources:
   - User Input (VSCode/Desktop)
   - M365 Synchronization (emails, meetings, teams)
2. Validation & Processing → 
3. Hybrid Database Manager:
   a. Store in SQLite (primary storage)
   b. Generate embeddings (AWS Bedrock/local)
   c. Store vectors in ChromaDB
   d. Extract entities & relationships (including M365 entities)
   e. Update knowledge graph with cross-platform relationships
4. Update UI with new connections and M365 insights
```

#### M365 Synchronization Flow
```
1. M365 Authentication (MSAL + OAuth) →
2. Graph API Content Fetching:
   - Emails from Outlook
   - Calendar events and meetings
   - Teams conversations and channels
   - SharePoint documents and sites
3. Entity Mapping & Transformation:
   - Extract people, organizations, projects from M365 content
   - Map M365 content types to DevMemory memory types
   - Create contextual relationships (email communication, meeting attendance)
4. Sync Engine Processing:
   - Conflict resolution (local vs remote changes)
   - Incremental sync for efficiency
   - Progress tracking and error handling
5. Hybrid Database Integration:
   - Store M365 memories with source metadata
   - Create M365-specific entities and relationships
   - Update search indexes with M365 content
```

#### Intelligent Search Flow
```
1. User Query → 
2. Search Method Selection:
   - Auto: Analyze query characteristics
   - Vector: Generate embeddings for similarity (includes M365 content)
   - Graph: Entity relationship traversal (cross-platform)
   - Text: SQLite FTS5 full-text search (all content sources)
   - Hybrid: Combine all methods with M365 enrichment
3. Execute chosen search method(s)
4. Rank and merge results with M365 context
5. Return enriched results with cross-platform relationship context
```

#### Enhanced Knowledge Graph Flow
```
1. Content Sources (Local + M365) → 
2. Advanced Entity Extraction:
   - Pattern-based detection (enhanced for M365)
   - Type classification (person, project, tech, organization, meeting)
   - M365-specific entities (email threads, teams, sites)
   - Confidence scoring with source attribution
3. Cross-Platform Relationship Inference:
   - Communication patterns (email threads, meeting attendance)
   - Collaboration relationships (team membership, document sharing)
   - Project associations (based on shared context)
   - Technology usage patterns (across platforms)
4. Graph Updates:
   - Create/update entities with M365 enrichment
   - Establish relationships with source tracking
   - Update confidence scores with cross-platform validation
   - Link local and M365 entities
5. Visual Graph Updates with M365 insights
```

## Target Enterprise Architecture

### High-Level System Design
```
┌──────────────────────────────────────────────────────────────┐
│                    Client Applications                        │
├─────────────┬─────────────┬─────────────┬─────────────────────┤
│   Desktop   │  Web App    │  Mobile     │    IDE Plugins      │
│   (Electron)│  (React)    │  (Native)   │  (VSCode, IntelliJ) │
└─────────────┴─────────────┴─────────────┴─────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────┐
│                     API Gateway (Apigee)                     │
├─────────────────┬─────────────────┬─────────────────────────┤
│  Rate Limiting  │   Authentication │      Analytics          │
│  Load Balancing │   Authorization  │      Monitoring         │
└─────────────────┴─────────────────┴─────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────┐
│                    Kubernetes Cluster                        │
├─────────────┬─────────────┬─────────────┬─────────────────────┤
│   Memory    │   Vector    │    Auth     │    Integration      │
│   Service   │   Service   │   Service   │     Services        │
└─────────────┴─────────────┴─────────────┴─────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────┐
│                      Data Layer                              │
├─────────────┬─────────────┬─────────────┬─────────────────────┤
│ PostgreSQL  │   Vector    │    Redis    │      Object         │
│  (Primary)  │  Database   │   (Cache)   │     Storage         │
└─────────────┴─────────────┴─────────────┴─────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────┐
│                 External Integrations                        │
├─────────────┬─────────────┬─────────────┬─────────────────────┤
│    LDAP     │     IIQ     │     M365    │      GitHub         │
│ (Identity)  │ (Governance)│ (Collab)    │   (Code Context)    │
└─────────────┴─────────────┴─────────────┴─────────────────────┘
```

### Microservices Architecture

#### Core Services

##### 1. Memory Service
```yaml
Responsibilities:
  - CRUD operations for memories
  - Search and filtering
  - Memory relationships and linking
  - Version control and history

Technologies:
  - Node.js + Express
  - PostgreSQL with Prisma ORM
  - Redis for caching
  - Event streaming for real-time updates

API Endpoints:
  POST   /api/v2/memories           # Create memory
  GET    /api/v2/memories/:id       # Get memory
  PUT    /api/v2/memories/:id       # Update memory
  DELETE /api/v2/memories/:id       # Delete memory
  GET    /api/v2/memories/search    # Search memories
  POST   /api/v2/memories/:id/link  # Link memories
```

##### 2. Vector Service
```yaml
Responsibilities:
  - Embedding generation and storage
  - Semantic similarity search
  - Vector index management
  - AI model integration

Technologies:
  - Python + FastAPI
  - Vector database (Pinecone/Weaviate/Qdrant)
  - Transformer models for embeddings
  - GPU acceleration for inference

API Endpoints:
  POST   /api/v2/vectors/embed      # Generate embeddings
  POST   /api/v2/vectors/search     # Similarity search
  POST   /api/v2/vectors/upsert     # Store vector
  DELETE /api/v2/vectors/:id        # Delete vector
```

##### 3. Authentication Service
```yaml
Responsibilities:
  - User authentication and authorization
  - JWT token management
  - LDAP/IIQ integration
  - Session management

Technologies:
  - Node.js + Express
  - Passport.js for auth strategies
  - JWT for token management
  - LDAP client for directory integration

API Endpoints:
  POST   /api/v2/auth/login         # User login
  POST   /api/v2/auth/logout        # User logout
  GET    /api/v2/auth/profile       # User profile
  POST   /api/v2/auth/refresh       # Refresh token
```

##### 4. Team Service
```yaml
Responsibilities:
  - Team and organization management
  - Member permissions and roles
  - Team-based access control
  - Collaboration features

Technologies:
  - Node.js + Express
  - PostgreSQL for team data
  - WebSocket for real-time collaboration

API Endpoints:
  GET    /api/v2/teams              # List user's teams
  POST   /api/v2/teams              # Create team
  GET    /api/v2/teams/:id/members  # Team members
  POST   /api/v2/teams/:id/invite   # Invite member
```

##### 5. Integration Service
```yaml
Responsibilities:
  - M365 integration (Teams, SharePoint, Outlook)
  - GitHub integration
  - External API connectors
  - Data synchronization

Technologies:
  - Node.js + Express
  - Microsoft Graph API
  - GitHub API
  - Message queues for async processing

API Endpoints:
  GET    /api/v2/integrations           # List integrations
  POST   /api/v2/integrations/m365     # M365 auth
  POST   /api/v2/integrations/github   # GitHub auth
  POST   /api/v2/integrations/sync     # Manual sync
```

### Database Design

#### PostgreSQL Schema
```sql
-- Core Tables
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  domain VARCHAR(255),
  settings JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  organization_id UUID REFERENCES organizations(id),
  ldap_dn VARCHAR(500),
  settings JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  last_login TIMESTAMP
);

CREATE TABLE teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  organization_id UUID REFERENCES organizations(id),
  settings JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE team_members (
  team_id UUID REFERENCES teams(id),
  user_id UUID REFERENCES users(id),
  role VARCHAR(50) NOT NULL, -- admin, editor, viewer
  permissions JSONB,
  joined_at TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (team_id, user_id)
);

-- Enhanced Memory Table
CREATE TABLE memories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(500) NOT NULL,
  content TEXT NOT NULL,
  type VARCHAR(50) NOT NULL,
  author_id UUID REFERENCES users(id),
  team_id UUID REFERENCES teams(id),
  visibility VARCHAR(20) DEFAULT 'private', -- private, team, public
  tags TEXT[],
  metadata JSONB,
  version INTEGER DEFAULT 1,
  parent_id UUID REFERENCES memories(id), -- for versioning
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  -- Search indexes
  CONSTRAINT valid_visibility CHECK (visibility IN ('private', 'team', 'public'))
);

-- Full-text search
CREATE INDEX idx_memories_fts ON memories 
  USING GIN (to_tsvector('english', title || ' ' || content));

-- Other indexes
CREATE INDEX idx_memories_author ON memories(author_id);
CREATE INDEX idx_memories_team ON memories(team_id);
CREATE INDEX idx_memories_type ON memories(type);
CREATE INDEX idx_memories_created ON memories(created_at);
CREATE INDEX idx_memories_tags ON memories USING GIN(tags);

-- Collaboration Tables
CREATE TABLE memory_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  memory_id UUID REFERENCES memories(id) ON DELETE CASCADE,
  shared_with_user_id UUID REFERENCES users(id),
  shared_by_user_id UUID REFERENCES users(id),
  permission_level VARCHAR(20), -- read, write, admin
  created_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(memory_id, shared_with_user_id)
);

CREATE TABLE memory_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  memory_id UUID REFERENCES memories(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id),
  content TEXT NOT NULL,
  parent_comment_id UUID REFERENCES memory_comments(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE memory_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_memory_id UUID REFERENCES memories(id) ON DELETE CASCADE,
  to_memory_id UUID REFERENCES memories(id) ON DELETE CASCADE,
  relationship_type VARCHAR(50), -- related, depends_on, references, implements
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(from_memory_id, to_memory_id, relationship_type)
);

-- Analytics Tables
CREATE TABLE user_activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  action VARCHAR(100) NOT NULL, -- create, read, update, delete, search, share
  resource_type VARCHAR(50), -- memory, team, comment
  resource_id UUID,
  metadata JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE team_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID REFERENCES teams(id),
  date DATE NOT NULL,
  metric_name VARCHAR(100),
  metric_value NUMERIC,
  metadata JSONB,
  
  UNIQUE(team_id, date, metric_name)
);

-- Integration Tables
CREATE TABLE user_integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  integration_type VARCHAR(50), -- m365, github, slack
  integration_data JSONB, -- tokens, configuration
  enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(user_id, integration_type)
);
```

#### Vector Database Schema
```json
{
  "collection": "team_memories",
  "dimension": 1536,
  "distance_metric": "cosine",
  "documents": [
    {
      "id": "memory_uuid",
      "vector": [0.1, 0.2, ...],
      "metadata": {
        "memory_id": "uuid",
        "team_id": "uuid",
        "author_id": "uuid",
        "title": "Memory Title",
        "type": "code_snippet",
        "tags": ["react", "typescript"],
        "visibility": "team",
        "created_at": "2024-01-01T00:00:00Z",
        "updated_at": "2024-01-01T00:00:00Z",
        "project": "project_name",
        "language": "typescript"
      }
    }
  ]
}
```

### Security Architecture

#### Authentication Flow
```
1. User → LDAP/IIQ Login
2. IIQ → Verify Credentials
3. Auth Service → Generate JWT
4. JWT → Client Applications
5. API Gateway → Validate JWT
6. Services → Process Request
```

#### Authorization Model
```yaml
Roles:
  - System Admin: Full system access
  - Org Admin: Organization management
  - Team Admin: Team management
  - Team Editor: Create/edit team memories
  - Team Viewer: Read team memories
  - User: Personal memories only

Permissions:
  memories:
    - create: own, team (if editor+)
    - read: own, shared, team (if member)
    - update: own, team (if editor+)
    - delete: own, team (if admin)
    - share: own, team (if editor+)
  
  teams:
    - create: org members
    - read: members only
    - update: team admin+
    - delete: team admin+
    - invite: team admin+
```

#### Data Protection
```yaml
Encryption:
  - At Rest: AES-256 for sensitive fields
  - In Transit: TLS 1.3 for all communications
  - Database: Transparent Data Encryption (TDE)
  - Backups: Encrypted with rotation keys

Access Controls:
  - Network: VPC with private subnets
  - Database: Private endpoints only
  - API: JWT validation on all endpoints
  - Files: Pre-signed URLs with expiration

Audit Logging:
  - All user actions logged
  - API access logs
  - Database query logs
  - File access logs
```

### Deployment Architecture

#### Kubernetes Configuration
```yaml
# Namespace Structure
apiVersion: v1
kind: Namespace
metadata:
  name: devmemory-prod
  labels:
    environment: production
    app: devmemory
---
apiVersion: v1
kind: Namespace
metadata:
  name: devmemory-auth
  labels:
    environment: production
    app: devmemory
    tier: security
---
apiVersion: v1
kind: Namespace
metadata:
  name: devmemory-data
  labels:
    environment: production
    app: devmemory
    tier: database
```

#### Service Deployments
```yaml
# Memory Service
apiVersion: apps/v1
kind: Deployment
metadata:
  name: memory-service
  namespace: devmemory-prod
spec:
  replicas: 3
  selector:
    matchLabels:
      app: memory-service
  template:
    metadata:
      labels:
        app: memory-service
    spec:
      containers:
      - name: memory-service
        image: devmemory/memory-service:v2.0.0
        ports:
        - containerPort: 8080
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: db-credentials
              key: postgres-url
        - name: REDIS_URL
          valueFrom:
            secretKeyRef:
              name: cache-credentials
              key: redis-url
        resources:
          requests:
            memory: "512Mi"
            cpu: "250m"
          limits:
            memory: "1Gi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /health
            port: 8080
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /ready
            port: 8080
          initialDelaySeconds: 5
          periodSeconds: 5
---
apiVersion: v1
kind: Service
metadata:
  name: memory-service
  namespace: devmemory-prod
spec:
  selector:
    app: memory-service
  ports:
  - port: 80
    targetPort: 8080
  type: ClusterIP
```

#### Database Configuration
```yaml
# PostgreSQL Cluster
apiVersion: postgresql.cnpg.io/v1
kind: Cluster
metadata:
  name: postgres-cluster
  namespace: devmemory-data
spec:
  instances: 3
  
  postgresql:
    parameters:
      max_connections: "200"
      shared_buffers: "256MB"
      effective_cache_size: "1GB"
      
  bootstrap:
    initdb:
      database: devmemory
      owner: devmemory_user
      secret:
        name: postgres-credentials
        
  storage:
    size: 100Gi
    storageClass: fast-ssd
    
  monitoring:
    enabled: true
    
  backup:
    retentionPolicy: "30d"
    schedule: "0 2 * * *"
```

### API Gateway (Apigee) Configuration

#### Proxy Configuration
```xml
<!-- Apigee API Proxy -->
<APIProxy name="devmemory-api">
  <DisplayName>DevMemory API Gateway</DisplayName>
  <Description>API Gateway for DevMemory services</Description>
  
  <HTTPProxyConnection>
    <BasePath>/api/v2</BasePath>
    <VirtualHost>secure</VirtualHost>
  </HTTPProxyConnection>
  
  <RouteRule name="memory-service">
    <Condition>proxy.pathsuffix MatchesPath "/memories/*"</Condition>
    <TargetEndpoint>memory-service</TargetEndpoint>
  </RouteRule>
  
  <RouteRule name="vector-service">
    <Condition>proxy.pathsuffix MatchesPath "/vectors/*"</Condition>
    <TargetEndpoint>vector-service</TargetEndpoint>
  </RouteRule>
  
  <ProxyEndpoint name="default">
    <PreFlow>
      <Request>
        <Step><Name>OAuth-Verify-Token</Name></Step>
        <Step><Name>Rate-Limit-by-User</Name></Step>
        <Step><Name>Request-Transformation</Name></Step>
      </Request>
      <Response>
        <Step><Name>Response-Cache</Name></Step>
        <Step><Name>Analytics-Collection</Name></Step>
      </Response>
    </PreFlow>
  </ProxyEndpoint>
</APIProxy>
```

#### Security Policies
```xml
<!-- OAuth Token Verification -->
<OAuthV2 name="OAuth-Verify-Token">
  <Operation>VerifyAccessToken</Operation>
  <GenerateResponse enabled="true"/>
  <Tokens>
    <Token ref="request.header.authorization"/>
  </Tokens>
</OAuthV2>

<!-- Rate Limiting -->
<RateLimitPolicy name="Rate-Limit-by-User">
  <Identifier ref="oauth.client_id"/>
  <Allow count="100" countRef="request.header.rate-limit"/>
  <Interval ref="request.header.rate-interval">1</Interval>
  <TimeUnit ref="request.header.rate-timeunit">minute</TimeUnit>
</RateLimitPolicy>

<!-- Response Caching -->
<ResponseCache name="Response-Cache">
  <CacheKey>
    <Prefix>devmemory</Prefix>
    <KeyFragment ref="request.uri"/>
    <KeyFragment ref="request.header.authorization"/>
  </CacheKey>
  <ExpirySettings>
    <TimeoutInSec>300</TimeoutInSec>
  </ExpirySettings>
</ResponseCache>
```

### Monitoring & Observability

#### Metrics Collection
```yaml
# Prometheus Configuration
global:
  scrape_interval: 15s
  
scrape_configs:
- job_name: 'devmemory-services'
  kubernetes_sd_configs:
  - role: endpoints
    namespaces:
      names:
      - devmemory-prod
      - devmemory-auth
  relabel_configs:
  - source_labels: [__meta_kubernetes_service_annotation_prometheus_io_scrape]
    action: keep
    regex: true

# Key Metrics
memory_service_requests_total
memory_service_request_duration_seconds
vector_service_embeddings_generated_total
vector_service_similarity_searches_total
auth_service_login_attempts_total
auth_service_token_validations_total
```

#### Logging Strategy
```yaml
# Structured Logging Format
{
  "timestamp": "2024-01-01T00:00:00.000Z",
  "level": "info",
  "service": "memory-service",
  "trace_id": "abc123",
  "span_id": "def456",
  "user_id": "user_uuid",
  "team_id": "team_uuid",
  "action": "create_memory",
  "resource_id": "memory_uuid",
  "duration_ms": 150,
  "status": "success",
  "metadata": {
    "memory_type": "code_snippet",
    "tags": ["react", "typescript"]
  }
}
```

#### Alerting Rules
```yaml
# Critical Alerts
- alert: ServiceDown
  expr: up{job="devmemory-services"} == 0
  for: 1m
  labels:
    severity: critical
  annotations:
    summary: "Service {{ $labels.instance }} is down"

- alert: HighErrorRate
  expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.1
  for: 2m
  labels:
    severity: warning
  annotations:
    summary: "High error rate on {{ $labels.service }}"

- alert: DatabaseConnectionPool
  expr: database_connections_active / database_connections_max > 0.8
  for: 5m
  labels:
    severity: warning
  annotations:
    summary: "Database connection pool usage high"
```

This architecture provides a solid foundation for scaling from single-user MVP to enterprise team collaboration platform while maintaining security, performance, and reliability requirements.