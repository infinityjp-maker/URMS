# ADR-015: AI 連携アーキテクチャ

> **resource_type:** decision  
> **resource_id:** decision:ADR-015  
> **status:** accepted  
> **date:** 2026-07-05  
> **author:** Architect

## コンテキスト

VISION「AI と人間が協調して進化」。Cursor AI チームと URMS 実行時の整合。

## 決定

1. AI は **REST API + OpenAPI** 経由で URMS 操作
2. 安定エラーコード、Mode ヘッダ必須
3. Context Export API（Should）— SSOT リンクのみ
4. AI Team を Resource として seed 参照
5. Service Account JWT（`ai-agent-*` actorId）
6. Cursor 双方向同期は Phase 4

## 理由

- VISION AI 協調
- NFR-050, NFR-051, NFR-052 充足
- Phase 1 Context Engine 設計との連続性

## 影響

- [17-ai-integration.md](../../architecture/17-ai-integration.md)

## 関連

- [ADR-004](./ADR-004-context-engine.md)
- [ADR-007](./ADR-007-api-architecture.md)
- [ADR-016](./ADR-016-ai-provider-abstraction.md)
