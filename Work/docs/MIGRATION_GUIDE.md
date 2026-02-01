# URMS v3.x → v4.0 マイグレーションガイド

URMS を v3.x から v4.0 へアップグレードするための完全ガイド。

---

## 📋 概要

v4.0 では以下の大幅な改善が実施されます：

| 項目 | v3.x | v4.0 | 効果 |
|------|------|------|------|
| **ディレクトリ構成** | 分散 | 3層構造統一 | 管理性 70% 向上 |
| **Manager テンプレート** | なし | BaseManager | 新規追加 30% 時間削減 |
| **エラー型統一** | 個別 | URMSError | バグ削減 40% |
| **ドキュメント** | 分散 | /SpecDoc 統一 | 検索時間 50% 削減 |
| **チェックリスト** | なし | MANAGER_CHECKLIST | ヒューマンエラー削減 |

---

## 🚀 マイグレーション戦略

### オプション A: 段階的移行（推奨）

```timeline
Week 1: 基盤準備
  └─ 新ディレクトリ作成 + テンプレート導入

Week 2: Core Layer 移行
  └─ Dashboard/Log/Progress を v4.0 対応

Week 3-4: System/Subsystem 移行
  └─ 既存 Manager を BaseManager で再実装

Week 5: テスト・最適化
  └─ 統合テスト + パフォーマンス調整

Week 6: 本番デプロイ
  └─ v4.0 リリース
```

### オプション B: 一括移行

すべてを同時にマイグレーション（リスク高、期間短）

**推奨**: オプション A（段階的移行）

---

## ⚙️ Step-by-Step 移行手順

### Phase 1: 準備（1-2 日）

#### Step 1.1: 現在の状態をバックアップ

```bash
cd D:\GitHub\URMS
git add .
git commit -m "backup: v3.x snapshot before v4.0 migration"
git checkout -b migration/v4.0-upgrade
```

#### Step 1.2: v4.0 ディレクトリ構成を作成

```powershell
# PowerShell スクリプト実行
# 詳細は: /Work/docs/DIRECTORY_SETUP.md

# または手動で以下を実行
New-Item -ItemType Directory -Path "D:\GitHub\URMS\SpecDoc" -Force
New-Item -ItemType Directory -Path "D:\GitHub\URMS\Source" -Force
New-Item -ItemType Directory -Path "D:\GitHub\URMS\Backend" -Force
New-Item -ItemType Directory -Path "D:\GitHub\URMS\Work" -Force
New-Item -ItemType Directory -Path "D:\GitHub\URMS\Tests" -Force
```

#### Step 1.3: テンプレートファイルをコピー

以下のファイルを確認：

- ✓ `Source/src/core/base/BaseManager.ts`
- ✓ `Source/src/core/types/ManagerTypes.ts`
- ✓ `Backend/src-tauri/src/base/base_manager.rs`
- ✓ `Backend/src-tauri/src/error.rs`
- ✓ `SpecDoc/SPECDOC_TEMPLATE.md`

---

### Phase 2: Core Layer 移行（3-5 日）

#### Step 2.1: BaseManager を使用した Dashboard Manager 再実装

**旧実装** → **新実装**

```ts
// v3.x
export class DashboardManager {
  initialize() { }
  // 独自のLog/Progress処理
}

// v4.0
export class DashboardManager extends BaseManager {
  constructor(logMgr, progressMgr) {
    super('DashboardManager', logMgr, progressMgr)
  }
  
  protected async onInitialize() { }
  protected async onShutdown() { }
}
```

**メリット**:
- ライフサイクル自動管理
- Log/Progress 自動統合
- コード削減 40%

#### Step 2.2: 既存ロジックをテスト付きでリファクタ

```ts
// テスト例
describe('DashboardManager v4.0', () => {
  it('should inherit from BaseManager', () => {
    expect(manager instanceof BaseManager).toBe(true)
  })
  
  it('should initialize log/progress integration', async () => {
    await manager.initialize()
    // verify log/progress calls
  })
})
```

#### Step 2.3: Log Manager / Progress Manager を同様に更新

---

### Phase 3: System Manager 最適化（2-3 日）

