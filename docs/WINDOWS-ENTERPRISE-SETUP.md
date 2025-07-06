# DevMemory Enterprise Windows Installation Guide

## Prerequisites

### System Requirements
- **Operating System**: Windows 10 (version 1903+) or Windows 11
- **Architecture**: x64 (64-bit)
- **RAM**: 8GB minimum, 16GB recommended
- **Storage**: 2GB free space for application + data
- **Network**: Internet connection for M365 integration and AWS Bedrock

### Administrative Requirements
- Local Administrator privileges for initial installation
- Azure AD enterprise account for M365 integration
- AWS credentials for embedding generation (optional)

## Pre-Installation Setup

### 1. Install Node.js and npm
```powershell
# Download and install Node.js LTS from https://nodejs.org/
# Verify installation
node --version  # Should be 18.x or higher
npm --version   # Should be 9.x or higher
```

### 2. Install Python (for ChromaDB)
```powershell
# Download and install Python 3.8+ from https://python.org/
# Ensure "Add Python to PATH" is checked during installation
# Verify installation
python --version  # Should be 3.8 or higher
pip --version
```

### 3. Install Git (Optional, for development)
```powershell
# Download and install Git from https://git-scm.com/
git --version
```

### 4. Install Visual C++ Redistributables
```powershell
# Required for native dependencies
# Download and install Microsoft Visual C++ Redistributable
# Available at: https://docs.microsoft.com/en-us/cpp/windows/latest-supported-vc-redist
```

## Installation Methods

### Method 1: Pre-built Installer (Recommended for Production)

1. **Download the installer**
   ```powershell
   # Download DevMemory-Setup-x.x.x.exe from releases page
   # Verify digital signature and checksum
   ```

2. **Run the installer**
   ```powershell
   # Right-click → "Run as administrator"
   # Follow installation wizard
   # Choose installation directory (default: C:\Program Files\DevMemory)
   ```

3. **First launch**
   ```powershell
   # Launch DevMemory from Start Menu or Desktop
   # Initial setup wizard will guide through configuration
   ```

### Method 2: Development Installation (From Source)

1. **Clone the repository**
   ```powershell
   git clone https://github.com/enterprise/devmemory.git
   cd devmemory
   ```

2. **Install dependencies**
   ```powershell
   # Install Node.js dependencies
   npm install

   # Install Python dependencies for ChromaDB
   pip install chromadb>=0.4.0
   ```

3. **Configure environment**
   ```powershell
   # Copy example environment file
   copy .env.example .env

   # Edit .env with your configuration
   notepad .env
   ```

4. **Build and run**
   ```powershell
   # Development mode
   npm run dev

   # Or build for production
   npm run build
   npm run electron
   ```

## Configuration

### 1. Database Configuration

The application will automatically create databases in:
```
%APPDATA%\DevMemory\
├── devmemory.db          # SQLite database
├── chroma/               # ChromaDB vector store
└── logs/                 # Application logs
```

### 2. AWS Configuration (Optional)

For enhanced embedding generation:

```powershell
# Configure AWS credentials
aws configure
# Or set environment variables:
# AWS_ACCESS_KEY_ID=your_key
# AWS_SECRET_ACCESS_KEY=your_secret
# AWS_REGION=us-east-1
```

### 3. Microsoft 365 Integration

**IT Administrator Setup** (See [AZURE-APP-REGISTRATION.md](./AZURE-APP-REGISTRATION.md)):
1. Register application in Azure AD
2. Configure redirect URIs for desktop app
3. Set required API permissions
4. Enable conditional access if needed

**User Setup**:
1. Launch DevMemory
2. Go to Settings → Microsoft 365 Integration
3. Click "Connect to Microsoft 365"
4. Follow enterprise authentication flow
5. Verify connection and permissions

## Post-Installation Verification

### 1. Basic Functionality Test
```powershell
# Launch DevMemory
# Create a test memory
# Verify search functionality
# Check database creation in %APPDATA%\DevMemory\
```

### 2. M365 Integration Test
```powershell
# Go to Settings → Microsoft 365 Integration
# Click "Connect to Microsoft 365"
# Complete authentication flow
# Verify Graph API connectivity
# Test synchronization with a small data set
```

### 3. Performance Verification
```powershell
# Check that ChromaDB is running properly
# Verify embedding generation (AWS or local fallback)
# Test search performance with sample data
# Monitor memory usage and startup time
```

## Enterprise Deployment

### 1. Silent Installation
```powershell
# For automated deployment across enterprise
DevMemory-Setup-x.x.x.exe /S /D=C:\Program Files\DevMemory

# Verify installation
if (Test-Path "C:\Program Files\DevMemory\DevMemory.exe") {
    Write-Host "Installation successful"
} else {
    Write-Host "Installation failed"
    exit 1
}
```

