# Log Manager – Specification Document  
### URMS / 資産統合管理システム  
### Version: v3.3.2

Log Manager は URMS 全体のログを一元管理する中枢コンポーネントであり、  
すべての Manager のログを統合し、  
事故ゼロ運用のための「記録・可視化・分析」を担う。

---

# 1. 目的（Purpose）

- 全 Manager のログを一元管理する  
- 異常・警告を即座に可視化する  
- Dashboard と連携し、最新ログを表示する  
- 監査・トラブルシューティングを容易にする  
- 事故ゼロのための記録基盤を提供する

---

# 2. 責務（Responsibilities）

### ✔ ログの受信  
各 Manager から送られるログを受け取る。

### ✔ ログの分類  
- INFO  
- WARN  
- ERROR  

### ✔ ログの保存  
- メモリ保存（最新 500 件）  
- 永続保存（オプション）

### ✔ Dashboard への提供  
- 最新ログ 5 件を返す  
- WARN / ERROR を強調

### ✔ 検索・フィルタリング  
- Manager 別  
- レベル別  
- 日付別

---

# 3. データ構造（Data Structure）

```ts
interface LogEntry {
  id: string
  timestamp: string
  level: "INFO" | "WARN" | "ERROR"
  manager: string
  message: string
  metadata?: Record<string, any>
}
```

---

# 4. Rust コマンド（Tauri Commands）

| コマンド名 | 説明 |
|------------|------|
| `log_manager_add` | ログ追加 |
| `log_manager_get_recent` | 最新ログ取得 |
| `log_manager_search` | 条件検索 |

---

# 5. UI 連携（Dashboard）

Dashboard の Log Center に以下を提供：

- 最新ログ 5 件  
- WARN / ERROR の強調  
- 詳細表示へのリンク  

---

# 6. エラー処理

- Rust 側で例外を握りつぶさない  
- ERROR ログは必ず記録  
- Dashboard に即時反映  

---

# 7. 将来拡張

- 永続ログ DB  
- AI による異常検知  
- ログ相関分析  
