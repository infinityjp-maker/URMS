---
name: fastify
description: URMS向けFastify API実装。Fastifyルート、プラグイン、リクエスト検証、API設計時に使用する。
disable-model-invocation: true
---

# Fastify 実装

> **resource_type:** skill  
> **resource_id:** skill:fastify

## 適用条件

- Developer `/implement`（API）
- Architect API 設計

## 原則

- ルートは薄く。ビジネスロジックは service 層へ（将来）
- 入力検証必須（JSON Schema / TypeBox 等、将来選定）
- エラーレスポンス形式を統一
- 認証・認可を省略しない

## 手順

1. API 設計書・ADR を確認
2. ルート → ハンドラ → service の順で実装（将来）
3. Prisma Client 経由で DB アクセス（生 SQL は PostgreSQL Skill 参照）
4. `/test`, `/review` へ PM 経由

## 成果物

- Fastify ルート・プラグイン（将来）

## 参照

- `skill:prisma`
- `skill:typescript`
