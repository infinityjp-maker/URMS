# setup-v4-directories.ps1
# URMS v4.0 ディレクトリセットアップスクリプト
# 
# 実行方法:
# powershell -ExecutionPolicy Bypass -File setup-v4-directories.ps1

$ErrorActionPreference = "Stop"
$URMSRoot = "D:\GitHub\URMS"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "URMS v4.0 ディレクトリセットアップ" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# ========================================
# Phase 1: ディレクトリ作成
# ========================================

Write-Host "[1/4] メインディレクトリ作成中..." -ForegroundColor Yellow

$mainDirs = @(
    "$URMSRoot\SpecDoc",
    "$URMSRoot\Source",
    "$URMSRoot\Backend",
    "$URMSRoot\Work",
    "$URMSRoot\Tests",
    "$URMSRoot\Assets"
)

foreach ($dir in $mainDirs) {
    New-Item -ItemType Directory -Path $dir -Force | Out-Null
    Write-Host "  ✓ $dir" -ForegroundColor Green
}

# ========================================
# Phase 2: SpecDoc サブディレクトリ
# ========================================

Write-Host "`n[2/4] SpecDoc 階層構造作成中..." -ForegroundColor Yellow

$specDocDirs = @(
    "$URMSRoot\SpecDoc\master",
    "$URMSRoot\SpecDoc\core",
    "$URMSRoot\SpecDoc\system",
    "$URMSRoot\SpecDoc\subsystems"
)

foreach ($dir in $specDocDirs) {
    New-Item -ItemType Directory -Path $dir -Force | Out-Null
    Write-Host "  ✓ $dir" -ForegroundColor Green
}

# ========================================
# Phase 3: Source (TypeScript) ディレクトリ
# ========================================

Write-Host "`n[3/4] Source (TypeScript) 構造作成中..." -ForegroundColor Yellow

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
    New-Item -ItemType Directory -Path $dir -Force | Out-Null
    Write-Host "  ✓ $(Split-Path $dir -Leaf)" -ForegroundColor Green
}

# ========================================
# Phase 4: Backend (Rust) ディレクトリ
# ========================================

Write-Host "`n[4/4] Backend (Rust) 構造作成中..." -ForegroundColor Yellow

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
    "$URMSRoot\Backend\src-tauri\tests\integration_tests"
)

foreach ($dir in $backendDirs) {
    New-Item -ItemType Directory -Path $dir -Force | Out-Null
    Write-Host "  ✓ $(Split-Path $dir -Leaf)" -ForegroundColor Green
}

$workDirs = @(
    "$URMSRoot\Work\scripts",
    "$URMSRoot\Work\config",
    "$URMSRoot\Work\docs",
    "$URMSRoot\Tests\unit",
    "$URMSRoot\Tests\integration",
    "$URMSRoot\Tests\e2e",
    "$URMSRoot\Tests\fixtures"
)

foreach ($dir in $workDirs) {
    New-Item -ItemType Directory -Path $dir -Force | Out-Null
    Write-Host "  ✓ $(Split-Path $dir -Leaf)" -ForegroundColor Green
}

Write-Host "`n========================================" -ForegroundColor Green
Write-Host "✓ ディレクトリセットアップ完了！" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "次のステップ:" -ForegroundColor Cyan
Write-Host "1. ファイルの移行: DIRECTORY_SETUP.md Phase 2 を参照" -ForegroundColor White
Write-Host "2. Import パス更新: tsconfig.json, vite.config.ts を更新" -ForegroundColor White
Write-Host "3. ビルド確認: npm run type-check / cargo check" -ForegroundColor White
Write-Host ""
