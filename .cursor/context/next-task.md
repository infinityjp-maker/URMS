# 次タスク

> **resource_type:** context  
> **resource_id:** context:next-task  
> **owner:** PM のみ更新

## User 決定（記録）

| 日付 | 判断 |
|------|------|
| 2026-07-05 | **Phase 4 Go** — S11 着手 |
| 2026-07-05 | **IdP 不要** — ローカルアプリ · ADR-022 |
| 2026-07-05 | **ログイン画面不要** — 起動後すぐ操作 |

## 候補一覧

| 優先 | タスク | 担当 | 備考 |
|------|--------|------|------|
| 1 | **S12 監視 · ログ集約** | Developer | 進行中 |
| 2 | S13 性能 · セキュリティ監査 | Developer | v0.3.0 目標 |
| 3 | Docker 環境支援（任意） | Developer | User 任意 |

## Phase 4 Sprint

| Sprint | 内容 | Version | 状態 |
|--------|------|---------|------|
| S11 | ローカル単一ユーザー（ログイン UI なし） | v0.3.0-alpha | 実装済 · 未タグ |
| S12 | 監視 · ログ集約 | v0.3.0-beta | 進行中 |
| S13 | 性能 · セキュリティ監査 | v0.3.0 | 未着手 |

## 参照

- [ADR-022-local-authentication.md](../../docs/project/decisions/ADR-022-local-authentication.md)
- [10-phase4-readiness.md](../../docs/implementation/10-phase4-readiness.md)
