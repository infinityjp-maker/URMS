# URMS アーキテクチャ履歴

> **resource_type:** knowledge  
> **resource_id:** knowledge:architecture-history  
> **version:** 1.7  
> **owner:** Knowledge Manager

## 目的

URMS のアーキテクチャ変遷を時系列で記録し、10年保守時の「なぜ今こうなっているか」を説明可能にする。

## 技術スタック（確定）

| 層 | 技術 | 確定日 |
|----|------|--------|
| フロントエンド | React + TypeScript | 2026-07（方針） |
| バックエンド | Fastify + TypeScript | 2026-07（方針） |
| ORM | Prisma | 2026-07（方針） |
| DB | PostgreSQL | 2026-07（方針） |
| パッケージ | pnpm | 2026-07（方針） |

## 変遷ログ

| 日付 | 変更 | ADR | 担当 |
|------|------|-----|------|
| 2026-07-05 | AI チーム v1.0 基盤構築開始 | ADR-001 | PM |
| 2026-07-05 | Prisma / PostgreSQL Skill 分離（DB 本体 vs ORM） | — | Architect |
| 2026-07-05 | 初回 Git コミット（v0.1.0-ai-team） | — | PM |
| 2026-07-05 | Resource 統一モデル採用 | ADR-002 | Architect |
| 2026-07-05 | Mode System（plan/operate/audit）採用 | ADR-003 | Architect |
| 2026-07-05 | Context Engine 設計（SSOT リンクのみ） | ADR-004 | Architect |
| 2026-07-05 | MVP スコープ固定 | ADR-005 | PM + Architect |
| 2026-07-05 | Phase 1 要求定義完了 | — | PM |
| 2026-07-05 | Monorepo 構成（pnpm workspace） | ADR-006 | Architect |
| 2026-07-05 | REST API + OpenAPI `/v1/` | ADR-007 | Architect |
| 2026-07-05 | DB スキーマ（Resource/Context/Audit） | ADR-008 | Architect |
| 2026-07-05 | Plugin Registry パターン | ADR-009 | Architect |
| 2026-07-05 | OIDC + JWT + RBAC 認証 | ADR-010 | Architect |
| 2026-07-05 | Domain Event + InProcess Bus | ADR-011 | Architect |
| 2026-07-05 | pino 構造化ログ | ADR-012 | Architect |
| 2026-07-05 | Vitest + Playwright テスト | ADR-013 | Architect |
| 2026-07-05 | Docker Compose デプロイ | ADR-014 | Architect |
| 2026-07-05 | AI API 連携設計 | ADR-015 | Architect |
| 2026-07-05 | AI Provider Abstraction（Adapter + Plugin + マルチモーダル） | ADR-016 | Architect |
| 2026-07-05 | **Architecture Freeze** — Phase 2 設計固定（ADR-006〜016） | — | PM + KM |
| 2026-07-05 | Implementation Contract 採用（Phase 2.5） | ADR-017 | Architect |
| 2026-07-05 | Developer Playbook Accepted（Phase 2.6） | — | PM |
| 2026-07-05 | Phase 2.5/2.6 Git コミット `3e61468` | ADR-017 | PM |
| 2026-07-05 | Phase 3 Ready 判定 | — | PM + Architect |

## Phase 2.6 Acceptance（2026-07-05）

| 項目 | 内容 |
|------|------|
| 状態 | **Accepted** |
| Commit Hash | `3e61468` |
| メッセージ | docs: add Phase 2.5 Implementation Contract and Phase 2.6 Developer Playbook (ADR-017) |
| Playbook | ADR-017 運用補助（Contract は唯一 SSOT） |
| Architecture Freeze | **変更なし**（ADR-006〜016 維持） |

### 合同レビュー（要約）

- Critical: 0
- Major: IdP 未決、実装開始未承認、Secret Store 未決
- SSOT / Freeze / AI Provider / Resource First: 整合確認済

## Phase 2.5 — Implementation Contract

Phase 3 実装前の **実装契約正本（SSOT）**。Architecture Freeze を変更せず実装ルールへ具体化。

| 項目 | 内容 |
|------|------|
| 正本 | [01-implementation-contract.md](../implementation/01-implementation-contract.md) |
| ADR | ADR-017 |
| 変更ルール | ADR 改訂 + PM 承認 + KM 記録 |

## Phase 2.6 — Developer Playbook

| 項目 | 内容 |
|------|------|
| 正本 | [02-developer-playbook.md](../implementation/02-developer-playbook.md) |
| ADR | なし（ADR-017 運用補助） |
| 優先順位 | VISION > ADR > Architecture > Contract > Playbook |
| Git | `3e61468`（2026-07-05） |

## Phase 3 Preparation

Phase 3 実装開始前の Readiness + Master Checklist。判定: **Phase 3 Ready**（実装開始承認待ち）。

| 項目 | 内容 |
|------|------|
| Readiness | [03-phase3-readiness.md](../implementation/03-phase3-readiness.md) |
| Checklist | [04-phase3-master-checklist.md](../implementation/04-phase3-master-checklist.md) |

## Phase 2 設計決定サマリ

| 領域 | 決定 | ADR |
|------|------|-----|
| リポジトリ | pnpm Monorepo | ADR-006 |
| API | REST /v1/ + OpenAPI | ADR-007 |
| DB | Prisma + PostgreSQL 分離 | ADR-008 |
| 拡張 | Plugin Registry | ADR-009 |
| セキュリティ | OIDC + Mode + RBAC | ADR-010 |
| イベント | Domain Event in-process | ADR-011 |
| 運用 | pino + Docker Compose | ADR-012, ADR-014 |
| AI 連携 | OpenAPI + Context Export | ADR-015 |
| AI Provider | Adapter + AI Manager + Fallback + マルチモーダル | ADR-016 |

## Architecture Freeze（2026-07-05）

**Phase 2 アーキテクチャ設計を正式固定。** User + PM 承認済み。

### Freeze 対象

| 種別 | パス |
|------|------|
| 設計書 | `docs/architecture/*`（01〜18） |
| ADR | ADR-006 〜 ADR-016 |
| Knowledge | roadmap, backlog, glossary, architecture-history, resource-catalog（AI Resource 節） |

### 変更ルール

Architecture Freeze 対象の変更は **ADR 新規または改訂 + PM 承認 + KM 記録** が必須。

### ADR-016 固定事項（要約）

- Core → AI Manager → Provider Registry → AiProviderAdapter（Provider 直接参照禁止）
- Capability ベース判定（kebab-case 標準 14 種 + ProviderCapability 拡張）
- Resource: ai-provider, ai-model, embedding-model, generated-image, ai-usage
- Secret Store（API Key を Resource に保存しない）
- Routing: Task → Role → Project → System
- Fallback: 標準機能（Timeout / API Error / Rate Limit / Capability / Cost Policy）
- 画像・音声・Embedding 対応（Adapter 追加のみで Core 不変）

## 将来予定

- IdP 具体選定 — B-010（Phase 3 開始前 Must）
- Resource リレーション実装 — Phase 3
- pgvector 利用方針 — Phase 4
- AI Manager + Provider Plugin 実装 — B-014（Phase 3）

## 参照

- [decisions/](./decisions/)
- [glossary.md](./glossary.md)