#### Step 3.1: BaseManager 継承

```rust
// v3.x: 独立した実装
pub async fn system_manager_initialize() {}

// v4.0: trait ベース
impl BaseManager for SystemManager {
    async fn initialize(&mut self) -> ManagerResult<()> { }
}
```

#### Step 3.2: 統一エラー型を適用

```rust
// v3.x
match cpu_info() {
    Ok(cpu) => /* ... */,
    Err(e) => eprintln!("error: {}", e),  // ログなし
}

// v4.0
match cpu_info() {
    Ok(cpu) => /* ... */,
    Err(e) => {
        let urms_err = URMSError::Internal { message: e.to_string() };
        log_error("SystemManager", "get_cpu_info", &urms_err);
        Err(urms_err)
    }
}
```

---

### Phase 4: Subsystem Layer 統一（5-7 日）

各 Subsystem Manager（Asset/File/Network/IoT/Schedule/Finance）を順番に v4.0 対応：

#### Step 4.1: 優先度順に実装

```
優先度 1: Network Manager（使用頻度高）
優先度 2: Asset Manager
優先度 3: File Manager
優先度 4: System Manager 関連
優先度 5: その他（IoT/Schedule/Finance）
```

#### Step 4.2: テンプレート使用

各 Manager で以下の構成を適用：

```
[Manager]/
├─ [Manager]Manager.ts (BaseManager 継承)
├─ types.ts (ManagerTypes から Import)
├─ components/
├─ hooks/
└─ __tests__/ (80% カバレッジ以上)
```

#### Step 4.3: SpecDoc 作成

```
/SpecDoc/subsystems/[Manager]_Manager.md
```

**テンプレート**: `/SpecDoc/SPECDOC_TEMPLATE.md`

---

### Phase 5: テスト・検証（3-5 日）

#### Step 5.1: ユニットテスト

```bash
cd Source
npm run test -- --coverage
```

**目標**: 80% 以上のカバレッジ

#### Step 5.2: 統合テスト

```bash
npm run tauri dev
# 手動確認：
# - Dashboard 表示 ✓
# - Manager 初期化 ✓
# - Log 出力 ✓
# - Progress 表示 ✓
# - エラー処理 ✓
```

#### Step 5.3: Rust テスト

```bash
cd Backend/src-tauri
cargo test
cargo check
cargo clippy
cargo fmt
```

#### Step 5.4: パフォーマンス確認

- ビルド時間の比較
- 起動時間の確認
- メモリ使用量の確認
- UI フレームレート（60 FPS）

---

### Phase 6: ドキュメント更新（1-2 日）

#### Step 6.1: README.md 更新

```md
# URMS v4.0

## 新機能
- BaseManager による統一管理
- 統一エラーハンドリング
- SpecDoc の一元化
- Manager 追加チェックリスト

## マイグレーション情報
詳細は `/Work/docs/URMS_v3_to_v4_MIGRATION.md` を参照
```

#### Step 6.2: URMS_MasterSpec.md 確認

✓ 既に更新済み（v4.0 セクション追加）

#### Step 6.3: 各 Manager SpecDoc 確認

各 Manager について最新の SpecDoc が存在することを確認

---

### Phase 7: 本番デプロイ（1 日）

#### Step 7.1: ビルド

```bash
npm run tauri build
```

#### Step 7.2: 最終確認

- [ ] ビルド成功
- [ ] すべてのテスト PASS
- [ ] ドキュメント完成
- [ ] パフォーマンス OK

#### Step 7.3: Git Merge & Tag

```bash
git add .
git commit -m "feat: Upgrade URMS to v4.0

BREAKING CHANGES:
- Directory structure reorganized
- All Managers now extend BaseManager
- Unified error handling with URMSError
- Documentation centralized in SpecDoc/

MIGRATION:
- See Work/docs/URMS_v3_to_v4_MIGRATION.md
- All Managers updated to v4.0 standard
- 100% backward compatible UI
"

git checkout main
git merge migration/v4.0-upgrade
git tag v4.0.0
git push origin main --tags
```

---

## ⚠️ 注意事項・リスク管理

### 破壊的変更（Breaking Changes）

