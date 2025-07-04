# DevMemory Windows Setup Guide

Complete guide for setting up DevMemory on Windows 10/11 enterprise environments.

## Prerequisites

### Required Software

#### 1. Node.js (v18 or higher)
```powershell
# Download and install from: https://nodejs.org/
# Verify installation
node --version
npm --version
```

#### 2. Visual Studio Build Tools
Required for compiling native dependencies (better-sqlite3).

**Option A: Visual Studio Installer**
1. Download from: https://visualstudio.microsoft.com/visual-cpp-build-tools/
2. Install "C++ build tools" workload
3. Include Windows 10/11 SDK

**Option B: Command Line**
```powershell
# Using chocolatey (if available)
choco install visualstudio2022buildtools --package-parameters "--add Microsoft.VisualStudio.Workload.VCTools"
```

#### 3. Git (for development)
```powershell
# Download from: https://git-scm.com/
# Or using winget
winget install Git.Git
```

### Optional Software

#### AWS CLI (for enhanced AI features)
```powershell
# Download from: https://aws.amazon.com/cli/
# Or using winget
winget install Amazon.AWSCLI
```

## Installation Options

### Option 1: Pre-built Installer (Recommended)

1. **Download the installer**
   ```
   DevMemory-Setup-{version}.exe
   ```

2. **Run as Administrator**
   ```powershell
   # Right-click installer → "Run as administrator"
   ```

3. **Install to Program Files**
   ```
   C:\Program Files\DevMemory\
   ```

4. **Launch DevMemory**
   - Desktop shortcut: "DevMemory"
   - Start menu: "DevMemory"
   - Or run: `C:\Program Files\DevMemory\DevMemory.exe`

### Option 2: Build from Source

#### Step 1: Clone Repository
```powershell
git clone https://github.com/company/devmemory.git
cd devmemory
```

#### Step 2: Install Dependencies
```powershell
# Install Node dependencies
npm install

# If you encounter native compilation errors:
npm install --build-from-source
```

#### Step 3: Build Application
```powershell
# Development build
npm run build
npm run dev

# Production build
npm run build
npm run package:win
```

#### Build Output
```
dist-electron\DevMemory-Setup-{version}.exe
```

## Configuration

### Default Locations (Windows)

- **Application Data**: `%APPDATA%\devmemory\`
- **Database**: `%APPDATA%\devmemory\devmemory.db`
- **Vector Store**: `%APPDATA%\devmemory\vector-data.json`
- **Configuration**: `%APPDATA%\devmemory\config.json`
- **Logs**: `%APPDATA%\devmemory\logs\`

### Environment Variables

```powershell
# AWS Configuration (Optional)
$env:AWS_ACCESS_KEY_ID = "your_access_key"
$env:AWS_SECRET_ACCESS_KEY = "your_secret_key"
$env:AWS_REGION = "us-east-1"

