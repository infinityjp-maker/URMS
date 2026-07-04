---
name: prisma
description: URMS向けPrisma ORM。schema.prisma、Migration、Prisma Client利用時に使用する。
disable-model-invocation: true
---

# Prisma

> **resource_type:** skill  
> **resource_id:** skill:prisma

## 適用範囲（ORM 層）

- `schema.prisma` 設計・変更
- Migration（`prisma migrate`）
- Prisma Client 利用
- リレーション・インデックス（schema レベル）

## PostgreSQL Skill との境界

| 本 Skill | PostgreSQL Skill |
|----------|------------------|
| schema.prisma | 生 SQL |
| migrate | View / MV / Function / Trigger |
| Client API | EXPLAIN / チューニング |
| | pgvector, Extension |

## 手順

1. Architect 設計・ADR を確認
2. schema 変更 → migration 作成（将来）
3. 破壊的変更は ADR + KM 記録必須
4. `/knowledge` で ADR 正本化

## 成果物

- `schema.prisma`, `prisma/migrations/`（将来）

## 参照

- `skill:postgresql`（DB 本体）
- `.cursor/rules/01_設計.mdc`
