# 現在タスク

> **resource_type:** context  
> **resource_id:** context:current-task  
> **owner:** PM のみ更新

## Task

**Vision Track VT-2 + VT-4 — Context 合成 · 日次ループ**

SSOT（schedule · location · loop journal）と advance-task 接続済み。Context 脳が時間 · 予定 · 天気 · タスクから「今」を合成し、ループ完了が project_status と journal.md に残る段階。

## 進捗

| 項目 | 状態 |
|------|------|
| VT-1 SSOT 重力 | ✅ ~完了 |
| VT-2 Context 脳（合成 narrative） | 🔄 着手（関係グラフ信号） |
| VT-4 日次ループ | 🔄 部分（journal 読取 · 翌日 narrative 完了） |
| VT-3 知覚膜 | ⏳ |

## 直近の変更

- `synthesizeSummaryNote` — 予定 · タスク · 天気から summary.note を合成
- loop journal 読取 — 昨日 / 今日のループを summary · aiMemo に合成
- VT-2 — Resource 関係件数を summary · meta.sources.relations に反映
- API dev — ルート `.env` 自動読込（`DATABASE_URL`）
- perception meta — `loopContinuity` · `loopJournalEntries` · `relations`

## User

`pnpm ssot:sync` · API+DB 起動後、窓で「完了 → 次へ」→ ステータス行 · まとめが変わる · journal.md に 1 行追記 · 接続カードにソース表示。
