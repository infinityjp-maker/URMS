# ADR-018: Versioning Policy

> **resource_type:** decision  
> **resource_id:** decision:ADR-018  
> **status:** accepted  
> **date:** 2026-07-05  
> **author:** Architect + PM

## コンテキスト

Phase 3 MVP を Sprint 単位で実装する。Application、API、Plugin、Resource、Schema、AI Capability のバージョン方針が未定義だと互換性破壊リスクがある。Architecture Freeze（ADR-006〜016）および Contract（ADR-017）を維持したまま、バージョン管理を固定する必要がある。

## 決定

### 1. 基本方針

**Semantic Versioning 2.0.0**（`MAJOR.MINOR.PATCH`）を採用する。

| 変更 | バージョン |
|------|------------|
| 破壊的変更 | MAJOR |
| 後方互換機能追加 | MINOR |
| バグ修正 | PATCH |

### 2. Application

- Monorepo 全体: 単一バージョン（`package.json` root `version`）
- MVP リリース: `v0.2.0-mvp`（pre-release タグ可）
- GA: `v1.0.0`

### 3. API

- URL バージョン: **`/v1/`** プレフィックス（ADR-007 維持）
- 破壊的 API 変更 → `/v2/` + ADR 必須
- OpenAPI `info.version` は Application バージョンと同期

### 4. Plugin

```typescript
interface PluginVersion {
  id: string;
  version: string;  // SemVer
  compatibleCore: string;  // e.g. "^0.2.0"
}
```

| 互換性 | ルール |
|--------|--------|
| major 不一致 | 登録拒否（`PLUGIN_INCOMPATIBLE_VERSION`） |
| minor 追加 | 後方互換 — Core 変更なし |
| patch | 互換 |

**ResourceTypePlugin / AiProviderPlugin** 共通。

### 5. Resource

- `resource_type` / `resource_id` 規約変更 → ADR 必須（MAJOR 相当）
- metadata schema 拡張 → Plugin minor
- ライフサイクル遷移追加 → ADR + MINOR

### 6. Schema（Prisma / PostgreSQL）

- 破壊的 migration → ADR 必須
- 追加列・nullable → MINOR
- Index / View 追加 → PATCH または MINOR（性能影響による）

### 7. AI Provider Capability

- 標準 Capability（kebab-case 14 種）追加 → **ProviderCapability 拡張のみ**（Core 不変、ADR-016）
- 新 Capability 名は glossary + ADR 記録
- Adapter `version` は Plugin SemVer に従う

## 理由

- 10年保守: 互換性明示
- Sprint コミットポイントと tag 整合
- Plugin エコシステムの安全な拡張

## 影響

- [04-sprint-planning.md](../../implementation/04-sprint-planning.md)
- [05-development-roadmap.md](../../implementation/05-development-roadmap.md)
- Contract §8 Plugin 互換

## 関連

- [ADR-007](./ADR-007-api-architecture.md)
- [ADR-009](./ADR-009-plugin-architecture.md)
- [ADR-016](./ADR-016-ai-provider-abstraction.md)
- [ADR-017](./ADR-017-implementation-contract.md)
