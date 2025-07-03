# DevMemory - Quick Start Guide

Get DevMemory running on your machine in 15 minutes or less.

## 🚀 Fast Track Installation

### Option 1: Use Pre-built Installer (If Available)
1. Check if there's a release at: https://github.com/[your-org]/devmemory/releases
2. Download `DevMemory-Setup-1.0.0.exe`
3. Run as Administrator → Follow wizard → Done!

### Option 2: Build from Source (Most Likely)
Since this is a new application, you'll probably need to build it:

## ⚡ 5-Step Build Process

### 1️⃣ Install Prerequisites (5 minutes)
Download and install these (as Administrator):
- **Node.js 18+**: https://nodejs.org/ (select "Automatically install necessary tools")
- **Python 3.9+**: https://python.org/downloads/ (check "Add to PATH")
- **VS Build Tools**: https://visualstudio.microsoft.com/visual-cpp-build-tools/ (select "C++ build tools")

### 2️⃣ Get the Code (1 minute)
```cmd
# Download source code
git clone https://github.com/[your-org]/devmemory.git
cd devmemory

# Or download ZIP from GitHub and extract
```

### 3️⃣ Install Dependencies (3 minutes)
```cmd
# Open Command Prompt as Administrator
pip install chromadb
npm install
```

### 4️⃣ Build the App (5 minutes)
```cmd
npm run package:win
```

### 5️⃣ Install & Run (1 minute)
```cmd
# The installer is created at:
# dist-electron\DevMemory-Setup-1.0.0.exe

# Run it as Administrator
```

## 🔧 One-Command Build (Alternative)
Use our automated script:
```cmd
powershell -ExecutionPolicy Bypass -File scripts\release.ps1
```

This does steps 3-4 automatically with error checking.

## ✅ Verification

After installation, verify it works:
1. **Launch**: Start Menu → DevMemory
2. **Test**: Create a new memory with title "Test"
3. **Search**: Search for "test" - should find your memory
4. **Settings**: Press Ctrl+, to open settings

## 🐛 Common Issues

**"gyp ERR! find VS"**: 
```cmd
npm config set msvs_version 2022
npm rebuild better-sqlite3
```

**"Python not found"**: 
- Reinstall Python with "Add to PATH" checked
- Restart Command Prompt

**"Permission denied"**: 
- Run Command Prompt as Administrator
- Check antivirus isn't blocking the build

**Build takes forever**: 
- First build downloads ~500MB of dependencies
- Subsequent builds are much faster

## 🎯 What You Get

After installation:
- **Desktop app**: Professional Electron application
- **Data storage**: Local SQLite database (`%APPDATA%\devmemory\`)
- **Memory types**: 11 different types (code, docs, notes, etc.)
- **Full-text search**: Find anything instantly
- **AWS integration**: Ready for Bedrock LLM features

## 📚 Next Steps

1. **Basic usage**: Create your first memories
2. **AWS setup**: Configure Bedrock for LLM features (optional)
3. **VSCode integration**: Install the extension (coming soon)
4. **Enterprise setup**: See DEPLOYMENT.md for team deployment

## 🆘 Need Help?

- **Build issues**: Check BUILD.md for detailed troubleshooting
- **Enterprise deployment**: See DEPLOYMENT.md
- **Security questions**: See SECURITY.md
- **General issues**: Check the GitHub issues page

---

**Expected total time**: 15 minutes for fresh install + build
**Installer size**: ~150-200 MB
**System requirements**: Windows 10/11, 4GB RAM, 2GB storage