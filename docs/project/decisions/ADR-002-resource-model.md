# ADR-002: URMS Resource モデル

> **resource_type:** decision  
> **resource_id:** decision:ADR-002  
> **status:** accepted  
> **date:** 2026-07-05  
> **author:** Architect

## コンテキスト

URMS は多様な資産（物理・デジタル・人的・知識・AI チーム構成）を統合管理する。[VISION](../VISION.md) は SSOT と拡張性を要求する。個別エンティティ設計では10年保守時にモデルが分裂するリスクがある。

## 決定

1. すべての管理対象を **Resource** 統一モデルで表現する
2. 識別子: `resource_type` + `resource_id`（例: `physical:server-001`）
3. 共通属性: name, status, metadata, relationships, audit
4. ライフサイクル: draft → active → deprecated → archived
5. AI チーム構成要素（role, rule, command, skill, context, decision, team）も Resource Type として含める
6. Phase 2 で Prisma schema に `Resource` エンティティとして実装

## 理由

- VISION「拡張可能な構造」「将来 URMS 自身が AI チームを Resource として管理」と整合
- 単一 CRUD / 検索 / 監査パターンで保守性向上
- AI Team v1.0 の `resource_id` メタデータと連続性

## 影響

- [resource-catalog.md](../../requirements/resource-catalog.md) が Type 定義の正本
- MVP は 4 ビジネス Type + 7 システム Type
- リレーションは MVP 外（Phase 2）

## 関連

- [VISION.md](../VISION.md)
- [ADR-001](./ADR-001-ai-team-v1.md)
- [ADR-005](./ADR-005-mvp-scope.md)
