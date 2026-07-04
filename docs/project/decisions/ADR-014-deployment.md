# ADR-014: デプロイ構成

> **resource_type:** decision  
> **resource_id:** decision:ADR-014  
> **status:** accepted  
> **date:** 2026-07-05  
> **author:** Architect

## コンテキスト

MVP を単一組織向けにデプロイ。NFR-040 バックアップ要件。

## 決定

1. **Docker Compose** ベース（api + web + postgres + nginx）
2. 環境: local / staging / production
3. PostgreSQL 日次 pg_dump バックアップ
4. ホスト選定は Phase 3（VPS または PaaS）
5. `/health` ヘルスチェック

## 理由

- 最小運用複雑性
- 10年保守: 標準コンテナ化
- K8s は規模拡大時に検討（Could）

## 影響

- [16-deploy-architecture.md](../../architecture/16-deploy-architecture.md)

## 関連

- [ADR-010](./ADR-010-authentication.md)
