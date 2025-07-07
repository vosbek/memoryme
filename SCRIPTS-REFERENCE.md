# 📜 DevMemory Scripts Reference

## 🚀 **Quick Commands**

```powershell
# Fresh machine setup
npm install && npm run build && npm run dev:full

# Daily development (with ChromaDB - recommended)
npm run dev:full

# Daily development (basic mode)
npm run dev

# Production build and run
npm run build && npx electron .

# Create Windows installer
npm run dist

# Install VS Code extension
cd vscode-extension && code --install-extension devmemory-vscode-1.0.0.vsix
```

---

## 📋 **All Available Scripts**

### **🔧 Development Scripts**

| Command | Description | Use Case |
|---------|-------------|----------|
| `npm run dev` | Basic development mode | Quick start without ChromaDB |
| `npm run dev:full` | Full mode with ChromaDB | **Recommended** - complete experience |
| `npm run dev:electron` | Start only Electron | Debugging main process |
| `npm run dev:react` | Start only React server | Frontend development |
| `npm run chromadb` | Start only ChromaDB | Manual ChromaDB management |

### **🏗️ Build Scripts**

| Command | Description | Use Case |
|---------|-------------|----------|
| `npm run build` | Full production build | Complete compilation |
| `npm run build:react` | Build renderer only | Frontend-only changes |
| `npm run build:electron` | Build main process only | Backend-only changes |
| `npm run copy-wasm` | Copy SQL.js WASM files | Fix database issues |

### **📦 Packaging Scripts**

| Command | Description | Output |
|---------|-------------|--------|
| `npm run package` | Platform-specific build | Current OS format |
| `npm run package:win` | Windows installer | `.exe` file |
| `npm run package:mac` | macOS application | `.dmg` file |
| `npm run package:linux` | Linux packages | `.AppImage`, `.deb` |
| `npm run dist` | Build + package | Complete installer |

### **🧪 Testing Scripts**

| Command | Description | Scope |
|---------|-------------|-------|
| `npm run test` | Run all tests | Complete test suite |
| `npm run test:watch` | Watch mode testing | Development testing |
| `npm run test:coverage` | Coverage report | Quality assurance |
| `npm run test:ci` | CI/CD testing | Automated builds |
| `npm run test:unit` | Component tests only | Frontend testing |
| `npm run test:integration` | Integration tests | System testing |
| `npm run test:database` | Database tests | Backend testing |

### **🔧 Maintenance Scripts**

| Command | Description | When to Use |
|---------|-------------|-------------|
| `npm run lint` | Check code style | Before commits |
| `npm run lint:fix` | Auto-fix style issues | Clean up code |
| `npm run clean` | Remove build artifacts | Troubleshooting |
| `npm run rebuild` | Clean + reinstall | Fresh start |

### **🧩 VS Code Extension Scripts**

| Command | Description | Output |
|---------|-------------|--------|
| `cd vscode-extension && npm install` | Install extension dependencies | Extension ready |
| `cd vscode-extension && npm run compile` | Build extension TypeScript | Compiled JS files |
| `cd vscode-extension && npm run package` | Create .vsix package | devmemory-vscode-1.0.0.vsix |
| `code --install-extension ./vscode-extension/devmemory-vscode-1.0.0.vsix` | Install extension | Extension active |

---

## 🎯 **Usage Scenarios**

### **👨‍💻 Daily Development**

```powershell
# Best experience (with ChromaDB)
npm run dev:full

# Alternative: Manual control
# Terminal 1:
.\start-chromadb.bat
# Terminal 2: 
npm run dev
```

### **🆕 Fresh Machine Setup**

```powershell
# 1. Install prerequisites
pip install chromadb

# 2. Install and build
npm install
npm run build

# 3. Start development
npm run dev:full
```

### **🐛 Troubleshooting**

```powershell
# Clean rebuild
npm run clean
npm install
npm run build

# Check if WASM files copied correctly
npm run copy-wasm

# Test without ChromaDB
npm run dev
```

### **🚀 Production Deployment**

```powershell
# Local production test
npm run build
npx electron .

# Create installer
npm run dist
# Output: dist-electron/DevMemory-Setup-{version}.exe
```

### **🔧 Development Workflows**

```powershell
# Frontend only changes
npm run build:react
npm run dev:electron

# Backend only changes  
npm run build:electron
npm run dev:react

# Database fixes
npm run copy-wasm
npm run build:electron

# VS Code extension development
cd vscode-extension
npm install
npm run compile
npm run package
code --install-extension devmemory-vscode-1.0.0.vsix
```

---

## 📋 **Prerequisites**

### **Required for Basic Usage:**
- ✅ **Node.js 18+** - `node --version`
- ✅ **npm 8+** - `npm --version`

### **Required for Full Experience:**
- ✅ **Python 3.8+** - `python --version`
- ✅ **ChromaDB** - `pip install chromadb`

### **Optional:**
- ⚡ **Git** - For repository management
- 🔧 **VS Code** - For development and extension usage

---

## ⚠️ **Important Notes**

### **Script Behavior:**
- ❌ **NO `npm start` script** - Use `npm run dev` instead
- ✅ **Automatic WASM copying** - SQL.js files handled automatically
- ✅ **Graceful ChromaDB fallback** - App works without ChromaDB
- ✅ **Hot reload** - Changes update automatically in dev mode

### **ChromaDB Integration:**
- 🟢 **`dev:full`** - Automatically starts ChromaDB
- 🟡 **`dev`** - Uses legacy vector store if ChromaDB unavailable
- 🔴 **ChromaDB connection failed** - App continues with basic functionality

### **Build Process:**
- 📦 **Webpack** handles TypeScript compilation
- 🗃️ **Electron Builder** creates installers
- 🔧 **ESLint** enforces code quality
- 🧪 **Jest** runs tests

---

## 🔍 **Script Diagnostics**

### **Check Script Status:**
```powershell
# Verify all tools available
node --version
npm --version
python --version
python -c "import chromadb; print('ChromaDB OK')"

# Test individual components
npm run copy-wasm
npm run chromadb
npm run build:electron
npm run build:react
```

### **Common Script Issues:**

| Error | Solution |
|-------|----------|
| `npm start` not found | Use `npm run dev` instead |
| ChromaDB not available | `pip install chromadb` |
| WASM files missing | `npm run copy-wasm` |
| Build fails | `npm run clean && npm install` |
| TypeScript errors | `npm run lint:fix` |
| Tests failing | `npm run test:watch` |
| VS Code extension not working | `cd vscode-extension && npm run compile` |

---

## 📞 **Getting Help**

1. **Check prerequisites** are installed
2. **Try clean rebuild:** `npm run rebuild`
3. **Test basic mode:** `npm run dev`
4. **Check logs** for specific error messages
5. **Refer to** [Windows Installation Guide](WINDOWS-INSTALLATION-GUIDE.md)

---

*DevMemory v1.0.3 Scripts Reference | Updated: July 2025*