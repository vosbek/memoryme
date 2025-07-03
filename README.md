# DevMemory - Enterprise Developer Memory Assistant

A desktop Electron application that serves as a local memory assistant for enterprise developers, featuring vector database capabilities, LLM integration via AWS Bedrock, and VSCode integration.

## 🎯 Features

### Core Functionality
- **Local Vector Database**: Semantic search through all your developer knowledge
- **Multiple Memory Types**: Code snippets, documentation, meeting notes, decisions, API calls, debug sessions, project contexts, Kubernetes resources, commands, links, and general notes
- **LLM Integration**: AWS Bedrock integration with Claude 3.5 Sonnet and Titan embeddings
- **VSCode Integration**: Automatic context capture from VSCode (files, git, terminal commands)
- **Advanced Search**: Hybrid semantic + keyword search with filters
- **Tagging System**: Organize memories with custom tags
- **Knowledge Graph**: Visual representation of interconnected memories

### Data Tracking
- Code snippets and documentation
- Meeting notes and decisions
- API calls and debugging sessions
- Project contexts and Kubernetes resources
- Terminal commands and documentation links
- Manual notes and quick captures

## 🛠 Prerequisites

### Required Software
1. **Node.js** (v18 or higher)
   - Download from: https://nodejs.org/
   - Verify installation: `node --version` and `npm --version`

2. **Python** (v3.8 or higher) - Required for Chroma vector database
   - Download from: https://python.org/
   - Verify installation: `python --version` or `python3 --version`

3. **Git** (for version control)
   - Download from: https://git-scm.com/
   - Verify installation: `git --version`

4. **Visual Studio Build Tools** (Windows only)
   - Install from: https://visualstudio.microsoft.com/visual-cpp-build-tools/
   - Required for native dependency compilation (better-sqlite3)

### AWS Prerequisites
1. **AWS Account** with Bedrock access
2. **AWS CLI** configured with appropriate credentials
3. **Bedrock Model Access** enabled for:
   - Claude 3.5 Sonnet (`anthropic.claude-3-sonnet-20240229-v1:0`)
   - Amazon Titan Text Embeddings (`amazon.titan-embed-text-v1`)

## 📦 Installation

### For Enterprise Users (Recommended)
See the detailed [DEPLOYMENT.md](./DEPLOYMENT.md) guide for complete Windows enterprise installation instructions.

### For Developers

#### Step 1: Clone the Repository
```bash
git clone <repository-url>
cd devmemory
```

