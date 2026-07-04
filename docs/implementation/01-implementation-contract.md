# URMS Implementation Contract（実装契約）

> **resource_type:** knowledge  
> **resource_id:** knowledge:implementation-contract  
> **version:** 1.0  
> **phase:** 2.5  
> **status:** accepted — ADR-017  
> **owner:** Architect  
> **supersedes:** なし（Architecture Freeze を実装ルールへ具体化）

## 参照（最上位）

| 種別 | 正本 |
|------|------|
| 哲学 | [VISION.md](../project/VISION.md) |
| アーキテクチャ | [docs/architecture/](../architecture/) — **Architecture Freeze** |
| ADR | [docs/project/decisions/](../project/decisions/) |
| 要件 | [docs/requirements/](../requirements/) |
| コーディング標準 | [coding-standard.md](../standards/coding-standard.md) |

## 本書の位置づけ

Architecture Freeze（Phase 2）を **Developer / Reviewer / Tester が同一基準で実装・検証するための契約** である。  
本書と Architecture が矛盾する場合、**Architecture Freeze + ADR が優先**。本書の変更は ADR + PM 承認必須。

---

## 1. ディレクトリ構成

### 1.1 最終ディレクトリ構成

[02-directory-structure.md](../architecture/02-directory-structure.md) / ADR-006 に従う。

```
URMS/
├── apps/web/              # Presentation
├── apps/api/              # Application (Fastify)
├── packages/
│   ├── domain/            # Domain（Resource, Mode, Context, AI Manager）
│   ├── db/                # Infrastructure（Prisma）
│   ├── shared/            # 共有型・定数
│   ├── logger/            # 構造化ログ
│   └── plugins/           # ResourceTypePlugin, AiProviderPlugin
├── docs/                  # SSOT 文書（実装コードを置かない）
├── scripts/
├── pnpm-workspace.yaml
├── tsconfig.base.json
└── package.json
```

Phase 3 で `packages/plugins/ai-providers/` を `packages/plugins/` 配下に追加可。

### 1.2 責務

| パス | 責務 | 依存可 |
|------|------|--------|
| `apps/web` | UI, API Client | shared, domain（型のみ） |
| `apps/api` | HTTP, Middleware, Route | domain, db, shared, logger |
| `packages/domain` | ビジネスロジック, AI Manager | shared |
| `packages/db` | Prisma, Repository 実装 | domain, shared |
| `packages/shared` | 型, 定数, エラーコード | なし |
| `packages/logger` | pino ラッパー | shared |
| `packages/plugins/*` | Plugin 実装 | domain, shared |

### 1.3 依存関係

- **apps 同士の直接依存禁止**
- **packages → apps 依存禁止**
- **domain → db 依存禁止**（Repository interface は domain、実装は db）
- **Plugin → 他 Plugin 依存禁止**
- **Core（domain/apps）→ Provider SDK 直接 import 禁止**（ADR-016）

### 1.4 追加可能範囲

| 追加 | 条件 |
|------|------|
| `apps/*` 新規 | ADR + PM 承認 |
| `packages/plugins/{name}/` | Plugin 契約（§8）+ ADR（Provider は KM 更新） |
| `packages/db/sql/*.sql` | PostgreSQL Skill レビュー |
| `apps/api/src/routes/*` | OpenAPI 同期必須 |

### 1.5 禁止事項

- `docs/` 配下に `.ts` / `.tsx` 実装ファイル
- `.cursor/context/` に Knowledge 本文複製
- `node_modules` コミット
- Architecture Freeze 対象の無断変更
- `packages/domain` から `@prisma/client` 直接 import

---

## 2. 命名規則

### 2.1 Resource

| 対象 | 規約 | 例 |
|------|------|-----|
| resource_type | kebab-case | `ai-provider`, `physical` |
| resource_id | kebab-case（論理 ID） | `server-rack-a01`, `gpt-5.5` |
| 複合参照 | `{type}:{id}` | `physical:server-rack-a01` |

### 2.2 API

| 対象 | 規約 | 例 |
|------|------|-----|
| Path | kebab-case, `/v1/` プレフィックス | `/v1/resources`, `/v1/ai/chat` |
| Path param | camelCase または type/id 分割 | `:type`, `:id` |
| Query | camelCase | `page`, `limit`, `resourceType` |
| Header | `X-URMS-*` カスタム | `X-URMS-Mode` |

