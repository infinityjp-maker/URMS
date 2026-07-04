# URMS 用語集（Glossary）

> **resource_type:** knowledge  
> **resource_id:** knowledge:glossary  
> **version:** 1.0  
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

### Command

`.cursor/commands/` のスラッシュコマンド。ロール起動の入口。

## K

### Knowledge

`docs/project/` および `docs/standards/` の長期正本。KM が管理。

## P

### PM 単一窓口

User と直接会話するのは PM のみ。他ロールは PM 経由。

### PostgreSQL Skill

DB 本体（SQL, Index, View, Function, Trigger, チューニング, pgvector 等）を管轄する Skill。Prisma Skill とは独立。

### Prisma Skill

ORM, Migration, `schema.prisma` を管轄する Skill。

## R

### Resource（将来）

URMS が管理する資産単位。Team, Role, Rule, Command, Skill, Context, Knowledge, Decision 等。

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
