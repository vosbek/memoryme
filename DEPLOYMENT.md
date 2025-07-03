# DevMemory - Windows Enterprise Deployment Guide

This guide provides step-by-step instructions for deploying DevMemory on Windows enterprise environments.

## 🎯 Prerequisites Checklist

### System Requirements
- [ ] Windows 10/11 (64-bit)
- [ ] 4GB RAM minimum (8GB recommended)
- [ ] 2GB free disk space
- [ ] Internet connection for initial setup and AWS Bedrock access

### Administrator Prerequisites
- [ ] Local administrator rights (for initial installation)
- [ ] Network access to AWS Bedrock endpoints
- [ ] Corporate firewall configured for AWS access

## 🔧 Installation Steps

### Step 1: Install Node.js
1. Download Node.js LTS (v18 or v20) from https://nodejs.org/
2. Run the installer as Administrator
3. Select "Automatically install the necessary tools" checkbox
4. Verify installation:
   ```cmd
   node --version
   npm --version
   ```
   Expected: Node v18+ and npm v9+
5. Configure npm for enterprise environments:
   ```cmd
   npm config set fund false
   npm config set audit-level moderate
   ```

### Step 2: Install Python (Required for Chroma)
1. Download Python 3.9+ from https://python.org/downloads/ (3.8 is EOL)
2. **IMPORTANT**: Check "Add Python to PATH" during installation
3. **IMPORTANT**: Check "Install pip" during installation
4. Run installer as Administrator
5. Verify installation:
   ```cmd
   python --version
   pip --version
   ```
6. Update pip to latest version:
   ```cmd
   python -m pip install --upgrade pip
   ```

### Step 3: Install Visual Studio Build Tools
1. Download from https://visualstudio.microsoft.com/visual-cpp-build-tools/
2. Run installer as Administrator
3. Select "C++ build tools" workload
4. Include these components:
   - Windows 10/11 SDK (latest version)
   - MSVC v143 - VS 2022 C++ x64/x86 build tools
   - CMake tools for Visual Studio
5. Install and restart computer
6. Verify installation by checking:
   ```cmd
   cl
   ```
   (Should show Microsoft C/C++ compiler information)

### Step 4: Install Git (Optional but Recommended)
1. Download from https://git-scm.com/download/win
2. Run installer with default settings
3. Verify installation:
   ```cmd
   git --version
   ```

## 📦 Application Deployment

### Option A: Install from Release Package (Recommended)

#### Quick Install (If Available)
1. Download the latest `DevMemory-Setup-1.0.0.exe` from GitHub releases
   - Go to: https://github.com/[your-org]/devmemory/releases
   - Download the Windows installer (.exe file)
