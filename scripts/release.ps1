# DevMemory Release Script for Windows
# Run this script to build release packages

Write-Host "DevMemory Release Builder" -ForegroundColor Green
Write-Host "=========================" -ForegroundColor Green

# Check prerequisites
Write-Host "`nChecking prerequisites..." -ForegroundColor Yellow

try {
    $nodeVersion = node --version
    Write-Host "✓ Node.js: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js not found" -ForegroundColor Red
    exit 1
}

try {
    $pythonVersion = python --version
    Write-Host "✓ Python: $pythonVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Python not found" -ForegroundColor Red
    exit 1
}

# Clean previous builds
Write-Host "`nCleaning previous builds..." -ForegroundColor Yellow
if (Test-Path "dist") {
    Remove-Item -Recurse -Force "dist"
    Write-Host "✓ Cleaned dist directory" -ForegroundColor Green
}

if (Test-Path "dist-electron") {
    Remove-Item -Recurse -Force "dist-electron"
    Write-Host "✓ Cleaned dist-electron directory" -ForegroundColor Green
}

# Install dependencies
Write-Host "`nInstalling dependencies..." -ForegroundColor Yellow
try {
    npm ci
    Write-Host "✓ Node.js dependencies installed" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to install Node.js dependencies" -ForegroundColor Red
    exit 1
}

try {
    pip install chromadb
    Write-Host "✓ Python dependencies installed" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to install Python dependencies" -ForegroundColor Red
    exit 1
}

# Run linting
Write-Host "`nRunning code quality checks..." -ForegroundColor Yellow
try {
    npm run lint
    Write-Host "✓ Linting passed" -ForegroundColor Green
} catch {
    Write-Host "⚠ Linting issues found, continuing anyway..." -ForegroundColor Yellow
}

# Build application
Write-Host "`nBuilding application..." -ForegroundColor Yellow
try {
    npm run build
    Write-Host "✓ Application built successfully" -ForegroundColor Green
} catch {
    Write-Host "❌ Build failed" -ForegroundColor Red
    exit 1
}

# Create Windows installer
Write-Host "`nCreating Windows installer..." -ForegroundColor Yellow
try {
    npm run package:win
    Write-Host "✓ Windows installer created" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to create Windows installer" -ForegroundColor Red
    exit 1
}

# Show results
Write-Host "`nBuild complete!" -ForegroundColor Green
Write-Host "==================" -ForegroundColor Green

if (Test-Path "dist-electron") {
    $files = Get-ChildItem "dist-electron" -Filter "*.exe"
    foreach ($file in $files) {
        $size = [math]::Round($file.Length / 1MB, 1)
        Write-Host "📦 $($file.Name) ($($size) MB)" -ForegroundColor Cyan
    }
    
    Write-Host "`nInstaller location: dist-electron\" -ForegroundColor White
    Write-Host "Ready for distribution!" -ForegroundColor Green
} else {
    Write-Host "❌ No output files found" -ForegroundColor Red
}

Write-Host "`nTo test the installer:" -ForegroundColor Yellow
Write-Host "1. Navigate to dist-electron\ folder" -ForegroundColor White
Write-Host "2. Run DevMemory-Setup-1.0.0.exe as Administrator" -ForegroundColor White
Write-Host "3. Follow the installation wizard" -ForegroundColor White