### 2.3 DB / PostgreSQL

| 対象 | 規約 | 例 |
|------|------|-----|
| テーブル | snake_case 複数形 | `resources`, `audit_logs` |
| カラム | snake_case | `resource_type`, `created_at` |
| Index | `{table}_{cols}_idx` | `resources_type_status_idx` |
| View | `{name}_view` | `audit_log_summary_view` |
| Function | `{verb}_{noun}` | `search_resources` |

### 2.4 Prisma

| 対象 | 規約 | 例 |
|------|------|-----|
| Model | PascalCase 単数 | `Resource`, `AuditLog` |
| Field | camelCase（`@map` で snake） | `resourceType` → `resource_type` |
| Enum | PascalCase | `ResourceStatus` |
| Migration | Prisma 自動名 | `20260705_init` |

### 2.5 TypeScript

| 対象 | 規約 | 例 |
|------|------|-----|
| ファイル（一般） | kebab-case.ts | `resource.service.ts` |
| ファイル（React） | PascalCase.tsx | `ResourceList.tsx` |
| 変数・関数 | camelCase | `getResource` |
| 型・Interface | PascalCase | `ResourceEntity` |
| 定数 | UPPER_SNAKE_CASE | `MAX_PAGE_SIZE` |

### 2.6 React

| 対象 | 規約 | 例 |
|------|------|-----|
| Component | PascalCase | `ResourceTable` |
| Hook | `use` + PascalCase | `useResources` |
| Feature ディレクトリ | kebab-case | `features/resources/` |

### 2.7 Fastify

| 対象 | 規約 | 例 |
|------|------|-----|
| Route ファイル | kebab-case | `resources.routes.ts` |
| Plugin | `{name}.plugin.ts` | `auth.plugin.ts` |
| Service | `{domain}.service.ts` | `resource.service.ts` |

### 2.8 Plugin

| 対象 | 規約 | 例 |
|------|------|-----|
| ResourceTypePlugin ID | kebab-case | `physical`, `ai-provider-openai` |
| AiProviderPlugin ID | provider 名と一致 | `openai`, `ollama` |
| パッケージ | `packages/plugins/{id}/` | `packages/plugins/openai/` |

### 2.9 Event

| 対象 | 規約 | 例 |
|------|------|-----|
| EventType | PascalCase | `ResourceCreated` |
| payload フィールド | camelCase | `resourceType`, `actorId` |

### 2.10 AI Provider / AI Model

| 対象 | 規約 | 例 |
|------|------|-----|
| providerId | kebab-case | `openai`, `lm-studio` |
| modelId | kebab-case または vendor 形式 | `gpt-5.5`, `claude-opus` |
| Capability | kebab-case（ADR-016 固定） | `chat`, `image-generation` |

### 2.11 Environment Variable

| 規約 | 例 |
|------|-----|
| UPPER_SNAKE_CASE | `DATABASE_URL`, `JWT_SECRET` |
| プレフィックス `URMS_`（アプリ固有） | `URMS_AUTH_BYPASS` |
| Secret は `.env` のみ（gitignore） | — |

---

## 3. API 実装契約

### 3.1 REST URI

- プレフィックス: `/v1/`
- 複数形リソース名: `/v1/resources`
- ネスト最大 2 階層（例: `/v1/resources/:type/:id`）
- 動詞を URI に含めない（`createResource` 禁止 → `POST /v1/resources`）

### 3.2 Version

- URL バージョン: `/v1/`（ADR-007）
- 破壊的変更時: `/v2/` + ADR
- `Accept-Version` ヘッダは Phase 3 では不使用

### 3.3 HTTP Method

| Method | 用途 |
|--------|------|
| GET | 読取 |
| POST | 作成 |
| PATCH | 部分更新 |
| PUT | 全置換（Context のみ） |
| DELETE | 論理削除（archived） |

### 3.4 Request

- `Content-Type: application/json`
- 必須フィールド欠落 → `VALIDATION_*`
- 未知フィールド → 無視（strict モード将来検討）

### 3.5 Response（成功）

```json
{
  "data": {},
  "meta": { "page": 1, "limit": 20, "total": 100 }
}
```

