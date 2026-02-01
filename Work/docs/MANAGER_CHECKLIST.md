# Manager 追加チェックリスト

新しい Manager を URMS に追加する際の標準プロセス。このチェックリストに従うことで、責務分離・命名規則・ドキュメント・テストのすべてが確実に統一される。

---

## 📋 事前準備

### Manager 計画フェーズ

- [ ] Manager 名を決定（例: Asset Manager）
- [ ] 責務を明確化（3-5 個程度）
- [ ] 依存する Manager を列挙
- [ ] Dashboard カード構成をスケッチ
- [ ] 推定開発期間を見積もり

**チェックポイント**: URMS_MasterSpec の設計思想に合致しているか？

---

## 📝 ドキュメント作成

### 1. SpecDoc 作成（/SpecDoc/subsystems/）

- [ ] `[Manager]_Manager.md` を作成
  - [ ] 目的（Purpose）を記述
  - [ ] 責務（Responsibilities）を記述
  - [ ] UI 構成（Dashboard カード）を定義
  - [ ] データ構造を TypeScript インターフェースで定義
  - [ ] Rust コマンド一覧を記述
  - [ ] Log/Progress 連携方針を記述
  - [ ] エラーハンドリング方針を記述
  - [ ] 異常判定基準（Thresholds）を定義
  - [ ] パフォーマンス要件を記述
  - [ ] 依存関係を明示
  - [ ] テスト戦略を記述
  - [ ] 将来拡張を記述

**テンプレート参照**: `/SpecDoc/SPECDOC_TEMPLATE.md`

**チェックポイント**: SpecDoc は URMS_MasterSpec の命名規則に従っているか？

---

## 💻 TypeScript 実装

### 2. ディレクトリ構成作成

```
Source/src/subsystems/[manager-name]/
├─ index.ts                    # 公開インターフェース
├─ [Manager]Manager.ts         # メインクラス
├─ types.ts                    # 型定義
├─ hooks/
│  └─ use[Manager].ts          # カスタムフック
├─ components/
│  └─ [Manager]Card.tsx        # ダッシュボードカード
└─ __tests__/
   ├─ [Manager]Manager.test.ts
   └─ components.test.tsx
```

### 3. Manager クラス実装

- [ ] BaseManager を継承
- [ ] コンストラクタで Log/Progress Manager を受け取り
- [ ] `onInitialize()` メソッド実装
- [ ] `onShutdown()` メソッド実装
- [ ] メインビジネスロジック実装
- [ ] `executeTask()` でタスク管理を統合
- [ ] `getDashboardCard()` で Dashboard カード提供
- [ ] TypeScript 型安全性確認（tsconfig strict mode）

**ファイル例**:
```ts
// Source/src/subsystems/asset/AssetManager.ts
import { BaseManager } from '@core/base'
import type { ILogManager } from '@core/log'
import type { IProgressManager } from '@core/progress'

export class AssetManager extends BaseManager {
  constructor(logMgr: ILogManager, progressMgr: IProgressManager) {
    super('AssetManager', logMgr, progressMgr)
  }

  protected async onInitialize(): Promise<void> {
    // 初期化ロジック
  }

  protected async onShutdown(): Promise<void> {
    // シャットダウンロジック
  }

  // ビジネスロジックメソッド...
}
```

### 4. Dashboard カード実装

- [ ] `[Manager]Card.tsx` コンポーネント作成
- [ ] Future Mode UI 適用（3D・ネオン・パララックス）
- [ ] リアルタイム更新対応（Sparkline など）
- [ ] 異常時の色変更・アニメーション実装

### 5. useManager フック実装

- [ ] `use[Manager].ts` 作成
- [ ] Manager インスタンス管理
- [ ] データ取得ロジック
- [ ] エラーハンドリング

```ts
// Source/src/subsystems/asset/hooks/useAsset.ts
export function useAsset() {
  const [manager] = useState(() => new AssetManager(logMgr, progressMgr))
  const [data, setData] = useState<AssetData[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    manager.getData()
      .then(setData)
      .catch(err => setError(err.message))
  }, [])

  return { data, error, manager }
}
```

