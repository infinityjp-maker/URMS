# 現在タスク

> **resource_type:** context  
> **resource_id:** context:current-task  
> **owner:** PM のみ更新

## Task

**B-020 develop Mode 完了 → 次 Sprint 待ち**

暫定 Web UI で develop 切替 · Integration sync ページ実装済。次テーマは PM / User が backlog から選定。

## 進捗

| 項目 | 状態 |
|------|------|
| ADR-024 M1–M4 + relates_to | ✅ |
| B-020 develop Mode | ✅ 2026-07-08 |

## 直近の変更

- **B-020** — Web ModeSwitcher が `GET /v1/modes` 連動 · `/develop/integrations` · `.env.example` に flag
- loop-entry relates_to · ADR-024 M4

## 次 Sprint 候補（PM · 未承認）

| 優先 | 候補 | 備考 |
|------|------|------|
| P1 | Phase 4 S13 続行 | security-audit チェックリスト |
| P2 | Desktop develop Mode 切替 | S16 残課題 |
| P2 | ADR-024 status → accepted | PM 承認後 |

## User

5173 暫定 Web UI → ヘッダ「開発」→ 連携ページで cursor-local sync。要 `URMS_FF_DEVELOP_ENABLED=true` + API 起動。

## 運用

- **進捗報告 SSOT:** [progress-report.md](./progress-report.md)
- **モデル選定:** [model-policy.md](./model-policy.md)
- **使用率ログ:** [usage-log.md](./usage-log.md)
