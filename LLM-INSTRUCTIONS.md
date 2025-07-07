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
- **SQLite (sql.js)**: Primary structured data storage (memories, metadata) - Pure JavaScript, no native compilation
- **ChromaDB**: Vector embeddings for semantic search (10-100x faster than linear)
- **Knowledge Graph**: Entity relationships and contextual connections
- **Hybrid Search**: Combines vector similarity + graph relationships + full-text search

## 🚀 **Fresh Installation Instructions**

### **🆕 Quick Start for New Machine**

**If you just cloned this project and want to get it running:**

```bash
# 1. Install dependencies (no native compilation needed!)
npm install

# 2. For immediate testing/development:
npm run dev
# This opens the app in development mode with hot reload

# 3. For production build and testing:
npm run build
electron .
# Or create installer: npm run dist
```

**Available Scripts:**
- `npm run dev` - Development mode (recommended for testing)
- `npm run build` - Build production files
- `npm run dist` - Build + create installer packages
- `npm run lint` - Check code quality
- `npm run test` - Run tests

**⚠️ Note**: There is **NO** `npm start` script. Use `npm run dev` for development.

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

#### **For Development (Local Testing)**
```bash
# 1. Clone and setup
git clone <repository-url>
cd memory
npm install

# 2. Environment setup (optional - create .env file for M365/AWS features)
AZURE_CLIENT_ID=your-azure-app-client-id
AZURE_AUTHORITY=https://login.microsoftonline.com/common
AWS_REGION=us-east-1
NODE_ENV=development

# 3. Start in development mode (hot reload)
npm run dev
```

#### **For Production Deployment**
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

# 3. Build and package application
npm run dist

# 4. Install the generated package:
# Windows: dist-electron/DevMemory-Setup-{version}.exe
# macOS: dist-electron/DevMemory-{version}.dmg
# Linux: dist-electron/DevMemory-{version}.AppImage
```

#### **For Enterprise Windows Deployment**
```bash
# This application now uses sql.js (pure JavaScript) instead of better-sqlite3
# No native compilation required - eliminates NODE_MODULE_VERSION issues
# Compatible with corporate artifactories

# 1. Configure enterprise registry (if using company artifactory)
npm config set registry https://art.nwie.net/repository/npm/
npm config set @types:registry https://art.nwie.net/repository/npm/

# 2. Clone and setup
git clone <repository-url>
cd memory
npm install    # All packages available from artifactory

# 3. Build for distribution
npm run build
npm run package:win

# 4. Deploy the installer
# dist-electron/DevMemory-Setup-{version}.exe
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

# Production build only
npm run build

# Build and package for distribution
npm run dist

# Platform-specific packaging
npm run package:win     # Windows installer
npm run package:mac     # macOS DMG
npm run package:linux   # Linux AppImage

# Type checking
npm run lint            # ESLint + TypeScript checking

# Testing
npm run test            # Run all tests
npm run test:watch      # Watch mode
npm run test:coverage   # Coverage report

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
- **sql.js WASM Loading**: Ensure sql.js WASM files are accessible in Electron bundle
- **ChromaDB Issues**: Ensure Python 3.8+ installed for ChromaDB dependencies  
- **TypeScript Errors**: Run `npm run lint` for detailed diagnostics
- **Memory Issues**: Increase Node.js heap: `node --max-old-space-size=4096`
- **Enterprise Registry**: All dependencies now pure JavaScript - no native compilation

### **Runtime Issues**
- **Database Connection**: Check file permissions in userData directory
- **sql.js WASM**: Verify WASM file paths in production Electron bundle
- **M365 Auth**: Verify Azure app registration and redirect URIs
- **AWS Bedrock**: Ensure AWS credentials configured with Bedrock access
- **Vector Search**: Check ChromaDB service health via `getCollectionInfo()`
- **Enterprise Network**: Application works offline except for cloud AI features

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

1. **✅ Enterprise Deployment Ready**: Uses sql.js (pure JavaScript) - no native compilation issues
2. **AWS Bedrock Access**: Ensure AWS account has Bedrock model access in target region  
3. **Azure App Registration**: M365 integration requires proper Azure AD app setup
4. **Disk Space**: ChromaDB requires adequate storage for vector indices
5. **Memory**: Minimum 4GB RAM recommended for large knowledge bases
6. **Network**: Stable internet for cloud AI services and M365 sync

### **🏢 Enterprise Deployment Benefits (sql.js Migration)**

**Problem Solved**: The application previously used `better-sqlite3` which required native C++ compilation during installation. This caused NODE_MODULE_VERSION mismatches and failed installations on enterprise Windows machines with restricted npm registries.

**Solution**: Migrated to `sql.js` - a pure JavaScript SQLite implementation that:
- ✅ **No Native Compilation**: Pure JavaScript/WebAssembly 
- ✅ **Artifactory Compatible**: All dependencies available on corporate registries (e.g., art.nwie.net)
- ✅ **Standard npm Packages**: No special registry requirements
- ✅ **Identical Functionality**: Same database operations, same performance
- ✅ **Windows Enterprise Ready**: No Visual Studio Build Tools required
- ✅ **Offline Capable**: Core database functions work without internet

**Verification**: The application now builds and runs successfully on restricted enterprise environments.

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

### **🔧 Fresh Machine Troubleshooting**

**"npm start doesn't exist"**
```bash
# WRONG: npm start
# CORRECT: npm run dev
```

**"Build fails with native module errors"**
```bash
# This should NOT happen with sql.js migration
# If you see better-sqlite3 errors, ensure you're on latest code:
git pull origin main
npm install
```

**"Electron app won't start"**
```bash
# Try development mode first:
npm run dev

# If that works, build and test:
npm run build
electron .
```

**"Permission denied or file not found"**
```bash
# Ensure you're in the correct directory:
pwd
# Should show: /path/to/memory

# Check package.json exists:
ls package.json

# Verify scripts:
npm run
```

## 🎓 **For New LLM Managers**

**Start Here**: Read `CLAUDE.md` for development guidelines, then review `main.ts` for IPC handlers, then `hybrid-database-manager.ts` for core logic.

**Key Files to Monitor**: 
- `hybrid-database-manager.ts` (database orchestration)
- `main.ts` (IPC and application lifecycle)
- `m365-auth.ts` (enterprise authentication)
- `chromadb-vector-store.ts` (vector search performance)

**Common User Requests**:
- Fresh machine setup and installation issues
- Memory creation/search/organization
- M365 integration setup and troubleshooting  
- Performance optimization
- Enterprise deployment and sql.js migration questions
- Data export/import
- Knowledge graph exploration

**Success Metrics**:
- `npm run dev` starts successfully without native module errors
- Build completes without TypeScript errors (`npm run build`)
- Database systems healthy on startup (sql.js working)
- M365 authentication working (if configured)
- Search results returned within 2 seconds
- No memory leaks during extended use

**⚠️ Key Reminders for Fresh Installs**:
- **NO** `npm start` script exists - use `npm run dev` for development
- Application now uses **sql.js** (pure JavaScript) - no native compilation
- Enterprise deployment issues with better-sqlite3 have been **resolved**
- Core functionality works offline (except cloud AI features)

This application is **production-ready** and **enterprise-deployment-ready** after comprehensive sql.js migration. Focus on user experience and data integrity. 🚀