# Application Configuration
$env:DEVMEMORY_DATA_DIR = "C:\Users\%USERNAME%\Documents\DevMemory"
```

## VSCode Extension Setup

### Installation

1. **From Marketplace** (when published)
   ```
   ext install devmemory.devmemory-extension
   ```

2. **From VSIX** (development)
   ```powershell
   # Navigate to vscode-extension directory
   cd vscode-extension
   npm install
   npm run compile
   
   # Package extension
   npx vsce package
   
   # Install in VSCode
   code --install-extension devmemory-*.vsix
   ```

### Configuration

Add to VSCode `settings.json`:
```json
{
  "devmemory.enabled": true,
  "devmemory.autoCapture": true,
  "devmemory.appPath": "C:\\Program Files\\DevMemory\\DevMemory.exe"
}
```

## Enterprise Configuration

### Group Policy Settings

For domain-managed environments:

```registry
[HKEY_LOCAL_MACHINE\SOFTWARE\Policies\DevMemory]
"DataDirectory"="\\\\server\\shared\\devmemory"
"AWSRegion"="us-east-1"
"LogLevel"="INFO"
```

### Firewall Configuration

If using AWS Bedrock, allow outbound HTTPS:
- **Port**: 443
- **Destinations**: 
  - `bedrock.us-east-1.amazonaws.com`
  - `bedrock-runtime.us-east-1.amazonaws.com`

### Antivirus Exclusions

Add these paths to antivirus exclusions:
- `%APPDATA%\devmemory\`
- `C:\Program Files\DevMemory\`
- Node.js temp directories during build

## Troubleshooting

### Common Issues

#### Build Errors

**Error: MSBuild not found**
```powershell
# Install Visual Studio Build Tools
# Or set MSBuild path manually
$env:MSBUILD_PATH = "C:\Program Files (x86)\Microsoft Visual Studio\2022\BuildTools\MSBuild\Current\Bin\MSBuild.exe"
```

**Error: Python not found**
```powershell
# Install Python (if needed for build tools)
winget install Python.Python.3
# Or download from: https://python.org/downloads/
```

**Error: better-sqlite3 compilation**
```powershell
# Rebuild native dependencies
npm rebuild better-sqlite3

# Or clear cache and reinstall
npm cache clean --force
rm -rf node_modules
npm install
```

#### Runtime Issues

**Error: Cannot create database**
- Check file permissions in `%APPDATA%\devmemory\`
- Run DevMemory as Administrator once to create directories
- Verify disk space availability

**Error: VSCode extension not working**
- Restart VSCode after extension installation
- Check DevMemory app is running
- Verify extension is enabled in Extensions panel

**Error: AWS Bedrock access denied**
- Verify AWS credentials in environment variables
- Check IAM permissions for Bedrock services
- Test AWS CLI: `aws bedrock list-foundation-models`

### Performance Optimization

#### For Large Datasets
```json
// config.json
{
  "database": {
    "pragmas": {
      "journal_mode": "WAL",
      "cache_size": 10000,
      "temp_store": "memory"
    }
  }
}
```

#### For Low-Memory Systems
```json
// config.json
{
  "vectorStore": {
    "cacheTTL": 60000,
    "maxCacheSize": 100
  }
}
```

## Development Environment

### Setting up for Development

1. **Install Development Tools**
   ```powershell
   # VS Code
   winget install Microsoft.VisualStudioCode
   
   # Git
   winget install Git.Git
   
   # Node.js
   winget install OpenJS.NodeJS
   ```

2. **Clone and Setup**
   ```powershell
   git clone https://github.com/company/devmemory.git
   cd devmemory
   npm install
   ```

3. **Development Commands**
   ```powershell
   # Start development server
   npm run dev
   
   # Run tests
   npm test
   
   # Build for Windows
   npm run package:win
   ```

### Testing on Windows

```powershell
# Run all tests
npm test

# Test Windows-specific features
npm run test:windows

# Test installer
npm run test:installer
```

## Support

### Internal Support Channels
- Enterprise IT Help Desk
- Internal DevMemory Teams channel
- GitHub Issues (internal repository)

### Diagnostic Information

When reporting issues, include:
```powershell
# System information
systeminfo

# Node.js version
node --version

# DevMemory version
Get-ItemProperty "C:\Program Files\DevMemory\DevMemory.exe" | Select-Object VersionInfo

# Error logs
Get-Content "$env:APPDATA\devmemory\logs\main.log" -Tail 50
```

## Updates

### Automatic Updates
DevMemory includes an auto-updater that will:
- Check for updates on startup
- Download updates in background
- Prompt user to restart when ready

### Manual Updates
1. Download latest installer
2. Run installer (will update existing installation)
3. Restart application

### Enterprise Updates
For managed environments:
1. Deploy new installer via SCCM/Group Policy
2. Use silent install: `DevMemory-Setup.exe /S`
3. Update registry settings if needed