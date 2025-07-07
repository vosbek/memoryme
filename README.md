# 🧠 DevMemory - Enterprise Developer Memory Assistant

[![Version](https://img.shields.io/badge/version-1.0.3-blue.svg)](https://github.com/enterprise/devmemory)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)](https://nodejs.org/)
[![Electron](https://img.shields.io/badge/electron-31.0.0-47848f.svg)](https://electronjs.org/)

> **AI-powered knowledge management for developers with vector search, knowledge graphs, and Microsoft 365 integration**

## 🎯 **What is DevMemory?**

DevMemory is an **Enterprise Developer Memory Assistant** that captures, stores, and intelligently retrieves your development knowledge using:

- 🔍 **AI-Powered Vector Search** - Semantic similarity search with ChromaDB
- 🕸️ **Knowledge Graphs** - Automatic entity extraction and relationship mapping  
- 🏢 **Microsoft 365 Integration** - Email, Teams, SharePoint, and OneDrive sync
- 💾 **Local-First Storage** - SQLite + ChromaDB for privacy and performance
- 🤖 **Claude 3 Integration** - AWS Bedrock for content analysis and embeddings
- 🧩 **VS Code Extension** - Instant code capture and search directly from your editor

## 🚀 **Quick Start**

### **For Windows Users**
📖 **[Follow the Complete Windows Installation Guide](WINDOWS-INSTALLATION-GUIDE.md)**

### **For Developers & Other Platforms**

```bash
# Prerequisites: Node.js 18+, npm 8+, Git, Python 3.8+
git clone <repository-url> memory
cd memory
npm install

# Install ChromaDB for enhanced vector search (recommended):
pip install chromadb

# Option A: Full experience with ChromaDB
npm run dev:full

# Option B: Basic mode without ChromaDB
npm run dev

# Optional: Install VS Code extension for instant code capture
# In VS Code: Extensions → Install from VSIX → vscode-extension/devmemory-vscode-1.0.0.vsix

# For production build:
npm run build
electron .

# Or create installer:
npm run dist
```

### **⚠️ Important Notes**
- **NO** `npm start` script exists - use `npm run dev` for development
- **Enterprise Ready**: Uses sql.js (pure JavaScript) - no native compilation required
- **ChromaDB Optional**: Works with basic vector search if ChromaDB unavailable
- **VS Code Integration**: Extension available for seamless code capture workflow
- **Offline Capable**: Core features work without internet (cloud AI optional)

## ✨ **Key Features**

### **🧠 Intelligent Memory Management**
- Create, organize, and search development memories
- Automatic tagging and categorization
- Rich text editing with markdown support
- Attachment and file linking capabilities

### **🔍 Advanced Search Capabilities**
- **Vector Search**: Semantic similarity using AI embeddings
- **Full-Text Search**: Traditional keyword matching
- **Graph Search**: Relationship-based discovery
- **Hybrid Search**: Combined approach for best results

### **🕸️ Knowledge Graph**
- Automatic entity extraction (people, technologies, projects)
- Relationship mapping between concepts
- Visual graph exploration
- Context-aware suggestions

### **🏢 Microsoft 365 Integration**
- **Outlook**: Email knowledge extraction
- **Teams**: Conversation and meeting insights
- **SharePoint**: Document intelligence
- **OneDrive**: File synchronization and indexing
- **Calendar**: Meeting context and scheduling insights

## 🏗️ **Architecture**

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   React UI      │    │   Electron      │    │   Node.js       │
│   (Renderer)    │◄──►│   (Main)        │◄──►│   (Backend)     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │
                ┌───────────────┼───────────────┐
                │               │               │
        ┌───────▼──────┐ ┌──────▼──────┐ ┌─────▼─────┐
        │   SQLite     │ │  ChromaDB   │ │ Knowledge │
        │  (Metadata)  │ │ (Vectors)   │ │   Graph   │
        └──────────────┘ └─────────────┘ └───────────┘
```

### **Technology Stack**
- **Frontend**: React 18 + TypeScript + Tailwind CSS
- **Backend**: Electron + Node.js + TypeScript
- **Database**: SQLite (sql.js - pure JavaScript) + ChromaDB (vectors)
- **AI/ML**: AWS Bedrock (Claude 3 + Titan Embeddings)
- **Integration**: Microsoft Graph API + MSAL Authentication
- **Build**: Webpack + TypeScript + ESLint

### **🏢 Enterprise Deployment Benefits**
- ✅ **No Native Compilation**: Uses sql.js instead of better-sqlite3
- ✅ **Registry Compatible**: Works with restricted npm registries
- ✅ **Windows Enterprise Ready**: No Visual Studio Build Tools required
- ✅ **NODE_MODULE_VERSION Safe**: Eliminates native module version conflicts

## 📋 **System Requirements**

### **Minimum Requirements**
- **OS**: Windows 10/11, macOS 10.14+, or Linux (Ubuntu 18.04+)
- **Node.js**: Version 18.0.0 or higher
- **RAM**: 4GB minimum, 8GB recommended
- **Storage**: 2GB free space for application and data
- **Network**: Internet connection for cloud features (optional)

### **Optional Requirements**
- **AWS Account**: For enhanced AI features (Bedrock access)
- **Microsoft 365**: For enterprise integration features
- **Git**: For development and updates

## 🔧 **Configuration**

### **Environment Variables**
Copy `.env.example` to `.env` and configure:

```bash
# AWS Bedrock (Optional - for enhanced AI features)
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key

# Microsoft 365 Integration (Optional)
AZURE_CLIENT_ID=your-azure-app-client-id
AZURE_AUTHORITY=https://login.microsoftonline.com/common

# Application Settings
NODE_ENV=production
```

### **Data Storage**
Your data is stored locally:
- **Windows**: `%APPDATA%\DevMemory\`
- **macOS**: `~/Library/Application Support/DevMemory/`
- **Linux**: `~/.config/DevMemory/`

## 🛠️ **Development**

### **Development Setup**
```bash
# Clone and install
git clone <repository-url>
cd memory
npm install

# Start development server (hot reload)
npm run dev

# Run tests
npm test
npm run test:watch    # Watch mode
npm run test:coverage # Coverage report

# Build for production
npm run build

# Package for distribution
npm run dist           # Build + package
npm run package:win    # Windows installer
npm run package:mac    # macOS DMG
npm run package:linux  # Linux AppImage

# Code quality
npm run lint           # ESLint + TypeScript
npm run lint:fix       # Auto-fix issues
```

### **Project Structure**
```
src/
├── main/                    # Electron main process
│   ├── main.ts             # Application entry + IPC handlers
│   └── preload.ts          # Secure bridge
├── renderer/               # React frontend
│   ├── App.tsx             # Main app component
│   ├── components/         # UI components
│   └── styles/            # Tailwind CSS
└── shared/                 # Shared business logic
    ├── database/           # Database management
    ├── services/           # External integrations
    ├── types.ts           # TypeScript interfaces
    └── utils/             # Utility functions
```

### **Key Components**
- **HybridDatabaseManager**: Orchestrates SQLite + ChromaDB + Knowledge Graph
- **ChromaDBVectorStore**: Vector embeddings and semantic search
- **M365IntegrationService**: Microsoft 365 data synchronization
- **KnowledgeGraph**: Entity extraction and relationship mapping

## 🔒 **Security & Privacy**

### **Data Privacy**
- ✅ **Local-first storage** - Your data stays on your machine
- ✅ **No telemetry** - We don't collect usage data
- ✅ **Encrypted credentials** - Secure storage of API keys
- ✅ **Optional cloud features** - Cloud AI is opt-in only

### **Enterprise Security**
- ✅ **Microsoft 365 compliance** - Respects conditional access policies
- ✅ **Multi-factor authentication** - Supports enterprise MFA requirements
- ✅ **Audit logging** - Comprehensive activity logs
- ✅ **Role-based access** - Integration with Azure AD

## 📚 **Documentation**

- 📖 **[Windows Installation Guide](WINDOWS-INSTALLATION-GUIDE.md)** - Step-by-step Windows setup
- 📖 **[LLM Management Instructions](LLM-INSTRUCTIONS.md)** - For AI assistants managing this project
- 📖 **[Critical Fixes Documentation](CRITICAL-FIXES.md)** - Important fixes and issues
- 📖 **[Ultra-Analysis Report](ULTRA-ANALYSIS-FINAL.md)** - Complete technical analysis

## 🐛 **Troubleshooting**

### **Common Issues**

#### Application Won't Start
```bash
# WRONG: npm start (doesn't exist)
# CORRECT: npm run dev

# Try development mode first:
npm run dev

# If that works, test production build:
npm run build
electron .

# Clear cache and rebuild if needed:
npm run clean
npm install
npm run build
```

#### "npm start doesn't exist" Error
```bash
# This is correct - use these commands instead:
npm run dev      # Development mode
npm run build    # Production build
electron .       # Run built app
npm run dist     # Create installer
```

#### Native Module Compilation Errors
```bash
# This should NOT happen with sql.js migration
# If you see better-sqlite3 errors:
git pull origin main
npm install

# The app now uses sql.js (pure JavaScript)
# No C++ compilation required
```

#### Search Not Working
- Verify ChromaDB is initialized (check Settings > Vector Database)
- Ensure at least one memory exists
- Check AWS credentials if using Bedrock embeddings

#### Microsoft 365 Integration Issues
- Verify `AZURE_CLIENT_ID` is set in `.env`
- Check Azure AD app registration permissions
- Ensure corporate firewall allows Microsoft Graph API access

#### Performance Issues
- Check available RAM (4GB minimum)
- Monitor database file sizes in data directory
- Consider clearing ChromaDB index and rebuilding

## 🤝 **Contributing**

DevMemory is an enterprise application designed for professional development teams. For contribution guidelines and development standards, please refer to the development documentation.

## 📄 **License**

MIT License - see [LICENSE](LICENSE) file for details.

## 🎯 **Roadmap**

### **Current Version (1.0.3)**
- ✅ Core memory management
- ✅ Vector search with ChromaDB
- ✅ Knowledge graph functionality
- ✅ Microsoft 365 integration
- ✅ AWS Bedrock AI integration
- ✅ **Enterprise deployment ready** (sql.js migration)
- ✅ **Pure JavaScript database** (no native compilation)
- ✅ **Windows enterprise compatible** (restricted registries)

### **Planned Features**
- 🔄 Real-time collaboration
- 🔄 Mobile companion app
- 🔄 Advanced analytics and insights
- 🔄 Integration with more development tools
- 🔄 Custom AI model support

## 🏢 **Enterprise Support**

DevMemory is designed for enterprise environments with:
- **Professional deployment** guidance
- **Corporate security** compliance
- **Scale considerations** for large teams
- **Integration support** for enterprise tools

For enterprise inquiries and support, please contact the development team.

---

**DevMemory - Empowering developers with intelligent knowledge management** 🚀

*Built with ❤️ for the developer community*