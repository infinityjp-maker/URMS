# 現在タスク

> **resource_type:** context  
> **resource_id:** context:current-task  
> **owner:** PM のみ更新

## Task

**Vision Track VT-4 — 日次ループ（窓 → 行動 → Context 更新）**

VT-1 SSOT（schedule · location）接続済み。窓から `完了 → 次へ` で Context を更新し、日次ループの 1 サイクルを閉じる段階。

## 進捗

| 項目 | 状態 |
|------|------|
| エンジニアリング（Sprint 20/20） | ✅ 参考値 |
| VT-1 SSOT 重力 | 🔄 ~完了 |
| VT-4 日次ループ | 🔄 着手（advance-task） |
| VT-2 Context 脳 | ⏳ |
| VT-3 知覚膜 | ⏳ |

## 直近の変更

- `POST /v1/context/advance-task` — operate Mode から current_task 完了 · 繰り上げ
- 窓 UI — タスクカードに「完了 → 次へ」ボタン（API+DB 時）

## User

API+DB 起動 · `pnpm ssot:sync` 後、窓で「完了 → 次へ」を試せます。
