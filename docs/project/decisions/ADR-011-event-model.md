# ADR-011: イベントモデル

> **resource_type:** decision  
> **resource_id:** decision:ADR-011  
> **status:** accepted  
> **date:** 2026-07-05  
> **author:** Architect

## コンテキスト

Resource CRUD と Audit ログ連携。将来外部連携拡張が必要。

## 決定

1. **Domain Event** パターン
2. MVP: **InProcessEventBus**（EventEmitter）
3. AuditHandler がイベント購読 → audit_logs append
4. 将来: PostgreSQL / Redis Streams へ移行可能な EventBus 抽象
5. Event Sourcing は採用しない

## 理由

- 監査とドメインの疎結合
- 最小複雑性（in-process で開始）
- 拡張ポイント確保

## 影響

- [11-event-model.md](../../architecture/11-event-model.md)

## 関連

- [ADR-008](./ADR-008-database-architecture.md)
- [ADR-012](./ADR-012-logging.md)