単一リソース: `meta` 省略可。

### 3.6 Error Response

```json
{
  "error": {
    "code": "RESOURCE_NOT_FOUND",
    "message": "Human readable message",
    "details": [{ "field": "resourceId", "message": "..." }]
  }
}
```

### 3.7 Pagination

| Query | デフォルト | 最大 |
|-------|------------|------|
| `page` | 1 | — |
| `limit` | 20 | 100 |

### 3.8 Filtering

- 等価: `?type=physical&status=active`
- 部分一致: `?q=server`（名称）
- 複合: AND 結合

### 3.9 Sorting

- `?sort=createdAt` 昇順
- `?sort=-createdAt` 降順
- MVP: `createdAt`, `name`, `updatedAt` のみ

### 3.10 OpenAPI 生成ルール

- 正本: `apps/api/openapi.yaml`（Phase 3 作成）
- 全 `/v1/*` ルートを記載
- `@fastify/swagger` 生成時も openapi.yaml と diff レビュー必須
- 変更は PR で Reviewer 確認

---

## 4. Error Code 体系

### 4.1 命名

`{DOMAIN}_{DESCRIPTION}` — UPPER_SNAKE_CASE、安定（変更時 ADR）

### 4.2 HTTP 対応

| 分類 | HTTP | 例 |
|------|------|-----|
| Validation | 400 | `VALIDATION_REQUIRED_FIELD` |
| Auth | 401 | `AUTH_INVALID_TOKEN` |
| Authz / Mode | 403 | `MODE_NOT_ALLOWED` |
| Not Found | 404 | `RESOURCE_NOT_FOUND` |
| Conflict | 409 | `RESOURCE_DUPLICATE_ID` |
| Business | 422 | `RESOURCE_INVALID_LIFECYCLE` |
| Rate Limit | 429 | `RATE_LIMIT_EXCEEDED` |
| System | 500 | `INTERNAL_ERROR` |

### 4.3 Business Error

`RESOURCE_*`, `CONTEXT_*`, `MODE_*` — ドメインルール違反

### 4.4 Validation Error

`VALIDATION_*` — スキーマ・入力検証

### 4.5 System Error

`INTERNAL_*` — 予期しない例外（スタック非公開）

### 4.6 AI Provider Error

| Code | 説明 |
|------|------|
| `AI_PROVIDER_UNAVAILABLE` | 全 Fallback 失敗 |
| `AI_CAPABILITY_UNAVAILABLE` | Capability 不足 |
| `AI_PROVIDER_TIMEOUT` | タイムアウト |
| `AI_PROVIDER_RATE_LIMIT` | 429 |
| `AI_PROVIDER_AUTH_FAILED` | Provider 認証失敗 |

### 4.7 Plugin Error

| Code | 説明 |
|------|------|
| `PLUGIN_NOT_FOUND` | 未登録 Plugin |
| `PLUGIN_VALIDATION_FAILED` | Plugin バリデーション失敗 |
| `PLUGIN_INCOMPATIBLE_VERSION` | バージョン不一致 |

---

## 5. Resource 実装契約

### 5.1 resource_type / resource_id

- ADR-002 準拠
- 作成時 `(resourceType, resourceId)` ユニーク
- `resourceId` はユーザー指定または slug 生成（Plugin 定義）

### 5.2 ライフサイクル

```
draft → active → deprecated → archived
```

- 遷移は `packages/domain/resource/lifecycle.ts` に集約
- API: `PATCH .../lifecycle` body: `{ "status": "active" }`

### 5.3 Relation

- MVP: スキーマ準備、UI/API は Phase 3+ 後半
- relationType: kebab-case（`provided_by`, `depends_on`）

### 5.4 Metadata

- JSON object、Plugin が validate
- 秘密情報 **禁止**（Secret Store 使用）

### 5.5 Audit

- 全 CUD + lifecycle を `AuditLog` + Domain Event
- `actorId`, `mode` 必須

### 5.6 Version

- Resource 本体に `updatedAt` で楽観ロック（将来 `version` 列）
- 競合 → `RESOURCE_VERSION_CONFLICT`（422）

### 5.7 削除ルール

- 物理 DELETE 禁止（MVP）
- `archived` へ遷移 = 論理削除
- `archived` からの復帰は ADR 必須

