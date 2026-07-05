# Phase 4 Readiness — PM 提案

> **resource_type:** knowledge  
> **resource_id:** knowledge:phase4-readiness  
> **version:** 1.3  
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
| 2026-07-05 | **Phase 4 Go** | S11 から着手 |
| 2026-07-05 | **ログイン画面不要** | 起動後すぐ操作 · UI にログインフォームを置かない |

---

## S11 進捗（ローカル単一ユーザー）

| 項目 | 状態 |
|------|------|
| ローカル認証 API（内部用 · 任意） | ✅ `POST /v1/auth/login` |
| 開発確認用 bypass | ✅ デフォルト（暫定 Web UI はそのまま） |
| **ログイン画面（UI）** | ❌ **不要 — User 決定** |
| 本番 UI | OS ユーザーで即操作（Phase 5 で本格化） |

---

## Phase 4 Sprint 概要

| Sprint | 名称 | Version |
|--------|------|---------|
| **S11** | **ローカル単一ユーザー方針**（進行中） | v0.3.0-alpha |
| S12 | 監視 · ログ集約 | v0.3.0-beta |
| S13 | 性能 · セキュリティ監査 | v0.3.0 |

---

## User の日常作業

| 項目 | 内容 |
|------|------|
| 普段 | **作業なし** |
| 確認 | 暫定 Web UI（`:5173`）— ログイン操作なし |

---

## 変更履歴

| 日付 | 変更 |
|------|------|
| 2026-07-05 | v1.2 — User Go · S11 着手 |
| 2026-07-05 | v1.3 — ログイン画面不要 |
