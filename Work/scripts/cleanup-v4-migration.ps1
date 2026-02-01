# cleanup-v4-migration.ps1
# URMS v4.0 移行後の旧ファイルクリーンアップ
# 
# 注意: バックアップなしで削除されます。
# 事前に git commit してください！

$ErrorActionPreference = "Stop"
$URMSRoot = "D:\GitHub\URMS"

Write-Host "========================================"
Write-Host "URMS v4.0 Migration Cleanup"
Write-Host "========================================"
Write-Host ""
Write-Host "Warning: This script will DELETE old directories"
Write-Host "Make sure you have git committed all changes!"
Write-Host ""

# 確認プロンプト
$confirm = Read-Host "本当に削除してもよろしいですか？ (yes/no)"
if ($confirm -ne "yes") {
    Write-Host "Cancelled."
    exit
}

Write-Host ""
Write-Host "Cleanup starting..."
Write-Host ""

# 1. 旧ディレクトリ削除
$oldDirs = @(
    "src",           # Source/src に移行済み
    "src-tauri",     # Backend/src-tauri に移行済み
    "docs",          # SpecDoc に移行済み
    "scripts",       # Work/scripts に移行済み
    "dist",          # ビルド出力（再生成可能）
    "public"         # Assets に統合可能
)

foreach ($dir in $oldDirs) {
    $path = Join-Path $URMSRoot $dir
    if (Test-Path $path) {
        Write-Host "Deleting: $path"
        Remove-Item -Path $path -Recurse -Force
        Write-Host "  ✓ Deleted"
    }
}

# 2. キャッシュ・生成ファイル削除
$cacheFiles = @(
    "node_modules",
    ".next",
    "dist",
    ".turbo",
    "Backend\src-tauri\target"
)

foreach ($file in $cacheFiles) {
    $path = Join-Path $URMSRoot $file
    if (Test-Path $path) {
        Write-Host "Deleting cache: $path"
        Remove-Item -Path $path -Recurse -Force -ErrorAction SilentlyContinue
        Write-Host "  ✓ Deleted"
    }
}

# 3. 不要な根ディレクトリのクリーンアップ確認
Write-Host ""
Write-Host "Optional cleanup items:"
Write-Host ""

$optionalItems = @(
    @{
        Path = "out_exe_icon.png"
        Reason = "生成されたアイコン（Assets に統合可能）"
    },
    @{
        Path = "out_ico_icon.png"
        Reason = "生成されたアイコン（Assets に統合可能）"
    }
)

foreach ($item in $optionalItems) {
    $path = Join-Path $URMSRoot $item.Path
    if (Test-Path $path) {
        Write-Host "- $($item.Path): $($item.Reason)"
    }
}

Write-Host ""
Write-Host "========================================"
Write-Host "Cleanup Complete!"
Write-Host "========================================"
Write-Host ""
Write-Host "Remaining directories:"
Write-Host ""

Get-ChildItem -Path $URMSRoot -Directory | Select-Object -ExpandProperty Name | ForEach-Object {
    Write-Host "  ✓ $_"
}

Write-Host ""
Write-Host "ディレクトリ構成:"
Write-Host "  SpecDoc/       - 仕様書"
Write-Host "  Source/        - TypeScript フロントエンド"
Write-Host "  Backend/       - Rust バックエンド"
Write-Host "  Work/          - 運用ツール・設定"
Write-Host "  Tests/         - テスト"
Write-Host "  Assets/        - リソース"
Write-Host "  .git/          - Git リポジトリ"
Write-Host "  .vscode/       - VS Code 設定"
Write-Host ""
Write-Host "次のステップ:"
Write-Host "1. git status で変更を確認"
Write-Host "2. git add . && git commit -m 'chore: Clean up v4.0 migration'"
Write-Host "3. npm install && cargo build で新構造で再ビルド"
Write-Host ""
