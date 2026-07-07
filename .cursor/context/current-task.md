# 現在タスク

> **resource_type:** context  
> **resource_id:** context:current-task  
> **owner:** PM のみ更新

## Task

**Cursor 双方向 export v2（Context SSOT）完了 → 次 Sprint 待ち**

`POST /v1/integrations/cursor-local/export` — AI Team H1 + Context summary を `.cursor/context/` へ書戻し。

## 進捗

| 項目 | 状態 |
|------|------|
| v1.1.0 GA | ✅ |
| **Cursor export v1（AI Team H1）** | ✅ **2026-07-08** |
| **Cursor export v2（Context SSOT）** | ✅ **2026-07-08** |
| sync（ファイル → Resource） | ✅ 既存 |

## 直近の変更

- `ContextSsotExportService` · `CursorCombinedExportReport`（aiTeam + context）
- `.cursor/context/` — current-task · current-phase · project-status サマリ書戻し

## 次 Sprint 候補（PM · 未承認）

| 優先 | 候補 | 備考 |
|------|------|------|
| P1 | export 拡張（本文 merge） | v1.3 |
| P2 | WCAG 改善 | S13 残課題 |

## User

- develop Mode + `/develop/integrations` または 1420 DevelopPanel — **書戻し**

## 運用

- **S16 正本:** [15-phase5-s16-external-integration.md](../../docs/implementation/15-phase5-s16-external-integration.md)
