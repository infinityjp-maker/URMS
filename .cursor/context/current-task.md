# 現在タスク

> **resource_type:** context  
> **resource_id:** context:current-task  
> **owner:** PM のみ更新

## Task

**S13 k6 CI · ADR-024 accepted 完了 → 次 Sprint 待ち**

k6 スモーク CI と Desktop 白画面再発防止テストを追加。ADR-024 を accepted に更新。

## 進捗

| 項目 | 状態 |
|------|------|
| S16 Desktop develop Mode | ✅ |
| 白画面修正（shared/domain barrel） | ✅ |
| **k6 負荷テスト CI** | ✅ **2026-07-08** |
| **ADR-024 accepted** | ✅ **2026-07-08** |
| Desktop Playwright 5/5 | ✅ |

## 直近の変更

- k6 — `scripts/perf/k6-smoke.js` · CI `perf-k6` job · `pnpm perf:k6`
- Desktop — `browser-imports.test.ts`（barrel import 禁止）
- ADR-024 status → accepted

## 次 Sprint 候補（PM · 未承認）

| 優先 | 候補 | 備考 |
|------|------|------|
| P1 | v1.0.0 GA タグ | PM · User 承認後 |
| P2 | Cursor 双方向同期 | S16 v1.x |
| P2 | WCAG 改善 | S13 残課題 |

## User

- 本番窓: http://127.0.0.1:1420/
- k6 ローカル: `pnpm perf:k6`（k6 CLI + API 起動要）

## 運用

- **進捗報告 SSOT:** [progress-report.md](./progress-report.md)
- **S13 正本:** [12-phase4-s13-security-audit.md](../../docs/implementation/12-phase4-s13-security-audit.md)
- **ADR-024:** [ADR-024-loop-journal-resource.md](../../docs/project/decisions/ADR-024-loop-journal-resource.md)
