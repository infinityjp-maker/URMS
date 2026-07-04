# Resource 管理詳細設計

> **resource_type:** knowledge  
> **resource_id:** knowledge:architecture-resource  
> **version:** 1.0  
> **phase:** 2

## 参照

- [ADR-002](../project/decisions/ADR-002-resource-model.md)
- [resource-catalog.md](../requirements/resource-catalog.md)
- [09-plugin-architecture.md](./09-plugin-architecture.md)

---

## 1. Resource First 設計

すべてのビジネス操作は Resource 集約を経由する。個別テーブル（servers, licenses 等）は作らない。

---

## 2. 集約（Aggregate）

```typescript
interface Resource {
  resourceType: string;
  resourceId: string;      // logical id within type
  name: string;
  status: ResourceStatus;
  metadata: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;
  updatedBy?: string;
}
```

**識別:** DB `id` (cuid) + 論理キー `(resourceType, resourceId)`。

---

## 3. ライフサイクル

```
draft ──→ active ──→ deprecated ──→ archived
  │          │            │
  └──────────┴────────────┴──→ archived (直接可)
```

| 遷移 | 条件 |
|------|------|
| draft → active | 必須属性充足（Plugin バリデーション） |
| active → deprecated | operate Mode |
| * → archived | operate Mode（論理削除） |

---

## 4. Resource Type Plugin

各 Type は Plugin が以下を提供:

```typescript
interface ResourceTypePlugin {
  type: string;
  validateCreate(input: CreateInput): ValidationResult;
  validateMetadata(metadata: unknown): ValidationResult;
  defaultMetadata(): Record<string, unknown>;
  searchableFields(): string[];
}
```

MVP 組込 Plugin: `physical`, `digital`, `human`, `knowledge`, `role`, `rule`, `command`, `skill`, `context`, `decision`, `team`

---

## 5. 検索

MVP:

- `resource_type` フィルタ
- `status` フィルタ
- `name` ILIKE 部分一致
- ページネーション（page, limit）

Phase 3: PostgreSQL 全文検索 Index

---

## 6. リレーション（Phase 2 設計 / Phase 3 実装）

```prisma
model ResourceRelation {
  id            String @id @default(cuid())
  fromType      String @map("from_type")
  fromId        String @map("from_id")
  toType        String @map("to_type")
  toId          String @map("to_id")
  relationType  String @map("relation_type")  // depends_on, owned_by, etc.

  @@unique([fromType, fromId, toType, toId, relationType])
  @@map("resource_relations")
}
```

MVP 実装対象外。スキーマのみ Phase 3 migrate 可。

---

## 7. AI Team Resource 取込

Phase 3 初回 seed:

- `.cursor/rules/*.mdc` → `rule:*`
- `.cursor/commands/*.md` → `command:*`
- `.cursor/skills/*/SKILL.md` → `skill:*`
- `docs/ai-team/*.md` → `role:*`, `team:*`
- `docs/project/decisions/*.md` → `decision:*`

read-only 参照（MVP）。更新は Phase 4。

---

## 変更履歴

| 日付 | 変更 |
|------|------|
| 2026-07-05 | v1.0 初版 |
