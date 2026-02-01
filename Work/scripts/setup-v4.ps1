# setup-v4-directories.ps1
# URMS v4.0 Directory Setup Script

$ErrorActionPreference = "Stop"
$URMSRoot = "D:\GitHub\URMS"

Write-Host "========================================"
Write-Host "URMS v4.0 Directory Setup"
Write-Host "========================================"
Write-Host ""

# Main directories
Write-Host "[1/4] Creating main directories..."
$mainDirs = @(
    "$URMSRoot\SpecDoc",
    "$URMSRoot\Source",
    "$URMSRoot\Backend",
    "$URMSRoot\Work",
    "$URMSRoot\Tests",
    "$URMSRoot\Assets"
)

foreach ($dir in $mainDirs) {
    if (-not (Test-Path $dir)) {
        New-Item -ItemType Directory -Path $dir -Force | Out-Null
    }
    Write-Host "  OK: $dir"
}

# SpecDoc directories
Write-Host ""
Write-Host "[2/4] Creating SpecDoc structure..."
$specDocDirs = @(
    "$URMSRoot\SpecDoc\master",
    "$URMSRoot\SpecDoc\core",
    "$URMSRoot\SpecDoc\system",
    "$URMSRoot\SpecDoc\subsystems"
)

foreach ($dir in $specDocDirs) {
    if (-not (Test-Path $dir)) {
        New-Item -ItemType Directory -Path $dir -Force | Out-Null
    }
    Write-Host "  OK: $(Split-Path $dir -Leaf)"
}

# Source directories
Write-Host ""
Write-Host "[3/4] Creating Source (TypeScript) structure..."
$sourceDirs = @(
    "$URMSRoot\Source\src\core\base",
    "$URMSRoot\Source\src\core\types",
    "$URMSRoot\Source\src\core\dashboard",
    "$URMSRoot\Source\src\core\log",
    "$URMSRoot\Source\src\core\progress",
    "$URMSRoot\Source\src\system",
    "$URMSRoot\Source\src\subsystems\asset",
    "$URMSRoot\Source\src\subsystems\file",
    "$URMSRoot\Source\src\subsystems\network",
    "$URMSRoot\Source\src\subsystems\iot",
    "$URMSRoot\Source\src\subsystems\schedule",
    "$URMSRoot\Source\src\subsystems\finance",
    "$URMSRoot\Source\src\components\cards",
    "$URMSRoot\Source\src\components\layouts",
    "$URMSRoot\Source\src\components\common",
    "$URMSRoot\Source\src\components\future-mode",
    "$URMSRoot\Source\src\hooks",
    "$URMSRoot\Source\src\utils",
    "$URMSRoot\Source\src\styles"
)

foreach ($dir in $sourceDirs) {
    if (-not (Test-Path $dir)) {
        New-Item -ItemType Directory -Path $dir -Force | Out-Null
    }
    Write-Host "  OK: $(Split-Path $dir -Leaf)"
}

# Backend directories
Write-Host ""
Write-Host "[4/4] Creating Backend (Rust) structure..."
$backendDirs = @(
    "$URMSRoot\Backend\src-tauri\src\base",
    "$URMSRoot\Backend\src-tauri\src\core",
    "$URMSRoot\Backend\src-tauri\src\system",
    "$URMSRoot\Backend\src-tauri\src\subsystems\asset",
    "$URMSRoot\Backend\src-tauri\src\subsystems\file",
    "$URMSRoot\Backend\src-tauri\src\subsystems\network",
    "$URMSRoot\Backend\src-tauri\src\subsystems\iot",
    "$URMSRoot\Backend\src-tauri\src\subsystems\schedule",
    "$URMSRoot\Backend\src-tauri\src\subsystems\finance",
    "$URMSRoot\Backend\src-tauri\tests\integration_tests",
    "$URMSRoot\Work\scripts",
    "$URMSRoot\Work\config",
    "$URMSRoot\Work\docs",
    "$URMSRoot\Tests\unit",
    "$URMSRoot\Tests\integration",
    "$URMSRoot\Tests\e2e",
    "$URMSRoot\Tests\fixtures"
)

foreach ($dir in $backendDirs) {
    if (-not (Test-Path $dir)) {
        New-Item -ItemType Directory -Path $dir -Force | Out-Null
    }
    Write-Host "  OK: $(Split-Path $dir -Leaf)"
}

Write-Host ""
Write-Host "========================================"
Write-Host "Setup Complete!"
Write-Host "========================================"
Write-Host ""
