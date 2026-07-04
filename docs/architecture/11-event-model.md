# URMS イベントモデル

> **resource_type:** knowledge  
> **resource_id:** knowledge:architecture-events  
> **version:** 1.0  
> **phase:** 2

## 参照

- [ADR-011](../project/decisions/ADR-011-event-model.md)

---

## 1. 方針

Domain Event パターン。MVP は **in-process EventEmitter**。将来 message queue（Redis Streams / PostgreSQL LISTEN）へ移行可能な抽象化。

---

## 2. イベント一覧（MVP）

| Event | 発火元 | 購読者 |
|-------|--------|--------|
| `ResourceCreated` | ResourceService | AuditHandler |
| `ResourceUpdated` | ResourceService | AuditHandler |
| `ResourceLifecycleChanged` | ResourceService | AuditHandler |
| `ResourceArchived` | ResourceService | AuditHandler |
| `ContextUpdated` | ContextService | AuditHandler |
| `ModeChanged` | ModeService | Logger |

---

## 3. イベント構造

```typescript
interface DomainEvent {
  eventId: string;
  eventType: string;
  occurredAt: Date;
  actorId: string;
  mode: string;
  payload: Record<string, unknown>;
}
```

---

## 4. Event Bus 抽象

```typescript
interface EventBus {
  publish(event: DomainEvent): Promise<void>;
  subscribe(eventType: string, handler: EventHandler): void;
}
```

実装:

- MVP: `InProcessEventBus`
- Phase 3+: `PostgresEventBus` または外部 MQ

---

## 5. Audit 連携

AuditHandler が全 Resource/Context イベントを `audit_logs` に append。トランザクション外（ eventual consistency 許容）。失敗時は retry + dead letter log。

---

## 6. 将来拡張

- IntegrationPlugin がイベント購読（外部 Webhook）
- Event Sourcing は採用しない（YAGNI）

---

## 変更履歴

| 日付 | 変更 |
|------|------|
| 2026-07-05 | v1.0 初版 |
