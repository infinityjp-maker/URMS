# URMS 用語集（Glossary）

> **resource_type:** knowledge  
> **resource_id:** knowledge:glossary  
> **version:** 1.7  
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

### AI Manager

生成AI Provider を抽象化する URMS サブシステム。Routing、Fallback、Cost 管理を担う。Core は Adapter Interface のみ参照。ADR-016 参照。

### ai-model（Resource Type）

利用可能な生成AIモデル。`resource_type: ai-model`, `resource_id: gpt-5.5` 等。Provider とは別 Resource。

### ai-provider（Resource Type）

生成AIサービス Provider。`resource_type: ai-provider`, `resource_id: openai` 等。Adapter Plugin と対応。

## C

### Context

`.cursor/context/` に置く **現在状態のみ** のスナップショット。PM のみ更新。

### Context Engine

URMS サブシステム。現在フェーズ・タスク・Mode 等の **要約 + SSOT リンク** のみ保持。本文複製禁止。ADR-004 参照。

### Command

`.cursor/commands/` のスラッシュコマンド。ロール起動の入口。

### ai-usage（Resource Type）

AI 利用履歴。Provider, Model, Tokens, Cost, Latency, Timestamp を保持。ADR-016 参照。

### Capability（AI）

AI Model の能力（chat, streaming, vision, image-generation 等）。**Provider 名ではなく Capability で判定。** ADR-016 参照。

### embedding-model（Resource Type）

Embedding 専用モデル。Chat Model（ai-model）と分離。ADR-016 参照。

### generated-image（Resource Type）

画像生成結果 Resource。prompt, seed, provider, model, parameters 等を metadata に保持。ADR-016 参照。

## D

### Domain Event

Resource / Context 操作時に発行されるイベント。Audit 連携に使用。ADR-011 参照。

## E

### Event Bus

Domain Event の publish/subscribe 抽象。MVP は in-process。

### Implementation Contract

Phase 3 実装前の実装ルール正本。`docs/implementation/01-implementation-contract.md`。ADR-017 参照。

### Developer Playbook

実装時の運用ガイド。`docs/implementation/02-developer-playbook.md`。Contract を複製せず、チェックリスト・早見表を提供。ADR-017 運用補助。

## K

### Knowledge

`docs/project/` および `docs/standards/` の長期正本。KM が管理。

## M

### Mode System

URMS の操作文脈切替。MVP: `plan` / `operate` / `audit`。ADR-003 参照。

### MVP

Minimum Viable Product。Phase 3 初回リリース範囲。[mvp-definition.md](../requirements/mvp-definition.md) が正本。

### Monorepo

pnpm workspace による apps + packages 構成。ADR-006 参照。

## O

### OpenAPI

REST API 契約の記述形式。`/v1/` プレフィックス。ADR-007 参照。

## P

### PM 単一窓口

User と直接会話するのは PM のみ。他ロールは PM 経由。

### PostgreSQL Skill

DB 本体（SQL, Index, View, Function, Trigger, チューニング, pgvector 等）を管轄する Skill。Prisma Skill とは独立。

### Plugin（ResourceTypePlugin）

Resource Type 別バリデーション・メタデータを提供する拡張点。ADR-009 参照。

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

### Phase 3 Ready

Phase 3 実装準備完了判定。実装開始は User 承認待ち。[03-phase3-readiness.md](../implementation/03-phase3-readiness.md)。

## S

### Secret Store

AI Provider API Key 等の秘密情報を保持する暗号化ストア。Resource には `secretRef` のみ保存。ADR-016 参照。

## U

### URMS

Unified Resource Management System。10年以上保守を前提とした資産統合管理システム。

### VISION

`docs/project/VISION.md`。存在理由・哲学・判断基準の長期不変正本。ROADMAP とは役割分離。

### Phase 3 Readiness

Phase 3 実装開始判定。`docs/implementation/03-phase3-readiness.md`。

### Phase 3 Master Checklist

実装進捗チェック。`docs/implementation/04-phase3-master-checklist.md`。

---

## 参照

- [99_Template.md](../ai-team/99_Template.md) — 用語追加手順
