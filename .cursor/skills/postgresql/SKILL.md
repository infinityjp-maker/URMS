---
name: postgresql
description: URMS向けPostgreSQL DB本体設計。SQL、Index、View、Materialized View、Function、Trigger、Performance Tuning、EXPLAIN、pgvector、Extension時に使用する。
disable-model-invocation: true
---

# PostgreSQL

> **resource_type:** skill  
> **resource_id:** skill:postgresql

## 適用範囲（DB 本体）

- SQL 設計・最適化
- Index 設計
- View / Materialized View
- Function / Trigger
- Performance Tuning / EXPLAIN
- pgvector
- Extension 選定・利用

## Prisma Skill との境界

Prisma が **ORM / Migration / schema** を担当。  
本 Skill は **DB エンジンそのもの** を担当。重複実装しない。

## 手順

1. Architect 設計・ADR を確認
2. schema で表現できない要件を SQL で設計
3. 性能要件は EXPLAIN で検証（将来）
4. 変更は ADR + `/knowledge` 必須

## 成果物

- SQL スクリプト（将来 `prisma/migrations` または `sql/`）
- Index / View 設計書

## 参照

- `skill:prisma`
- `docs/ai-team/02_Architect.md`
