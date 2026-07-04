# URMS アーキテクチャ履歴

> **resource_type:** knowledge  
> **resource_id:** knowledge:architecture-history  
> **version:** 1.0  
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
| 2026-07-05 | AI チーム v1.0 基盤構築開始 | — | PM |
| 2026-07-05 | Prisma / PostgreSQL Skill 分離（DB 本体 vs ORM） | — | Architect |

## 将来予定

- モノレポ構成（pnpm workspace）の確定
- API 認証方式の選定
- pgvector 利用方針（PostgreSQL Skill 管轄）

## 参照

- [decisions/](./decisions/)
- [glossary.md](./glossary.md)
