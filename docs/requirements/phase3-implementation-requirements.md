# Phase 3 実装要件（Sprint 対応）

> **resource_type:** knowledge  
> **resource_id:** knowledge:phase3-implementation-requirements  
> **version:** 1.0  
> **phase:** 3  
> **status:** approved — 2026-07-05  
> **owner:** PM + Architect

## 参照

- [mvp-definition.md](./mvp-definition.md)
- [04-sprint-planning.md](../implementation/04-sprint-planning.md)
- [01-implementation-contract.md](../implementation/01-implementation-contract.md)
- [ui-requirements.md](./ui-requirements.md)

---

## 1. 目的

Phase 3 MVP 実装（Sprint S1〜S10）の **受入要件** を Sprint 単位で定義する。Contract が実装 SSOT、本書は **要件 → Sprint → 受入** のトレーサビリティ。

---

## 2. トレーサビリティ

| 層 | 正本 |
|----|------|
| ビジネス要求 | VISION, FR-xxx（Requirements Spec） |
| ユースケース | use-cases.md |
| 実装要件 | **本書** |
| 実装契約 | Contract |
| 計画 | Sprint Planning |

---

## 3. Sprint 別受入要件

### S1 — Monorepo（完了）

| 要件 ID | 受入条件 | 状態 |
|---------|----------|------|
| IR-S1-01 | pnpm workspace 動作 | ✅ |
| IR-S1-02 | `@urms/shared` 型・Contract Loader 骨格 | ✅ |
| IR-S1-03 | `@urms/domain` 骨格 | ✅ |
| IR-S1-04 | `@urms/web` 起動・空ダッシュボード | ✅ |
| IR-S1-05 | build / lint / typecheck 成功 | ✅ |

### S2 — Domain

| 要件 ID | 受入条件 | 関連 FR / UC |
|---------|----------|--------------|
| IR-S2-01 | Resource エンティティ + ライフサイクル | FR-004, UC-003 | ✅ |
| IR-S2-02 | ModePolicy（plan/operate/audit） | FR-010, FR-011, UC-005 | ✅ |
| IR-S2-03 | Domain Event 型 + in-process Bus | FR-040 | ✅ |
| IR-S2-04 | AppError + Repository interfaces | Contract §4, §6 | ✅ |
| IR-S2-05 | domain unit tests 90% 目標 | NFR-003 | ✅ |

### S3 — Database

| 要件 ID | 受入条件 | 関連 | 状態 |
|---------|----------|------|------|
| IR-S3-01 | Prisma schema（Resource, Context, Audit, User） | Contract §6 | ✅ |
| IR-S3-02 | migration 実行可能 | — | ✅ |
| IR-S3-03 | Repository 実装 + Testcontainers | — | ✅ |
| IR-S3-04 | 論理 DELETE のみ | Contract §5.7 | ✅ |

### S4 — API

| 要件 ID | 受入条件 | 関連 FR / UC | 状態 |
|---------|----------|--------------|------|
| IR-S4-01 | Fastify `/v1/` + OpenAPI 同期 | FR-002〜005 | ✅ |
| IR-S4-02 | Resource CRUD API | UC-001〜004 | ✅ |
| IR-S4-03 | Mode middleware + RBAC 骨格 | FR-011, U-001 前は mock auth | ✅ |
| IR-S4-04 | Audit API | UC-008, FR-040 | ✅ |
| IR-S4-05 | `/health` | — | ✅ |
| IR-S4-06 | api 80% coverage 目標 | NFR-003 | ✅（骨格 + 単体 4 / 結合 3） |

### S5 — Web

| 要件 ID | 受入条件 | 関連 | 状態 |
|---------|----------|------|------|
| IR-S5-01 | [ui-requirements.md](./ui-requirements.md) SCR-02〜05, 07, 08 | UC-001〜005, UC-008, UC-010 | ✅ |
| IR-S5-02 | Mode Switcher（UI-M01〜04） | — | ✅ |
| IR-S5-03 | API Client + エラー表示 | UI-N01, UI-N02 | ✅ |
| IR-S5-04 | web 70% coverage 目標 | NFR-003 | ✅（mode-ui 単体） |

### S6 — Context Engine

| 要件 ID | 受入条件 | 関連 | 状態 |
|---------|----------|------|------|
| IR-S6-01 | Context API GET/PUT | FR-020, FR-021, UC-006, UC-007 | ✅ |
| IR-S6-02 | SCR-06 実装 | ui-requirements | ✅ |
| IR-S6-03 | summary 500 字検証 | ADR-004 | ✅ |
| IR-S6-04 | SCR-09 AI Team 参照 | UC-009, FR-030 | ✅ |

### S7 — AI Manager

| 要件 ID | 受入条件 | 関連 | 状態 |
|---------|----------|------|------|
| IR-S7-01 | AI Manager + Ollama Adapter | ADR-016, FR（AI 連携） | ✅ |
| IR-S7-02 | `/v1/ai/*` + Feature Flag | ADR-019 | ✅ |
| IR-S7-03 | ai-usage 記録 | ADR-016 | ✅ |
| IR-S7-04 | Core → Provider 直 import なし | Contract §9 | ✅ |

### S8 — Plugin

| 要件 ID | 受入条件 | 関連 | 状態 |
|---------|----------|------|------|
| IR-S8-01 | Plugin Registry | ADR-009 | ✅ |
| IR-S8-02 | ResourceTypePlugin 1 種以上 | FR-002 | ✅ |
| IR-S8-03 | SemVer 互換 | ADR-018 | ✅ |

### S9 — Testing

| 要件 ID | 受入条件 | 関連 |
|---------|----------|------|
| IR-S9-01 | Playwright E2E 4 シナリオ | Contract §13.3 |
| IR-S9-02 | Coverage CI gate | Quality Gate §6 |
| IR-S9-03 | UC-001, 002, 005, 006 相当 E2E | use-cases |

### S10 — Docker / CI

| 要件 ID | 受入条件 | 関連 |
|---------|----------|------|
| IR-S10-01 | docker-compose 起動 | ADR-014 |
| IR-S10-02 | GitHub Actions CI green | — |
| IR-S10-03 | `.env.example` 整備 | — |
| IR-S10-04 | tag `v0.2.0-mvp` | ADR-018 |

---

## 4. 未決事項（要件ブロッカー）

| ID | 項目 | 影響 Sprint | 回避 |
|----|------|-------------|------|
| U-001 | IdP 選定 | S4 本番 / S10 | dev mock auth |
| U-003 | TanStack Query | S5 | fetch + useState MVP |
| U-004 | Secret Store | S7 | env + 将来 secretRef |

---

## 5. 承認

| ロール | 状態 | 日付 |
|--------|------|------|
| Architect | レビュー済（Sprint Plan 整合） | 2026-07-05 |
| Tester | レビュー済（受入・E2E 整合） | 2026-07-05 |
| PM | 承認 | 2026-07-05 |
| User | **承認** | 2026-07-05 |

## 変更履歴

| 日付 | 変更 |
|------|------|
| 2026-07-05 | v1.0 初版 |