#### Step 2: Install Prerequisites
Ensure you have:
- Node.js 18+ ([download](https://nodejs.org/))
- Python 3.9+ ([download](https://python.org/downloads/))
- Visual Studio Build Tools ([download](https://visualstudio.microsoft.com/visual-cpp-build-tools/))

#### Step 3: Install Dependencies
```bash
# Install Python dependencies first
pip install chromadb

# Install Node.js dependencies
npm install
# or for clean build: npm run rebuild
```

#### Step 4: Configure AWS Credentials (Optional)
```bash
# Configure AWS CLI (if not already done)
aws configure

# Or set environment variables
set AWS_ACCESS_KEY_ID=your_access_key
set AWS_SECRET_ACCESS_KEY=your_secret_key
set AWS_REGION=us-east-1
```

#### Step 5: Build the Application

**For Development:**
```bash
npm run build
npm run dev
```

**For Distribution:**
```bash
# Build Windows installer
npm run package:win     # Creates DevMemory-Setup-1.0.0.exe

# Other platforms
npm run package:mac     # Creates DevMemory-1.0.0.dmg  
npm run package:linux   # Creates DevMemory-1.0.0.AppImage

# Build all platforms
npm run dist
```

**Quick Build Script:**
```bash
# Use automated build script (Windows)
powershell -ExecutionPolicy Bypass -File scripts\release.ps1
```

#### Build Output
After building, you'll find the installer at:
```
dist-electron/DevMemory-Setup-1.0.0.exe
```

Run this installer as Administrator to install DevMemory on your system.

## 🚀 Running the Application

### Development Mode
```bash
# Start in development mode (hot reload enabled)
npm run dev
```

### Production Mode
```bash
# Build and run production version
npm run build
npm run dev:electron
```

## 📁 Project Structure

```
devmemory/
├── src/
│   ├── main/                 # Electron main process
│   │   ├── main.ts          # Main application entry
│   │   └── preload.ts       # Preload script for IPC
│   ├── renderer/             # React frontend
│   │   ├── components/      # React components
│   │   ├── hooks/           # Custom React hooks
│   │   ├── pages/           # Application pages
│   │   ├── styles/          # CSS and styling
│   │   ├── App.tsx          # Main React component
│   │   └── index.tsx        # React entry point
│   └── shared/              # Shared utilities and types
│       ├── database/        # Database managers
│       ├── types/           # TypeScript type definitions
│       └── utils/           # Utility functions
├── dist/                    # Built application files
├── dist-electron/           # Packaged Electron app
└── package.json             # Dependencies and scripts
```

## 🔧 Configuration

The application creates a configuration file on first run. Settings can be modified through the Settings UI or by editing the config file directly.

### Default Configuration Locations
- **Windows**: `%APPDATA%/devmemory/config.json`
- **macOS**: `~/Library/Application Support/devmemory/config.json`
- **Linux**: `~/.config/devmemory/config.json`

### Key Configuration Options
```json
{
  "database": {
    "sqlitePath": "path/to/devmemory.db",
    "chromaPath": "path/to/chroma"
  },
  "llm": {
    "awsRegion": "us-east-1",
    "bedrockModelId": "anthropic.claude-3-sonnet-20240229-v1:0",
    "embeddingModelId": "amazon.titan-embed-text-v1"
  },
  "ui": {
    "theme": "system",
    "defaultView": "list"
  },
  "integration": {
    "vscode": {
      "enabled": true,
      "autoCapture": true,
      "captureCommands": true,
      "captureFiles": true
    }
  }
}
```

## 🔌 VSCode Integration

### Installing the VSCode Extension
1. Navigate to the `vscode-extension/` directory (when created)
2. Run `npm install && npm run compile`
3. Press `F5` to launch extension in development mode
4. Or package with `vsce package` and install the `.vsix` file

### Extension Features
- Automatic context capture from active files
- Terminal command history tracking
- Git repository and branch information
- Workspace folder detection
- Quick memory creation from selected code

## 📋 Usage

### Creating Memories
1. Click "New Memory" or press `Ctrl+N` (Cmd+N on macOS)
2. Enter a descriptive title
3. Select the appropriate memory type
4. Add content (code, notes, documentation, etc.)
5. Add tags for organization
6. Fill in metadata (source, project, URL, etc.)
7. Save the memory

### Searching Memories
1. Click "Search" or press `Ctrl+F` (Cmd+F on macOS)
2. Enter search terms (supports natural language queries)
3. Use filters to narrow results by type, tags, or date range
4. Click on results to view or edit

### Knowledge Graph View
- Press `Ctrl+G` (Cmd+G on macOS) to view the knowledge graph
- Visualizes relationships between memories
- Interactive nodes show memory details
- Helps discover connections in your knowledge

## 🛡️ Security Considerations

### Data Storage
- All data stored locally by default
- SQLite database contains structured data
- Chroma vector database contains embeddings
- No data sent to external services except AWS Bedrock for LLM processing

### AWS Integration
- Requires valid AWS credentials
- Data sent to Bedrock for embedding generation and LLM processing
- Ensure compliance with your organization's data policies
- Consider using VPC endpoints for enhanced security

### Future Security Enhancements
- End-to-end encryption for sensitive memories
- LDAP/SSO integration for enterprise authentication
- Audit logging for compliance
- Data retention policies
- Team collaboration with access controls

## 🚀 Stretch Goals & Roadmap

### Phase 2: Enhanced Intelligence
- [ ] Advanced vector search with Chroma integration
- [ ] AI-powered categorization and tagging
- [ ] Smart suggestions based on context
- [ ] Duplicate detection and merging

### Phase 3: Team Collaboration
- [ ] Shared knowledge graphs
- [ ] Real-time collaboration
- [ ] Team insights and analytics
- [ ] Knowledge sharing workflows

### Phase 4: Advanced Features
- [ ] Multi-IDE support (IntelliJ, Vim, Emacs)
- [ ] Mobile companion app
- [ ] Plugin ecosystem
- [ ] Advanced analytics dashboard

### Phase 5: Enterprise Features
- [ ] SSO/LDAP integration
- [ ] Advanced security and compliance
- [ ] Cloud sync and backup
- [ ] Enterprise deployment tools

## 🐛 Troubleshooting

### Common Issues

**Build Errors with better-sqlite3**
```bash
# Windows: Install Visual Studio Build Tools
# Then rebuild native dependencies
npm rebuild better-sqlite3
```

**Python/Chroma Issues**
```bash
# Ensure Python is in PATH
python --version

# Reinstall chromadb
pip uninstall chromadb
pip install chromadb
```

**AWS Bedrock Access Denied**
1. Verify AWS credentials are configured
2. Ensure Bedrock model access is enabled in AWS Console
3. Check IAM permissions for Bedrock services

**VSCode Extension Not Working**
1. Restart VSCode after installation
2. Check extension is enabled in Extensions panel
3. Verify DevMemory desktop app is running

### Getting Help
1. Check the GitHub Issues page
2. Review the troubleshooting documentation
3. Contact your enterprise IT support for AWS/deployment issues

## 📝 Development

### Running Tests
```bash
npm test
```

### Building for Distribution
```bash
# Build for current platform
npm run package

# Build for specific platforms
npm run package -- --platform=win32
npm run package -- --platform=darwin
npm run package -- --platform=linux
```

### Contributing
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

## 🙏 Acknowledgments

- Built with Electron, React, and TypeScript
- Vector database powered by Chroma
- LLM capabilities via AWS Bedrock
- Inspired by the MCP memory server project# memoryme
