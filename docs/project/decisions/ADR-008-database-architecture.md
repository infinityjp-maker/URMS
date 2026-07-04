# ADR-008: Database アーキテクチャ

> **resource_type:** decision  
> **resource_id:** decision:ADR-008  
> **status:** accepted  
> **date:** 2026-07-05  
> **author:** Architect

## コンテキスト

Resource 統一モデル（ADR-002）を永続化する。Prisma と PostgreSQL の責務分離が VISION 原則。

## 決定

1. Prisma: schema, migrate, Resource/Context/Audit/User CRUD
2. PostgreSQL: Index, View, Function, 全文検索, pgvector（将来）
3. raw SQL は `packages/db/sql/` で管理
4. 監査ログ `audit_logs` は append-only
5. Resource は `(resource_type, resource_id)` ユニーク

## 理由

- ADR-002 Resource モデル実装
- NFR-032 監査改ざん防止
- Skill 分離（Prisma vs PostgreSQL）遵守

## 影響

- [05-database-architecture.md](../../architecture/05-database-architecture.md)

## 関連

- [ADR-002](./ADR-002-resource-model.md)
