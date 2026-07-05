# Phase 5 — S14 Resource リレーション

> **resource_type:** knowledge  
> **owner:** PM / Developer  
> **sprint:** S14  
> **target:** v0.4.0

## スコープ

| 項目 | 実装 | 状態 |
|------|------|------|
| Prisma `resource_relations` | migration `20260706000000` | ✅ |
| Domain `RelationService` | 作成 · 削除 · 一覧 | ✅ |
| relationType 検証 | `depends_on` 等 6 種 | ✅ |
| API | `GET/POST /v1/relations` · `GET .../relations` · `DELETE /v1/relations/:id` | ✅ |
| 監査 | RelationCreated / RelationDeleted → AuditLog | ✅ |

## relationType（Contract §5.3）

`depends_on` · `owned_by` · `governed_by` · `provided_by` · `generated_from` · `member_of`

## API 例

```http
POST /v1/relations
Content-Type: application/json
x-urms-mode: operate

{
  "fromType": "digital",
  "fromId": "license-ms365",
  "toType": "physical",
  "toId": "rack-a01",
  "relationType": "depends_on"
}
```

```http
GET /v1/resources/physical/rack-a01/relations
x-urms-mode: operate
```

## 残課題（S14 以降）

- リレーション UI（UC-011 · 暫定 Web）
- perception 層へのリレーション反映
- archived Resource への既存リレーション整理

## 参照

- [08-resource-management.md](../architecture/08-resource-management.md) §6
- [resource-catalog.md](../requirements/resource-catalog.md) §5
