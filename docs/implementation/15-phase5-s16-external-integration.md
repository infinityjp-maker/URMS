# Phase 5 — S16 外部連携 · v1.0 GA

> **resource_type:** knowledge  
> **owner:** PM / Developer  
> **sprint:** S16  
> **target:** v1.0.0

## スコープ

| 項目 | 実装 | 状態 |
|------|------|------|
| develop Mode | `ff.develop.enabled` · mode-policy 拡張 | ✅ |
| Integration Registry | adapter 登録 · health · sync | ✅ |
| Cursor 連携 | `cursor-local` · AI Team sync 委譲 | ✅ |
| API | `GET /v1/integrations` · health · sync | ✅ |
| v1.0.0 GA | バージョン · タグ `v1.0.0` | ✅ |

## develop Mode

| 操作 | plan | operate | audit | develop |
|------|------|---------|-------|---------|
| Resource 読取 | ✅ | ✅ | ✅ | ✅ |
| Resource 書込 | — | ✅ | — | ✅ |
| Context 更新 | ✅ | — | — | ✅ |
| Audit 閲覧 | — | — | ✅ | ✅ |
| Integration sync | — | — | — | ✅ |

有効化: `URMS_FF_DEVELOP_ENABLED=true`

## Integration API

```bash
GET  /v1/integrations
GET  /v1/integrations/cursor-local/health
POST /v1/integrations/cursor-local/sync   # develop Mode + flag
```

`cursor-local` は `.cursor/rules` の存在で health を判定し、sync 時に `AiTeamSyncService` を呼び出します。

## 残課題（v1.x 以降）

- Cursor 双方向同期（Resource → 正本ファイル書戻し）
- 追加 Integration adapter（GitHub · Slack 等）
- Desktop UI での develop Mode 切替

## 参照

- [04-api-architecture.md](../architecture/04-api-architecture.md)
- [14-phase5-s15-ai-team-resources.md](./14-phase5-s15-ai-team-resources.md)
