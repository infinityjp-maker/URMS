# URMS 用語集（Glossary）

> **resource_type:** knowledge  
> **resource_id:** knowledge:glossary  
> **version:** 1.1  
> **owner:** Knowledge Manager

## 運用

- 新規用語は KM が `/knowledge` で追加
- 同義語は **正本用語1つ** に統合
- Document Writer / Architect は執筆前に本 glossary を参照

---

## A

### ADR（Architecture Decision Record）

アーキテクチャ上の重要決定を記録する文書。正本: `docs/project/decisions/ADR-*.md`

### AI チーム

Cursor 上で URMS を協調開発する7ロール（PM, Architect, Developer, Reviewer, Tester, Document Writer, Knowledge Manager）の総称。

## C

### Context

`.cursor/context/` に置く **現在状態のみ** のスナップショット。PM のみ更新。

### Context Engine

URMS サブシステム。現在フェーズ・タスク・Mode 等の **要約 + SSOT リンク** のみ保持。本文複製禁止。ADR-004 参照。

### Command

`.cursor/commands/` のスラッシュコマンド。ロール起動の入口。

## K

### Knowledge

`docs/project/` および `docs/standards/` の長期正本。KM が管理。

## M

### Mode System

URMS の操作文脈切替。MVP: `plan` / `operate` / `audit`。ADR-003 参照。

### MVP

Minimum Viable Product。Phase 2 初回リリース範囲。[mvp-definition.md](../requirements/mvp-definition.md) が正本。

## P

### PM 単一窓口

User と直接会話するのは PM のみ。他ロールは PM 経由。

### PostgreSQL Skill

DB 本体（SQL, Index, View, Function, Trigger, チューニング, pgvector 等）を管轄する Skill。Prisma Skill とは独立。

### Prisma Skill

ORM, Migration, `schema.prisma` を管轄する Skill。

## R

### Resource

URMS が管理する統一資産単位。`resource_type` + `resource_id` で識別。物理・デジタル・人的・知識・AI チーム構成要素を含む。ADR-002 参照。

### resource_id

Resource の一意識別子。形式: `{resource_type}:{name}`（例: `physical:server-001`）。

### resource_type

Resource の種別（例: `physical`, `digital`, `role`, `decision`）。[resource-catalog.md](../requirements/resource-catalog.md) が Type 定義の正本。

### SSOT（Single Source of Truth）

情報の正本を1箇所に限定し、複製による不整合を防ぐ原則。

## U

### URMS

Unified Resource Management System。10年以上保守を前提とした資産統合管理システム。

### VISION

`docs/project/VISION.md`。存在理由・哲学・判断基準の長期不変正本。ROADMAP とは役割分離。

---

## 参照

- [99_Template.md](../ai-team/99_Template.md) — 用語追加手順
