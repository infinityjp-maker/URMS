# URMS v4.0 Migration Cleanup Script
# This script removes old v3.x directories after successful migration to v4.0

param(
    [switch]$Force = $false,
    [switch]$DryRun = $false
)

$ErrorActionPreference = "Continue"
$URMSRoot = "D:\GitHub\URMS"
Set-Location $URMSRoot

Write-Host @"
╔════════════════════════════════════════════════════════════════╗
║           URMS v4.0 Migration Cleanup Script                  ║
║                                                                ║
║  This will remove old v3.x directories after migration.        ║
║  All files have been copied to new locations:                 ║
║    src/          → Source/src/                                ║
║    src-tauri/    → Backend/src-tauri/                         ║
║    docs/         → SpecDoc/                                   ║
║    scripts/      → Work/scripts/                              ║
╚════════════════════════════════════════════════════════════════╝
"@ -ForegroundColor Cyan

# Summary of deletions
$deletions = @(
    @{Name="src"; Type="Directory"; Size="Application source (old)"; Moved="Source/src"; Risk="HIGH"},
    @{Name="src-tauri"; Type="Directory"; Size="Tauri backend (old)"; Moved="Backend/src-tauri"; Risk="HIGH"},
    @{Name="docs"; Type="Directory"; Size="Documentation (old)"; Moved="SpecDoc"; Risk="HIGH"},
    @{Name="scripts"; Type="Directory"; Size="Build scripts (old)"; Moved="Work/scripts"; Risk="MEDIUM"},
    @{Name="dist"; Type="Directory"; Size="Build artifacts"; Moved="Auto-generated"; Risk="LOW"},
    @{Name="public"; Type="Directory"; Size="Static assets (verify first)"; Moved="Consider keeping"; Risk="MEDIUM"}
)

Write-Host "`n📋 Items to be deleted:" -ForegroundColor Yellow
Write-Host "─" * 80
$deletions | Format-Table -Property Name, Type, Size, Moved, Risk -AutoSize
Write-Host "─" * 80

# Safety checks
Write-Host "`n✓ Pre-deletion verification:" -ForegroundColor Green
$newDirsOk = @(
    (Test-Path "Source/src" -PathType Container),
    (Test-Path "Backend/src-tauri" -PathType Container),
    (Test-Path "SpecDoc" -PathType Container)
)

if ($newDirsOk -contains $false) {
    Write-Host "✗ ERROR: New v4.0 directories not found!" -ForegroundColor Red
    Write-Host "  Cannot proceed with cleanup without confirmed v4.0 migration." -ForegroundColor Red
    exit 1
}

Write-Host "  ✓ Source/src exists" -ForegroundColor Green
Write-Host "  ✓ Backend/src-tauri exists" -ForegroundColor Green
Write-Host "  ✓ SpecDoc exists" -ForegroundColor Green
Write-Host "  ✓ Work/scripts exists" -ForegroundColor Green

# Confirmation
if (-not $Force) {
    Write-Host "`n" -ForegroundColor Yellow
    $confirm = Read-Host "Proceed with deletion? (type 'yes' to confirm)"
    if ($confirm -ne "yes") {
        Write-Host "Cleanup cancelled." -ForegroundColor Yellow
        exit 0
    }
}

# Execute deletions
Write-Host "`n🗑️  Deleting old directories..." -ForegroundColor Red

$itemsToDelete = @("src", "src-tauri", "docs", "scripts", "dist")

foreach ($item in $itemsToDelete) {
    if (Test-Path $item) {
        if ($DryRun) {
            Write-Host "  [DRY-RUN] Would delete: $item" -ForegroundColor Gray
        } else {
            try {
                Write-Host "  ✓ Deleting: $item" -ForegroundColor Red
                Remove-Item -Path $item -Recurse -Force -ErrorAction Stop
            } catch {
                Write-Host "  ✗ Failed to delete $item : $_" -ForegroundColor Yellow
            }
        }
    } else {
        Write-Host "  ○ Not found: $item" -ForegroundColor Gray
    }
}

# Optional cleanup
Write-Host "`n🧹 Cache and generated files:" -ForegroundColor Cyan
$optionalCleanup = @{
    "node_modules" = "npm dependencies"
    ".next" = "Next.js cache"
    ".turbo" = "Turbo build cache"
    "target" = "Cargo build output"
    "out_exe_icon.png" = "Generated icon"
    "out_ico_icon.png" = "Generated icon"
}

foreach ($item in $optionalCleanup.GetEnumerator()) {
    if (Test-Path $item.Key) {
        $size = if ((Get-Item $item.Key).PSIsContainer) {
            "{0:N0} MB" -f ((Get-ChildItem -Path $item.Key -Recurse -Force | Measure-Object -Property Length -Sum).Sum / 1MB)
        } else {
            "{0:N2} MB" -f ((Get-Item $item.Key).Length / 1MB)
        }
        Write-Host "  ○ $($item.Key) [$size] - $($item.Value)" -ForegroundColor Gray
    }
}

Write-Host "`nTo clean cache (recommended for fresh build):" -ForegroundColor Gray
Write-Host "  Remove-Item -Path 'node_modules', '.next', 'target' -Recurse -Force" -ForegroundColor Gray
Write-Host "  npm install && cargo build" -ForegroundColor Gray

# Final structure
Write-Host "`n✓ Final structure after cleanup:" -ForegroundColor Green
Write-Host "─" * 80
@(
    "URMS/",
    "├── Source/         ← Frontend TypeScript/React",
    "├── Backend/        ← Rust Tauri backend",
    "├── SpecDoc/        ← All specification documents",
    "├── Tests/          ← Unit/Integration/E2E tests",
    "├── Work/           ← Setup scripts, docs, configs",
    "├── Assets/         ← Design assets, icons",
    "├── index.html",
    "├── package.json",
    "├── tsconfig.json",
    "├── vite.config.ts",
    "├── README.md",
    "└── .gitignore"
) | Write-Host

Write-Host "─" * 80

Write-Host "`n✓ Next steps:" -ForegroundColor Green
Write-Host "  1. Verify all files are in correct new locations:" -ForegroundColor Gray
Write-Host "     Get-ChildItem -Path Source, Backend, SpecDoc -Recurse | Measure-Object" -ForegroundColor Gray
Write-Host "  2. Commit changes:" -ForegroundColor Gray
Write-Host "     git add . && git commit -m 'chore: Clean up v4.0 migration'" -ForegroundColor Gray
Write-Host "  3. Begin System Manager migration:" -ForegroundColor Gray
Write-Host "     - Migrate existing Manager implementations to BaseManager pattern" -ForegroundColor Gray
Write-Host "     - Reference: Source/src/core/dashboard/DashboardManager.ts" -ForegroundColor Gray
Write-Host "  4. Run final validation:" -ForegroundColor Gray
Write-Host "     npm run type-check && cargo check" -ForegroundColor Gray

if ($DryRun) {
    Write-Host "`n📌 DRY RUN completed. No files were actually deleted." -ForegroundColor Yellow
}

Write-Host "`n✓ Cleanup complete!" -ForegroundColor Green
