# ディレクトリ構成セットアップガイド

URMS v4.0 への移行用ガイド。新しいディレクトリ構造を構築するためのステップバイステップ手順。

---

## Phase 1: ディレクトリ構成の作成

### Step 1.1: トップレベルディレクトリ作成

```powershell
# PowerShell実行

# メインディレクトリ
New-Item -ItemType Directory -Path "D:\GitHub\URMS\SpecDoc" -Force
New-Item -ItemType Directory -Path "D:\GitHub\URMS\Source" -Force
New-Item -ItemType Directory -Path "D:\GitHub\URMS\Backend" -Force
New-Item -ItemType Directory -Path "D:\GitHub\URMS\Work" -Force
New-Item -ItemType Directory -Path "D:\GitHub\URMS\Tests" -Force
New-Item -ItemType Directory -Path "D:\GitHub\URMS\Assets" -Force
```

### Step 1.2: SpecDoc サブディレクトリ作成

```powershell
# SpecDoc 階層構造
New-Item -ItemType Directory -Path "D:\GitHub\URMS\SpecDoc\master" -Force
New-Item -ItemType Directory -Path "D:\GitHub\URMS\SpecDoc\core" -Force
New-Item -ItemType Directory -Path "D:\GitHub\URMS\SpecDoc\system" -Force
New-Item -ItemType Directory -Path "D:\GitHub\URMS\SpecDoc\subsystems" -Force
```

### Step 1.3: Source（TypeScript）ディレクトリ作成

```powershell
# Source/src の階層構造
$sourcePaths = @(
    "D:\GitHub\URMS\Source\src\core\base",
    "D:\GitHub\URMS\Source\src\core\types",
    "D:\GitHub\URMS\Source\src\core\dashboard",
    "D:\GitHub\URMS\Source\src\core\log",
    "D:\GitHub\URMS\Source\src\core\progress",
    
    "D:\GitHub\URMS\Source\src\system",
    
    "D:\GitHub\URMS\Source\src\subsystems\asset",
    "D:\GitHub\URMS\Source\src\subsystems\file",
    "D:\GitHub\URMS\Source\src\subsystems\network",
    "D:\GitHub\URMS\Source\src\subsystems\iot",
    "D:\GitHub\URMS\Source\src\subsystems\schedule",
    "D:\GitHub\URMS\Source\src\subsystems\finance",
    
    "D:\GitHub\URMS\Source\src\components\cards",
    "D:\GitHub\URMS\Source\src\components\layouts",
    "D:\GitHub\URMS\Source\src\components\common",
    "D:\GitHub\URMS\Source\src\components\future-mode",
    
    "D:\GitHub\URMS\Source\src\hooks",
    "D:\GitHub\URMS\Source\src\utils",
    "D:\GitHub\URMS\Source\src\styles"
)

foreach ($path in $sourcePaths) {
    New-Item -ItemType Directory -Path $path -Force | Out-Null
}

Write-Host "Source directories created successfully"
```

### Step 1.4: Backend（Rust）ディレクトリ作成

```powershell
# Backend/src-tauri/src の階層構造
$backendPaths = @(
    "D:\GitHub\URMS\Backend\src-tauri\src\base",
    "D:\GitHub\URMS\Backend\src-tauri\src\core",
    "D:\GitHub\URMS\Backend\src-tauri\src\system",
    "D:\GitHub\URMS\Backend\src-tauri\src\subsystems\asset",
    "D:\GitHub\URMS\Backend\src-tauri\src\subsystems\file",
    "D:\GitHub\URMS\Backend\src-tauri\src\subsystems\network",
    "D:\GitHub\URMS\Backend\src-tauri\src\subsystems\iot",
    "D:\GitHub\URMS\Backend\src-tauri\src\subsystems\schedule",
    "D:\GitHub\URMS\Backend\src-tauri\src\subsystems\finance",
    "D:\GitHub\URMS\Backend\src-tauri\tests\integration_tests"
)

foreach ($path in $backendPaths) {
    New-Item -ItemType Directory -Path $path -Force | Out-Null
}

Write-Host "Backend directories created successfully"
```

### Step 1.5: Work（スクリプト・設定）ディレクトリ作成

```powershell
$workPaths = @(
    "D:\GitHub\URMS\Work\scripts",
    "D:\GitHub\URMS\Work\config",
    "D:\GitHub\URMS\Work\docs"
)

foreach ($path in $workPaths) {
    New-Item -ItemType Directory -Path $path -Force | Out-Null
}

Write-Host "Work directories created successfully"
```

### Step 1.6: Tests ディレクトリ作成

```powershell
$testPaths = @(
    "D:\GitHub\URMS\Tests\unit",
    "D:\GitHub\URMS\Tests\integration",
    "D:\GitHub\URMS\Tests\e2e",
    "D:\GitHub\URMS\Tests\fixtures"
)

foreach ($path in $testPaths) {
    New-Item -ItemType Directory -Path $path -Force | Out-Null
}

Write-Host "Tests directories created successfully"
```

---

## Phase 2: ファイル移行

### Step 2.1: 現在の src/ を Source/src へ移行

```powershell
# 既存ファイルをバックアップ
Copy-Item -Path "D:\GitHub\URMS\src\*" -Destination "D:\GitHub\URMS\Source\src" -Recurse -Force

Write-Host "Source files migrated"
```

### Step 2.2: src-tauri を Backend へ移行

