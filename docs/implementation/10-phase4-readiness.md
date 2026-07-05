# Phase 4 Readiness — PM 提案

> **resource_type:** knowledge  
> **resource_id:** knowledge:phase4-readiness  
> **version:** 1.2  
> **phase:** 4 — **S11 進行中**  
> **status:** **User Go 承認済 — 2026-07-05**  
> **owner:** PM

## 参照

- [roadmap.md](../project/roadmap.md)
- [ADR-022-local-authentication.md](../project/decisions/ADR-022-local-authentication.md)
- **User 向け Canvas:** `canvases/urms-progress-plan.canvas.tsx`

---

## User 決定（記録）

| 日付 | 判断 | 内容 |
|------|------|------|
| 2026-07-05 | **IdP 不要** | ローカルアプリ · ADR-022 |
| 2026-07-05 | **Phase 4 Go** | S11 ローカル認証から着手 |

---

## S11 進捗（ローカル認証）

| 項目 | 状態 |
|------|------|
| `POST /v1/auth/login` | ✅ 実装 |
| JWT 検証（`URMS_AUTH_MODE=local`） | ✅ 実装 |
| User テーブル `password_hash` | ✅ migration |
| 初回ユーザー seed | `pnpm --filter @urms/db db:seed-local` |
| 暫定 Web UI ログイン画面 | ⏳ 次 |

---

## Phase 4 Sprint 概要

| Sprint | 名称 | Version |
|--------|------|---------|
| **S11** | **ローカル認証**（進行中） | v0.3.0-alpha |
| S12 | 監視 · ログ集約 | v0.3.0-beta |
| S13 | 性能 · セキュリティ監査 | v0.3.0 |

---

## User の日常作業

| 項目 | 内容 |
|------|------|
| 普段 | **作業なし** |
| 確認 | 暫定 Web UI（`:5173`） |

---

## 変更履歴

| 日付 | 変更 |
|------|------|
| 2026-07-05 | v1.0 — PM 提案初版 |
| 2026-07-05 | v1.1 — IdP 不要 · ADR-022 |
| 2026-07-05 | v1.2 — User Go · S11 着手 |
