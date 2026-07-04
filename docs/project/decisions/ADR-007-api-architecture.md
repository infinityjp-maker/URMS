# ADR-007: API アーキテクチャ

> **resource_type:** decision  
> **resource_id:** decision:ADR-007  
> **status:** accepted  
> **date:** 2026-07-05  
> **author:** Architect

## コンテキスト

AI と人間の両方が API を利用する。バージョニングと Mode 連携が必要（NFR-012, NFR-051）。

## 決定

1. **REST** + **OpenAPI 3.1**
2. プレフィックス `/v1/`
3. Mode ヘッダ `X-URMS-Mode: plan|operate|audit`
4. 統一レスポンス `{ data, meta }` / `{ error }`
5. Fastify + TypeScript

## 理由

- シンプル、AI 理解容易
- OpenAPI で契約明確化
- GraphQL は YAGNI（10年保守で REST 十分）

## 影響

- [04-api-architecture.md](../../architecture/04-api-architecture.md)

## 関連

- [ADR-003](./ADR-003-mode-system.md)
- [ADR-015](./ADR-015-ai-integration.md)