```powershell
# 既存 Rust ファイルをバックアップ
Copy-Item -Path "D:\GitHub\URMS\src-tauri\src\*" -Destination "D:\GitHub\URMS\Backend\src-tauri\src" -Recurse -Force

Write-Host "Backend files migrated"
```

### Step 2.3: docs/ を SpecDoc へ移行

```powershell
# 既存ドキュメントを移行
Copy-Item -Path "D:\GitHub\URMS\docs\master\*" -Destination "D:\GitHub\URMS\SpecDoc\master" -Recurse -Force
Copy-Item -Path "D:\GitHub\URMS\docs\spec\*" -Destination "D:\GitHub\URMS\SpecDoc\subsystems" -Recurse -Force

Write-Host "SpecDoc files migrated"
```

### Step 2.4: scripts/ を Work へ移行

```powershell
Copy-Item -Path "D:\GitHub\URMS\scripts\*" -Destination "D:\GitHub\URMS\Work\scripts" -Recurse -Force

Write-Host "Work scripts migrated"
```

---

## Phase 3: パス参照の更新

### Step 3.1: TypeScript import パス更新

**変更前**:
```ts
import { LogManager } from '../../../core/log'
import { BaseManager } from '../../base'
```

**変更後**:
```ts
import { LogManager } from '@core/log'
import { BaseManager } from '@core/base'
```

**tsconfig.json 更新**:
```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@core/*": ["src/core/*"],
      "@system/*": ["src/system/*"],
      "@subsystems/*": ["src/subsystems/*"],
      "@components/*": ["src/components/*"],
      "@hooks/*": ["src/hooks/*"],
      "@utils/*": ["src/utils/*"],
      "@styles/*": ["src/styles/*"]
    }
  }
}
```

### Step 3.2: vite.config.ts 更新

```ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@core': path.resolve(__dirname, './src/core'),
      '@system': path.resolve(__dirname, './src/system'),
      '@subsystems': path.resolve(__dirname, './src/subsystems'),
      '@components': path.resolve(__dirname, './src/components'),
      '@hooks': path.resolve(__dirname, './src/hooks'),
      '@utils': path.resolve(__dirname, './src/utils'),
      '@styles': path.resolve(__dirname, './src/styles'),
    },
  },
})
```

### Step 3.3: Rust mod 参照の追加

**Backend/src-tauri/src/lib.rs**:
```rust
pub mod base;
pub mod core;
pub mod system;
pub mod subsystems;
pub mod error;
pub mod types;
pub mod commands;
```

---

## Phase 4: ファイル検証

### Step 4.1: ディレクトリ構造の確認

```powershell
# ディレクトリツリー表示
tree D:\GitHub\URMS\SpecDoc /F
tree D:\GitHub\URMS\Source\src /F /L 2
tree D:\GitHub\URMS\Backend\src-tauri\src /F /L 2
```

### Step 4.2: 必須ファイルの確認

```powershell
# テンプレートファイル確認
$requiredFiles = @(
    "D:\GitHub\URMS\Source\src\core\base\BaseManager.ts",
    "D:\GitHub\URMS\Source\src\core\types\ManagerTypes.ts",
    "D:\GitHub\URMS\Backend\src-tauri\src\base\base_manager.rs",
    "D:\GitHub\URMS\Backend\src-tauri\src\error.rs",
    "D:\GitHub\URMS\SpecDoc\SPECDOC_TEMPLATE.md"
)

foreach ($file in $requiredFiles) {
    if (Test-Path $file) {
        Write-Host "✓ $file" -ForegroundColor Green
    } else {
        Write-Host "✗ $file MISSING" -ForegroundColor Red
    }
}
```

---

## Phase 5: 既存ファイルのクリーンアップ

### Step 5.1: 旧ディレクトリのバックアップ

```powershell
# 移行後、旧ファイルをバックアップディレクトリへ
$backupDate = Get-Date -Format "yyyyMMdd_HHmmss"
$backupDir = "D:\GitHub\URMS\__backup_$backupDate"

New-Item -ItemType Directory -Path $backupDir -Force | Out-Null

# 旧ディレクトリを移動
Move-Item -Path "D:\GitHub\URMS\src" -Destination "$backupDir\src" -Force -ErrorAction SilentlyContinue
Move-Item -Path "D:\GitHub\URMS\src-tauri\src" -Destination "$backupDir\src-tauri_src" -Force -ErrorAction SilentlyContinue
Move-Item -Path "D:\GitHub\URMS\docs" -Destination "$backupDir\docs" -Force -ErrorAction SilentlyContinue

Write-Host "Backup created at: $backupDir" -ForegroundColor Green
```

---

## Phase 6: 検証テスト

### Step 6.1: TypeScript コンパイルテスト

```powershell
cd D:\GitHub\URMS\Source
npm run type-check
```

### Step 6.2: Rust コンパイルテスト

```powershell
cd D:\GitHub\URMS\Backend\src-tauri
cargo check
```

---

## 完成チェックリスト

- [ ] ディレクトリ構成作成完了
- [ ] ファイル移行完了
- [ ] Import パス更新完了
- [ ] tsconfig.json 更新完了
- [ ] vite.config.ts 更新完了
- [ ] Rust mod 定義完了
- [ ] TypeScript コンパイルテスト ✓
- [ ] Rust コンパイルテスト ✓
- [ ] git commit（マイグレーション）完了
- [ ] README.md 更新完了

---

## 注意事項

- 移行前に **git commit** して現在の状態を保存してください
- バックアップディレクトリは移行成功後に削除可能
- path alias の設定忘れはビルドエラーになります
- 既存テストがある場合は、import パス更新後に再実行してください
