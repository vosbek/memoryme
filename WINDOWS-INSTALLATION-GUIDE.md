# 🖥️ DevMemory - Windows Installation Guide

## 📋 **Fresh Windows Machine Setup Guide**

This guide will walk you through installing DevMemory on a completely fresh Windows machine from scratch.

---

## 🎯 **What DevMemory Does**

DevMemory is an **Enterprise Developer Memory Assistant** that:
- Captures and stores development knowledge using AI-powered vector search
- Integrates with Microsoft 365 (Outlook, Teams, SharePoint, OneDrive)
- Uses ChromaDB for semantic search and SQLite (sql.js) for structured data
- Builds knowledge graphs from your development activities
- Works 100% locally with optional cloud AI enhancements

### **🏢 Enterprise Deployment Ready**
- ✅ **Pure JavaScript Database**: Uses sql.js instead of better-sqlite3 (no native compilation)
- ✅ **Artifactory Compatible**: Works with company registry (art.nwie.net)
- ✅ **No Build Tools Required**: No Visual Studio Build Tools or C++ compiler needed
- ✅ **NODE_MODULE_VERSION Safe**: Eliminates native module version conflicts
- ✅ **Standard npm Packages**: All dependencies available in corporate artifactories

---

## 📋 **Prerequisites Installation**

