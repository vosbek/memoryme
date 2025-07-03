# DevMemory - Build and Distribution Guide

This guide explains how to build DevMemory and create distribution packages including the `DevMemory-Setup.exe` installer.

## 🏗️ Building the Application

### Prerequisites
Ensure you have completed the installation steps from `DEPLOYMENT.md`:
- Node.js 18+
- Python 3.9+
- Visual Studio Build Tools
- All npm dependencies installed

### Build Steps

#### 1. Install Dependencies
```bash
# Install Node.js dependencies
npm install

# Install Python dependencies for Chroma
pip install chromadb
```

#### 2. Build Application
```bash
# Build both renderer and main processes
npm run build
```

This creates the `dist/` directory with:
- `main.js` - Electron main process
- `preload.js` - Preload script
- `renderer.js` - React application bundle
- `index.html` - Main HTML file

#### 3. Create Distribution Packages
```bash
# Build and package for current platform
npm run dist

# Or build for specific platforms
npm run package:win     # Windows installer
npm run package:mac     # macOS DMG
npm run package:linux   # Linux AppImage and DEB
```

## 📦 Distribution Packages

### Windows
**Output**: `dist-electron/DevMemory-Setup-1.0.0.exe`

Features:
- NSIS installer with custom install directory option
- Desktop and Start Menu shortcuts
- Uninstaller included
- Installs to `C:\Program Files\DevMemory\` by default

### macOS
**Output**: `dist-electron/DevMemory-1.0.0.dmg`

Features:
- Standard DMG with drag-to-Applications
- Universal binary (Intel + Apple Silicon)
- Code signing ready (requires developer certificate)

### Linux
**Output**: 
- `dist-electron/DevMemory-1.0.0.AppImage`
- `dist-electron/DevMemory-1.0.0.deb`

Features:
- AppImage for universal compatibility
- DEB package for Debian/Ubuntu
- Desktop integration included

## 🔧 Build Configuration

### Package.json Configuration
The build configuration in `package.json` includes:

```json
{
  "build": {
    "appId": "com.enterprise.devmemory",
    "productName": "DevMemory",
    "directories": {
      "output": "dist-electron"
    },
    "win": {
      "target": "nsis",
      "artifactName": "DevMemory-Setup-${version}.${ext}"
    }
  }
}
```

### Custom Build Options

#### Silent Installation (Enterprise)
For enterprise deployment, you can create a silent installer:
```bash
# Build with silent install option
npm run package:win -- --config.nsis.oneClick=true
```

#### Portable Version
To create a portable version without installer:
```bash
# Build portable executable
npm run package:win -- --config.win.target=portable
```

## 🖼️ Application Icons

### Required Icon Files
Place these files in the `assets/` directory:

- **Windows**: `icon.ico` (multiple sizes: 16, 32, 48, 64, 128, 256px)
- **macOS**: `icon.icns` (multiple sizes: 16, 32, 64, 128, 256, 512, 1024px)  
- **Linux**: `icon.png` (512x512px recommended)

### Creating Icons
From a 1024x1024 PNG source:

**Windows ICO**:
```bash
# Using ImageMagick
convert source.png -define icon:auto-resize=256,128,64,48,32,16 assets/icon.ico
```

**macOS ICNS**:
```bash
# Create iconset (macOS only)
mkdir icon.iconset
sips -z 16 16 source.png --out icon.iconset/icon_16x16.png
sips -z 32 32 source.png --out icon.iconset/icon_16x16@2x.png
# ... (repeat for all sizes)
iconutil -c icns icon.iconset --output assets/icon.icns
```

**Linux PNG**:
```bash
# Simply copy/resize the source
cp source.png assets/icon.png
```

### Building Without Custom Icons
If you don't have custom icons, remove the icon references from `package.json` and the build will use default Electron icons.

## 🚀 Continuous Integration

### GitHub Actions Build
Create `.github/workflows/build.yml`:

```yaml
name: Build DevMemory

on:
  push:
    tags: ['v*']
  pull_request:

jobs:
  build:
    strategy:
      matrix:
        os: [windows-latest, macos-latest, ubuntu-latest]
    
    runs-on: ${{ matrix.os }}
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: Setup Python
      uses: actions/setup-python@v4
      with:
        python-version: '3.9'
    
    - name: Install dependencies
      run: |
        npm ci
        pip install chromadb
    
    - name: Build application
      run: npm run dist
    
    - name: Upload artifacts
      uses: actions/upload-artifact@v3
      with:
        name: DevMemory-${{ matrix.os }}
        path: dist-electron/
```

### Local Release Script
Create `scripts/release.sh`:

```bash
#!/bin/bash
# DevMemory Release Script

echo "Building DevMemory release packages..."

# Clean previous builds
npm run clean

# Install dependencies
npm ci
pip install chromadb

# Build application
npm run build

# Create packages for all platforms
npm run package:win
npm run package:mac  
npm run package:linux

echo "Build complete! Packages available in dist-electron/"
echo "Windows: DevMemory-Setup-1.0.0.exe"
echo "macOS: DevMemory-1.0.0.dmg"
echo "Linux: DevMemory-1.0.0.AppImage"
```

## 🔍 Build Troubleshooting

### Common Build Issues

**Node-gyp Errors (Windows)**:
```bash
# Set Visual Studio version
npm config set msvs_version 2022

# Rebuild native dependencies
npm rebuild better-sqlite3
```

**Missing Icons**:
```bash
# Remove icon references from package.json temporarily
# Or create placeholder icons in assets/
```

**Python Dependencies**:
```bash
# Ensure chromadb is installed
pip install chromadb

# Check Python PATH
where python
```

**Large Bundle Size**:
```bash
# Analyze bundle
npm install -g webpack-bundle-analyzer
npx webpack-bundle-analyzer dist/renderer.js
```

### Build Performance Tips

1. **Use npm ci** instead of npm install for faster, reliable builds
2. **Enable caching** in CI/CD pipelines
3. **Exclude unnecessary files** in .gitignore and electron-builder files config
4. **Use --parallel** flag for multi-platform builds

## 📋 Release Checklist

Before creating a release:

- [ ] Version number updated in package.json
- [ ] CHANGELOG.md updated with new features/fixes
- [ ] All tests passing (`npm test`)
- [ ] Linting passing (`npm run lint`)
- [ ] Dependencies updated and audited (`npm audit`)
- [ ] Build successful on all target platforms
- [ ] Application tested on clean machine
- [ ] Icons included for all platforms
- [ ] Release notes prepared

### Creating a Release

1. **Tag the release**:
```bash
git tag v1.0.0
git push origin v1.0.0
```

2. **Build packages**:
```bash
npm run dist
```

3. **Upload to GitHub Releases**:
- Create release from tag
- Upload `DevMemory-Setup-1.0.0.exe` and other platform packages
- Include release notes and installation instructions

4. **Update deployment documentation** with actual download links

## 📁 Build Output Structure

After running `npm run dist`, you'll find:

```
dist-electron/
├── DevMemory-Setup-1.0.0.exe        # Windows installer
├── DevMemory-1.0.0.dmg              # macOS installer  
├── DevMemory-1.0.0.AppImage         # Linux portable
├── DevMemory-1.0.0.deb              # Linux package
├── win-unpacked/                    # Windows unpacked files
├── mac/                             # macOS app bundle
└── linux-unpacked/                  # Linux unpacked files
```

The `DevMemory-Setup-1.0.0.exe` file is what users download for Windows installation!

---

**Note**: The first build may take longer as it downloads and caches build dependencies. Subsequent builds will be faster.