# URMS アーキテクチャ設計（Phase 2）

> **resource_type:** knowledge  
> **resource_id:** knowledge:architecture-index  
> **version:** 1.0  
> **phase:** 2  
> **status:** frozen — Architecture Freeze 2026-07-05  
> **owner:** Architect

## 参照（最上位）

- [00-start-here.md](./00-start-here.md) — **読み方ガイド**
- [VISION.md](../project/VISION.md)
- [requirements/](../requirements/)
- [decisions/](../project/decisions/)

## 設計書一覧

| # | 文書 | パス | ADR |
|---|------|------|-----|
| 1 | システムアーキテクチャ全体 | [01-system-overview.md](./01-system-overview.md) | — |
| 2 | ディレクトリ構成 | [02-directory-structure.md](./02-directory-structure.md) | ADR-006 |
| 3 | Monorepo 設計 | [03-monorepo.md](./03-monorepo.md) | ADR-006 |
| 4 | API アーキテクチャ | [04-api-architecture.md](./04-api-architecture.md) | ADR-007 |
| 5 | Database アーキテクチャ | [05-database-architecture.md](./05-database-architecture.md) | ADR-008 |
| 6 | Context Engine 詳細 | [06-context-engine.md](./06-context-engine.md) | ADR-004 |
| 7 | Mode System 詳細 | [07-mode-system.md](./07-mode-system.md) | ADR-003 |
| 8 | Resource 管理詳細 | [08-resource-management.md](./08-resource-management.md) | ADR-002 |
| 9 | Plugin アーキテクチャ | [09-plugin-architecture.md](./09-plugin-architecture.md) | ADR-009 |
| 10 | 認証・認可 | [10-auth-authorization.md](./10-auth-authorization.md) | ADR-010 |
| 11 | イベントモデル | [11-event-model.md](./11-event-model.md) | ADR-011 |
| 12 | キャッシュ戦略 | [12-cache-strategy.md](./12-cache-strategy.md) | — |
| 13 | エラーハンドリング | [13-error-handling.md](./13-error-handling.md) | — |
| 14 | ログ設計 | [14-logging.md](./14-logging.md) | ADR-012 |
| 15 | テストアーキテクチャ | [15-test-architecture.md](./15-test-architecture.md) | ADR-013 |
| 16 | デプロイ構成 | [16-deploy-architecture.md](./16-deploy-architecture.md) | ADR-014 |
| 17 | AI 連携 | [17-ai-integration.md](./17-ai-integration.md) | ADR-015 |
| 18 | AI Provider | [18-ai-provider-architecture.md](./18-ai-provider-architecture.md) | ADR-016 |

## 設計原則

1. **Resource First** — すべてのドメインロジックは Resource モデルを中心に配置
2. **SSOT** — DB + Knowledge が正本、Context は要約のみ
3. **Prisma / PostgreSQL 境界** — ORM vs DB 本体の責務分離
4. **Plugin 拡張** — Resource Type / AI Provider 追加はプラグイン型
5. **AI Provider 非依存** — Adapter Interface のみ Core 参照（ADR-016）
6. **10年保守** — モジュール境界・ADR・テスト可能性

## 変更履歴

| 日付 | 変更 |
|------|------|
| 2026-07-05 | v1.0 初版（Phase 2） |
| 2026-07-05 | v1.1 — ADR-016 AI Provider Architecture 追加（Architecture Freeze） |
