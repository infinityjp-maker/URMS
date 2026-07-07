# Phase 4 — S13 性能 · セキュリティ監査

> **resource_type:** knowledge  
> **owner:** PM / Reviewer  
> **sprint:** S13  
> **target:** v0.3.0

## スコープ

Contract §17 · Quality Gate §8 に基づく Phase 4 監査。

| 項目 | 実装 | 状態 |
|------|------|------|
| Helmet（セキュリティヘッダ） | `@fastify/helmet` | ✅ |
| Rate limit（API 全体） | `@fastify/rate-limit` 120/min | ✅ |
| Rate limit（AI chat） | 20/min | ✅ |
| CORS（localhost · tauri） | `@fastify/cors` | ✅ S12 後 |
| 構造化ログ · 秘匿 | `@urms/logger` redact | ✅ S12 |
| 依存脆弱性スキャン | `pnpm audit` | スクリプト |
| 秘密情報 grep | `scripts/dev/security-audit.ps1` | スクリプト |

## 環境変数

| 変数 | 既定 | 意味 |
|------|------|------|
| `URMS_RATE_LIMIT_MAX` | 120 | API 全体 / 分 |
| `URMS_AI_RATE_LIMIT_MAX` | 20 | `/v1/ai/chat` / 分 |
| `URMS_SECURITY_PLUGINS` | — | `false` で helmet/rate-limit 無効 |

テスト（`NODE_ENV=test`）ではセキュリティプラグインは自動 OFF。

## 実行

```bash
# 依存脆弱性 + 簡易秘密情報チェック
pnpm audit:security

# 性能スポット（API 起動時）
pnpm perf:spot
```

## 残課題（v0.3.0 以降）

- k6 負荷テスト CI
- WCAG 改善（暫定 Web UI）
- Secret Store 本番注入（B-010 後続）
- `undici` 脆弱性 — **testcontainers 経由 devDependency のみ**（本番ランタイム外 · 2026-07-08 確認）

## 再監査（Vision Track · ADR-024 · B-020 後 · 2026-07-08）

| # | ゲート | 結果 |
|---|--------|------|
| 1 | `pnpm audit:security` | **PASSED**（1 warn — undici@5 via testcontainers · dev のみ） |
| 2 | 秘密情報 grep | **OK** |
| 3 | Helmet / rate-limit プラグイン | **OK** |
| 4 | develop Mode — flag OFF 時 403 | **API テスト** |
| 5 | Integration sync — develop のみ | **API テスト**（既存） |
| 6 | loop/sync · loop/export — operate/develop のみ | **API テスト追加** |
| 7 | loop-entry relates_to — Resource 書込 | **domain テスト** |

```bash
pnpm audit:security
pnpm --filter @urms/api test -- src/routes/routes.test.ts
pnpm --filter @urms/domain test
```

## 変更履歴

| 日付 | 変更 |
|------|------|
| 2026-07-05 | 初版 — S13 スコープ |
| 2026-07-08 | 再監査 — Vision Track 後 delta · loop モードゲート · undici 所見 |

## 参照

- [07-quality-gate.md](./07-quality-gate.md) §8
- [01-implementation-contract.md](./01-implementation-contract.md) §17
- [10-phase4-readiness.md](./10-phase4-readiness.md)
