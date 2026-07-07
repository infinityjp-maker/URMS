# 現在タスク

> **resource_type:** context  
> **resource_id:** context:current-task  
> **owner:** PM のみ更新

## Task

**Cursor 双方向同期 v1（export）完了 → 次 Sprint 待ち**

`POST /v1/integrations/cursor-local/export` — DB Resource.name を正本 Markdown H1 に書戻し。

## 進捗

| 項目 | 状態 |
|------|------|
| v1.1.0 GA | ✅ |
| **Cursor export（AI Team H1）** | ✅ **2026-07-08** |
| sync（ファイル → Resource） | ✅ 既存 |

## 直近の変更

- `AiTeamExportService` · IntegrationRegistry.export · API + Web/Desktop UI
- develop Mode — 「書戻し」ボタン

## 次 Sprint 候補（PM · 未承認）

| 優先 | 候補 | 備考 |
|------|------|------|
| P1 | export 拡張（本文 · Context SSOT） | v1.2 |
| P2 | WCAG 改善 | S13 残課題 |

## User

- develop Mode + `/develop/integrations` または 1420 DevelopPanel — **書戻し**

## 運用

- **S16 正本:** [15-phase5-s16-external-integration.md](../../docs/implementation/15-phase5-s16-external-integration.md)
