# SpecDoc テンプレート – Manager 仕様書作成ガイド

このテンプレートをコピーして、新規 Manager の SpecDoc を作成してください。

---

# [Subsystem] Manager – Specification Document  
### URMS / 資産統合管理システム  
### Version: v4.0.0

[Subsystem] Manager は [概要を2-3行で記述] を担当するコンポーネントである。

本書は [Subsystem] Manager の責務・UI構成・データ構造・Rust 連携仕様を定義する。

---

## 1. 目的（Purpose）

[Subsystem] Manager の目的は以下の通り。

- [目的1]  
- [目的2]  
- [目的3]

---

## 2. 責務（Responsibilities）

[Subsystem] Manager の責務は以下に限定される。

### ✔ [責務1]  
[詳細説明]

### ✔ [責務2]  
[詳細説明]

### ✔ [責務3]  
[詳細説明]

---

## 3. 入出力（Input/Output）

### 3.1 入力（Input）

| 項目 | 型 | 説明 |
|------|-----|------|
| [項目1] | [型] | [説明] |
| [項目2] | [型] | [説明] |

### 3.2 出力（Output）

| 項目 | 型 | 説明 |
|------|-----|------|
| [項目1] | [型] | [説明] |
| [項目2] | [型] | [説明] |

---

## 4. データ構造（Data Structure）

### 4.1 メインデータ型

```ts
interface [Subsystem]Data {
  id: string
  name: string
  status: 'normal' | 'warn' | 'error'
  createdAt: string
  updatedAt: string
  [customField]: [type]
}
```

### 4.2 レスポンス型

```ts
interface [Subsystem]Response {
  success: boolean
  data?: [Subsystem]Data[]
  error?: string
}
```

---

## 5. Dashboard 連携（UI）

### 5.1 カード定義

**カード名**: [Subsystem] Status Card

**表示内容**:
| 項目 | 表示形式 |
|------|---------|
| [項目1] | [数値] |
| [項目2] | [グラフ] |
| [状態] | [アイコン + 色] |

**カード例**:
```
┌─────────────────────────────┐
│ [Subsystem] Status          │
├─────────────────────────────┤
│ Item Count:        42       │
│ Status:            ✓ Normal │
│ Last Updated:      14:32    │
│ [Sparkline Chart]           │
└─────────────────────────────┘
```

### 5.2 アクション定義

| アクション | コマンド | 説明 |
|----------|---------|------|
| [アクション1] | `[subsystem]_manager_[action]` | [説明] |
| [アクション2] | `[subsystem]_manager_[action]` | [説明] |

---

## 6. Rust コマンド（Tauri Commands）

### 6.1 コマンド一覧

| コマンド名 | パラメータ | 戻り値 | 説明 |
|-----------|----------|--------|------|
| `[subsystem]_manager_get_data` | - | `[Subsystem]Data[]` | データ取得 |
| `[subsystem]_manager_process` | `data: [Subsystem]Data` | `Result<void>` | データ処理 |
| `[subsystem]_manager_validate` | `data: [Subsystem]Data` | `Result<boolean>` | バリデーション |

### 6.2 実装例（Rust）

```rust
#[command]
pub async fn [subsystem]_manager_get_data() -> Result<Vec<[Subsystem]Data>, String> {
    [Subsystem]Manager::get_data()
        .await
        .map_err(|e| e.to_string())
}

#[command]
pub async fn [subsystem]_manager_process(
    data: [Subsystem]Data,
) -> Result<(), String> {
    [Subsystem]Manager::process_data(data)
        .await
        .map_err(|e| e.to_string())
}
```

---

## 7. Log/Progress 連携

### 7.1 Log Manager 連携

[Subsystem] Manager は以下を Log Manager に送信する：

- 処理開始時：`INFO` レベル  
  例: `"Data processing started for [Subsystem]"`

- 処理完了時：`INFO` レベル  
  例: `"Data processing completed: 42 items"`

- 異常時：`WARN` / `ERROR` レベル  
  例: `"Failed to validate data: Invalid format"`

### 7.2 Progress Manager 連携

