# URMS Sprint Planning（Phase 3 MVP）

> **resource_type:** knowledge  
> **resource_id:** knowledge:sprint-planning  
> **version:** 1.0  
> **phase:** 2.7  
> **status:** draft — PM 承認待ち  
> **owner:** PM + Architect

## 参照

- [01-implementation-contract.md](./01-implementation-contract.md) — 実装契約 SSOT
- [02-developer-playbook.md](./02-developer-playbook.md)
- [06-phase3-master-checklist.md](./06-phase3-master-checklist.md)
- [05-development-roadmap.md](./05-development-roadmap.md)
- [mvp-definition.md](../requirements/mvp-definition.md)
- [ADR-018](../project/decisions/ADR-018-versioning-policy.md)
- [ADR-019](../project/decisions/ADR-019-feature-flag-policy.md)

**Architecture Freeze 維持。** ADR-006〜017 は変更しない。

---

## Sprint 一覧

| Sprint | 名称 | 期間（目安） | コミットポイント |
|--------|------|--------------|------------------|
| S1 | Monorepo 構築 | 2〜3 日 | CP-1 |
| S2 | Domain | 3〜4 日 | CP-2 |
| S3 | Database | 3〜4 日 | CP-3 |
| S4 | API 基盤 | 3〜4 日 | CP-4 |
| S5 | Web 基盤 | 3〜4 日 | CP-5 |
| S6 | Context Engine | 2〜3 日 | CP-6 |
| S7 | AI Manager | 4〜5 日 | CP-7 |
| S8 | Plugin | 3〜4 日 | CP-8 |
| S9 | Testing | 3〜4 日 | CP-9 |
| S10 | Docker・CI/CD | 2〜3 日 | CP-10 / v0.2.0-mvp |

---

## Sprint 1 — Monorepo 構築

| 項目 | 内容 |
|------|------|
| **目的** | pnpm workspace と TypeScript 基盤を確立 |
| **Package** | `packages/shared`, ルート設定 |
| **App** | — |
| **依存** | なし |
| **実装範囲** | pnpm-workspace, tsconfig.base, ESLint/Prettier, shared 型・エラーコード |
| **DoD** | `pnpm install`, `pnpm lint` 成功；Contract §1, §10 準拠 |
| **レビューゲート** | Reviewer: 依存方向 / Architect: Monorepo 整合 |
| **Tester** | lint スクリプト実行確認 |
| **CP-1** | `chore: initialize monorepo workspace (S1)` |

---

## Sprint 2 — Domain

| 項目 | 内容 |
|------|------|
| **目的** | ドメインコア（Resource, Mode, Event） |
| **Package** | `packages/domain` |
| **App** | — |
| **依存** | S1 |
| **実装範囲** | Resource entity, lifecycle, ModePolicy, EventBus, AppError, Repository interfaces |
| **DoD** | domain unit tests 90% 目標；ADR-002, ADR-003, ADR-011 準拠 |
| **レビューゲート** | Reviewer: Resource First / Architect: 層境界 |
| **Tester** | lifecycle / ModePolicy テスト合格 |
| **CP-2** | `feat(domain): add resource mode and event core (S2)` |

---

## Sprint 3 — Database

| 項目 | 内容 |
|------|------|
| **目的** | Prisma schema と Repository 実装 |
| **Package** | `packages/db` |
| **App** | — |
| **依存** | S2 |
| **実装範囲** | Resource, ContextSnapshot, AuditLog, User；migration；Repository impl |
| **DoD** | migrate 成功；Testcontainers integration；Contract §6 準拠 |
| **レビューゲート** | Architect: Prisma/PG 境界 / Reviewer: 命名 |
| **Tester** | integration tests 合格 |
| **CP-3** | `feat(db): add prisma schema and repositories (S3)` |

---

## Sprint 4 — API 基盤

| 項目 | 内容 |
|------|------|
| **目的** | Fastify + Resource/Mode/Audit API |
| **Package** | `apps/api`, `packages/logger` |
| **App** | `apps/api` |
| **依存** | S3 |
| **実装範囲** | server, auth mock, mode middleware, error handler, `/v1/resources`, `/v1/audit`, `/health`, openapi.yaml |
| **DoD** | OpenAPI 同期；Contract §3, §12；UC-001〜004, UC-008  API 層 |
| **レビューゲート** | Reviewer: API 契約 / Architect: ADR-007 |
| **Tester** | supertest integration |
| **CP-4** | `feat(api): add resource and audit routes (S4)` |