### **Step 1: Install Node.js**
1. Go to [nodejs.org](https://nodejs.org/)
2. Download **Node.js 18 LTS** (or newer)
3. Run the installer with **default settings**
4. ✅ **Verify installation:**
   ```powershell
   node --version    # Should show v18.x.x or higher
   npm --version     # Should show 8.x.x or higher
   ```

### **Step 2: Install Git**
1. Go to [git-scm.com](https://git-scm.com/download/win)
2. Download **Git for Windows**
3. Run installer with **default settings**
4. ✅ **Verify installation:**
   ```powershell
   git --version     # Should show git version 2.x.x
   ```

### **Step 3: Install Visual Studio Code (Highly Recommended)**
1. Go to [code.visualstudio.com](https://code.visualstudio.com/)
2. Download and install **VS Code**
3. ✅ **Highly recommended for the DevMemory VS Code extension**

---

## 🚀 **DevMemory Installation**

### **Step 4: Clone the Repository**
1. **Open PowerShell or Command Prompt**
2. **Navigate to your desired folder:**
   ```powershell
   cd C:\Users\%USERNAME%\Documents
   # Or wherever you want to install
   ```
3. **Clone the repository:**
   ```powershell
   git clone <YOUR-REPOSITORY-URL> memory
   cd memory
   ```

### **Step 5: Configure Enterprise Registry**

**🏢 CRITICAL: Configure company artifactory first**

```powershell
# Configure npm to use company registry
npm config set registry https://art.nwie.net/repository/npm/
npm config set @types:registry https://art.nwie.net/repository/npm/

# Verify configuration
npm config get registry
# Should show: https://art.nwie.net/repository/npm/
```

### **Step 6: Install Dependencies**
```powershell
npm install
```
⏱️ **This will take 2-5 minutes** depending on your connection to art.nwie.net.

**✅ Verify Installation Success:**
```powershell
# Check if webpack was installed correctly
npx webpack --version

# Check if all dependencies installed
npm list --depth=0

# If webpack not found, install explicitly:
npm install webpack webpack-cli --save-dev
```

**✅ Enterprise Ready**: 
- No native compilation needed - all dependencies are pure JavaScript!
- All packages available from company artifactory (art.nwie.net)
- No external registry dependencies required

### **Step 7: Install Python for ChromaDB (Recommended)**

**🔍 For Enhanced Vector Search**: ChromaDB provides professional-grade semantic search with HNSW indexing.

1. **Install Python 3.8+ (if not already installed):**
   - Download from [python.org](https://www.python.org/downloads/)
   - ✅ **IMPORTANT**: Check "Add Python to PATH" during installation
   
2. **Install ChromaDB:**
   ```powershell
   pip install chromadb
   ```

3. **Verify ChromaDB installation:**
   ```powershell
   python -c "import chromadb; print('ChromaDB installed successfully')"
   ```

**⚠️ Note**: If you skip this step, the app will use a basic vector store instead.

### **Step 8: Configure Environment (Optional)**

**⚠️ Note**: The `.env.example` file may not exist yet. This step is completely optional - the app works without it.

1. **Copy the example environment file (if it exists):**
   ```powershell
   copy .env.example .env
   ```
   If this fails, you can create a `.env` file manually or skip this step.
2. **Edit `.env` file** (optional - app works without this):
   ```
   # For AI features (optional)
   AWS_REGION=us-east-1
   
   # For Microsoft 365 integration (optional)
   AZURE_CLIENT_ID=your-azure-app-client-id
   AZURE_AUTHORITY=https://login.microsoftonline.com/common
   
   NODE_ENV=production
   ```

### **Step 9: Build the Application**
```powershell
npm run build
```
⏱️ **This will take 2-3 minutes**

✅ **Success indicators:**
- No TypeScript errors
- Files created in `dist/` folder
- Build completes with "compiled successfully"

### **Step 10: Start the Application**

**⚠️ IMPORTANT: There is NO `npm start` script**

**Option A: Full Experience with ChromaDB (Recommended):**
```powershell
# Terminal 1: Start ChromaDB server
.\start-chromadb.bat

# Terminal 2: Start the app (in a new PowerShell window)
npm run dev
```

**Option B: Quick Start without ChromaDB:**
```powershell
npm run dev
```

**Option C: Everything in One Command:**
```powershell
npm run dev:full
```

**For Production Testing:**
```powershell
# After npm run build:
npx electron .
```

**Or Create Windows Installer:**
```powershell
npm run dist
# Creates: dist-electron/DevMemory-Setup-{version}.exe
```

🎉 **DevMemory should now open!**

### **🔍 ChromaDB Connection Status**
- ✅ **With ChromaDB**: Professional vector search, 10-100x faster
- ⚠️ **Without ChromaDB**: Basic vector search (still functional)

### **Step 11: Install VS Code Extension (Optional but Recommended)**

**🧩 Supercharge your coding workflow with instant memory capture!**

1. **Install the extension:**
   ```powershell
   # Navigate to the vscode-extension folder
   cd vscode-extension
   
   # Install the .vsix file in VS Code
   code --install-extension devmemory-vscode-1.0.0.vsix
   ```

2. **Alternative manual installation:**
   - Open VS Code
   - Go to Extensions (`Ctrl+Shift+X`)
   - Click "..." menu → "Install from VSIX..."
   - Select `vscode-extension/devmemory-vscode-1.0.0.vsix`

3. **Configure the extension:**
   - Open VS Code Settings (`Ctrl+,`)
   - Search for "DevMemory"
   - Set **App Path** to your DevMemory installation location

4. **Start using:**
   - `Ctrl+Shift+M` - Capture selected code as memory
   - `Ctrl+Shift+F` - Search memories from VS Code
   - `Ctrl+Alt+M` - Open quick capture panel

**✨ VS Code Extension Features:**
- 📋 **Instant capture**: Select code → Ctrl+Shift+M → Saved!
- 🔍 **In-editor search**: Find code snippets without leaving VS Code
- 🌲 **Explorer integration**: Browse memories in sidebar
- 🚀 **Zero context switching**: Everything inside your editor

---

## ✅ **Verification Checklist**

After installation, verify these features work:

### **Core Functionality**
- [ ] Application starts without errors
- [ ] Can create a new memory (click "New Memory" button)
- [ ] Can view memories in the list
- [ ] Can search memories (try typing in search box)
- [ ] Settings page opens (click gear icon)
- [ ] Knowledge graph displays (if you have memories)

### **VS Code Extension (if installed)**
- [ ] Extension appears in VS Code Extensions list
- [ ] DevMemory sidebar appears in VS Code Explorer
- [ ] Can capture code with `Ctrl+Shift+M`
- [ ] Can search memories with `Ctrl+Shift+F`
- [ ] Quick capture panel opens with `Ctrl+Alt+M`

### **Expected Behavior**
- ✅ **App opens successfully**
- ✅ **No error popups on startup**
- ✅ **Can create and save memories**
- ✅ **Search functionality works**
- ✅ **UI is responsive and functional**

### **ChromaDB Status Check**
In the app console logs, look for:
- ✅ **With ChromaDB**: `"chromaDB": true` in health check
- ⚠️ **Without ChromaDB**: `"chromaDB": false` + fallback message

---

## 🔧 **Optional: Advanced Configuration**

### **AWS Bedrock Setup (For AI Features)**
1. **Install AWS CLI:**
   - Download from [aws.amazon.com/cli](https://aws.amazon.com/cli/)
2. **Configure AWS credentials:**
   ```powershell
   aws configure
   # Enter your AWS Access Key, Secret Key, and region
   ```
3. **Ensure Bedrock access** in your AWS account for your region

### **Microsoft 365 Integration Setup**
1. **Register Azure AD Application:**
   - Go to [Azure Portal](https://portal.azure.com)
   - Navigate to "Azure Active Directory" → "App registrations"
   - Click "New registration"
   - Name: "DevMemory"
   - Supported account types: "Accounts in any organizational directory"
   - Redirect URI: Leave blank for desktop app
   - Copy the "Application (client) ID"

2. **Configure API Permissions:**
   - In your app registration, go to "API permissions"
   - Add these permissions:
     - `User.Read`
     - `Mail.Read`
     - `Calendars.Read`
     - `Sites.Read.All`
     - `Files.Read.All`

3. **Update .env file:**
   ```
   AZURE_CLIENT_ID=your-copied-client-id
   ```

4. **Restart the application:**
   ```powershell
   # Stop current app if running (Ctrl+C)
   npm run dev
   ```

---

## 🐛 **Troubleshooting**

### **Common Issues & Solutions**

#### **"npm install" fails**
```powershell
# Clear npm cache and try again
npm cache clean --force
npm install
```

#### **Build fails with TypeScript errors**
```powershell
# Ensure you have the latest code
git pull origin main
npm install
npm run build
```

#### **"webpack is not recognized" Error**
```powershell
# This happens when webpack wasn't installed properly
# Solution 1: Use npx to run webpack
npx webpack --config webpack.renderer.config.js --mode production

# Solution 2: Install webpack explicitly
npm install webpack webpack-cli --save-dev

# Solution 3: Check if node_modules/.bin is in PATH
echo $env:PATH | Select-String "node_modules"

# Solution 4: Run build with npx
npm run build:react
# If that fails, try:
npx webpack --config webpack.renderer.config.js --mode production
```

#### **53 TypeScript Problems in VS Code**
```powershell
# Check if TypeScript is installed
npx tsc --version

# Install TypeScript if missing
npm install typescript --save-dev

# Run TypeScript check
npx tsc --noEmit

# Clear VS Code TypeScript cache
# In VS Code: Ctrl+Shift+P → "TypeScript: Restart TS Server"
```

#### **Application won't start**
```powershell
# Check if all dependencies installed correctly
npm install
# Try rebuilding
npm run clean
npm run build

# IMPORTANT: Use npm run dev, NOT npm start
npm run dev
```

#### **"electron command not found"**
```powershell
# Install electron globally
npm install -g electron
# Or run locally
npx electron .
```

#### **Port already in use (if running in dev mode)**
```powershell
# Kill processes using port 3000
netstat -ano | findstr :3000
taskkill /PID <process-id> /F
```

#### **Windows Defender blocking installation**
- Add the `memory` folder to Windows Defender exclusions
- Go to Windows Security → Virus & threat protection → Exclusions

#### **"npm start doesn't exist" Error**
```powershell
# This is CORRECT - the npm start script was intentionally removed
# Use these commands instead:

# For development (basic):
npm run dev

# For development with ChromaDB (recommended):
# Terminal 1:
.\start-chromadb.bat
# Terminal 2:
npm run dev

# All-in-one (if Python/ChromaDB installed):
npm run dev:full

# For production testing:
npm run build
npx electron .

# For creating installer:
npm run dist
```

#### **Native module compilation errors (Should NOT happen)**
```powershell
# If you see better-sqlite3 or node-gyp errors:
# This should NOT occur with the sql.js migration

# Ensure you have the latest code:
git pull origin main
npm install

# The app now uses sql.js (pure JavaScript)
# No C++ compilation or Visual Studio Build Tools required
```

#### **Enterprise registry/artifactory issues**
```powershell
# Ensure company artifactory is configured:
npm config set registry https://art.nwie.net/repository/npm/
npm config set @types:registry https://art.nwie.net/repository/npm/

# Check current configuration:
npm config get registry
npm config list

# If specific packages fail, check artifactory availability:
npm view sql.js --registry https://art.nwie.net/repository/npm/
npm view @types/sql.js --registry https://art.nwie.net/repository/npm/

# Clear npm cache if needed:
npm cache clean --force

# All dependencies are now registry-compatible
# No native modules that require compilation
```

#### **"Package not found" errors from artifactory**
```powershell
# If you get package not found errors:
# 1. Verify the package exists in company artifactory
npm view webpack --registry https://art.nwie.net/repository/npm/
npm view typescript --registry https://art.nwie.net/repository/npm/
npm view electron --registry https://art.nwie.net/repository/npm/

# 2. Check what packages were actually installed
npm list --depth=0

# 3. Install missing dev dependencies manually
npm install --save-dev webpack webpack-cli typescript electron

# 4. If packages missing from artifactory, contact IT
```

#### **DevDependencies not installing from artifactory**
```powershell
# This happens when artifactory doesn't have all packages
# Symptoms: npm install succeeds but shows low package count

# Check if dev dependencies installed
npm list webpack typescript electron
# Should NOT show "(empty)"

# Force install dev dependencies
npm install --only=dev

# Install critical missing packages manually
npm install --save-dev webpack@5.92.1 webpack-cli@5.1.4 typescript@5.5.3 electron@31.0.0

# CRITICAL: Install sql.js packages (often missed)
npm install sql.js@1.8.0 @types/sql.js@1.4.9
```

#### **"Cannot find module 'sql.js'" Error**
```powershell
# This specific error means sql.js wasn't installed
# Even though it's in package.json, it might be missing from node_modules

# 1. Check if sql.js exists
npm list sql.js
# Should NOT show "(empty)"

# 2. Install sql.js explicitly
npm install sql.js@1.8.0 @types/sql.js@1.4.9

# 3. Verify in artifactory
npm view sql.js --registry https://art.nwie.net/artifactory/api/npm/npm/

# 4. Check node_modules
dir node_modules | Select-String "sql"

# 5. Also ensure WASM files are copied
npm run copy-wasm
```

#### **ChromaDB Connection Issues**
```powershell
# ChromaDB server not starting
python -c "import chromadb; print('ChromaDB available')"

# If ChromaDB import fails:
pip install chromadb

# Manual ChromaDB server start:
.\start-chromadb.bat
# Should show: "Listening on localhost:8000"

# Check if ChromaDB is running:
# Open http://localhost:8000 in browser - should show ChromaDB API info

# App logs should show:
# ✅ "chromaDB": true (working)
# ❌ "chromaDB": false (fallback mode)
```

#### **Packages install but don't appear in node_modules (CRITICAL BUG)**
```powershell
# This is a serious artifactory configuration issue
# Symptoms: npm says "added X packages" but they don't exist in node_modules

# 1. Check what's actually installed
dir node_modules | Select-String "webpack"
Test-Path "node_modules\webpack"
# If False, but npm said it installed webpack, this is the bug

# 2. The application has been modified to use npx workaround
# Scripts now use: npx webpack@5.92.1 instead of local webpack

# 3. Try the build anyway (should work with npx)
npm run build

# 4. Contact IT about artifactory package extraction issues
# Critical packages that must be available AND EXTRACTABLE in art.nwie.net:
# - webpack@5.92.1 + webpack-cli@5.1.4 (build system)
# - typescript@5.5.3 (language support)  
# - electron@31.0.0 (desktop framework)
# - sql.js@1.8.0 + @types/sql.js@1.4.9 (database)
```

---

## 📁 **File Structure Overview**

```
memory/
├── src/
│   ├── main/           # Electron main process
│   ├── renderer/       # React frontend
│   └── shared/         # Shared business logic
├── dist/               # Built application
├── node_modules/       # Dependencies
├── .env               # Your configuration (optional)
├── .env.example       # Configuration template
├── package.json       # Project configuration
└── README files       # Documentation
```

---

## 💾 **Data Storage Locations**

DevMemory stores your data in:
- **Windows:** `C:\Users\%USERNAME%\AppData\Roaming\devmemory\`
  - `devmemory.db` - Your memories (SQLite database via sql.js)
  - `vector-data.json` - Legacy vector store (fallback)
  - `m365-config` - Microsoft 365 settings

- **Project Directory:** `C:\path\to\memory\`
  - `chromadb-data/` - ChromaDB vector search index (if using ChromaDB)

**🏢 Enterprise Benefits:**
- Database file is pure binary (no native dependencies)
- Can be backed up, moved, or restored easily
- Works across different Windows versions and architectures
- No registry dependencies or system-level database drivers
- ChromaDB data is portable and can be moved between machines

---

## 🔄 **Development Mode (Optional)**

If you want to run DevMemory in development mode:

```powershell
# Install development dependencies
npm install

# Start in development mode (with hot reload)
npm run dev

# OR start with ChromaDB for full experience:
npm run dev:full
```

This opens the app with debugging tools and auto-reload on code changes.

### **Available Development Commands:**
- `npm run dev` - Basic development mode
- `npm run dev:full` - Development mode with ChromaDB
- `npm run chromadb` - Start only ChromaDB server  
- `npm run copy-wasm` - Copy SQL.js WASM files
- `npm run build` - Build for production
- `npm run build:electron` - Build only main process
- `npm run build:react` - Build only renderer process

---

## 🚀 **Creating Windows Installer (Optional)**

To create a Windows installer (.exe):

```powershell
# Build the application
npm run build

# Create Windows installer
npm run package:win
```

The installer will be created in `dist-electron/` folder.

---

## 🎯 **What to Expect**

### **Basic Configuration (No ChromaDB):**
- ✅ Full memory management (create, edit, delete, search)
- ✅ Basic vector search (legacy mode)
- ✅ Knowledge graph functionality
- ✅ SQLite database for structured data
- ⚠️ Basic embeddings (no AWS Bedrock)
- ❌ Microsoft 365 integration disabled

### **With ChromaDB (Recommended):**
- ✅ **Professional-grade vector search** with HNSW indexing
- ✅ **10-100x faster semantic search** performance
- ✅ Advanced similarity matching and clustering
- ✅ Automatic data migration from legacy vector store

### **With AWS Configuration:**
- ✅ Enhanced AI-powered embeddings
- ✅ Better semantic search quality
- ✅ Claude 3 Sonnet for content analysis

### **With Microsoft 365 Configuration:**
- ✅ Email knowledge extraction
- ✅ Calendar context integration
- ✅ Teams conversation mining
- ✅ SharePoint document intelligence
- ✅ OneDrive file synchronization

---

## 📞 **Getting Help**

If you encounter issues:

1. **Check this troubleshooting section** first
2. **Verify all prerequisites** are installed correctly
3. **Check the logs** in the application console (F12 in the app)
4. **Review the error messages** carefully
5. **Try the clean install process** if all else fails

### **Clean Reinstall Process:**
```powershell
# Remove node_modules and rebuild
rmdir /s node_modules
del package-lock.json
npm install
npm run build

# IMPORTANT: Use npm run dev, NOT npm start
npm run dev
```

---

## 🎉 **Success!**

If you've followed this guide, DevMemory should now be running on your Windows machine with:
- ✅ Core memory management functionality
- ✅ Vector-powered semantic search
- ✅ Knowledge graph capabilities
- ✅ Local data storage and privacy
- ✅ Optional cloud integrations (if configured)

**Welcome to DevMemory!** 🚀

Start by creating your first memory and exploring the knowledge graph to see how DevMemory organizes and connects your development knowledge.

---

*Last updated: July 2025 | Version: 1.0.3 | Status: Production Ready*