2. Run as Administrator
3. Follow installation wizard:
   - Choose installation directory (default: `C:\Program Files\DevMemory\`)
   - Select "Create desktop shortcut" if desired
   - Click "Install"
4. Application installs and creates Start Menu shortcuts

#### If No Pre-built Release Available
If there's no pre-built installer available, you'll need to build it yourself using Option B below.

### Option B: Build Installer from Source (Required for Fresh Setup)

Since DevMemory is a new application, you'll likely need to build the installer yourself:

#### Step 1: Prepare Build Environment
1. **Download/clone source code**:
   ```cmd
   git clone https://github.com/[your-org]/devmemory.git
   cd devmemory
   ```
   Or download and extract the ZIP file from GitHub

2. **Open Command Prompt as Administrator**
   - This is required for building native dependencies

#### Step 2: Install Dependencies
1. **Install Python dependencies first**:
   ```cmd
   pip install chromadb
   ```
   
2. **Install Node.js dependencies**:
   ```cmd
   # Clean install (recommended for first build)
   npm run rebuild
   
   # Or if rebuild fails, try standard install
   npm install
   ```
   
   **Expected output**: Dependencies install successfully (warnings about deprecated packages are normal)

#### Step 3: Build the Installer
1. **Build the application**:
   ```cmd
   npm run build
   ```
   This creates the `dist/` folder with compiled application files.

2. **Create the Windows installer**:
   ```cmd
   npm run package:win
   ```
   
   **Alternative single command**:
   ```cmd
   npm run dist
   ```
   This builds and packages in one step.

3. **Locate the installer**:
   The installer will be created at: `dist-electron\DevMemory-Setup-1.0.0.exe`

#### Step 4: Install the Application
1. Navigate to the `dist-electron\` folder
2. Run `DevMemory-Setup-1.0.0.exe` as Administrator
3. Follow the installation wizard
4. Application installs to `C:\Program Files\DevMemory\` by default

#### Build Automation Script (Optional)
For easier building, you can use the automated script:
```cmd
# Run the automated build script
powershell -ExecutionPolicy Bypass -File scripts\release.ps1
```

This script will:
- Check all prerequisites
- Clean previous builds
- Install dependencies
- Build the application
- Create the installer
- Show results and file locations

### Build Troubleshooting

**Common Build Issues**:

**"gyp ERR! find VS" Error**:
```cmd
npm config set msvs_version 2022
npm rebuild better-sqlite3
```

**Python Module Not Found**:
```cmd
# Verify Python and pip are in PATH
python --version
pip --version

# Reinstall chromadb
pip uninstall chromadb
pip install chromadb
```

**Build Fails with Permission Errors**:
- Ensure Command Prompt is running as Administrator
- Check that antivirus isn't blocking the build process
- Verify write permissions to the project directory

**Large Build Time (First Build)**:
- First build downloads many dependencies (can take 10-15 minutes)
- Subsequent builds will be much faster
- Consider using `npm ci` instead of `npm install` for faster builds

### Build Output

After successful build, you'll find:
```
dist-electron/
├── DevMemory-Setup-1.0.0.exe        # ← Windows installer (distribute this)
├── win-unpacked/                    # Unpacked application files
├── latest.yml                       # Auto-updater metadata
└── builder-debug.yml               # Build debug info
```

**File sizes (approximate)**:
- `DevMemory-Setup-1.0.0.exe`: ~150-200 MB
- Total build time: 5-15 minutes (first build)

**Note**: You may see deprecated package warnings during install. These are harmless and the application will work correctly. The warnings are from transitive dependencies that will be updated in future releases.

## 🔐 AWS Configuration

### Step 1: Install AWS CLI (Method 1 - MSI Installer)
1. Download AWS CLI from https://aws.amazon.com/cli/
2. Run the MSI installer as Administrator
3. Verify installation:
   ```cmd
   aws --version
   ```

### Step 2: Configure AWS Credentials
```cmd
# Interactive configuration
aws configure

# Manual configuration - create credential files
mkdir %USERPROFILE%\.aws
```

Create `%USERPROFILE%\.aws\credentials`:
```ini
[default]
aws_access_key_id = YOUR_ACCESS_KEY
aws_secret_access_key = YOUR_SECRET_KEY
```

Create `%USERPROFILE%\.aws\config`:
```ini
[default]
region = us-east-1
output = json
```

### Step 3: Enable Bedrock Model Access
1. Log into AWS Console as Administrator
2. Navigate to Amazon Bedrock service
3. Go to "Model access" in the left panel
4. Enable access for:
   - **Anthropic Claude 3 Sonnet** (`anthropic.claude-3-sonnet-20240229-v1:0`)
   - **Amazon Titan Text Embeddings** (`amazon.titan-embed-text-v1`)
5. Submit access request (may take 24-48 hours)
6. Verify model access is "Available" before proceeding

**Note**: Bedrock is available in limited regions. Supported regions:
- us-east-1 (N. Virginia) - **Recommended**
- us-west-2 (Oregon)
- eu-west-1 (Ireland)
- ap-southeast-1 (Singapore)

## 🌐 Network Configuration

### Firewall Rules
Ensure the following endpoints are accessible:

**AWS Bedrock Endpoints:**
- `bedrock.us-east-1.amazonaws.com` (port 443)
- `bedrock-runtime.us-east-1.amazonaws.com` (port 443)

**NPM Registry (for builds):**
- `registry.npmjs.org` (port 443)
- `*.npmjs.org` (port 443)

**Python Package Index (for Chroma):**
- `pypi.org` (port 443)
- `files.pythonhosted.org` (port 443)

**For other AWS regions, replace `us-east-1` with your region**

### Required Network Ports
- **Outbound HTTPS**: 443 (AWS, npm, PyPI)
- **Outbound HTTP**: 80 (redirects only)
- **No inbound ports required**

### Proxy Configuration (If Required)
If your organization uses a proxy, configure:

```cmd
# Set proxy for npm
npm config set proxy http://proxy.company.com:8080
npm config set https-proxy http://proxy.company.com:8080

# Set proxy for pip
pip config set global.proxy http://proxy.company.com:8080

# Set proxy for AWS CLI
set HTTP_PROXY=http://proxy.company.com:8080
set HTTPS_PROXY=http://proxy.company.com:8080
```

## 🚀 First Run Setup

### 1. Launch DevMemory
- Start menu: "DevMemory"
- Or run from: `C:\Program Files\DevMemory\DevMemory.exe`

### 2. Initial Configuration
1. Application will create config file at: `%APPDATA%\devmemory\`
2. Database files stored at: `%APPDATA%\devmemory\data\`
3. Open Settings (Ctrl+,) to configure:
   - AWS region
   - Bedrock model preferences
   - UI theme
   - VSCode integration

### 3. Test AWS Connection
1. Create a test memory with the following content:
   - Title: "Test Memory"
   - Content: "This is a test to verify DevMemory is working correctly"
   - Type: "Note"
   - Tags: "test", "setup"
2. Verify search functionality works by searching for "test"
3. Check Windows Event Viewer for any errors:
   - Windows + R → eventvwr → Windows Logs → Application
   - Look for DevMemory-related errors

### 4. Verification Checklist
Run through this checklist to ensure everything is working:

**Basic Functionality:**
- [ ] Application launches without errors
- [ ] Can create a new memory
- [ ] Can edit an existing memory
- [ ] Can delete a memory
- [ ] Search returns relevant results
- [ ] Settings can be opened and modified

**Error Handling:**
- [ ] App doesn't crash when entering invalid data
- [ ] Graceful error messages for network issues
- [ ] Database errors are handled properly

**Performance:**
- [ ] Application starts within 10 seconds
- [ ] Memory operations complete within 2 seconds
- [ ] Search results appear within 3 seconds

## 🔌 VSCode Extension Setup

### Automatic Installation
1. Ensure VSCode is installed
2. DevMemory will prompt to install extension on first run
3. Accept the installation prompt

### Manual Installation
1. Download `devmemory-vscode.vsix` from releases
2. Open VSCode
3. Press `Ctrl+Shift+P`
4. Type "Extensions: Install from VSIX"
5. Select the downloaded file

### Extension Configuration
1. Open VSCode Settings (`Ctrl+,`)
2. Search for "DevMemory"
3. Configure:
   - Auto-capture settings
   - Command tracking
   - File context capture

## 🛡️ Security Configuration

### Data Location
Default data storage locations:
```
%APPDATA%\devmemory\
├── config.json          # Application configuration
├── devmemory.db         # SQLite database
└── chroma\              # Vector database
```

### Security Recommendations
1. **Backup Strategy**: Schedule regular backups of `%APPDATA%\devmemory\`
2. **Access Control**: Restrict folder access to authorized users
3. **Network Security**: Monitor AWS API usage through CloudTrail
4. **Data Classification**: Configure appropriate data handling based on content sensitivity

### Enterprise Deployment Options
1. **Group Policy**: Deploy via GPO for organization-wide installation
2. **SCCM**: Package for System Center Configuration Manager
3. **Chocolatey**: Create package for Chocolatey deployment
4. **Silent Install**: Use `/S` flag for silent installation

## 🐛 Troubleshooting

### Common Installation Issues

**Node.js Installation Fails**
- Solution: Run installer as Administrator
- Verify Windows version compatibility
- Disable antivirus temporarily during installation

**NPM Install Warnings/Deprecated Packages**
- Issue: npm install shows deprecated package warnings
- Solution: These warnings are harmless - they come from transitive dependencies
- Use `npm run rebuild` for a clean installation
- Warnings about inflight, glob, rimraf, eslint are expected and don't affect functionality

**Python PATH Issues**
- Solution: Add Python to PATH manually:
  ```cmd
  setx PATH "%PATH%;C:\Python39;C:\Python39\Scripts"
  ```

**Build Tools Missing**
- Error: `MSB8036: The Windows SDK version 10.0 was not found`
- Solution: Install Windows 10/11 SDK via Visual Studio Installer
- Error: `error MSB8003: Could not find WindowsSDKDir variable`
- Solution: Restart command prompt after installing build tools

**Node-gyp Build Errors**
- Error: `gyp ERR! find VS` or similar Visual Studio errors
- Solution: Ensure Visual Studio Build Tools are properly installed
- Run: `npm config set msvs_version 2022` to specify VS version

**AWS Access Denied**
- Check credentials: `aws sts get-caller-identity`
- Verify Bedrock access is enabled
- Check IAM permissions for Bedrock services

**VSCode Extension Not Loading**
- Restart VSCode after installation
- Check Developer Tools for errors (`Help > Toggle Developer Tools`)
- Verify DevMemory app is running

### Performance Issues

**Slow Search Performance**
- Increase memory allocation for Chroma
- Move database to SSD storage
- Reduce number of concurrent embeddings

**High CPU Usage**
- Disable auto-capture in VSCode extension
- Reduce embedding frequency
- Check for background indexing processes

### Enterprise-Specific Issues

**Proxy Authentication**
```cmd
# For NTLM/Kerberos proxies
npm config set proxy http://domain\username:password@proxy.company.com:8080
```

**Certificate Issues**
```cmd
# Disable SSL verification (not recommended for production)
npm config set strict-ssl false

# Or add corporate certificates
npm config set cafile path\to\corporate-ca.pem
```

**Group Policy Restrictions**
- Work with IT to whitelist DevMemory executable
- Allow PowerShell script execution if needed
- Configure Windows Defender exclusions

## 📞 Support Contacts

### Technical Support
- **Internal IT**: Contact your enterprise IT help desk
- **Application Issues**: Check GitHub issues page
- **AWS Issues**: Contact AWS Enterprise Support

### Escalation Process
1. Local IT Support
2. Enterprise Architecture Team
3. AWS Technical Account Manager (if applicable)
4. DevMemory Development Team

## 📋 Deployment Checklist

### Pre-Deployment
- [ ] System requirements verified (Windows 10/11, 8GB RAM, 2GB storage)
- [ ] Network access confirmed (AWS endpoints, npm, PyPI)
- [ ] AWS credentials obtained with appropriate permissions
- [ ] Bedrock model access enabled and verified as "Available"
- [ ] Installation media prepared (source code or setup executable)
- [ ] Administrator privileges confirmed
- [ ] Corporate firewall rules configured

### Installation
- [ ] Node.js v18+ installed and verified (`node --version`)
- [ ] Python 3.9+ installed with PATH configured (`python --version`)
- [ ] Visual Studio Build Tools installed with C++ workload (`cl` command works)
- [ ] Git installed (optional but recommended)
- [ ] AWS CLI installed and configured (`aws --version`)
- [ ] **Source code downloaded/cloned** to local directory
- [ ] **Python dependencies installed** (`pip install chromadb`)
- [ ] **Node.js dependencies installed** (`npm install` or `npm run rebuild`)
- [ ] **Application built successfully** (`npm run build`)
- [ ] **Installer created** (`npm run package:win` → `dist-electron\DevMemory-Setup-1.0.0.exe`)
- [ ] **Application installed** from the created installer

### Post-Installation
- [ ] Application launches without errors
- [ ] Database initializes correctly (check `%APPDATA%\devmemory\`)
- [ ] AWS connection tested (create test memory)
- [ ] Search functionality verified
- [ ] Settings accessible and configurable
- [ ] VSCode extension installed (if using VSCode)
- [ ] User training completed
- [ ] Backup strategy implemented

### Validation Tests
- [ ] **Smoke Test**: Create memory titled "Installation Test"
- [ ] **Search Test**: Search for "Installation" returns results
- [ ] **Edit Test**: Modify and save an existing memory
- [ ] **Delete Test**: Remove a test memory
- [ ] **Settings Test**: Change UI theme and verify it persists
- [ ] **Performance Test**: Application starts < 10 seconds
- [ ] **Error Test**: Enter invalid data, verify graceful handling
- [ ] **Network Test**: Verify AWS connectivity (if applicable)

### Enterprise Validation
- [ ] Antivirus doesn't flag application
- [ ] Group Policy doesn't block execution
- [ ] User permissions sufficient for normal operation
- [ ] Data location accessible and writable
- [ ] Network policies allow required endpoints
- [ ] Backup procedures tested and documented

## 🔍 Installation Verification Script

Save this PowerShell script as `verify-devmemory-install.ps1` to automate installation verification:

```powershell
# DevMemory Installation Verification Script
Write-Host "DevMemory Installation Verification" -ForegroundColor Green
Write-Host "===================================" -ForegroundColor Green

$errors = @()

# Check Node.js
try {
    $nodeVersion = node --version
    if ($nodeVersion -match "v1[89]\.|v20\.") {
        Write-Host "✓ Node.js: $nodeVersion" -ForegroundColor Green
    } else {
        $errors += "Node.js version $nodeVersion is not supported (need v18+)"
    }
} catch {
    $errors += "Node.js not found or not in PATH"
}

# Check Python
try {
    $pythonVersion = python --version
    if ($pythonVersion -match "Python 3\.[9-9]|Python 3\.1[0-9]") {
        Write-Host "✓ Python: $pythonVersion" -ForegroundColor Green
    } else {
        $errors += "Python version $pythonVersion is not supported (need 3.9+)"
    }
} catch {
    $errors += "Python not found or not in PATH"
}

# Check AWS CLI
try {
    $awsVersion = aws --version
    Write-Host "✓ AWS CLI: $awsVersion" -ForegroundColor Green
} catch {
    $errors += "AWS CLI not found or not in PATH"
}

# Check Visual Studio Build Tools
try {
    $clOutput = cl 2>&1
    if ($clOutput -match "Microsoft") {
        Write-Host "✓ Visual Studio Build Tools: Available" -ForegroundColor Green
    } else {
        $errors += "Visual Studio Build Tools compiler not found"
    }
} catch {
    $errors += "Visual Studio Build Tools not available"
}

# Check DevMemory installation directory
# Check DevMemory installation directory
$devMemoryPath = "${env:ProgramFiles}\DevMemory\DevMemory.exe"
if (Test-Path $devMemoryPath) {
    Write-Host "✓ DevMemory: Installed at $devMemoryPath" -ForegroundColor Green
} else {
    Write-Host "⚠ DevMemory: Not found in Program Files" -ForegroundColor Yellow
    
    # Check if source code and build files exist
    if (Test-Path "package.json") {
        Write-Host "  ℹ Source code found - you can build the installer" -ForegroundColor Cyan
        if (Test-Path "dist-electron\DevMemory-Setup-1.0.0.exe") {
            Write-Host "  ✓ Installer found: dist-electron\DevMemory-Setup-1.0.0.exe" -ForegroundColor Green
            Write-Host "  → Run the installer as Administrator to install DevMemory" -ForegroundColor White
        } else {
            Write-Host "  → Run 'npm run package:win' to build the installer" -ForegroundColor White
        }
    }
}

# Check data directory
$dataPath = "${env:APPDATA}\devmemory"
if (Test-Path $dataPath) {
    Write-Host "✓ Data Directory: $dataPath exists" -ForegroundColor Green
} else {
    Write-Host "⚠ Data Directory: Will be created on first run" -ForegroundColor Yellow
}

# Summary
Write-Host "`nVerification Summary:" -ForegroundColor Blue
if ($errors.Count -eq 0) {
    Write-Host "✓ All prerequisites installed successfully!" -ForegroundColor Green
    Write-Host "Ready to run DevMemory." -ForegroundColor Green
} else {
    Write-Host "❌ Issues found:" -ForegroundColor Red
    foreach ($error in $errors) {
        Write-Host "  - $error" -ForegroundColor Red
    }
    Write-Host "`nPlease resolve these issues before proceeding." -ForegroundColor Yellow
}
```

Run this script in PowerShell as Administrator to verify your installation.

## 📝 Change Log

### Version 1.0.0
- Initial enterprise release
- Basic memory management
- AWS Bedrock integration
- VSCode extension

### Planned Updates
- Enhanced security features
- LDAP/SSO integration
- Advanced analytics
- Team collaboration features

---

**Need Help?** Contact your enterprise IT support team or refer to the main README.md for additional documentation.