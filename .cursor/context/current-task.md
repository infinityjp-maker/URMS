# 現在タスク

> **resource_type:** context  
> **resource_id:** context:current-task  
> **owner:** PM のみ更新

## Task

**v1.1.0 GA リリース完了 → 次 Sprint 待ち**

Vision Track · ADR-024 · S16 · k6 CI を反映した v1.1.0 をタグ付け。次テーマは PM / User が backlog から選定。

## 進捗

| 項目 | 状態 |
|------|------|
| k6 smoke CI · ADR-024 accepted | ✅ |
| **v1.1.0 バージョン SSOT** | ✅ **2026-07-08** |
| **Git tag `v1.1.0`** | ✅ |
| Desktop Playwright 5/5 | ✅ |

## 直近の変更

- `URMS_APP_VERSION` / `URMS_CORE_VERSION` — `@urms/shared` 正本
- リリースノート — [v1.1.0.md](../../docs/project/releases/v1.1.0.md)
- roadmap — Phase 5 完了

## 次 Sprint 候補（PM · 未承認）

| 優先 | 候補 | 備考 |
|------|------|------|
| P1 | Cursor 双方向同期 | S16 v1.x |
| P2 | WCAG 改善 | S13 残課題 |
| P2 | v1.2 計画 | Phase 6 未定 |

## User

- 本番窓: http://127.0.0.1:1420/
- リリース: `git tag -l v1.1.0` · `/health` → version 1.1.0

## 運用

- **進捗報告 SSOT:** [progress-report.md](./progress-report.md)
- **リリース正本:** [v1.1.0.md](../../docs/project/releases/v1.1.0.md)
