# Dashboard Manager – Specification Document  
### URMS / 資産統合管理システム  
### Version: v3.3.2

Dashboard Manager は URMS の中心となる UI レイヤーであり、  
すべての Manager の状態を統合し、  
未来的で美しく、合理的で、事故ゼロの運用を実現するための  
**メインダッシュボード画面**を構成する。

本書は Dashboard Manager の責務・UI構成・データ構造・連携仕様を定義する。

---

# 1. 目的（Purpose）

Dashboard Manager の目的は以下の通り。

- URMS 全体の状態を **1 画面で俯瞰できる UI** を提供する  
- 各 Manager の情報を **カード形式で統合表示**する  
- 進捗・ログ・異常を **リアルタイムで可視化**する  
- Future Mode を基準とした **未来的 UI/UX** を実現する  
- 事故ゼロのための **異常強調・通知機能** を提供する

---

# 2. 責務（Responsibilities）

Dashboard Manager の責務は以下に限定される。

### ✔ カードの管理
- 各 Manager が提供するカードを受け取り、画面に配置する  
- カードの順序・レイアウト・表示状態を管理する  
- Future Mode / Dark / Light のテーマに応じて UI を切り替える

### ✔ 状態の統合
- System / Asset / File / Network / IoT / Schedule など  
  各 Manager の状態を集約して表示する

### ✔ 異常の可視化
- WARN / ERROR 状態のカードを強調表示  
- 通知パネルに異常を追加  
- Log Manager と連携して詳細を表示

### ✔ Progress Manager との連携
- 進捗中のタスクをダッシュボードに表示  
- 進捗バー・残り時間・ステータスを表示

### ✔ UI レイアウトの管理
- Future Mode の 3D / ネオン / パララックス効果を適用  
- カードのレスポンシブ配置  
- フルスクリーン表示の最適化

---

# 3. UI 構成（UI Structure）

Dashboard は以下のカード群で構成される。

## 3.1 Core Cards（必須）
| カード名 | 説明 |
|---------|------|
| System Status | CPU / RAM / Disk / Network の状態 |
| Network Status | LAN / Ping / デバイス数 |
| Progress Center | 進捗中タスクの一覧 |
| Log Center | 最新ログ 5 件 |
| Quick Actions | よく使う操作（LAN 再スキャン等） |
| Today’s Schedule | 今日の予定 |

---

## 3.2 Subsystem Cards（Manager 追加時に増える）
| Manager | カード例 |
|---------|----------|
| Asset Manager | デバイス数 / 資産状態 |
| File Manager | 移動ファイル数 / 自動分類結果 |
| Network Manager | デバイス一覧 / Ping 状態 |
| IoT Manager | IoT デバイス状態 |
| Schedule Manager | 予定一覧 |
| Finance Manager（v4〜） | 支出 / サブスク / 異常検知 |

---

# 4. カードの UI ガイドライン（Future Mode 基準）

Dashboard の UI は **Future Mode を基準**とする。

## 4.1 カードデザイン
- 3D 浮遊カード（Floating Holographic Card）  
- ネオンエッジ（青系）  
- 半透明パネル（Glass/Holo）  
- HUD グリッド背景  
- パララックス効果（マウス追従）  
- アニメーション Sparkline（リアルタイム更新）

## 4.2 異常時の表示
- WARN → 黄色発光  
- ERROR → 赤色発光 + 軽い振動  
- 通知パネルに自動追加  
- Log Manager へ記録

---

# 5. データ構造（Data Structure）

Dashboard Manager は各 Manager から以下の形式でデータを受け取る。

## 5.1 カード定義
```ts
interface DashboardCard {
  id: string
  title: string
  manager: string
  status: "normal" | "warn" | "error"
  content: DashboardContent[]
  actions?: DashboardAction[]
}
```

## 5.2 コンテンツ定義
```ts
interface DashboardContent {
  label: string
  value: string | number
  graph?: number[] // sparkline
}
```

## 5.3 アクション定義
```ts
interface DashboardAction {
  id: string
  label: string
  command: string // Rust コマンド名
}
```

---

# 6. Rust 連携（Tauri Commands）

Dashboard Manager は直接 Rust 処理を持たない。  
すべてのデータは **各 Manager の Rust コマンド**から取得する。

例：
- `system_manager_get_status`
- `network_manager_scan`
- `file_manager_get_stats`
- `asset_manager_get_devices`

Dashboard Manager は **Rust コマンドを呼び出すだけ**で、  
処理ロジックは Manager 側に委譲する。

---

# 7. Progress Manager との連携

Dashboard は進捗中タスクを表示する。

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

表示内容：
- 進捗バー  
- 残り時間  
- ステータス  
- エラー時の強調表示  

---

# 8. Log Manager との連携

Dashboard の Log Center は最新ログ 5 件を表示する。

ログ形式：
```ts
interface LogEntry {
  timestamp: string
  level: "INFO" | "WARN" | "ERROR"
  manager: string
  message: string
}
```

---

# 9. エラー処理（Error Handling）

Dashboard Manager は以下を徹底する。

- Rust 側のエラーは UI に明確に表示  
- WARN / ERROR はカードを強調  
- Log Manager に必ず記録  
- Progress Manager にエラー状態を反映  
- UI 側で例外を握りつぶさない

---

# 10. 将来拡張（Future Enhancements）

- カードのドラッグ＆ドロップ配置  
- カスタムカード（ユーザー定義）  
- AI による異常予測  
- カードの自動レイアウト最適化  
- マルチディスプレイ対応  
- 3D アニメーション強化（WebGL）

---

# ✔ 本 SpecDoc は URMS_MasterSpec に従う  
Dashboard Manager の実装は、  
**URMS_MasterSpec.md の思想・命名規則・責務分離**に従うこと。

