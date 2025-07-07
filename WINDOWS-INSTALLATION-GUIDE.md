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

### **Step 3: Install Visual Studio Code (Recommended)**
1. Go to [code.visualstudio.com](https://code.visualstudio.com/)
2. Download and install **VS Code**
3. ✅ **Optional but helpful for viewing/editing files**

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

**✅ Enterprise Ready**: 
- No native compilation needed - all dependencies are pure JavaScript!
- All packages available from company artifactory (art.nwie.net)
- No external registry dependencies required

### **Step 7: Configure Environment (Optional)**

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

### **Step 8: Build the Application**
```powershell
npm run build
```
⏱️ **This will take 2-3 minutes**

✅ **Success indicators:**
- No TypeScript errors
- Files created in `dist/` folder
- Build completes with "compiled successfully"

### **Step 9: Start the Application**

**⚠️ IMPORTANT: There is NO `npm start` script**

**For Development (Recommended):**
```powershell
npm run dev
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

### **Expected Behavior**
- ✅ **App opens successfully**
- ✅ **No error popups on startup**
- ✅ **Can create and save memories**
- ✅ **Search functionality works**
- ✅ **UI is responsive and functional**

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

# For development:
npm run dev

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
# 2. Contact IT to ensure sql.js and @types/sql.js are available
# 3. The sql.js migration ensures all packages are standard npm packages

# Critical packages that must be available in art.nwie.net:
# - sql.js (replaces better-sqlite3)
# - @types/sql.js (TypeScript definitions)
# - All other packages are standard dependencies
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
- **Windows:** `C:\Users\%USERNAME%\AppData\Roaming\DevMemory\`
  - `devmemory.db` - Your memories (SQLite database via sql.js)
  - `chromadb/` - Vector search index
  - `m365-config` - Microsoft 365 settings

**🏢 Enterprise Benefits:**
- Database file is pure binary (no native dependencies)
- Can be backed up, moved, or restored easily
- Works across different Windows versions and architectures
- No registry dependencies or system-level database drivers

---

## 🔄 **Development Mode (Optional)**

If you want to run DevMemory in development mode:

```powershell
# Install development dependencies
npm install

# Start in development mode (with hot reload)
npm run dev
```

This opens the app with debugging tools and auto-reload on code changes.

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

### **Without Optional Configuration:**
- ✅ Full memory management (create, edit, delete, search)
- ✅ Local vector search with ChromaDB
- ✅ Knowledge graph functionality
- ✅ SQLite database for structured data
- ⚠️ Basic embeddings (no AWS Bedrock)
- ❌ Microsoft 365 integration disabled

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