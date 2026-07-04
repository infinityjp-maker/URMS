# URMS システムアーキテクチャ全体図

> **resource_type:** knowledge  
> **resource_id:** knowledge:architecture-system  
> **version:** 1.0  
> **phase:** 2

## 参照

- [VISION.md](../project/VISION.md)
- [system-boundary.md](../requirements/system-boundary.md)

---

## 1. レイヤー構成

```
┌──────────────────────────────────────────────────────────────────┐
│                        Presentation Layer                         │
│  apps/web (React + TypeScript)                                    │
│  - Resource UI  - Mode Switcher  - Context Dashboard              │
└────────────────────────────┬─────────────────────────────────────┘
                             │ HTTPS / REST
┌────────────────────────────▼─────────────────────────────────────┐
│                        Application Layer                            │
│  apps/api (Fastify + TypeScript)                                  │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐   │
│  │ Resource    │ │ Mode        │ │ Context     │ │ Auth        │   │
│  │ Service     │ │ Service     │ │ Engine      │ │ Middleware  │   │
│  └──────┬──────┘ └──────┬──────┘ └──────┬──────┘ └──────┬──────┘   │
│         └────────────────┴───────────────┴───────────────┘         │
│                             │                                       │
│  ┌──────────────────────────▼──────────────────────────────────┐   │
│  │ Event Bus (in-process → 将来 message queue)                  │   │
│  └──────────────────────────┬──────────────────────────────────┘   │
└─────────────────────────────┼──────────────────────────────────────┘
                              │
┌─────────────────────────────▼──────────────────────────────────────┐
│                        Domain Layer                                 │
│  packages/domain                                                  │
│  - Resource aggregate  - Lifecycle  - Mode policy  - Plugin registry│
└─────────────────────────────┬──────────────────────────────────────┘
                              │
┌─────────────────────────────▼──────────────────────────────────────┐
│                        Infrastructure Layer                         │
│  packages/db (Prisma)  │  packages/cache  │  packages/logger       │
└─────────────────────────────┬──────────────────────────────────────┘
                              │
┌─────────────────────────────▼──────────────────────────────────────┐
│  PostgreSQL  │  Redis (将来)  │  IdP (OIDC)                        │
└────────────────────────────────────────────────────────────────────┘
```

---

## 2. サブシステム

| サブシステム | 責務 | パッケージ |
|--------------|------|------------|
| **Resource Core** | CRUD、検索、ライフサイクル | domain, api/routes/resources |
| **Mode System** | 操作文脈・権限 | domain/mode, api/middleware/mode |
| **Context Engine** | 現状スナップショット + SSOT リンク | domain/context, api/routes/context |
| **Audit** | 操作記録（append-only） | domain/audit, db/audit_log |
| **Plugin Registry** | Resource Type 拡張 | domain/plugins |
| **AI Manager** | 生成AI Provider 抽象化・Routing・Fallback | domain/ai |
| **Knowledge Bridge** | ADR/Glossary 参照（read-only） | api/routes/knowledge |

---

## 3. データフロー（Resource CRUD）

```
User → Web UI → API (Mode check) → Resource Service
                                        │
                    ┌───────────────────┼───────────────────┐
                    ▼                   ▼                   ▼
              Prisma (Resource)   Audit Event          Cache invalidate
                    │
                    ▼
              PostgreSQL
```

---

## 4. 横断関心事

| 関心事 | 実装方針 | 文書 |
|--------|----------|------|
| 認証 | OIDC + JWT | [10-auth-authorization.md](./10-auth-authorization.md) |
| 認可 | Mode + RBAC | 同上 |
| ログ | 構造化 JSON | [14-logging.md](./14-logging.md) |
| エラー | 統一エラーコード | [13-error-handling.md](./13-error-handling.md) |
| イベント | Domain Event | [11-event-model.md](./11-event-model.md) |
| キャッシュ | MVP: なし / 将来 Redis | [12-cache-strategy.md](./12-cache-strategy.md) |
| テスト | 単体 / 統合 / E2E | [15-test-architecture.md](./15-test-architecture.md) |

---

## 5. MVP 境界

Phase 2 設計は MVP 実装（Phase 3）を対象とする。MVP 外（リレーション UI、develop Mode、外部連携）は設計に **拡張ポイント** のみ記載。

---

## 変更履歴

| 日付 | 変更 |
|------|------|
| 2026-07-05 | v1.0 初版 |
