# DevMemory Windows Testing Script
# Collects comprehensive logs and system information for analysis

param(
    [string]$OutputDir = "test-results",
    [switch]$Verbose = $false
)

# Create output directory
$timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$testDir = "$OutputDir\test-$timestamp"
New-Item -ItemType Directory -Path $testDir -Force | Out-Null

Write-Host "=== DevMemory Windows Testing ===" -ForegroundColor Green
Write-Host "Test results will be saved to: $testDir" -ForegroundColor Yellow

# Helper function to capture command output
function Invoke-TestCommand {
    param(
        [string]$Command,
        [string]$Description,
        [string]$LogFile
    )
    
    Write-Host "Testing: $Description" -ForegroundColor Cyan
    $logPath = "$testDir\$LogFile"
    
    try {
        $startTime = Get-Date
        $output = Invoke-Expression $Command 2>&1
        $endTime = Get-Date
        $duration = ($endTime - $startTime).TotalSeconds
        
        $result = @{
            Command = $Command
            Description = $Description
            StartTime = $startTime
            EndTime = $endTime
            Duration = $duration
            Success = $LASTEXITCODE -eq 0 -or $LASTEXITCODE -eq $null
            Output = $output
            ExitCode = $LASTEXITCODE
        }
        
        # Save to JSON for analysis
        $result | ConvertTo-Json -Depth 3 | Out-File "$logPath.json"
        
        # Save raw output
        $output | Out-File "$logPath.txt"
        
        if ($result.Success) {
            Write-Host "✅ $Description completed in $($duration)s" -ForegroundColor Green
        } else {
            Write-Host "❌ $Description failed (Exit code: $LASTEXITCODE)" -ForegroundColor Red
        }
        
        return $result
    }
    catch {
        $error = $_.Exception.Message
        Write-Host "❌ $Description failed: $error" -ForegroundColor Red
        
        $result = @{
            Command = $Command
            Description = $Description
            Success = $false
            Error = $error
            ExitCode = -1
        }
        
        $result | ConvertTo-Json | Out-File "$logPath.json"
        $error | Out-File "$logPath.txt"
        
        return $result
    }
}

# System Information
Write-Host "`n=== System Information ===" -ForegroundColor Blue

# Basic system info
systeminfo | Out-File "$testDir\system-info.txt"

# Environment variables
Get-ChildItem Env: | Out-File "$testDir\environment-variables.txt"

# Installed software versions
$versions = @{}

try { $versions.Node = node --version } catch { $versions.Node = "Not installed" }
try { $versions.NPM = npm --version } catch { $versions.NPM = "Not installed" }
try { $versions.Git = git --version } catch { $versions.Git = "Not installed" }
try { $versions.Python = python --version 2>&1 } catch { $versions.Python = "Not installed" }
try { $versions.VSCode = code --version 2>&1 } catch { $versions.VSCode = "Not installed" }
try { $versions.AWS = aws --version 2>&1 } catch { $versions.AWS = "Not installed" }

$versions | ConvertTo-Json | Out-File "$testDir\software-versions.json"

Write-Host "Software Versions:" -ForegroundColor Yellow
$versions | Format-Table | Out-Host

# Check Visual Studio Build Tools
$vsBuildTools = Get-ItemProperty "HKLM:\SOFTWARE\Microsoft\VisualStudio\*" -ErrorAction SilentlyContinue | 
    Where-Object { $_.DisplayName -like "*Build Tools*" -or $_.DisplayName -like "*Visual Studio*" }
$vsBuildTools | ConvertTo-Json | Out-File "$testDir\vs-build-tools.json"

# Test Results Collection
$testResults = @()

# Test 1: Clean Install
Write-Host "`n=== Testing Clean Install ===" -ForegroundColor Blue
$testResults += Invoke-TestCommand "npm cache clean --force" "Clear NPM cache" "01-npm-cache-clean"
$testResults += Invoke-TestCommand "npm install" "Install dependencies" "02-npm-install"

# Test 2: Build Process
Write-Host "`n=== Testing Build Process ===" -ForegroundColor Blue
$testResults += Invoke-TestCommand "npm run build:react" "Build React frontend" "03-build-react"
$testResults += Invoke-TestCommand "npm run build:electron" "Build Electron main" "04-build-electron"

# Test 3: Native Dependencies
Write-Host "`n=== Testing Native Dependencies ===" -ForegroundColor Blue
$testResults += Invoke-TestCommand "npm list better-sqlite3" "Check better-sqlite3" "05-check-sqlite"
$testResults += Invoke-TestCommand "npm rebuild better-sqlite3" "Rebuild SQLite" "06-rebuild-sqlite"

