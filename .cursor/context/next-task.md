# 次タスク

> **resource_type:** context  
> **resource_id:** context:next-task  
> **owner:** PM のみ更新

## User 決定（記録）

| 日付 | 判断 |
|------|------|
| 2026-07-05 | **IdP 不要** — ローカルアプリ · ADR-022 |

## 候補一覧

| 優先 | タスク | 担当 | 備考 |
|------|--------|------|------|
| 1 | **User Phase 4 Go/No-Go** | User | 唯一の未決判断 |
| 2 | S11 ローカル認証設計 | Architect | Go 後 |
| 3 | Docker 環境支援（任意） | Developer | User 任意 |

## Phase 4 Sprint（更新）

| Sprint | 内容 | Version |
|--------|------|---------|
| S11 | **ローカル認証**（IdP 不使用） | v0.3.0-alpha |
| S12 | 監視 · ログ集約 | v0.3.0-beta |
| S13 | 性能 · セキュリティ監査 | v0.3.0 |

## 参照

- [ADR-022-local-authentication.md](../../docs/project/decisions/ADR-022-local-authentication.md)
- [10-phase4-readiness.md](../../docs/implementation/10-phase4-readiness.md)
