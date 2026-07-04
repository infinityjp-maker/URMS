# URMS Database アーキテクチャ

> **resource_type:** knowledge  
> **resource_id:** knowledge:architecture-database  
> **version:** 1.0  
> **phase:** 2

## 参照

- [ADR-008](../project/decisions/ADR-008-database-architecture.md)
- [ADR-002](../project/decisions/ADR-002-resource-model.md)

---

## 1. Prisma / PostgreSQL 境界

| 領域 | 担当 | 内容 |
|------|------|------|
| **Prisma** | packages/db | schema.prisma, migrate, Resource CRUD |
| **PostgreSQL** | DBA 領域 | Index, View, Function, Trigger, 全文検索, pgvector |

Migration は Prisma が生成。View / Function は `packages/db/sql/` に raw SQL として管理し、PostgreSQL Skill がレビュー。

---

## 2. コアスキーマ（Prisma 設計）

### 2.1 Resource

```prisma
model Resource {
  id            String   @id @default(cuid())
  resourceType  String   @map("resource_type")
  resourceId    String   @map("resource_id")  // logical id e.g. server-001
  name          String
  status        ResourceStatus @default(draft)
  metadata      Json     @default("{}")
  createdAt     DateTime @default(now()) @map("created_at")
  updatedAt     DateTime @updatedAt @map("updated_at")
  createdBy     String?  @map("created_by")
  updatedBy     String?  @map("updated_by")

  @@unique([resourceType, resourceId])
  @@index([resourceType, status])
  @@index([name])
  @@map("resources")
}

enum ResourceStatus {
  draft
  active
  deprecated
  archived
}
```

### 2.2 ContextSnapshot

```prisma
model ContextSnapshot {
  id            String   @id @default(cuid())
  key           String   @unique  // current_phase, current_task, etc.
  summary       String             // 要約テキスト（短い）
  ssotLinks     Json     @map("ssot_links")  // [{ label, path }]
  updatedAt     DateTime @updatedAt @map("updated_at")
  updatedBy     String?  @map("updated_by")

  @@map("context_snapshots")
}
```

### 2.3 AuditLog（append-only）

```prisma
model AuditLog {
  id            String   @id @default(cuid())
  action        String   // CREATE, UPDATE, DELETE, LIFECYCLE
  resourceType  String?  @map("resource_type")
  resourceId    String?  @map("resource_id")
  actorId       String   @map("actor_id")
  mode          String
  payload       Json?
  createdAt     DateTime @default(now()) @map("created_at")

  @@index([resourceType, resourceId])
  @@index([createdAt])
  @@map("audit_logs")
}
```

### 2.4 User / Session（認証）

```prisma
model User {
  id            String   @id @default(cuid())
  externalId    String   @unique @map("external_id")  // IdP sub
  email         String   @unique
  roles         String[] @default([])
  createdAt     DateTime @default(now()) @map("created_at")

  @@map("users")
}
```

---

## 3. PostgreSQL 拡張（MVP 後）

| 対象 | 手法 | Phase |
|------|------|-------|
| 全文検索 | `tsvector` + GIN Index | Phase 3 |
| 監査 View | `audit_log_summary` View | Phase 3 |
| pgvector | embedding 列 + HNSW | Phase 3+ |

---

## 4. マイグレーション方針

1. すべて Prisma migrate（開発・本番同一パス）
2. 破壊的変更は ADR 必須
3. raw SQL は `packages/db/sql/` + 手動 apply 手順を docs に記載
4. ロールバック: forward-only を原則、down は緊急時のみ

---

## 5. 接続・プール

- 開発: `DATABASE_URL` 単一接続
- 本番: PgBouncer または Prisma connection pool（Phase 3 デプロイ時決定）

---

## 変更履歴

| 日付 | 変更 |
|------|------|
| 2026-07-05 | v1.0 初版 |