---

## Sprint 5 — Web 基盤

| 項目 | 内容 |
|------|------|
| **目的** | React UI + Resource CRUD |
| **Package** | — |
| **App** | `apps/web` |
| **依存** | S4 |
| **実装範囲** | Vite, routing, API client, Mode switcher, Resource 一覧/詳細/編集 |
| **DoD** | Contract §11；TanStack Query（U-003 確定後） |
| **レビューゲート** | Reviewer: Container/Presentational |
| **Tester** | コンポーネント smoke |
| **CP-5** | `feat(web): add resource management ui (S5)` |

---

## Sprint 6 — Context Engine

| 項目 | 内容 |
|------|------|
| **目的** | Context API + Dashboard |
| **Package** | `packages/domain/context`（拡張） |
| **App** | `apps/api`, `apps/web` |
| **依存** | S4, S5 |
| **実装範囲** | GET/PUT `/v1/context`；summary 検証；Dashboard UI；plan Mode のみ更新 |
| **DoD** | ADR-004；SSOT リンクのみ；UC-006, UC-007 |
| **レビューゲート** | Reviewer: SSOT 違反なし |
| **Tester** | Context validation tests |
| **CP-6** | `feat: add context engine api and dashboard (S6)` |

---

## Sprint 7 — AI Manager

| 項目 | 内容 |
|------|------|
| **目的** | AI Manager + 最小 Adapter |
| **Package** | `packages/domain/ai`, `packages/plugins/ai-providers/ollama` |
| **App** | `apps/api` |
| **依存** | S2, S4；U-004 Secret Store 設計 |
| **実装範囲** | AiManager, Registry, Routing, Fallback, CostTracker；Ollama Adapter；`/v1/ai/*`（Feature Flag: ADR-019） |
| **DoD** | ADR-016；Core→Provider 直接参照なし |
| **レビューゲート** | Architect: AI Provider 整合 |
| **Tester** | Adapter mock tests |
| **CP-7** | `feat(ai): add ai manager and ollama adapter (S7)` |

---

## Sprint 8 — Plugin

| 項目 | 内容 |
|------|------|
| **目的** | ResourceTypePlugin + 追加 Provider |
| **Package** | `packages/plugins/*` |
| **App** | — |
| **依存** | S2, S7 |
| **実装範囲** | physical/digital/human/knowledge plugins；OpenAI Adapter（Should）；PluginRegistry 統合 |
| **DoD** | Contract §8；ADR-009, ADR-018 Plugin 互換 |
| **レビューゲート** | Reviewer: Plugin 依存なし |
| **Tester** | Plugin validation tests |
| **CP-8** | `feat(plugins): add resource type and provider plugins (S8)` |

---

## Sprint 9 — Testing

| 項目 | 内容 |
|------|------|
| **目的** | E2E + カバレッジゲート |
| **Package** | 全 workspace |
| **App** | web, api |
| **依存** | S1〜S8 |
| **実装範囲** | Playwright E2E（UC-001〜010）；coverage CI；Contract §13 |
| **DoD** | domain 90%, api 80%；E2E 4 シナリオ合格 |
| **レビューゲート** | Tester ゲート必須 |
| **Tester** | 全テスト green |
| **CP-9** | `test: add e2e and coverage gates (S9)` |

---

## Sprint 10 — Docker・CI/CD

| 項目 | 内容 |
|------|------|
| **目的** | デプロイ可能 MVP |
| **Package** | ルート, scripts |
| **App** | api, web |
| **依存** | S9 |
| **実装範囲** | docker-compose, Dockerfiles, GitHub Actions, `.env.example` |
| **DoD** | ADR-014；`/health`；Contract §16 |
| **レビューゲート** | PM MVP 完了レビュー |
| **Tester** | CI green |
| **CP-10** | `chore: add docker and ci pipeline (S10)` → tag `v0.2.0-mvp` |

---

## 横断ルール

| 項目 | ルール |
|------|--------|
| DoR | Playbook §2 + Contract §18 |
| DoD | Contract §19 + 各 Sprint DoD |
| レビュー | 各 Sprint 完了 → Reviewer → Tester → PM |
| Feature Flag | ADR-019 — 本番前に Flag 確認 |
| Version | ADR-018 — Plugin/API 変更時 SemVer |

---

## 変更履歴

| 日付 | 変更 |
|------|------|
| 2026-07-05 | v1.0 初版（Phase 2.7） |
