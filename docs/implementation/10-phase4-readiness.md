# Phase 4 Readiness — PM 提案

> **resource_type:** knowledge  
> **resource_id:** knowledge:phase4-readiness  
> **version:** 1.5  
> **phase:** 4 — **S13 進行中**  
> **status:** **User Go 承認済 — 2026-07-05 · S11 実装済（v0.3.0-alpha 未タグ）**  
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

## S11 実装済（ローカル単一ユーザー · 未リリース）

| 項目 | 状態 |
|------|------|
| ローカル認証 API（内部用 · 任意） | ✅ `POST /v1/auth/login` · OpenAPI |
| 開発確認用 bypass | ✅ デフォルト（暫定 Web UI はそのまま） |
| **ログイン画面（UI）** | ❌ **不要 — User 決定** |
| 本番 UI | OS ユーザーで即操作（Phase 5 で本格化） |

---

## Phase 4 Sprint 概要

| Sprint | 名称 | Version | 状態 |
|--------|------|---------|------|
| **S11** | **ローカル単一ユーザー方針** | v0.3.0-alpha | 実装済 · 未タグ |
| **S12** | **監視 · ログ集約** | v0.3.0-beta | **完了** |
| **S13** | **性能 · セキュリティ監査** | v0.3.0 | **進行中** |

---

## S12 進捗（監視 · ログ集約）

| 項目 | 状態 |
|------|------|
| `/health` liveness | ✅ プロセス生存確認 |
| `/health/ready` readiness | ✅ DB 接続含む（503 when DB down） |
| `/metrics` Prometheus | ✅ リクエスト · 5xx カウンタ |
| 構造化アクセスログ | ✅ `@urms/logger` + request hook |
| Loki（Docker 任意） | ✅ `docker compose --profile observability up loki` |

---

## User の日常作業

| 項目 | 内容 |
|------|------|
| 普段 | **作業なし** |
| 確認 | 暫定 Web UI（`:5173`）— ログイン操作なし |

---

## S13 進捗（性能 · セキュリティ監査）

| 項目 | 状態 |
|------|------|
| Helmet セキュリティヘッダ | ✅ |
| Rate limit（API · AI chat） | ✅ |
| `pnpm audit:security` スクリプト | ✅ |
| `pnpm perf:spot` スクリプト | ✅ |
| k6 負荷テスト CI | ⏳ 将来 |

---

## 変更履歴

| 日付 | 変更 |
|------|------|
| 2026-07-05 | v1.2 — User Go · S11 着手 |
| 2026-07-05 | v1.3 — ログイン画面不要 |
| 2026-07-05 | v1.6 — S12 完了 · S13 準備 |
