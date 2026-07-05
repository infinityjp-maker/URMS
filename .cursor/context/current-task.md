# 現在タスク

> **resource_type:** context  
> **resource_id:** context:current-task  
> **owner:** PM のみ更新

## Task

**S12 — 監視 · ログ集約（Phase 4 · 進行中）**

## S12 進捗

| 項目 | 状態 |
|------|------|
| `/health` liveness | ✅ |
| `/health/ready` readiness | ✅ DB チェック |
| `/metrics` Prometheus | ✅ |
| 構造化アクセスログ | ✅ `@urms/logger` |
| Loki Docker profile | ✅ 任意 |
| OpenAPI 同期 | ✅ |
| 単体テスト | ✅ 18 passed |

## 次（開発側）

S12 残り · dev:verify 更新 · S13 準備 · v0.3.0-beta タグ（未）

## User

普段は作業なし。設計図（5180）が最も確実。5173 は DB 未起動時 Resource エラー（想定内）。
