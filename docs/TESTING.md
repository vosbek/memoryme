# DevMemory Testing Guide

This guide provides comprehensive testing procedures for validating DevMemory on Windows.

## Quick Testing

### 1. Automated Testing Script

Run the comprehensive test script:

```powershell
# Navigate to project directory
cd devmemory

# Run automated testing (requires PowerShell as Administrator)
powershell -ExecutionPolicy Bypass -File scripts\test-windows.ps1

# Results will be saved to test-results\test-{timestamp}\
```

The script will:
- ✅ Test system prerequisites
- ✅ Validate dependencies installation
- ✅ Build the application
- ✅ Package for Windows
- ✅ Generate comprehensive logs
- ✅ Create summary report

### 2. Results Analysis

After testing, you'll find:
- `summary.json` - Overall test results
- `README.txt` - Human-readable summary
- Individual test logs in `.json` and `.txt` formats

**Share `summary.json` for quick analysis of any issues.**

## Manual Testing Checklist

If you prefer step-by-step testing:

### Prerequisites Check
```powershell
# Check Node.js
node --version    # Should be v18+
npm --version

# Check Git
git --version

# Check Visual Studio Build Tools
Get-ItemProperty "HKLM:\SOFTWARE\Microsoft\VisualStudio\*" | Where-Object { $_.DisplayName -like "*Build Tools*" }
```

### Installation Test
```powershell
# Clean install
npm cache clean --force
npm install

# Check for errors in native compilation
npm list better-sqlite3
```

### Build Test
```powershell
# Build frontend
npm run build:react

# Build main process
npm run build:electron

# Package for Windows
npm run package:win
```

### Runtime Test
```powershell
# Start development mode
npm run dev

# Check application opens without errors
# Test basic functionality:
# - Create a memory
# - Search memories  
# - Settings panel
```

### VSCode Extension Test
```powershell
# Navigate to extension directory
cd vscode-extension

# Install and compile
npm install
npm run compile

# Package extension (optional)
npx vsce package
```

## Runtime Log Collection

If you encounter issues during testing:

```powershell
# Collect runtime logs after running the app
powershell -ExecutionPolicy Bypass -File scripts\collect-logs.ps1

# Include user data for debugging (optional)
powershell -ExecutionPolicy Bypass -File scripts\collect-logs.ps1 -IncludeUserData

# Results saved to debug-logs\logs-{timestamp}\
```

## Common Issues & Solutions

### Build Errors

**"MSBuild not found"**
```powershell
# Install Visual Studio Build Tools
# Download from: https://visualstudio.microsoft.com/visual-cpp-build-tools/
```

**"better-sqlite3 compilation failed"**
```powershell
# Rebuild native dependencies
npm rebuild better-sqlite3

# Or clean install
rm -rf node_modules
npm install
```

**"Python not found" (during build)**
```powershell
# Install Python (if required by build tools)
winget install Python.Python.3
```

### Runtime Errors

**"Cannot create database"**
- Check `%APPDATA%\devmemory\` directory permissions
- Run as Administrator once to create directories

**"Electron failed to start"**
- Check antivirus blocking Electron
- Verify all dependencies installed correctly

**"VSCode extension not working"**
- Restart VSCode after extension installation
- Verify DevMemory app is running
- Check extension is enabled

### AWS Integration Issues

**"AWS Bedrock access denied"**
```powershell
# Test AWS connectivity
Test-NetConnection "bedrock.us-east-1.amazonaws.com" -Port 443

# Test AWS CLI
aws bedrock list-foundation-models
```

## Performance Testing

### Memory Usage
```powershell
# Monitor memory usage during operation
Get-Process | Where-Object { $_.ProcessName -like "*DevMemory*" -or $_.ProcessName -like "*electron*" } | 
    Select-Object Name, WorkingSet, VirtualMemorySize
```

### Database Performance
```powershell
# Check database file size and performance
Get-Item "$env:APPDATA\devmemory\devmemory.db" | Select-Object Length, CreationTime, LastWriteTime
```

## Sharing Test Results

### For Quick Issues
Share just the summary:
```
test-results\test-{timestamp}\summary.json
```

### For Build Problems
Share build logs:
```
test-results\test-{timestamp}\02-npm-install.json
test-results\test-{timestamp}\08-package-win.json
test-results\test-{timestamp}\system-info.txt
```

### For Runtime Issues
Share runtime logs:
```
debug-logs\logs-{timestamp}\README.txt
debug-logs\logs-{timestamp}\main.log
debug-logs\logs-{timestamp}\error.log
```

### Full Debugging Package
Zip entire directories:
```
test-results\test-{timestamp}\     # Complete test results
debug-logs\logs-{timestamp}\       # Runtime logs
```

## Test Environment Variations

Test on different Windows configurations:

### Enterprise Environment
- Domain-joined machines
- Group Policy restrictions
- Corporate antivirus/firewall
- Proxy settings

### Home/Development Environment  
- Local administrator rights
- Direct internet access
- Developer tools installed

### Minimal Environment
- Clean Windows installation
- Only required prerequisites
- Limited user rights

## Success Criteria

✅ **Ready for Feature Development**
- All build tests pass
- Application starts without errors
- Basic memory operations work
- VSCode extension connects
- No critical errors in logs

❌ **Needs Investigation**
- Build failures
- Application crashes on startup
- Database creation errors
- Extension connection issues

## Next Steps

After successful testing:
1. **Feature Development Ready** → Proceed to system tray quick capture
2. **Issues Found** → Review logs and fix before proceeding
3. **Partial Success** → Document known issues and proceed with working features

The goal is a stable foundation before adding new features.