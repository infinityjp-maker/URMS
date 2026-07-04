# URMS キャッシュ戦略

> **resource_type:** knowledge  
> **resource_id:** knowledge:architecture-cache  
> **version:** 1.0  
> **phase:** 2

---

## 1. MVP 方針

**キャッシュなし。** PostgreSQL 直接クエリ。10,000 Resource 規模は Index で対応（NFR-020）。

理由: 最小複雑性（VISION）、キャッシュ invalidation コスト回避。

---

## 2. 将来（Phase 3+）

| 対象 | 方式 | TTL |
|------|------|-----|
| Resource 一覧（頻繁 query） | Redis | 60s |
| Context Snapshot | Redis | 30s |
| Knowledge（ADR 一覧） | Redis | 300s |
| User Session | Redis | session TTL |

---

## 3. Invalidation

Domain Event 購読:

- `ResourceUpdated` → `cache:resources:*` 削除
- `ContextUpdated` → `cache:context` 削除

---

## 4. HTTP キャッシュ

- API: `Cache-Control: no-store`（認証 API）
- 静的アセット: CDN / long cache（Phase 3 デプロイ時）

---

## 変更履歴

| 日付 | 変更 |
|------|------|
| 2026-07-05 | v1.0 初版 |
