# URMS アーキテクチャ履歴

> **resource_type:** knowledge  
> **resource_id:** knowledge:architecture-history  
> **version:** 1.1  
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

## Phase 1 設計決定サマリ

| 領域 | 決定 | ADR |
|------|------|-----|
| データモデル | Resource 統一（type + id） | ADR-002 |
| UX / 権限 | 3 Mode | ADR-003 |
| 状態管理 | Context Engine（要約のみ） | ADR-004 |
| リリース | MVP 最小スコープ | ADR-005 |

## 将来予定

- モノレポ構成（pnpm workspace）の確定 — B-011
- API 認証方式の選定 — B-010（Phase 2 開始前 Must）
- pgvector 利用方針（PostgreSQL Skill 管轄）— Phase 3
- Resource リレーション — Phase 2

## 参照

- [decisions/](./decisions/)
- [glossary.md](./glossary.md)
