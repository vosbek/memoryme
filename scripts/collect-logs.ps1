# DevMemory Log Collector
# Collects runtime logs and application state for debugging

param(
    [string]$OutputDir = "debug-logs",
    [switch]$IncludeUserData = $false
)

$timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$logDir = "$OutputDir\logs-$timestamp"
New-Item -ItemType Directory -Path $logDir -Force | Out-Null

Write-Host "=== DevMemory Log Collector ===" -ForegroundColor Green
Write-Host "Collecting logs to: $logDir" -ForegroundColor Yellow

# Application directories
$appDataDir = "$env:APPDATA\devmemory"
$tempDir = "$env:TEMP\devmemory"

# Check if application directories exist
$appExists = Test-Path $appDataDir
$tempExists = Test-Path $tempDir

Write-Host "App Data Directory: $appDataDir (Exists: $appExists)" -ForegroundColor Cyan
Write-Host "Temp Directory: $tempDir (Exists: $tempExists)" -ForegroundColor Cyan

# Collect system information
Write-Host "`nCollecting system information..." -ForegroundColor Blue
@{
    Timestamp = $timestamp
    OS = (Get-WmiObject Win32_OperatingSystem).Caption
    User = $env:USERNAME
    ComputerName = $env:COMPUTERNAME
    AppDataExists = $appExists
    TempExists = $tempExists
    Processes = (Get-Process | Where-Object { $_.ProcessName -like "*devmemory*" -or $_.ProcessName -like "*electron*" } | Select-Object Name, Id, StartTime)
} | ConvertTo-Json -Depth 2 | Out-File "$logDir\system-info.json"

# Collect application logs
if ($appExists) {
    Write-Host "Collecting application logs..." -ForegroundColor Blue
    
    # Main log files
    $logFiles = @(
        "main.log",
        "renderer.log", 
        "error.log",
        "debug.log"
    )
    
    foreach ($logFile in $logFiles) {
        $sourcePath = "$appDataDir\logs\$logFile"
        if (Test-Path $sourcePath) {
            Copy-Item $sourcePath "$logDir\$logFile" -Force
            Write-Host "✅ Collected $logFile" -ForegroundColor Green
        } else {
            Write-Host "⚠️ $logFile not found" -ForegroundColor Yellow
        }
    }
    
    # Configuration file
    $configPath = "$appDataDir\config.json"
    if (Test-Path $configPath) {
        Copy-Item $configPath "$logDir\config.json" -Force
        Write-Host "✅ Collected config.json" -ForegroundColor Green
    }
    
    # Database info (without sensitive data)
    $dbPath = "$appDataDir\devmemory.db"
    if (Test-Path $dbPath) {
        $dbInfo = Get-Item $dbPath | Select-Object Name, Length, CreationTime, LastWriteTime
        $dbInfo | ConvertTo-Json | Out-File "$logDir\database-info.json"
        Write-Host "✅ Collected database info" -ForegroundColor Green
    }
    
    # Vector store info
    $vectorPath = "$appDataDir\vector-data.json"
    if (Test-Path $vectorPath) {
        $vectorInfo = Get-Item $vectorPath | Select-Object Name, Length, CreationTime, LastWriteTime
        $vectorInfo | ConvertTo-Json | Out-File "$logDir\vector-store-info.json"
        Write-Host "✅ Collected vector store info" -ForegroundColor Green
    }
    
    # If user data requested, collect sample (anonymized)
    if ($IncludeUserData -and (Test-Path $dbPath)) {
        Write-Host "Collecting anonymized sample data..." -ForegroundColor Blue
        try {
            # This would require sqlite3 CLI or PowerShell SQLite module
            # For now, just note the request
            "User requested data sample - requires manual extraction" | Out-File "$logDir\user-data-requested.txt"
        } catch {
            "Failed to extract user data sample: $($_.Exception.Message)" | Out-File "$logDir\user-data-error.txt"
        }
    }
} else {
    Write-Host "⚠️ Application data directory not found - app may not have run yet" -ForegroundColor Yellow
    "Application data directory not found at: $appDataDir" | Out-File "$logDir\app-not-run.txt"
}

