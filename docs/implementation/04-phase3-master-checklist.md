# Phase 3 Master Checklist

> **resource_type:** knowledge  
> **resource_id:** knowledge:phase3-checklist  
> **version:** 1.0  
> **phase:** 3  
> **owner:** PM + Developer

実装開始後の進捗確認用。**Architecture Freeze + Contract 準拠**。

参照: [03-phase3-readiness.md](./03-phase3-readiness.md) | [01-implementation-contract.md](./01-implementation-contract.md)

---

## A. Monorepo 基盤

- [ ] `pnpm-workspace.yaml` 作成
- [ ] ルート `package.json`
- [ ] `tsconfig.base.json`
- [ ] `.npmrc` / pnpm 設定
- [ ] `packages/shared` 作成
- [ ] `packages/shared` エラーコード定数
- [ ] `packages/shared` 共有型（Resource, Mode）
- [ ] ESLint ルート設定
- [ ] Prettier 連携確認
- [ ] `pnpm install` 成功
- [ ] `pnpm lint` スクリプト
- [ ] `pnpm test` スクリプト
- [ ] `pnpm build` スクリプト
- [ ] Turbo 導入（Could — 未導入でも可）

---

## B. packages/domain

- [ ] パッケージ骨格
- [ ] `Resource` entity
- [ ] `ResourceStatus` lifecycle
- [ ] `ResourceRepository` interface
- [ ] `ResourceTypePlugin` interface
- [ ] `PluginRegistry`
- [ ] `Mode` enum + `ModePolicy`
- [ ] `ContextSnapshot` 型
- [ ] `DomainEvent` 型 + `EventBus` interface
- [ ] `InProcessEventBus` 実装
- [ ] `AuditHandler` subscriber
- [ ] `AppError` 基底
- [ ] Unit tests（domain 90% 目標）

---

## C. packages/db

- [ ] パッケージ骨格
- [ ] `schema.prisma` — Resource
- [ ] `schema.prisma` — ContextSnapshot
- [ ] `schema.prisma` — AuditLog
- [ ] `schema.prisma` — User
- [ ] 初回 migration
- [ ] `PrismaClient` singleton
- [ ] `ResourceRepository` 実装
- [ ] `ContextRepository` 実装
- [ ] `AuditLogRepository` 実装
- [ ] Index（resource_type, status, name）
- [ ] Integration tests（Testcontainers）

---

## D. packages/logger

- [ ] パッケージ骨格
- [ ] pino ラッパー
- [ ] 秘密マスク設定
- [ ] requestId 連携

---

## E. packages/plugins — Resource Type

- [ ] `physical` plugin
- [ ] `digital` plugin
- [ ] `human` plugin
- [ ] `knowledge` plugin
- [ ] システム Type plugins（role, rule, command, skill, context, decision, team）
- [ ] Plugin 登録（domain registry）

---

## F. apps/api — Fastify

- [ ] パッケージ骨格（Vite 不使用）
- [ ] `server.ts`
- [ ] CORS / Helmet
- [ ] Rate limit
- [ ] Auth plugin（mock JWT 開発）
- [ ] Mode middleware（`X-URMS-Mode`）
- [ ] Error handler（Contract §4）
- [ ] Logger plugin
- [ ] `GET /health`
- [ ] OpenAPI / Swagger 設定
- [ ] `openapi.yaml` 正本

---

## G. apps/api — Routes

- [ ] `GET/POST /v1/resources`
- [ ] `GET/PATCH/DELETE /v1/resources/:type/:id`
- [ ] `PATCH /v1/resources/:type/:id/lifecycle`
- [ ] `GET/PUT /v1/context`
- [ ] `GET /v1/modes`, `/v1/modes/current`
- [ ] `GET /v1/knowledge/decisions`
- [ ] `GET /v1/knowledge/glossary`
- [ ] `GET /v1/audit/logs`
- [ ] Route schema 検証
- [ ] Integration tests（supertest）

---

## H. AI Manager（ADR-016）

- [ ] `packages/domain/src/ai/ai-manager.ts`
- [ ] `provider-registry.ts`
- [ ] `routing-engine.ts`（Task→Role→Project→System）
- [ ] `fallback-chain.ts`
- [ ] `config-resolver.ts`
- [ ] `cost-tracker.ts`
- [ ] `AiProviderAdapter` interface
- [ ] `AiProviderPlugin` interface
- [ ] Secret Store 抽象（interface）
- [ ] Capability 検証
- [ ] AI audit log 記録
- [ ] `GET /v1/ai/providers`（Phase 3 後半）
- [ ] `POST /v1/ai/chat`（Phase 3 後半）

---

## I. AI Provider Adapters（段階的）

- [ ] `packages/plugins/ai-providers/ollama/`
- [ ] Ollama Adapter + Plugin
- [ ] OpenAI Adapter + Plugin
- [ ] Anthropic Adapter（Should）
- [ ] Custom / OpenAI-compatible Adapter
- [ ] Adapter Unit tests（mock HTTP）
- [ ] Fallback chain 設定 Resource
- [ ] `ai-usage` 記録

---

## J. apps/web — React

- [ ] Vite + React + TS 骨格
- [ ] ルーティング
- [ ] API client（`lib/api-client.ts`）
- [ ] Auth context（mock）
- [ ] Mode switcher UI
- [ ] Resource 一覧
- [ ] Resource 詳細
- [ ] Resource 作成/編集
- [ ] Context Dashboard
- [ ] Knowledge / ADR 参照
- [ ] Error boundary
- [ ] TanStack Query 導入

---

## K. Context Engine

- [ ] Context API 実装
- [ ] summary 500 文字検証
- [ ] ssotLinks 許可 prefix 検証
- [ ] Context Dashboard UI
- [ ] plan Mode のみ PUT

---

## L. Mode System

- [ ] ModePolicy 実装
- [ ] API middleware 連携
- [ ] UI show/hide 制御
- [ ] audit Mode 読取専用

---

## M. Event / Audit

- [ ] ResourceCreated/Updated events
- [ ] AuditHandler → audit_logs
- [ ] Audit API（audit Mode）
- [ ] append-only 保証

---

## N. Test

- [ ] Vitest 設定（monorepo）
- [ ] domain unit tests
- [ ] api integration tests
- [ ] Playwright E2E 設定
- [ ] E2E: Resource CRUD
- [ ] E2E: Mode 切替
- [ ] E2E: Context 表示
- [ ] E2E: Audit 参照
- [ ] Coverage CI ゲート

---

## O. Logging

- [ ] 構造化 JSON ログ
- [ ] Request ID
- [ ] AI usage ログ分離
- [ ] マスク検証

---

## P. Docker / Deploy

- [ ] `docker-compose.yml`
- [ ] PostgreSQL service
- [ ] api Dockerfile
- [ ] web Dockerfile
- [ ] nginx 設定（Should）
- [ ] `.env.example`
- [ ] ヘルスチェック

---

## Q. CI

- [ ] GitHub Actions workflow
- [ ] lint job
- [ ] test job
- [ ] build job
- [ ] PR 必須チェック

---

## R. Seed / AI Team

- [ ] AI Team Resource seed スクリプト
- [ ] ADR / Glossary read-only API 接続
- [ ] 初回データ投入手順 docs

---

## S. 完了ゲート（MVP）

- [ ] UC-001〜010 手動検証
- [ ] Contract DoD 全項目
- [ ] Reviewer 承認
- [ ] Tester ゲート合格
- [ ] PM MVP 完了宣言

---

## 変更履歴

| 日付 | 変更 |
|------|------|
| 2026-07-05 | v1.0 初版 |