### 2. Group Policy Configuration
```powershell
# Registry keys for enterprise configuration
# HKEY_LOCAL_MACHINE\SOFTWARE\DevMemory\
# - AzureClientId (String)
# - AzureTenantId (String)
# - DefaultAWSRegion (String)
# - AutoUpdateEnabled (DWORD)
```

### 3. Network Configuration
```yaml
# Required network access for enterprise deployment
Outbound HTTPS (443):
  - *.microsoft.com           # M365 Graph API
  - login.microsoftonline.com # Azure AD authentication
  - *.bedrock.amazonaws.com   # AWS Bedrock (optional)
  - *.s3.amazonaws.com        # AWS S3 (optional)

Local Ports:
  - Application uses random high ports for ChromaDB
  - No inbound connections required
```

## Troubleshooting

### Common Issues

#### Installation Fails
```powershell
# Check Windows version compatibility
Get-ComputerInfo | Select-Object WindowsProductName, WindowsVersion

# Verify .NET Framework
Get-ItemProperty "HKLM:SOFTWARE\Microsoft\NET Framework Setup\NDP\v4\Full\" -Name Release

# Check available disk space
Get-WmiObject -Class Win32_LogicalDisk | Select-Object DeviceID, FreeSpace
```

#### ChromaDB Connection Issues
```powershell
# Verify Python installation
python -c "import chromadb; print('ChromaDB available')"

# Check database directory permissions
icacls "%APPDATA%\DevMemory"

# Reset ChromaDB (if needed)
Remove-Item -Recurse -Force "%APPDATA%\DevMemory\chroma"
```

#### M365 Authentication Issues
```powershell
# Check network connectivity to Microsoft endpoints
Test-NetConnection login.microsoftonline.com -Port 443
Test-NetConnection graph.microsoft.com -Port 443

# Verify Azure AD app registration
# Check conditional access policies
# Confirm user has required permissions
```

#### Performance Issues
```powershell
# Check available memory
Get-WmiObject -Class Win32_OperatingSystem | Select-Object TotalVisibleMemorySize, FreePhysicalMemory

# Monitor process resource usage
Get-Process DevMemory | Select-Object CPU, WorkingSet, Handles

# Check antivirus exclusions for DevMemory directory
```

### Logging and Diagnostics

#### Application Logs
```powershell
# Application logs location
Get-ChildItem "%APPDATA%\DevMemory\logs"

# View recent logs
Get-Content "%APPDATA%\DevMemory\logs\main.log" -Tail 50

# Enable debug logging (add to .env)
# LOG_LEVEL=debug
```

#### System Information Collection
```powershell
# Collect system information for support
systeminfo > devmemory-systeminfo.txt
dxdiag /t devmemory-dxdiag.txt
Get-Process DevMemory | Format-List * > devmemory-process.txt
```

### Event Log Monitoring
```powershell
# Check Windows Event Logs for related errors
Get-WinEvent -FilterHashtable @{LogName='Application'; ProviderName='DevMemory'} -MaxEvents 50

# Monitor for .NET/Electron related issues
Get-WinEvent -FilterHashtable @{LogName='Application'; Level=2} -MaxEvents 20
```

## Security Considerations

### 1. Data Protection
- All data stored locally on user machine
- M365 tokens encrypted using Windows Data Protection API
- Database files protected by Windows file system permissions
- No data transmitted to external servers (except M365 Graph API calls)

### 2. Network Security
- All external communications use HTTPS/TLS
- M365 authentication follows enterprise security policies
- Conditional access and MFA support
- No inbound network connections required

### 3. Compliance
- Audit logging for M365 operations
- Respects M365 data classification and policies
- Local data processing for privacy compliance
- No data leaves organizational boundary

## Support and Maintenance

### Updates
```powershell
# Check for updates in application
# Help → Check for Updates

# Or download latest installer
# Updates preserve user data and configuration
```

### Backup and Recovery
```powershell
# Backup user data
xcopy "%APPDATA%\DevMemory" "C:\Backup\DevMemory\" /E /H /Y

# Restore from backup
xcopy "C:\Backup\DevMemory\" "%APPDATA%\DevMemory\" /E /H /Y
```

### Performance Monitoring
```powershell
# Monitor database size growth
Get-ChildItem "%APPDATA%\DevMemory" -Recurse | Measure-Object -Property Length -Sum

# Check memory usage trends
Get-Counter "\Process(DevMemory)\Working Set" -Continuous
```

For additional support and enterprise deployment assistance, contact your IT administrator or refer to the [troubleshooting guide](./TROUBLESHOOTING.md).