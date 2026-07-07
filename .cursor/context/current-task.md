# 現在タスク

> **resource_type:** context  
> **resource_id:** context:current-task  
> **owner:** PM のみ更新

## Task

**ADR-024 完了（M1–M4 + relates_to）→ 次 Sprint 待ち**

loop-entry · journal export · Context リレーションまで実装済。次テーマは PM / User が backlog から選定。

## 進捗

| 項目 | 状態 |
|------|------|
| VT-1〜VT-4 Vision Track | ✅ クローズ（2026-07-08） |
| ADR-024 M1–M4 | ✅ |
| loop-entry → context relates_to | ✅ 2026-07-08 |

## 直近の変更

- **loop-entry relates_to** — advance 時 `loop-entry` → `context:current-task` · `relates_to` 型追加
- ADR-024 M4 — DB 正本 · journal export
- Vision Track クローズ

## 次 Sprint 候補（PM · 未承認）

| 優先 | 候補 | 備考 |
|------|------|------|
| P1 | develop Mode（B-020） | backlog |
| P2 | Phase 4 S13 続行 | project-status 参照 |
| P2 | ADR-024 status → accepted | PM 承認後 |
| P2 | loop-entry 既存データへの relation バックフィル | 任意 · loop:sync 後 |

## User

1420 窓 advance → loop-entry Resource + context リレーション · journal.md export。

## 運用

- **進捗報告 SSOT:** [progress-report.md](./progress-report.md)
- **モデル選定:** [model-policy.md](./model-policy.md)
- **使用率ログ:** [usage-log.md](./usage-log.md)