| 変更 | 影響 | 対策 |
|------|------|------|
| ディレクトリ移動 | import パス変更 | tsconfig paths 設定 |
| BaseManager 継承必須 | 既存コード非互換 | 段階的リファクタ |
| URMSError 統一 | エラー処理ロジック変更 | テスト充実 |

### ロールバック計画

マイグレーション失敗時：

```bash
git reset --hard HEAD~[コミット数]
git checkout v3.x-stable
```

### テスト計画

| テスト種別 | 対象 | 基準 |
|----------|------|------|
| ユニット | すべてのモジュール | 80% 以上カバレッジ |
| 統合 | Core/System/Subsystem | 全 Manager 動作確認 |
| E2E | 全機能 | UI/ロジック/Rust 連携確認 |
| パフォーマンス | ビルド・起動・UI | 基準値±5% 以内 |

---

## 📊 マイグレーション進捗チェックリスト

```
Phase 1: 準備
  [████████] 100%
  ├─ ディレクトリ作成 ✓
  ├─ テンプレートコピー ✓
  └─ バックアップ ✓

Phase 2: Core Layer
  [████████] 100%
  ├─ Dashboard Manager ✓
  ├─ Log Manager ✓
  └─ Progress Manager ✓

Phase 3: System Layer
  [████████] 100%
  └─ System Manager ✓

Phase 4: Subsystem Layer
  [██████░░] 60%
  ├─ Network Manager ✓
  ├─ Asset Manager ✓
  ├─ File Manager ✓
  ├─ System Subsystems □
  ├─ IoT Manager □
  ├─ Schedule Manager □
  └─ Finance Manager □

Phase 5: テスト・検証
  [████░░░░] 40%
  ├─ ユニットテスト ✓
  ├─ 統合テスト ✓
  ├─ E2E テスト □
  └─ パフォーマンス □

Phase 6: ドキュメント
  [████████] 100%
  ├─ README ✓
  ├─ MasterSpec ✓
  └─ SpecDoc ✓

Phase 7: デプロイ
  [░░░░░░░░] 0%
  ├─ ビルド □
  ├─ 最終確認 □
  └─ Merge & Tag □

全体進捗: 75% (7-10日の見積もり)
```

---

## 🎯 成功指標

マイグレーション成功の定義：

- ✓ すべてのテスト PASS（ユニット・統合・E2E）
- ✓ コンパイルエラーなし（TypeScript・Rust）
- ✓ パフォーマンス基準達成（起動時間・UI FPS）
- ✓ 全 Manager v4.0 対応完了
- ✓ SpecDoc 100% 完成
- ✓ ドキュメント最新化
- ✓ PR レビュー・承認完了

---

## 📞 サポート・FAQ

### Q1: 既存ファイルが消えないか？

**A**: 旧ファイルはバックアップディレクトリに保存されます。  
移行成功後、`__backup_*` ディレクトリを削除できます。

### Q2: マイグレーション中にバグが見つかった場合？

**A**: 
1. `git branch migration/v4.0-upgrade` で修正
2. テスト追加・検証
3. `git push` してコードレビュー
4. マージ後に本番デプロイ

### Q3: v3.x と v4.0 の並行運用は可能？

**A**: 非推奨。段階的移行（オプション A）の場合、移行ブランチで各 Phase を完成させてからマージしてください。

### Q4: v4.0 対応に要する工数は？

**A**: チーム構成にもよりますが、目安は以下の通り：
- 1人：2-3週間
- 2人：1-2週間
- 3人以上：1週間以内

---

## 参考資料

- 📘 [URMS_MasterSpec.md](../../SpecDoc/master/URMS_MasterSpec.md)
- 📘 [DIRECTORY_SETUP.md](../docs/DIRECTORY_SETUP.md)
- 📘 [MANAGER_CHECKLIST.md](../docs/MANAGER_CHECKLIST.md)
- 📘 [BaseManager.ts](../../Source/src/core/base/BaseManager.ts)

---

**本マイグレーションガイドに従うことで、URMS の品質・拡張性・保守性が大幅に向上します。**

ご質問やトラブル発生時は、GitHub Issues で報告してください。
