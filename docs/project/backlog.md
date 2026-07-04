# URMS バックログ

> **resource_type:** knowledge  
> **resource_id:** knowledge:backlog  
> **version:** 1.5  
> **owner:** PM

## 凡例

| 優先度 | 意味 |
|--------|------|
| Must | 次イテレーション必須 |
| Should | 重要だが延期可 |
| Could | 余力があれば |

| 状態 | 意味 |
|------|------|
| todo | 未着手 |
| doing | 進行中 |
| done | 完了 |
| blocked | ブロック中 |

---

## Must

| ID | タスク | 担当 | 状態 | 備考 |
|----|--------|------|------|------|
| B-001 | AI チーム v1.0 構築 | PM | done | Phase 0 |
| B-002 | 初回 Git コミット | PM | done | v0.1.0-ai-team |
| B-003 | Phase 1 要求定義 | PM + Architect | done | |
| B-004 | Phase 1 PM レビュー・承認 | PM + User | done | 2026-07-05 |
| B-005 | Phase 2 アーキテクチャ設計 | Architect | done | Architecture Freeze |
| B-006 | Phase 2 PM レビュー・承認 | PM + User | done | 2026-07-05 |
| B-006b | Phase 2.5 Implementation Contract | Architect | done | ADR-017 |
| B-006c | Phase 2.5 PM レビュー・承認 | PM + User | done | 2026-07-05 |
| B-006d | Phase 2.6 Developer Playbook | Architect + PM | done | ADR-017 補助 |
| B-006e | Phase 2.6 PM レビュー・Git コミット | PM + User | todo | 2.5+2.6 一括可 |
| B-007 | Phase 3 MVP 実装 | Developer | blocked | Phase 2.6 承認後 |

## Should

| ID | タスク | 担当 | 状態 | 備考 |
|----|--------|------|------|------|
| B-010 | IdP 具体選定（OIDC） | Architect | todo | Phase 3 開始前 Must |
| B-011 | OpenAPI 正本配置 | Developer | todo | Phase 3 |
| B-012 | Resource リレーション実装 | Developer | todo | MVP 外 |
| B-014 | AI Manager + Provider Plugin 実装 | Developer | todo | Phase 3、ADR-016 |

## Could

| ID | タスク | 担当 | 状態 | 備考 |
|----|--------|------|------|------|
| B-020 | develop Mode 実装 | Developer | todo | Phase 3+ |
| B-021 | pgvector 利用 | Architect | todo | Phase 4 |
| B-022 | Redis キャッシュ | Developer | todo | Phase 3+ |

---

## Phase 2 成果物（完了）

| # | 成果物 | パス |
|---|--------|------|
| 1 | アーキテクチャ索引 | [architecture/README.md](../architecture/README.md) |
| 2 | システム全体図 | [01-system-overview.md](../architecture/01-system-overview.md) |
| 3 | ディレクトリ構成 | [02-directory-structure.md](../architecture/02-directory-structure.md) |
| 4 | Monorepo | [03-monorepo.md](../architecture/03-monorepo.md) |
| 5 | API | [04-api-architecture.md](../architecture/04-api-architecture.md) |
| 6 | Database | [05-database-architecture.md](../architecture/05-database-architecture.md) |
| 7 | Context Engine | [06-context-engine.md](../architecture/06-context-engine.md) |
| 8 | Mode System | [07-mode-system.md](../architecture/07-mode-system.md) |
| 9 | Resource 管理 | [08-resource-management.md](../architecture/08-resource-management.md) |
| 10 | Plugin | [09-plugin-architecture.md](../architecture/09-plugin-architecture.md) |
| 11 | 認証・認可 | [10-auth-authorization.md](../architecture/10-auth-authorization.md) |
| 12 | イベント | [11-event-model.md](../architecture/11-event-model.md) |
| 13 | キャッシュ | [12-cache-strategy.md](../architecture/12-cache-strategy.md) |
| 14 | エラー | [13-error-handling.md](../architecture/13-error-handling.md) |
| 15 | ログ | [14-logging.md](../architecture/14-logging.md) |
| 16 | テスト | [15-test-architecture.md](../architecture/15-test-architecture.md) |
| 17 | デプロイ | [16-deploy-architecture.md](../architecture/16-deploy-architecture.md) |
| 18 | AI 連携 | [17-ai-integration.md](../architecture/17-ai-integration.md) |
| 19 | ADR-006〜016 | [decisions/](./decisions/) |
| 20 | AI Provider Architecture | [18-ai-provider-architecture.md](../architecture/18-ai-provider-architecture.md) |

## Phase 2.5 成果物（完了）

| # | 成果物 | パス |
|---|--------|------|
| 1 | Implementation Contract | [01-implementation-contract.md](../implementation/01-implementation-contract.md) |
| 2 | 索引 | [implementation/README.md](../implementation/README.md) |
| 3 | ADR-017 | [ADR-017-implementation-contract.md](./decisions/ADR-017-implementation-contract.md) |

## Phase 2.6 成果物（完了）

| # | 成果物 | パス |
|---|--------|------|
| 1 | Developer Playbook | [02-developer-playbook.md](../implementation/02-developer-playbook.md) |

## 参照

- [roadmap.md](./roadmap.md)
- `.cursor/context/current-task.md`
