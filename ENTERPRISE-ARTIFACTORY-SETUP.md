# 🏢 Enterprise Artifactory Setup Guide

## Overview

DevMemory has been specifically configured to work with corporate npm registries and artifactories. This guide covers setup for environments that use company-controlled package repositories like `art.nwie.net`.

## 🎯 Why This Matters

Enterprise environments often:
- Restrict access to external npm registries
- Use internal artifactories for package management
- Require all dependencies to be pre-approved and cached
- Block direct access to npmjs.org for security

DevMemory's migration to **sql.js** ensures all dependencies are standard npm packages available in corporate artifactories.

## 🔧 Required Configuration

### **Step 1: Configure npm Registry**

```powershell
# Set primary registry to company artifactory
npm config set registry https://art.nwie.net/repository/npm/

# Set TypeScript types registry
npm config set @types:registry https://art.nwie.net/repository/npm/

# Verify configuration
npm config get registry
# Should output: https://art.nwie.net/repository/npm/
```

### **Step 2: Verify Package Availability**

Before installation, verify critical packages are available:

```powershell
# Check sql.js (replaces better-sqlite3)
npm view sql.js --registry https://art.nwie.net/repository/npm/

# Check TypeScript definitions
npm view @types/sql.js --registry https://art.nwie.net/repository/npm/

# Check other key packages
npm view electron --registry https://art.nwie.net/repository/npm/
npm view react --registry https://art.nwie.net/repository/npm/
```

## 📦 Critical Dependencies for Artifactory

These packages **must** be available in your company's artifactory:

### **Core Dependencies**
- `sql.js` - Pure JavaScript SQLite (replaces better-sqlite3)
- `@types/sql.js` - TypeScript definitions
- `electron` - Desktop framework
- `react` + `react-dom` - UI framework
- `typescript` - Language support

### **Build Dependencies**
- `webpack` + `webpack-cli` - Bundling
- `ts-loader` - TypeScript compilation
- `electron-builder` - Packaging

### **Enterprise Benefits**
- ✅ **No native modules** requiring compilation
- ✅ **No node-gyp** dependencies
- ✅ **No Python/C++ requirements**
- ✅ **Standard npm packages** only

## 🚨 Common Issues & Solutions

### **"Package not found" Errors**

```powershell
# 1. Verify registry configuration
npm config list

# 2. Clear npm cache
npm cache clean --force

# 3. Check package in artifactory
npm view [package-name] --registry https://art.nwie.net/repository/npm/

# 4. Contact IT to ensure package is mirrored
```

### **Fallback Registry Configuration**

If some packages are missing from the primary artifactory:

```powershell
# Option 1: Use scoped registries
npm config set @types:registry https://art.nwie.net/repository/npm/
npm config set registry https://art.nwie.net/repository/npm/

# Option 2: Set up npmrc file with fallbacks
echo "registry=https://art.nwie.net/repository/npm/" > .npmrc
echo "@types:registry=https://art.nwie.net/repository/npm/" >> .npmrc
```

## 🔐 Security Considerations

### **Certificate Issues**
If you encounter SSL certificate errors:

```powershell
# For internal artifactory with self-signed certificates
npm config set strict-ssl false
# OR
npm config set ca ""

# Better: Install company root certificates
# Contact IT for proper certificate installation
```

### **Authentication**
If artifactory requires authentication:

```powershell
# Set authentication token
npm config set //art.nwie.net/repository/npm/:_authToken YOUR_TOKEN

# Or use .npmrc file
echo "//art.nwie.net/repository/npm/:_authToken=YOUR_TOKEN" >> .npmrc
```

## 📋 Validation Checklist

After configuration, validate your setup:

- [ ] `npm config get registry` shows correct artifactory URL
- [ ] `npm view sql.js` returns package information
- [ ] `npm view @types/sql.js` returns TypeScript definitions
- [ ] `npm install` completes without errors
- [ ] No native compilation warnings during install
- [ ] Application builds successfully with `npm run build`

## 🆘 IT Requirements

If packages are missing from your artifactory, provide this list to your IT team:

```json
{
  "critical-packages": [
    "sql.js",
    "@types/sql.js",
    "electron",
    "react",
    "react-dom",
    "typescript",
    "webpack",
    "webpack-cli",
    "electron-builder"
  ],
  "note": "All packages are standard npm packages with no native compilation requirements"
}
```

## ✅ Success Indicators

Your enterprise setup is working correctly when:

1. ✅ `npm install` completes without external registry errors
2. ✅ No native module compilation occurs
3. ✅ Build process completes successfully
4. ✅ Application starts without database errors
5. ✅ All functionality works offline (except cloud AI features)

## 🎉 Enterprise Ready

DevMemory is now fully compatible with enterprise environments using:
- Corporate artifactories (art.nwie.net)
- Restricted network access
- Internal package repositories
- Standard corporate security policies

The sql.js migration ensures no external dependencies or native compilation requirements that could cause enterprise deployment issues.