---

## 6. Database 実装契約

### 6.1 PostgreSQL / Prisma 境界

| 領域 | 担当 |
|------|------|
| Prisma schema, migrate, CRUD | packages/db |
| Index, View, MV, Function, Trigger | packages/db/sql/ + PostgreSQL Skill |

### 6.2 Migration

- `prisma migrate dev`（開発）/ `migrate deploy`（本番）
- 破壊的変更 → ADR
- down migration は緊急時のみ

### 6.3 Index

- 検索列必須: `(resource_type, status)`, `name`
- 監査: `created_at`, `(resource_type, resource_id)`

### 6.4 View / Materialized View / Function / Trigger

- raw SQL は `packages/db/sql/` に配置
- ファイル先頭に目的・ADR 参照コメント

### 6.5 UUID

- 内部 PK: `cuid()` または `uuid()` — ADR-008 に従い Phase 3 で cuid 採用
- 論理 ID は `resource_id` 文字列

### 6.6 Timestamp

- `created_at`, `updated_at` — UTC, `timestamptz`
- Prisma `@updatedAt`

### 6.7 Soft Delete

- `status = archived` で表現（deleted_at 列は Phase 3 不使用）

---

## 7. Event 契約

### 7.1 命名

`{Aggregate}{PastTense}` — PascalCase（`ResourceCreated`）

### 7.2 Payload

```typescript
{
  eventId: string;
  eventType: string;
  eventVersion: 1;
  occurredAt: ISO8601;
  actorId: string;
  mode: string;
  payload: Record<string, unknown>;
}
```

### 7.3 Version

- `eventVersion: 1` — 破壊的変更時インクリメント + 購読者更新

### 7.4 Publisher

- Domain Service のみ（Route から直接 publish 禁止）

### 7.5 Subscriber

- `AuditHandler`, `CostTracker`（AI）等 — packages/domain 内

### 7.6 禁止事項

- 外部 MQ 直接利用（MVP）— EventBus 抽象経由のみ
- 同期 Handler 内での長時間 I/O
- Event payload に秘密情報

---

## 8. Plugin 契約

### 8.1 登録

- 起動時 `PluginRegistry.register()` / `AiProviderRegistry.register()`
- develop Mode で動的追加（Phase 3+）

### 8.2 Lifecycle

`register → active → deprecated → unregister`

### 8.3 Capability

- ResourceTypePlugin: `validateCreate`, `searchableFields`
- AiProviderPlugin: ADR-016 Capability 準拠

### 8.4 依存関係

- Plugin 間依存 **禁止**
- domain interface のみ implement

### 8.5 Version

- SemVer: `{major}.{minor}.{patch}`
- `PLUGIN_INCOMPATIBLE_VERSION` で Core 互換チェック

### 8.6 互換性

- major 不一致 → 拒否
- minor 追加 → 後方互換

---

## 9. AI Provider 契約

ADR-016 / [18-ai-provider-architecture.md](../architecture/18-ai-provider-architecture.md) 準拠。

### 9.1 アクセス

- **AI Manager のみ** — apps/api は AiManager 経由
- Core → Provider SDK **直接 import 禁止**

### 9.2 Adapter Pattern

`AiProviderAdapter` 実装 — Interface のみ Core 参照

### 9.3 Capability 判定

- Provider 名では判定しない
- 標準 Capability: `chat`, `streaming`, `reasoning`, `tools`, `structured-output`, `vision`, `image-generation`, `image-edit`, `image-variation`, `speech-to-text`, `text-to-speech`, `realtime-audio`, `audio`, `embedding`

### 9.4 Provider / Model 追加

1. `packages/plugins/ai-providers/{id}/`
2. ADR（新 Provider）→ PM 承認
3. Registry register + Resource seed + KM 更新

### 9.5 画像 / Embedding / 音声

- Core: 共通 Prompt / Request 生成
- Adapter: Provider 形式変換
- 画像結果: `generated-image` Resource
- Embedding: `embedding-model` Resource（Chat と分離）

### 9.6 Streaming / Tool Calling

- `stream()` AsyncIterable 必須（Capability: `streaming`）
- `callTools()` — Capability: `tools`

### 9.7 Secret 管理

- API Key → **Secret Store**（Resource に平文保存禁止）
- Resource metadata: `secretRef` のみ