### 6. index.ts で公開インターフェース定義

```ts
// Source/src/subsystems/asset/index.ts
export { AssetManager } from './AssetManager'
export type { AssetData } from './types'
export { useAsset } from './hooks/useAsset'
export { AssetCard } from './components/AssetCard'
```

**チェックポイント**: TypeScript strict mode でコンパイルエラーがない？

---

## 🦀 Rust 実装

### 7. Rust ディレクトリ構成作成

```
Backend/src-tauri/src/subsystems/[manager-name]/
├─ mod.rs                    # モジュール定義
├─ [manager]_manager.rs      # メイン実装
├─ types.rs                  # 型定義
├─ commands.rs               # Tauri コマンド
└─ utils.rs                  # ユーティリティ関数
```

### 8. Rust 型定義実装

- [ ] `types.rs` に Main Data Struct を定義
- [ ] serde で JSON シリアライズ対応
- [ ] バリデーションロジック追加

```rust
// Backend/src-tauri/src/subsystems/asset/types.rs
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AssetData {
    pub id: String,
    pub name: String,
    pub status: String,
    #[serde(rename = "createdAt")]
    pub created_at: String,
}
```

### 9. Manager 実装（Rust）

- [ ] `[manager]_manager.rs` で business logic 実装
- [ ] エラーハンドリング（URMSError 使用）
- [ ] ログ出力（log::info!/warn!/error! マクロ）

```rust
// Backend/src-tauri/src/subsystems/asset/asset_manager.rs
use crate::error::Result;

pub struct AssetManager;

impl AssetManager {
    pub async fn get_data() -> Result<Vec<AssetData>> {
        // ビジネスロジック
        Ok(vec![])
    }
}
```

### 10. Tauri コマンド定義

- [ ] `commands.rs` に `#[command]` マクロで定義
- [ ] コマンド名は snake_case（例: `asset_manager_get_data`）
- [ ] エラー返却：`Result<T, String>`

```rust
// Backend/src-tauri/src/subsystems/asset/commands.rs
use tauri::command;
use crate::subsystems::asset::{AssetManager, AssetData};

#[command]
pub async fn asset_manager_get_data() -> Result<Vec<AssetData>, String> {
    AssetManager::get_data()
        .await
        .map_err(|e| e.to_string())
}
```

### 11. mod.rs で公開

```rust
// Backend/src-tauri/src/subsystems/asset/mod.rs
pub mod asset_manager;
pub mod types;
pub mod commands;

pub use asset_manager::AssetManager;
pub use types::AssetData;
pub use commands::*;
```

### 12. src/lib.rs へ登録

```rust
// Backend/src-tauri/src/lib.rs
pub mod subsystems;

// invoke で呼び出し可能にする
#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            subsystems::asset::commands::asset_manager_get_data,
            // ... 他のコマンド
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

**チェックポイント**: `cargo check` でコンパイルエラーがない？

---

## 🔗 連携実装

### 13. Dashboard への登録

- [ ] App.tsx で Manager インスタンス生成
- [ ] Dashboard Manager に `registerCard()` で登録
- [ ] カード更新周期を設定

```tsx
// Source/src/App.tsx
const assetManager = new AssetManager(logMgr, progressMgr)

