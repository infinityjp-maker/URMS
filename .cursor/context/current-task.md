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
| VT-2 Context 脳（合成 narrative） | 🔄 進行（地点 SSOT · 関係タイプ内訳 · 予定相対時間） |
| VT-4 日次ループ | 🔄 進行（journal 読取 · 翌日 narrative · **次タスク反映**） |
| VT-3 知覚膜 | ⏳ |

## 直近の変更

- `synthesizeSummaryNote` — 予定 · タスク · 天気から summary.note を合成
- loop journal 読取 — 昨日 / 今日のループを summary · aiMemo に合成
- VT-2 — **地点 SSOT 名称**を summary · meta.sources.location に反映
- VT-2 — Resource 関係件数 + **relationType 内訳**を summary · meta.sources.relationTypes に反映
- VT-2 — 次予定の **あと Xm** を aiMemo に合成（schedule note）
- VT-4 — loop journal の **次タスク**を continuity narrative に反映
- API dev — ルート `.env` 自動読込（`DATABASE_URL`）
- perception meta — `loopContinuity` · `loopJournalEntries` · `relations`

## User

`pnpm ssot:sync` · API+DB 起動後、窓で「完了 → 次へ」→ ステータス行 · まとめが変わる · journal.md に 1 行追記 · 接続カードにソース表示。
