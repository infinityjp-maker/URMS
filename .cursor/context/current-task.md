# 現在タスク

> **resource_type:** context  
> **resource_id:** context:current-task  
> **owner:** PM のみ更新

## Task

**v1.2.0 GA 完了 → 次 Sprint 待ち**

Cursor 双方向 export v1/v2 · dev 起動安定化を含むマイナーリリース。

## 進捗

| 項目 | 状態 |
|------|------|
| **v1.2.0 GA** | ✅ **2026-07-08** |
| Cursor export v1（AI Team H1） | ✅ |
| Cursor export v2（Context SSOT） | ✅ |
| dev:prepare プラグイン再ビルド | ✅ |

## 次 Sprint 候補（PM · 未承認）

| 優先 | 候補 | 備考 |
|------|------|------|
| P1 | export 拡張（本文 merge） | v1.3 |
| P2 | WCAG 改善 | S13 残課題 |

## User

- 本番窓: http://127.0.0.1:1420/ — develop Mode · 書戻し
- 起動: `scripts\launch\start-dev-servers.bat` または `corepack pnpm dev:prepare` 後に API

## 運用

- **リリースノート:** [v1.2.0.md](../../docs/project/releases/v1.2.0.md)
- **S16 正本:** [15-phase5-s16-external-integration.md](../../docs/implementation/15-phase5-s16-external-integration.md)
