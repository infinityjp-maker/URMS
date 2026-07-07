# プロジェクト状態

> **resource_type:** context  
> **resource_id:** context:project-status  
> **owner:** PM / KM

## サマリ

| 項目 | 値 |
|------|-----|
| 状態 | **Phase 5 完了 · v1.1.0 GA（2026-07-08）** |
| バージョン | Git タグ **`v1.1.0`** · root 1.1.0 |
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
| **S16 Desktop develop Mode** | ✅ **2026-07-08** — 1420 Mode 切替 · DevelopPanel |
| **k6 smoke CI** | ✅ **2026-07-08** — GitHub Actions `perf-k6` |
| **ADR-024** | ✅ **accepted** — loop-entry M1–M4 + relates_to |
| **v1.1.0 GA** | ✅ **2026-07-08** — Vision Track · Desktop · k6 CI |
| **Cursor export v1** | ✅ **2026-07-08** — AI Team H1 書戻し · integration export API |

## リンク

- **PM 進捗報告 SSOT:** [progress-report.md](../context/progress-report.md)
- Canvas 進捗: `canvases/urms-progress-plan.canvas.tsx`
- [roadmap.md](../../docs/project/roadmap.md)
- [backlog.md](../../docs/project/backlog.md)
