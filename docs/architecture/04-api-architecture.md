# URMS API アーキテクチャ

> **resource_type:** knowledge  
> **resource_id:** knowledge:architecture-api  
> **version:** 1.0  
> **phase:** 2

## 参照

- [ADR-007](../project/decisions/ADR-007-api-architecture.md)
- [04-api-architecture.md](./04-api-architecture.md) — 本書

---

## 1. 方針

- **REST** + **OpenAPI 3.1**（NFR-012: `/v1/` プレフィックス）
- JSON リクエスト/レスポンス
- Mode はヘッダ `X-URMS-Mode: plan|operate|audit`
- 認証: Bearer JWT（Phase 3 実装）

---

## 2. エンドポイント一覧（MVP）

### 2.1 Resource

| Method | Path | Mode | 説明 |
|--------|------|------|------|
| GET | `/v1/resources` | operate, audit, plan | 一覧・検索 |
| POST | `/v1/resources` | operate | 作成 |
| GET | `/v1/resources/:type/:id` | 全 Mode（読取） | 詳細 |
| PATCH | `/v1/resources/:type/:id` | operate | 更新 |
| DELETE | `/v1/resources/:type/:id` | operate | 論理削除（archived） |
| PATCH | `/v1/resources/:type/:id/lifecycle` | operate | 状態遷移 |

**Query パラメータ（GET /v1/resources）:**

- `type`, `status`, `q`（名称検索）, `page`, `limit`

### 2.2 Context Engine

| Method | Path | Mode | 説明 |
|--------|------|------|------|
| GET | `/v1/context` | plan, operate | スナップショット取得 |
| PUT | `/v1/context` | plan | スナップショット更新（PM 相当） |

### 2.3 Mode

| Method | Path | Mode | 説明 |
|--------|------|------|------|
| GET | `/v1/modes` | 全 | 利用可能 Mode 一覧 |
| GET | `/v1/modes/current` | 全 | 現在 Mode |

### 2.4 Knowledge（read-only）

| Method | Path | Mode | 説明 |
|--------|------|------|------|
| GET | `/v1/knowledge/decisions` | plan, audit | ADR 一覧 |
| GET | `/v1/knowledge/decisions/:id` | plan, audit | ADR 詳細 |
| GET | `/v1/knowledge/glossary` | 全 | 用語集 |

### 2.5 Audit

| Method | Path | Mode | 説明 |
|--------|------|------|------|
| GET | `/v1/audit/logs` | audit | 監査ログ |

### 2.6 Health

| Method | Path | 説明 |
|--------|------|------|
| GET | `/health` | ヘルスチェック（認証不要） |

---

## 3. レスポンス形式

### 成功

```json
{
  "data": { },
  "meta": { "page": 1, "limit": 20, "total": 100 }
}
```

### エラー

```json
{
  "error": {
    "code": "RESOURCE_NOT_FOUND",
    "message": "Resource physical:server-001 not found",
    "details": []
  }
}
```

---

## 4. Fastify 構成

```
server.ts
  ├── register(cors, helmet, rateLimit)
  ├── register(authPlugin)      # JWT 検証
  ├── register(modePlugin)      # X-URMS-Mode 検証
  ├── register(errorHandler)
  └── register(routes)
        ├── /v1/resources
        ├── /v1/context
        ├── /v1/modes
        ├── /v1/knowledge
        └── /v1/audit
```

---

## 5. OpenAPI

- `apps/api/openapi.yaml` を正本（Phase 3）
- `@fastify/swagger` で自動生成も可（ADR-007 で Phase 3 時に選択）
- AI 連携: OpenAPI を AI 向け API 契約として公開（NFR-051）

---

## 変更履歴

| 日付 | 変更 |
|------|------|
| 2026-07-05 | v1.0 初版 |