### 9.8 Fallback

- Primary → Secondary → Local LLM → `AI_PROVIDER_UNAVAILABLE`
- トリガー: Timeout, API Error, Rate Limit, Capability 不足, Cost Policy

### 9.9 Cost 集計

- 必須: Provider, Model, Prompt/Completion Tokens, Cost, Latency, Timestamp
- `ai-usage` Resource または `ai_usage_logs` テーブル

### 9.10 Telemetry

- 全呼出: promptHash, responseHash, providerId, modelId, latencyMs
- 本文保存は設定依存（デフォルト off）

### 9.11 禁止事項

- Core から Adapter 直接 new（Registry 経由）
- Capability チェック省略
- ログへの API Key 出力

---

## 10. TypeScript 契約

### 10.1 strict

`"strict": true` — tsconfig.base.json 必須

### 10.2 type only import

`import type { X } from '...'` — 型のみは type import

### 10.3 interface / type

| 用途 | 使用 |
|------|------|
| オブジェクト形状 | `interface` 優先 |
| Union / Utility | `type` |
| 公開 API | 明示 export |

### 10.4 enum 方針

- **const object + as const** 優先（Tree shaking）
- Prisma enum は generated を使用

### 10.5 Utility Type

- `Pick`, `Omit`, `Partial` 活用
- `any` **禁止**（`unknown` + 型ガード）

### 10.6 Barrel Export

- `packages/*/src/index.ts` で公開 API のみ re-export
- 内部モジュール deep import 禁止（apps から）

### 10.7 禁止事項

- `@ts-ignore`（`@ts-expect-error` は理由コメント必須）
- 暗黙 any
- default export 乱用（React コンポーネント除く）

---

## 11. React 契約

### 11.1 Container / Presentational

- `features/*/containers/` — データ取得・状態
- `features/*/components/` — 表示のみ

### 11.2 Hook

- 1 Hook 1 責務 — `useResources`, `useMode`
- API 呼出は `lib/api-client.ts` 経由

### 11.3 State

- サーバー状態: TanStack Query（Phase 3 採用）
- UI ローカル: `useState` / `useReducer`
- グローバル: Context 最小限（Mode, Auth）

### 11.4 Context

- URMS Context Engine API との混同回避 — React Context は `AuthContext`, `ModeContext` 等

### 11.5 Suspense / Error Boundary

- ルートレベル Error Boundary 必須
- 非同期 Route は Suspense（Phase 3）

---

## 12. Fastify 契約

### 12.1 Plugin

- 認証・Mode・Logger は Fastify Plugin
- `fastify-plugin` で encapsulation 解除

### 12.2 Route

- 1 ドメイン 1 ルートファイル
- Handler は thin — Service 委譲

### 12.3 Schema

- `@fastify/type-provider-json-schema` または Zod → JSON Schema
- Request/Response スキーマ必須

### 12.4 Validation

- スキーマ外バリデーション → domain / Plugin

### 12.5 Error

- 統一 `AppError` → §4 Error Handler

### 12.6 Logging

- pino — requestId 自動付与

---

## 13. テスト契約

[15-test-architecture.md](../architecture/15-test-architecture.md) 準拠。

### 13.1 Unit

- Vitest — domain, plugins
- カバレッジ: domain 90%

### 13.2 Integration

- supertest + Testcontainers PostgreSQL
- カバレッジ: api 80%

### 13.3 E2E

- Playwright — クリティカルパス 4 シナリオ

### 13.4 Coverage

- CI で閾値未達 → fail

### 13.5 Fixture

- `tests/fixtures/` — 匿名化データ

### 13.6 Mock

- Provider: AiProviderAdapter mock
- DB: Testcontainers 優先（in-memory 禁止）

### 13.7 Snapshot

- UI スナップショット最小限 — 変更時意図確認必須

---

## 14. Logging 契約

### 14.1 Pino

- JSON 構造 — packages/logger 経由

### 14.2 Correlation ID / Request ID

- `reqId` — Fastify 自動 + `X-Request-Id` 応答

### 14.3 AI Usage

- 別ストリーム — ai_audit_logs / ai-usage（§9.10）

### 14.4 Audit

- DB append-only — Application Log と分離

### 14.5 Mask 対象

