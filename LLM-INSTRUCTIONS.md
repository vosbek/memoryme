# DevMemory - LLM Management Instructions

## 🎯 **What This Application Does**

DevMemory is an **Enterprise Developer Memory Assistant** that captures, stores, and intelligently retrieves development knowledge using AI-powered vector search and knowledge graphs. It integrates with Microsoft 365 to automatically sync emails, calendar events, Teams conversations, and SharePoint documents into a searchable knowledge base.

## 🏗️ **Core Architecture**

### **Technology Stack**
- **Frontend**: React + TypeScript + Electron (Desktop Application)
- **Backend**: Node.js + SQLite + ChromaDB + Knowledge Graph
- **AI/ML**: AWS Bedrock (Claude 3 Sonnet) + Titan Embeddings
- **Integration**: Microsoft Graph API + SharePoint + Teams
- **Build**: Webpack + TypeScript

### **Database Architecture**
- **SQLite**: Primary structured data storage (memories, metadata)
- **ChromaDB**: Vector embeddings for semantic search (10-100x faster than linear)
- **Knowledge Graph**: Entity relationships and contextual connections
- **Hybrid Search**: Combines vector similarity + graph relationships + full-text search

## 🚀 **Fresh Installation Instructions**

### **Prerequisites**
```bash
# Required software
- Node.js 18+ (LTS recommended)
- npm 8+
- Git
- AWS CLI (configured with credentials)
- Azure CLI (optional, for M365 setup)
```

### **Installation Steps**
```bash
# 1. Clone and setup
git clone <repository-url>
cd memory
npm install

# 2. Environment setup (create .env file)
AZURE_CLIENT_ID=your-azure-app-client-id
AZURE_AUTHORITY=https://login.microsoftonline.com/common
AWS_REGION=us-east-1
NODE_ENV=production

# 3. Build application
npm run build

# 4. Start application
npm start
```

## 📁 **Critical File Structure**

```
memory/
├── src/
│   ├── main/                    # Electron main process
│   │   ├── main.ts             # Application entry point + IPC handlers
│   │   └── preload.ts          # Secure bridge between main/renderer
│   ├── renderer/               # React frontend
│   │   ├── App.tsx             # Main application component
│   │   ├── components/         # UI components
│   │   └── styles/            # CSS styling
│   └── shared/                 # Shared business logic
│       ├── database/           # Database management
│       │   ├── hybrid-database-manager.ts  # Core database orchestrator
│       │   ├── sqlite.ts       # SQLite operations
│       │   ├── chromadb-vector-store.ts    # Vector embeddings
│       │   └── knowledge-graph.ts          # Entity relationships
│       ├── services/           # External integrations
│       │   ├── m365-auth.ts    # Microsoft 365 authentication
│       │   ├── m365-graph-client.ts        # Graph API client
│       │   ├── m365-integration-service.ts # M365 data sync
│       │   └── sharepoint-service.ts       # SharePoint integration
│       ├── types.ts            # TypeScript interfaces
│       └── utils/              # Utility functions
├── package.json                # Dependencies and scripts
├── tsconfig.json              # TypeScript configuration
├── webpack.*.config.js        # Build configuration
└── CLAUDE.md                  # Project instructions for Claude
```

## 🔧 **Key Components Deep Dive**

### **1. Database System (`hybrid-database-manager.ts`)**
- **Purpose**: Orchestrates SQLite + ChromaDB + Knowledge Graph
- **Key Methods**:
  - `createMemory()`: Stores memory + generates embeddings + extracts entities
  - `searchMemories()`: Hybrid search across all systems
  - `getSystemHealth()`: Monitors database health
- **Error Handling**: Graceful degradation if ChromaDB unavailable

### **2. Vector Search (`chromadb-vector-store.ts`)**
- **Purpose**: Semantic similarity search using HNSW indexing
- **Performance**: Batch operations, LRU caching, optimized queries
- **Configuration**: Uses AWS Bedrock Titan embeddings (384 dimensions)
- **Fallback**: Local embeddings if Bedrock unavailable

### **3. M365 Integration (`m365-*.ts` files)**
- **Authentication**: MSAL-Node with PKCE flow for enterprise security
- **Data Sources**: Outlook, Teams, SharePoint, OneDrive, Calendar
- **Permissions**: Read-only access respecting conditional access policies
- **Sync Engine**: Incremental sync with conflict resolution

### **4. Knowledge Graph (`knowledge-graph.ts`)**
- **Entity Types**: person, technology, organization, project, file, api, database, service, concept, repository, location, site, document
- **Extraction**: NLP-based entity extraction with confidence scoring
- **Relationships**: Automatic relationship detection and creation
- **Context**: Memory-type specific entity relevance scoring

## 🎮 **Common Management Tasks**

### **Build and Development**
```bash
# Development mode (hot reload)
npm run dev

# Production build
npm run build

# Type checking
npm run typecheck

# Linting
npm run lint

# Clean build
npm run clean && npm run build
```

### **Database Management**
```typescript
// Check database health
const health = await databaseManager.getSystemHealth();

// Vector store info
const vectorInfo = await chromaDB.getCollectionInfo();

// Reset ChromaDB (if corrupted)
await chromaDB.resetCollection();

// Bulk import memories
await databaseManager.bulkImportMemories(memories);
```