# Collect Windows Event Logs related to the application
Write-Host "Collecting Windows Event Logs..." -ForegroundColor Blue
try {
    $events = Get-WinEvent -FilterHashtable @{LogName='Application'; StartTime=(Get-Date).AddDays(-1)} -ErrorAction SilentlyContinue | 
        Where-Object { $_.ProviderName -like "*Electron*" -or $_.Message -like "*DevMemory*" -or $_.Message -like "*devmemory*" }
    
    if ($events) {
        $events | Select-Object TimeCreated, Id, LevelDisplayName, ProviderName, Message | 
            ConvertTo-Json -Depth 2 | Out-File "$logDir\windows-events.json"
        Write-Host "✅ Collected Windows events ($($events.Count) events)" -ForegroundColor Green
    } else {
        "No relevant Windows events found" | Out-File "$logDir\no-windows-events.txt"
    }
} catch {
    "Failed to collect Windows events: $($_.Exception.Message)" | Out-File "$logDir\windows-events-error.txt"
}

# Collect Node.js and NPM information
Write-Host "Collecting Node.js environment..." -ForegroundColor Blue
@{
    NodeVersion = (node --version 2>&1)
    NPMVersion = (npm --version 2>&1)
    NPMConfig = (npm config list 2>&1)
    NPMCache = (npm cache verify 2>&1)
} | ConvertTo-Json | Out-File "$logDir\nodejs-env.json"

# Collect VSCode extension logs if applicable
$vscodeExtensionDir = "$env:USERPROFILE\.vscode\extensions"
if (Test-Path $vscodeExtensionDir) {
    $devmemoryExtensions = Get-ChildItem $vscodeExtensionDir | Where-Object { $_.Name -like "*devmemory*" }
    if ($devmemoryExtensions) {
        Write-Host "Collecting VSCode extension info..." -ForegroundColor Blue
        $devmemoryExtensions | Select-Object Name, CreationTime, LastWriteTime | 
            ConvertTo-Json | Out-File "$logDir\vscode-extensions.json"
    }
}

# Collect network connectivity info (for AWS Bedrock)
Write-Host "Testing network connectivity..." -ForegroundColor Blue
$connectivityTests = @{}

try {
    $connectivityTests.AWS_Bedrock = Test-NetConnection "bedrock.us-east-1.amazonaws.com" -Port 443 -InformationLevel Quiet
} catch {
    $connectivityTests.AWS_Bedrock = $false
}

try {
    $connectivityTests.GitHub = Test-NetConnection "github.com" -Port 443 -InformationLevel Quiet
} catch {
    $connectivityTests.GitHub = $false
}

$connectivityTests | ConvertTo-Json | Out-File "$logDir\connectivity-tests.json"

# Create summary for easy sharing
$logSummary = @"
=== DevMemory Debug Log Summary ===
Collected: $timestamp
Computer: $env:COMPUTERNAME
User: $env:USERNAME

Application State:
- App Data Directory: $(if($appExists) { "✅ Found" } else { "❌ Missing" })
- Temp Directory: $(if($tempExists) { "✅ Found" } else { "❌ Missing" })
- Running Processes: $((Get-Process | Where-Object { $_.ProcessName -like "*devmemory*" -or $_.ProcessName -like "*electron*" }).Count)

Logs Collected:
$(Get-ChildItem $logDir | ForEach-Object { "- $($_.Name)" } | Out-String)

For Analysis:
1. Share the entire logs directory: $logDir
2. Key files for troubleshooting:
   - system-info.json (system state)
   - main.log (application logs)
   - error.log (error details)
   - nodejs-env.json (environment)

Privacy Note:
$(if($IncludeUserData) { "⚠️ User data included - review before sharing" } else { "✅ No user data included - safe to share" })
"@

$logSummary | Out-File "$logDir\README.txt"

Write-Host "`n=== Log Collection Complete ===" -ForegroundColor Green
Write-Host $logSummary
Write-Host "`nZip the entire directory for sharing: $logDir" -ForegroundColor Cyan