- `startTask(title)` で処理開始
- `updateProgress(taskId, percentage)` で進捗更新
- `completeTask(taskId)` で完了報告
- `errorTask(taskId, errorMessage)` でエラー報告

**例**:
```ts
const taskId = await progressManager.startTask('Processing [Subsystem]', 5000)
await progressManager.updateProgress(taskId, 50)
await progressManager.completeTask(taskId)
```

---

## 8. エラー処理（Error Handling）

### 8.1 エラーケース

| エラータイプ | 例 | 対応 |
|-----------|-----|------|
| バリデーション失敗 | 無効なデータ形式 | `ERROR` ログ + UI通知 |
| リソース not found | ファイル/デバイスなし | `WARN` ログ + 再試行 |
| タイムアウト | 処理時間超過 | `ERROR` ログ + タイムアウト表示 |
| 権限不足 | 操作不可 | `ERROR` ログ + UI制御 |

### 8.2 エラーハンドリング方針

- Rust 側で例外を握りつぶさない（常に Result を返す）
- UI 側で `Result<T, String>` を使用
- Log Manager に必ず記録
- Progress Manager にエラー状態を反映
- ユーザーには分かりやすいメッセージを表示

---

## 9. 異常判定基準（Thresholds）

### 9.1 WARN 判定

| 項目 | 閾値 | 例 |
|------|-----|-----|
| [項目1] | [値] | [状況] |

### 9.2 ERROR 判定

| 項目 | 閾値 | 例 |
|------|-----|-----|
| [項目1] | [値] | [状況] |

---

## 10. パフォーマンス要件

| 項目 | 要件 |
|------|------|
| データ取得時間 | < 2秒 |
| データ処理時間（1件） | < 500ms |
| Dashboard カード更新間隔 | 5-10秒 |
| メモリ使用量上限 | < 100MB |

---

## 11. 依存関係（Dependencies）

### 11.1 外部依存

- [ライブラリ名] v[バージョン]: [用途]
- [ライブラリ名] v[バージョン]: [用途]

### 11.2 Manager 依存

- Log Manager  
- Progress Manager  
- [他の Manager] (必要に応じて)

---

## 12. テスト戦略（Testing Strategy）

### 12.1 ユニットテスト

```ts
// tests/[subsystem]-manager.test.ts

describe('[Subsystem]Manager', () => {
  it('should initialize successfully', async () => {
    const manager = new [Subsystem]Manager(logMgr, progressMgr)
    await manager.initialize()
    expect(manager.isInitialized()).toBe(true)
  })

  it('should fetch data correctly', async () => {
    const data = await manager.getData()
    expect(data).toBeInstanceOf(Array)
  })
})
```

### 12.2 統合テスト

- Rust + React 連携テスト
- Tauri コマンド呼び出しテスト
- Log/Progress 統合テスト

---

## 13. 将来拡張（Future Enhancements）

### v4.1 以降の拡張案

- [拡張1]: [概要]
- [拡張2]: [概要]
- [拡張3]: [概要]

---

## 14. 変更履歴（Change Log）

| バージョン | 日付 | 変更内容 |
|-----------|------|---------|
| v4.0.0 | YYYY-MM-DD | 初版 |

---

## ✔ コンプライアンスチェック

本 SpecDoc は以下に従う：

- ✓ [URMS_MasterSpec.md](../../master/URMS_MasterSpec.md) の思想・命名規則・責務分離
- ✓ BaseManager テンプレート
- ✓ ManagerTypes.ts の型定義
- ✓ エラーハンドリング統一規則
- ✓ Log/Progress 連携仕様

---

## 📝 SpecDoc 作成チェックリスト

新規 Manager を追加する際は、このチェックリストを確認してください：

- [ ] 目的と責務を明確に記述
- [ ] UI（Dashboard カード）を設計
- [ ] Rust コマンド一覧を記述
- [ ] エラーハンドリング方針を定義
- [ ] Log/Progress 連携を記述
- [ ] パフォーマンス要件を設定
- [ ] テスト戦略を記述
- [ ] 依存関係を確認
- [ ] URMS_MasterSpec との整合性を確認

---

**SpecDoc 作成支援**: このテンプレートを複製し、`[Subsystem]` と書かれた部分を実際の Manager 名に置き換えてください。