- `authorization`, `apiKey`, `password`, `secret`, JWT 全文

---

## 15. コメント規約

| Tag | 用途 |
|-----|------|
| `TODO` | 未実装（Issue/Backlog ID 推奨） |
| `FIXME` | 既知バグ |
| `NOTE` | 非自明な理由 |
| `HACK` | 暫定回避（ADR または期限必須） |
| `@deprecated` | JSDoc — 代替を明記 |

**ADR 参照:** `// ADR-016: Provider access via AI Manager only`

---

## 16. Git 契約

[git-workflow Skill](.cursor/skills/git-workflow/SKILL.md) 準拠。

### 16.1 Branch

- `main` — 保護
- `feature/{backlog-id}-{slug}` — 例: `feature/B-007-resource-crud`

### 16.2 Commit

- Conventional Commits: `feat:`, `fix:`, `docs:`, `refactor:`, `test:`
- 1 コミット 1 論点

### 16.3 Tag

- リリース: `v{major}.{minor}.{patch}` — MVP: `v0.2.0-mvp`

### 16.4 PR

- PM 承認ゲート前: Reviewer + Tester CI 合格
- 説明に Backlog ID, ADR リンク

### 16.5 Merge

- squash merge 推奨（main 履歴整理）

### 16.6 Release / Version

- SemVer — Architecture 破壊的変更 → major

---

## 17. セキュリティ契約

### 17.1 Secret

- Secret Store + `.env`（gitignore）
- Resource metadata に秘密禁止

### 17.2 Environment

- 本番 Secret は CI/CD またはホスト注入

### 17.3 JWT / OIDC

- ADR-010 — Bearer JWT, OIDC 本番

### 17.4 RBAC + Mode

- 二層認可 — Route で両方チェック

### 17.5 入力検証

- JSON Schema + domain 検証

### 17.6 SQL Injection

- Prisma パラメータバインド — raw SQL は `sql` テンプレート + レビュー

### 17.7 XSS

- React デフォルトエスケープ — `dangerouslySetInnerHTML` 禁止

### 17.8 CSRF

- JWT Bearer のため MVP は CSRF トークン不要（Cookie セッション導入時再評価）

### 17.9 Rate Limit

- `@fastify/rate-limit` — API 全体 + AI エンドポイント厳格

---

## 18. Definition of Ready（DoR）

実装タスク開始前に **すべて** 満たすこと:

| # | 条件 |
|---|------|
| 1 | Backlog にタスク ID・DoD 明記 |
| 2 | 関連 ADR / Architecture / 本 Contract 参照可能 |
| 3 | Architecture Freeze 範囲内 |
| 4 | PM 割当済み |
| 5 | 依存タスク完了 |
| 6 | IdP 未決定タスクは Phase 3 ブロック（B-010 等）を確認 |
| 7 | OpenAPI 影響がある場合、更新計画あり |

---

## 19. Definition of Done（DoD）

実装タスク完了条件:

| # | 条件 |
|---|------|
| 1 | 本 Contract + Architecture 準拠 |
| 2 | Unit / Integration テスト合格 |
| 3 | カバレッジ閾値達成 |
| 4 | ESLint + Prettier 合格 |
| 5 | OpenAPI 同期（API 変更時） |
| 6 | 秘密情報コミットなし |
| 7 | Reviewer 承認 |
| 8 | Tester ゲート合格 |
| 9 | 必要時 Document Writer / KM 更新 |

---

## 20. 実装禁止事項

| # | 禁止 | 参照 |
|---|------|------|
| 1 | Architecture Freeze 無断変更 | architecture-history |
| 2 | SSOT 違反（Knowledge 複製） | VISION |
| 3 | Context への本文複製 | ADR-004 |
| 4 | Core → Provider SDK 直接呼出 | ADR-016 |
| 5 | Plugin 間依存 | §8 |
| 6 | 命名規則違反 | §2 |
| 7 | Resource 物理 DELETE | §5.7 |
| 8 | API Key を Resource に保存 | ADR-016 |
| 9 | `any` 乱用 | §10 |
| 10 | PM / Architect 承認なしスコープ外実装 | VISION |

---

## 変更履歴

| 日付 | 変更 |
|------|------|
| 2026-07-05 | v1.0 初版（Phase 2.5） |
