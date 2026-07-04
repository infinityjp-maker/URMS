# ADR-019: Feature Flag Policy

> **resource_type:** decision  
> **resource_id:** decision:ADR-019  
> **status:** accepted  
> **date:** 2026-07-05  
> **author:** Architect + PM

## コンテキスト

MVP を段階的にリリースし、未完成機能や実験機能を本番で安全に制御する必要がある。Architecture Freeze を変更せず、Runtime 切替のみで機能を有効化する方針が必要。

## 決定

### 1. 管理方式

| 層 | 方式 |
|----|------|
| 設定 | 環境変数 + DB `feature_flags` テーブル（Phase 3） |
| 評価 | `packages/shared/feature-flags.ts` — 単一 API |
| デフォルト | コード内 default → 環境 override |

**3 環境:**

| 環境 | 用途 | Flag 方針 |
|------|------|-----------|
| **development** | ローカル | 大多数 on（experimental 除く） |
| **staging** | 検証 | 本番相当 + 新機能 preview |
| **production** | 本番 | 最小 on、experimental 常 off |

### 2. Flag 命名

`ff.{domain}.{feature}` — kebab-case

| ドメイン | 例 |
|----------|-----|
| ai | `ff.ai.enabled`, `ff.ai.fallback` |
| plugin | `ff.plugin.dynamic-load` |
| audit | `ff.audit.export`, `ff.audit.prompt-body` |
| search | `ff.search.fulltext` |
| context | `ff.context.export`, `ff.context.body-store` |
| experimental | `ff.experimental.*` |

### 3. 対象機能

| 領域 | Flag | MVP デフォルト（prod） |
|------|------|------------------------|
| **AI** | `ff.ai.enabled` | off → S7 後 staging on |
| **Plugin** | `ff.plugin.dynamic-load` | off |
| **Audit** | `ff.audit.export` | on |
| **Audit** | `ff.audit.prompt-body` | off |
| **Search** | `ff.search.fulltext` | off（Phase 4） |
| **Context** | `ff.context.export` | on |
| **Experimental** | `ff.experimental.*` | off |

### 4. 実装ルール

- Flag チェックは **Application 層**（Route / Service）— domain 核心ロジックに分散禁止
- Flag 削除: 機能 GA 後 1 Sprint 以内に Flag コード削除（ADR 不要、PM 承認）
- 新 Flag 追加: Sprint Planning 更新 + glossary（ADR 不要、軽量変更）

### 5. 禁止

- Flag で Architecture / Contract を迂回しない
- Flag OFF 時もセキュリティ要件（認証・監査）は維持

## 理由

- MVP 段階リリース（S7 AI 等）
- 本番リスク低減
- ADR-016 AI Provider 段階有効化

## 影響

- [04-sprint-planning.md](../../implementation/04-sprint-planning.md) S7, S8
- [05-development-roadmap.md](../../implementation/05-development-roadmap.md)

## 関連

- [ADR-005](./ADR-005-mvp-scope.md)
- [ADR-016](./ADR-016-ai-provider-abstraction.md)
- [ADR-018](./ADR-018-versioning-policy.md)
