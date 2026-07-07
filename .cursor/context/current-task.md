# 現在タスク

> **resource_type:** context  
> **resource_id:** context:current-task  
> **owner:** PM のみ更新

## Task

**S16 Desktop develop Mode 完了 → 次 Sprint 待ち**

本番窓（1420）で Mode 切替 · develop 時 Integrations パネルを実装。次テーマは PM / User が backlog から選定。

## 進捗

| 項目 | 状態 |
|------|------|
| ADR-024 M1–M4 + relates_to | ✅ |
| B-020 develop Mode（Web） | ✅ |
| S13 再監査（2026-07-08） | ✅ |
| dev オフライン修正 | ✅ |
| **S16 Desktop develop Mode** | ✅ **2026-07-08** |

## 直近の変更

- **Desktop develop Mode** — ModeProvider · ヘッダー切替 · DevelopPanel（cursor-local）
- dev オフライン修正 — domain export · desktop proxy

## 次 Sprint 候補（PM · 未承認）

| 優先 | 候補 | 備考 |
|------|------|------|
| P1 | v1.0.0 GA タグ · ADR-024 accepted | PM 承認後 |
| P2 | k6 負荷テスト CI | S13 残課題 |
| P2 | Cursor 双方向同期 | S16 v1.x |
| P2 | Phase 5 残バックログ | roadmap 参照 |

## User

- develop Mode 表示: API `.env` に `URMS_FF_DEVELOP_ENABLED=true` · API 再起動
- 本番窓: http://127.0.0.1:1420/ — ヘッダーで Mode 切替 · develop 時サイドに連携パネル

## 運用

- **進捗報告 SSOT:** [progress-report.md](./progress-report.md)
- **S16 正本:** [15-phase5-s16-external-integration.md](../../docs/implementation/15-phase5-s16-external-integration.md)
- **モデル選定:** [model-policy.md](./model-policy.md)