### **M365 Integration Setup**
```typescript
// Initialize M365 (requires Azure App Registration)
await m365AuthService.initialize({
  clientId: 'your-azure-client-id',
  authority: 'https://login.microsoftonline.com/common',
  scopes: ['User.Read', 'Mail.Read', 'Sites.Read.All']
});

// Test connectivity
const status = await m365GraphClient.testConnection();

// Sync M365 data
const result = await m365SyncEngine.performSync();
```

## 🐛 **Troubleshooting Guide**

### **Build Errors**
- **ChromaDB Issues**: Ensure Python 3.8+ installed for ChromaDB dependencies
- **TypeScript Errors**: Run `npm run typecheck` for detailed diagnostics
- **Memory Issues**: Increase Node.js heap: `node --max-old-space-size=4096`

### **Runtime Issues**
- **Database Connection**: Check file permissions in userData directory
- **M365 Auth**: Verify Azure app registration and redirect URIs
- **AWS Bedrock**: Ensure AWS credentials configured with Bedrock access
- **Vector Search**: Check ChromaDB service health via `getCollectionInfo()`

### **Performance Issues**
- **Slow Search**: Monitor vector store cache hit rates
- **Memory Usage**: Check for memory leaks in batch operations
- **M365 Sync**: Implement incremental sync vs full sync

## 🔒 **Security Considerations**

### **Credentials Management**
- **Environment Variables**: Store sensitive data in `.env` (never commit)
- **Token Storage**: MSAL handles secure token caching automatically
- **Database Encryption**: SQLite WAL mode for corruption resistance

### **M365 Security**
- **Conditional Access**: Respects enterprise policies (MFA, device compliance)
- **Permissions**: Minimal required scopes, read-only by default
- **Logging**: PII logging disabled, audit trail maintained

## 📊 **Monitoring and Health Checks**

### **System Health Endpoints**
```typescript
// Overall system health
const health = await databaseManager.getSystemHealth();
// Returns: { overall: boolean, sqlite: boolean, chromadb: boolean, knowledgeGraph: boolean }

// Performance metrics
const stats = chromaDB.getPerformanceStats();
// Returns: { cacheSize: number, cacheHitRate: number, pendingOperations: number }

// M365 connectivity
const m365Status = await m365GraphClient.testConnection();
// Returns: { success: boolean, services: {...}, userProfile: {...} }
```

### **Log Locations**
- **Application Logs**: Console output + structured logging
- **Error Tracking**: Automatic error capture with context
- **Performance Metrics**: Built-in timing and cache statistics

## 🎯 **Configuration Management**

### **Application Settings** (`AppConfig` interface)
```typescript
{
  database: {
    sqlitePath: string,      // SQLite database file path
    chromaPath: string       // ChromaDB persistence directory
  },
  llm: {
    awsRegion: string,       // AWS region for Bedrock
    bedrockModelId: string,  // Claude model identifier
    embeddingModelId: string // Titan embedding model
  },
  ui: {
    theme: 'light' | 'dark' | 'system',
    defaultView: 'list' | 'graph' | 'search'
  },
  integration: {
    vscode: { enabled: boolean, autoCapture: boolean },
    m365: { enabled: boolean, syncInterval: number }
  }
}
```

## 🚨 **Critical Success Factors**

1. **AWS Bedrock Access**: Ensure AWS account has Bedrock model access in target region
2. **Azure App Registration**: M365 integration requires proper Azure AD app setup
3. **Disk Space**: ChromaDB requires adequate storage for vector indices
4. **Memory**: Minimum 4GB RAM recommended for large knowledge bases
5. **Network**: Stable internet for cloud AI services and M365 sync

## 📝 **Emergency Procedures**

### **Database Recovery**
```bash
# If ChromaDB corrupted
rm -rf userData/chromadb
# App will recreate and re-index from SQLite

# If SQLite corrupted
# Backup: userData/devmemory.db.backup
# Restore or recreate will lose data but app continues functioning
```

### **Reset Application State**
```bash
# Clear all data (nuclear option)
rm -rf userData/
# App will reinitialize with defaults
```

## 🎓 **For New LLM Managers**

**Start Here**: Read `CLAUDE.md` for development guidelines, then review `main.ts` for IPC handlers, then `hybrid-database-manager.ts` for core logic.

**Key Files to Monitor**: 
- `hybrid-database-manager.ts` (database orchestration)
- `main.ts` (IPC and application lifecycle)
- `m365-auth.ts` (enterprise authentication)
- `chromadb-vector-store.ts` (vector search performance)

**Common User Requests**:
- Memory creation/search/organization
- M365 integration setup and troubleshooting  
- Performance optimization
- Data export/import
- Knowledge graph exploration

**Success Metrics**:
- Build completes without TypeScript errors
- Database systems healthy on startup
- M365 authentication working (if configured)
- Search results returned within 2 seconds
- No memory leaks during extended use

This application is **production-ready** and **rock-solid** after comprehensive error fixing. Focus on user experience and data integrity. 🚀