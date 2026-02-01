# Progress Manager – Specification Document  
### URMS / 資産統合管理システム  
### Version: v3.3.2

Progress Manager は URMS のすべての処理の進捗を一元管理するコンポーネントであり、  
ユーザーに「何がどれだけ進んでいるか」を明確に伝える役割を持つ。

---

# 1. 目的（Purpose）

- 全 Manager の進捗を統合管理  
- Dashboard にリアルタイムで進捗を表示  
- 残り時間・速度・ステータスを可視化  
- 事故ゼロのための「処理の透明性」を提供

---

# 2. 責務（Responsibilities）

### ✔ 進捗タスクの登録  
各 Manager から進捗タスクを受け取る。

### ✔ 進捗の更新  
percentage / elapsed / remaining を更新。

### ✔ 完了・エラー処理  
- success  
- error  
- retry（任意）

### ✔ Dashboard への提供  
進捗中タスクを一覧で返す。

---

# 3. データ構造（Data Structure）

```ts
interface ProgressTask {
  taskId: string
  title: string
  percentage: number
  elapsedTime: number
  remainingTime: number
  status: "running" | "success" | "error"
}
```

---

# 4. Rust コマンド（Tauri Commands）

| コマンド名 | 説明 |
|------------|------|
| `progress_manager_start` | タスク開始 |
| `progress_manager_update` | 進捗更新 |
| `progress_manager_finish` | 完了 |
| `progress_manager_error` | エラー |
| `progress_manager_list` | 進捗一覧取得 |

---

# 5. UI 連携（Dashboard）

Dashboard の Progress Center に以下を提供：

- 進捗バー  
- 残り時間  
- ステータス  
- エラー時の強調  

---

# 6. エラー処理

- Rust 側で例外を握りつぶさない  
- ERROR 状態は Dashboard に即時反映  
- Log Manager に記録  

---

# 7. 将来拡張

- 進捗履歴の保存  
- AI による処理時間予測  
- マルチタスクのグルーピング  
