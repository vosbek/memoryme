# 🆕 DevMemory - Fresh Windows Machine Setup

## 📋 **Complete Setup for Brand New Windows Machine**

This guide assumes you're starting with a **completely fresh Windows machine** with nothing installed except Windows itself.

---

## 🎯 **Overview: What We're Installing**

By the end of this guide, you'll have:
- ✅ **Node.js 18+** (JavaScript runtime)
- ✅ **Git** (version control)
- ✅ **Python 3.8+** (for ChromaDB vector search)
- ✅ **DevMemory** (the application)
- ✅ **ChromaDB** (professional vector search)
- ✅ **PowerShell** (already on Windows)

**Total Setup Time: 15-20 minutes**

---

## 📋 **Step-by-Step Installation**

### **Step 1: Install Node.js** ⏱️ *3 minutes*

1. **Open your web browser**
2. **Go to:** [https://nodejs.org](https://nodejs.org)
3. **Download:** The **LTS version** (left green button - should be 18.x or higher)
4. **Run the installer:**
   - Double-click the downloaded `.msi` file
   - Click "Next" through all steps (accept defaults)
   - **Important:** Keep "Add to PATH" checked ✅
5. **Verify installation:**
   - Press `Windows + R`, type `powershell`, press Enter
   - Type: `node --version` (should show v18.x.x or higher)
   - Type: `npm --version` (should show 8.x.x or higher)

### **Step 2: Install Git** ⏱️ *2 minutes*

1. **Go to:** [https://git-scm.com/download/win](https://git-scm.com/download/win)
2. **Download:** Git for Windows (64-bit)
3. **Run the installer:**
   - Accept all default settings
   - Click "Next" through all steps
4. **Verify installation:**
   - In PowerShell: `git --version` (should show git version 2.x.x)

### **Step 3: Install Python** ⏱️ *3 minutes*

1. **Go to:** [https://python.org/downloads](https://python.org/downloads)
2. **Download:** Latest Python 3 (should be 3.8+ or higher)
3. **Run the installer:**
   - ✅ **CRITICAL:** Check "Add Python to PATH" at the bottom
   - Click "Install Now"
4. **Verify installation:**
   - In PowerShell: `python --version` (should show Python 3.x.x)
   - Or try: `python3 --version`

### **Step 4: Install ChromaDB** ⏱️ *1 minute*

1. **In PowerShell, run:**
   ```powershell
   pip install chromadb
   ```
2. **Verify installation:**
   ```powershell
   python -c "import chromadb; print('ChromaDB installed successfully')"
   ```

### **Step 5: Get DevMemory** ⏱️ *2 minutes*

1. **Navigate to your desired folder:**
   ```powershell
   cd C:\Users\$env:USERNAME\Documents
   ```
2. **Clone the repository:**
   ```powershell
   git clone <YOUR-REPOSITORY-URL> memory
   cd memory
   ```

### **Step 6: Install DevMemory Dependencies** ⏱️ *3-5 minutes*

1. **Install all dependencies:**
   ```powershell
   npm install
   ```
   *This downloads ~1300 packages and takes 3-5 minutes*

2. **Build the application:**
   ```powershell
   npm run build
   ```
   *This compiles TypeScript and takes 2-3 minutes*

### **Step 7: Start DevMemory** ⏱️ *30 seconds*

**Option A: Full Experience (Recommended)**
```powershell
# Start everything together:
npm run dev:full
```

**Option B: Manual Control**
```powershell
# Terminal 1: Start ChromaDB
.\start-chromadb.bat

# Terminal 2: Start DevMemory (open new PowerShell)
npm run dev
```

**Option C: Basic Mode (No ChromaDB)**
```powershell
npm run dev
```

### **Step 8: Install VS Code Extension (Optional)** ⏱️ *2 minutes*

**🧩 Supercharge your coding workflow with instant memory capture!**

```powershell
# Install the VS Code extension
cd vscode-extension
code --install-extension devmemory-vscode-1.0.0.vsix

# Or install manually:
# 1. Open VS Code
# 2. Extensions (Ctrl+Shift+X)  
# 3. "..." menu → "Install from VSIX"
# 4. Select devmemory-vscode-1.0.0.vsix
```

**Configure in VS Code:**
- Open Settings (`Ctrl+,`)
- Search "DevMemory"
- Set App Path to your DevMemory installation

**Start using:**
- `Ctrl+Shift+M` - Capture selected code
- `Ctrl+Shift+F` - Search memories from VS Code
- `Ctrl+Alt+M` - Quick capture panel

---

## ✅ **Success Indicators**

### **You'll know it's working when:**

1. **ChromaDB shows:**
   ```
   Saving data to: chromadb-data
   Connect to Chroma at: http://localhost:8000
   Listening on localhost:8000
   ```

2. **DevMemory shows:**
   ```
   ✓ SQLite database initialized
   ✓ ChromaDB vector store initialized
   "chromaDB": true
   Hybrid database system initialized successfully
   ```

3. **Web interface opens:**
   - DevMemory desktop app window appears
   - OR browser opens to http://localhost:3000

---

## 🔧 **Verification Checklist**

**Test these features to ensure everything works:**

- [ ] **App opens without errors**
- [ ] **Create a new memory** (click "New Memory" button)
- [ ] **Search works** (type in search box)
- [ ] **Console shows** `"chromaDB": true`
- [ ] **No red error messages** in console

**VS Code Extension (if installed):**
- [ ] **Extension appears** in VS Code Extensions list
- [ ] **DevMemory sidebar** visible in VS Code Explorer
- [ ] **Code capture works** (`Ctrl+Shift+M`)
- [ ] **Search from VS Code** (`Ctrl+Shift+F`)
- [ ] **Quick capture panel** (`Ctrl+Alt+M`)

---

## 🐛 **Troubleshooting Common Issues**

### **"node is not recognized"**
- **Solution:** Restart PowerShell, or restart your computer
- **Check:** Node.js installer completed successfully

### **"python is not recognized"**  
- **Solution:** Python wasn't added to PATH during installation
- **Fix:** Reinstall Python, CHECK "Add Python to PATH"

### **"pip install chromadb" fails**
- **Check:** `python --version` works first
- **Try:** `python -m pip install chromadb`
- **Alternative:** `py -m pip install chromadb`

### **npm install takes forever**
- **Normal:** Can take 5+ minutes on slow connections
- **Solution:** Be patient, it's downloading ~200MB of packages

### **ChromaDB won't start**
- **Check:** `python -c "import chromadb"`
- **If fails:** `pip install chromadb`
- **Alternative:** Use basic mode: `npm run dev`

### **App shows "chromaDB": false**
- **Cause:** ChromaDB server not running
- **Solution:** Start ChromaDB: `.\start-chromadb.bat`
- **Note:** App still works in fallback mode

---

## 💾 **Where Your Data Is Stored**

DevMemory creates files in:
- **Your memories:** `C:\Users\%USERNAME%\AppData\Roaming\devmemory\devmemory.db`
- **ChromaDB data:** `C:\path\to\memory\chromadb-data\`
- **App settings:** Same AppData folder

**💡 Tip:** These folders are automatically created on first run.

---

## 🚀 **What's Next?**

### **Your DevMemory is now ready!**

1. **Create your first memory**
2. **Try the search functionality**  
3. **Explore the knowledge graph**
4. **Optional:** [Set up AWS Bedrock](WINDOWS-INSTALLATION-GUIDE.md#aws-bedrock-setup-for-ai-features)
5. **Optional:** [Set up Microsoft 365](WINDOWS-INSTALLATION-GUIDE.md#microsoft-365-integration-setup)

### **Daily Usage:**
```powershell
# Navigate to your memory folder
cd C:\Users\$env:USERNAME\Documents\memory

# Start DevMemory with ChromaDB
npm run dev:full

# OR start components separately:
# Terminal 1: .\start-chromadb.bat
# Terminal 2: npm run dev
```

### **VS Code Integration Workflow:**
```powershell
# 1. Start DevMemory
npm run dev:full

# 2. Open VS Code in your project
code .

# 3. Start capturing code:
# - Select useful code → Ctrl+Shift+M
# - Need similar code? → Ctrl+Shift+F
# - Quick notes → Ctrl+Alt+M
```

---

## 📞 **Still Having Issues?**

1. **Check the** [Windows Installation Guide](WINDOWS-INSTALLATION-GUIDE.md) **troubleshooting section**
2. **Ensure all prerequisites** are properly installed
3. **Try the clean reinstall** process:
   ```powershell
   # In the memory folder:
   rmdir /s node_modules
   del package-lock.json
   npm install
   npm run build
   npm run dev:full
   ```

---

## 🎉 **Congratulations!**

You now have a **fully functional DevMemory installation** with:
- ✅ **Professional vector search** (ChromaDB)
- ✅ **Local SQLite database** (sql.js)
- ✅ **Knowledge graph** capabilities
- ✅ **Real-time search** and memory management
- ✅ **Privacy-first** local storage
- ✅ **VS Code integration** (if installed) for seamless code capture

**Welcome to DevMemory!** 🧠✨

---

*Setup guide for DevMemory v1.0.3 | Updated: July 2025*