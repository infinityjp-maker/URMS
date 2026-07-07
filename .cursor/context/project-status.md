# プロジェクト状態

> **resource_type:** context  
> **resource_id:** context:project-status  
> **owner:** PM / KM

## サマリ

| 項目 | 値 |
|------|-----|
| 状態 | **Phase 4 完了 · 本番UI v1 · Vision Track 完了 · S13 再監査（2026-07-08）** |
| バージョン | Git タグ v0.2.0-mvp（S11 は未タグ） |
| User Go | ✅ 2026-07-05 |
| User Vision | ✅ UI 確定 · Tauri 2 + React（User Go 2026-07-05） |

## ゲート

| 項目 | 状態 |
|------|-----|
| Monorepo · Domain · DB · API | ✅ |
| 暫定 Web UI · Context · AI · Plugins | ✅ |
| E2E · Coverage CI | ✅ |
| Docker Compose · CI build | ✅ |
| S11 ローカル認証方針 | ✅ bypass + 内部 API |
| PostgreSQL（User 環境） | ✅ Docker Desktop + db:up（2026-07-07） |
| Cursor モデル方針 | ✅ [model-policy.md](../context/model-policy.md) · **日次監視** · 次回月次見直し 2026-08-07 |
| **Vision Track VT-1〜4** | ✅ **2026-07-08 クローズ** — ADR-024 M1–M4 · resource-catalog v1.4 |
| **B-020 develop Mode** | ✅ **2026-07-08** — Web UI 切替 · Integrations ページ |
| **S13 再監査** | ✅ **2026-07-08** — audit:security · loop モードゲート |
| **dev オフライン修正** | ✅ **2026-07-08** — domain export 修正 · desktop proxy · start-ui に API 同梱 |

## リンク

- **PM 進捗報告 SSOT:** [progress-report.md](../context/progress-report.md)
- Canvas 進捗: `canvases/urms-progress-plan.canvas.tsx`
- [roadmap.md](../../docs/project/roadmap.md)
- [backlog.md](../../docs/project/backlog.md)