# Test 4: Application Tests
Write-Host "`n=== Testing Application ===" -ForegroundColor Blue
$testResults += Invoke-TestCommand "npm test -- --passWithNoTests" "Run unit tests" "07-unit-tests"

# Test 5: Packaging
Write-Host "`n=== Testing Packaging ===" -ForegroundColor Blue
$testResults += Invoke-TestCommand "npm run package:win" "Package Windows app" "08-package-win"

# Check output files
Write-Host "`n=== Checking Output Files ===" -ForegroundColor Blue

$distFiles = @()
if (Test-Path "dist") {
    $distFiles += Get-ChildItem "dist" -Recurse | Select-Object Name, Length, LastWriteTime
}
if (Test-Path "dist-electron") {
    $distFiles += Get-ChildItem "dist-electron" -Recurse | Select-Object Name, Length, LastWriteTime
}

$distFiles | ConvertTo-Json | Out-File "$testDir\output-files.json"

# Test 6: Application Launch (if built successfully)
if (Test-Path "dist\main.js") {
    Write-Host "`n=== Testing Application Launch ===" -ForegroundColor Blue
    
    # Start app in background and capture initial logs
    $appProcess = Start-Process "npm" "run dev:electron" -PassThru -WindowStyle Hidden
    Start-Sleep -Seconds 10
    
    if (!$appProcess.HasExited) {
        Write-Host "✅ Application started successfully" -ForegroundColor Green
        $appProcess.Kill()
    } else {
        Write-Host "❌ Application failed to start" -ForegroundColor Red
    }
}

# Test 7: VSCode Extension (if available)
if (Test-Path "vscode-extension") {
    Write-Host "`n=== Testing VSCode Extension ===" -ForegroundColor Blue
    Push-Location "vscode-extension"
    $testResults += Invoke-TestCommand "npm install" "Install extension dependencies" "09-vscode-install"
    $testResults += Invoke-TestCommand "npm run compile" "Compile extension" "10-vscode-compile"
    Pop-Location
}

# Generate Summary Report
Write-Host "`n=== Generating Summary Report ===" -ForegroundColor Blue

$summary = @{
    TestTimestamp = $timestamp
    SystemInfo = @{
        OS = (Get-WmiObject Win32_OperatingSystem).Caption
        Architecture = $env:PROCESSOR_ARCHITECTURE
        NodeVersion = $versions.Node
        NPMVersion = $versions.NPM
        HasVSBuildTools = $vsBuildTools.Count -gt 0
    }
    TestResults = $testResults
    OverallSuccess = ($testResults | Where-Object { !$_.Success }).Count -eq 0
    FailedTests = ($testResults | Where-Object { !$_.Success }).Count
    TotalTests = $testResults.Count
    Duration = (Get-Date) - (Get-Date $timestamp)
}

$summary | ConvertTo-Json -Depth 4 | Out-File "$testDir\summary.json"

# Create readable summary
$summaryText = @"
=== DevMemory Windows Test Summary ===
Test Date: $timestamp
OS: $($summary.SystemInfo.OS)
Node.js: $($summary.SystemInfo.NodeVersion)
NPM: $($summary.SystemInfo.NPMVersion)
VS Build Tools: $($summary.SystemInfo.HasVSBuildTools)

Overall Result: $(if($summary.OverallSuccess) { "✅ SUCCESS" } else { "❌ FAILURE" })
Passed: $($summary.TotalTests - $summary.FailedTests)/$($summary.TotalTests)
Duration: $($summary.Duration)

Failed Tests:
$($testResults | Where-Object { !$_.Success } | ForEach-Object { "- $($_.Description)" } | Out-String)

Next Steps:
1. Review logs in: $testDir
2. Share summary.json and failed test logs for analysis
3. Check specific error details in individual .txt/.json files

For Claude Analysis:
- Upload summary.json
- Upload any .json files from failed tests
- Include system-info.txt if build issues occur
"@

$summaryText | Out-File "$testDir\README.txt"

# Display final results
Write-Host "`n=== Test Complete ===" -ForegroundColor Green
Write-Host $summaryText

if ($summary.OverallSuccess) {
    Write-Host "`n🎉 All tests passed! Ready for feature development." -ForegroundColor Green
} else {
    Write-Host "`n🔧 Some tests failed. Review logs and fix issues before proceeding." -ForegroundColor Yellow
}

Write-Host "`nTest results saved to: $testDir" -ForegroundColor Cyan
Write-Host "Share the summary.json file for analysis." -ForegroundColor Cyan