useEffect(() => {
  const card = await assetManager.getDashboardCard()
  await dashboardManager.registerCard(card)
}, [])
```

### 14. Log/Progress 連携確認

- [ ] Manager が executeTask() で Log/Progress を通知
- [ ] ログレベル（INFO/WARN/ERROR）を正しく使い分け
- [ ] 進捗更新が適切なタイミング

**チェックポイント**: Log Manager に正しくログが出力される？

---

## 🧪 テスト実装

### 15. ユニットテスト作成

- [ ] `__tests__/[Manager]Manager.test.ts` 作成
- [ ] 初期化テスト
- [ ] メインロジックテスト
- [ ] エラーハンドリングテスト
- [ ] Log/Progress 統合テスト

```ts
// Source/src/subsystems/asset/__tests__/AssetManager.test.ts
describe('AssetManager', () => {
  it('should initialize successfully', async () => {
    const manager = new AssetManager(mockLogMgr, mockProgressMgr)
    await manager.initialize()
    expect(manager.isInitialized()).toBe(true)
  })
})
```

### 16. 統合テスト

- [ ] Tauri コマンド呼び出しテスト
- [ ] React コンポーネント + Manager 統合テスト
- [ ] Dashboard インテグレーション

### 17. テストカバレッジ確認

- [ ] 最低 80% のカバレッジを目指す
- [ ] `npm run test:coverage` 実行

**チェックポイント**: テストがすべて PASS？

---

## 📋 ドキュメント整備

### 18. SpecDoc の最終確認

- [ ] すべてのセクション完成
- [ ] 型定義が実装と一致
- [ ] Rust コマンド名が実装と一致
- [ ] SpecDoc MASTER.md に新規 Manager を記載

### 19. README 更新

- [ ] README ロードマップに新規 Manager を記載
- [ ] 設定手順がある場合は記載

### 20. コード内ドキュメント

- [ ] JSDoc/RustDoc で主要メソッドをドキュメント化
- [ ] 複雑なロジックにはコメント追加

---

## 🔍 コード品質チェック

### 21. Linting & Formatting

- [ ] `npm run lint` エラーなし
- [ ] `npm run format` で整形完了
- [ ] Rust: `cargo clippy` 警告なし
- [ ] Rust: `cargo fmt` で整形完了

### 22. TypeScript 型安全性

- [ ] `npm run type-check` エラーなし
- [ ] strict モード対応

### 23. Rust コンパイル

- [ ] `cargo check` 成功
- [ ] テスト: `cargo test` 成功

---

## 🚀 統合テスト（End-to-End）

### 24. 手動テスト実行

- [ ] 開発サーバー起動：`npm run tauri dev`
- [ ] Manager が初期化される
- [ ] Dashboard にカードが表示される
- [ ] Rust コマンド実行が成功する
- [ ] Log/Progress が表示される
- [ ] エラーハンドリングが機能する

### 25. パフォーマンステスト

- [ ] SpecDoc で定義した要件を満たす
- [ ] メモリリークがない
- [ ] UI が スムーズ（FPS 60 以上）

---

## 🎯 Git & PR

### 26. Git コミット

```bash
git checkout -b feature/add-[manager-name]-manager
git add .
git commit -m "feat: Add [Manager] Manager

- Implemented [Manager]Manager class
- Added Tauri commands
- Created Dashboard card
- 100% test coverage
- Updated SpecDoc
"
```

### 27. Pull Request

- [ ] PR タイトル明確
- [ ] PR 説明に以下を含む：
  - [ ] 背景（Why）
  - [ ] 実装内容（What）
  - [ ] テスト結果（How tested）
  - [ ] 関連 Issue リンク
- [ ] CI/CD パス
- [ ] コードレビュー完了

---

## ✅ 最終チェック

### デプロイ前確認

- [ ] すべてのテスト PASS
- [ ] ドキュメント完成
- [ ] コードレビュー承認
- [ ] ロードマップに記載完了
- [ ] CHANGELOG 更新
- [ ] Version bump 実施

---

## 📊 完成度チェック

```
Manager 追加完成度チェック
├─ SpecDoc               [█████] 100%
├─ TypeScript 実装        [█████] 100%
├─ Rust 実装             [█████] 100%
├─ テスト                [█████] 100%
├─ ドキュメント          [█████] 100%
├─ コード品質            [█████] 100%
├─ パフォーマンス        [█████] 100%
└─ Git & PR              [█████] 100%

✅ 本 Manager は本番環境へのデプロイ準備完了
```

---

## 参考資料

- 📘 [URMS_MasterSpec.md](../../SpecDoc/master/URMS_MasterSpec.md)
- 📘 [SPECDOC_TEMPLATE.md](../../SpecDoc/SPECDOC_TEMPLATE.md)
- 📘 [BaseManager.ts](../../Source/src/core/base/BaseManager.ts)
- 📘 [Manager Types](../../Source/src/core/types/ManagerTypes.ts)

---

**このチェックリストを完了することで、URMS の品質・一貫性・保守性が確保されます。**
