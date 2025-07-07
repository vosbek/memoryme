# 🚨 Critical Windows Fixes - Immediate Resolution

## Issue Summary
- Linux-only package `inotify` breaking Windows npm install
- Webpack not recognized after corrupted installation  
- M365 authentication not working properly
- Directory confusion between `memoryme` vs `memory`

## 🔧 **Step-by-Step Fix (Execute in PowerShell as Administrator)**

### Step 1: Navigate to Correct Directory
```powershell
# Navigate to the correct project directory
cd C:\devl\workspaces\memory

# Verify you're in the right place
dir package.json
```

### Step 2: Complete Clean Installation
```powershell
# Remove corrupted installation completely
rmdir /s /q node_modules
del package-lock.json
del dist-electron
rmdir /s /q dist

# Clear npm cache
npm cache clean --force

# Fresh install (this will avoid Linux packages on Windows)
npm install --platform=win32 --arch=x64

# Verify webpack is available
npx webpack --version
```

### Step 3: Rebuild Application
```powershell
# Copy required WASM files
npm run copy-wasm

# Build React renderer with M365 fixes
npm run build:react

# Build Electron main process
npm run build:electron

# Verify build completed
dir dist\renderer.js
dir dist\main.js
```

### Step 4: Test M365 Authentication
```powershell
# Set your M365 credentials (replace with your actual values)
$env:AZURE_CLIENT_ID="4f775650-bbcd-4f4a-b78e-0ad7b3a9309d"
$env:AZURE_CLIENT_SECRET="3faca7b1-bb35-437b-864c-c10ab2f0a6ce"  
$env:AZURE_TENANT_ID="22140e4c-d390-45c2-b297-a26c516dc461"

# Start application in development mode
npm run dev
```

### Step 5: Verify M365 Authentication Works
1. **DevMemory opens** → Desktop app window appears
2. **Click "Settings"** → Find M365 integration option  
3. **Click "Connect to Microsoft 365"** → Login dialog appears
4. **Click "Sign in with Microsoft"** → Browser opens for auth
5. **Complete authentication** → Return to app
6. **Verify connected** → Should show "Connected to Microsoft 365"

## 🐛 **If Issues Persist:**

### Linux Package Error:
```powershell
# Force Windows-only installation
npm install --platform=win32 --arch=x64 --no-optional
```

### Webpack Still Missing:
```powershell
# Install webpack explicitly
npm install --save-dev webpack webpack-cli
```

### M365 Auth Still Failing:
```powershell
# Check if browser opens for authentication
# If browser doesn't open, the issue is in the Electron auth flow
# Look for errors in console that mention "global is not defined"
```

## ✅ **Success Indicators:**

You'll know everything is working when:
- ✅ `npm run build` completes without errors
- ✅ `npm run dev` starts both Electron and React
- ✅ DevMemory app opens without white screen
- ✅ M365 login button opens browser authentication
- ✅ After M365 auth, app shows "Connected to Microsoft 365"
- ✅ Console shows `"chromaDB": true` and no "global is not defined"

## 📞 **If Still Broken:**

Run these diagnostics and share the output:
```powershell
# Check your current directory
pwd

# Check if you have the right files
dir package.json, webpack.*.js

# Check Node/npm versions
node --version
npm --version

# Check if webpack exists
npx webpack --version

# Test clean install
npm run clean
npm install
npm run build
```

---

*Last Updated: July 7, 2025 - Critical Windows Resolution*