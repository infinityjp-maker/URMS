# プロジェクト状態

> **resource_type:** context  
> **resource_id:** context:project-status  
> **owner:** PM / KM

## サマリ

| 項目 | 値 |
|------|-----|
| 状態 | **v0.2 製品 live 画面完成 — S1–S9 コミット済（55439f5）· S10+ 拡張** |
| バージョン | Git タグ **`v1.4.0`** · v0.2 User Go 2026-07-08 |
| User Go | ✅ v0.2 — 2026-07-08 |
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
| **v0.2 User Go** | ✅ **2026-07-08** — S1–S9 live（2026-07-09 S3–S9 完了） |
| **設計再出発** | ✅ **2026-07-08** — `docs/product/` v0.2 承認 · 実装再開 |
| **v1.4.0 正式版** | ✅ **2026-07-08** — 書き戻し v1.4 · 柱 C 区切り |
| **v1.3.0 GA** | ✅ **2026-07-08** — export v3 · Desktop ErrorBoundary |
| **Cursor export v3** | ✅ **2026-07-08** — URMS Export block · SSOT links 書戻し |
| **PM 承認 S17** | ✅ **2026-07-08** — B-023 export v1.4 · B-024 cancelled（5173 削除） |
| **Multi-Agent Batch Gate** | ✅ **2026-07-08** — 複数 Agent 必須 · Package レビュー · User Go×2 |
| **User 向け平易語** | ✅ **2026-07-08** — glossary 拡充 · PM 報告は専門用語不使用 |
| **dev オフライン修正（plugin）** | ✅ **2026-07-08** — plugin-resource-types 再ビルド · dev:prepare 拡張 |
| **S16 Desktop develop Mode** | ✅ **2026-07-08** — 1420 Mode 切替 · DevelopPanel |
| **k6 smoke CI** | ✅ **2026-07-08** — GitHub Actions `perf-k6` |
| **ADR-024** | ✅ **accepted** — loop-entry M1–M4 + relates_to |
| **v1.1.0 GA** | ✅ **2026-07-08** — Vision Track · Desktop · k6 CI |
| **Cursor export v1** | ✅ **2026-07-08** — AI Team H1 書戻し · integration export API |
| **Cursor export v2** | ✅ **2026-07-08** — Context SSOT summary 書戻し · combined export report |

## リンク

- **User 入口 Canvas:** `canvases/urms-hub.canvas.tsx` — **情報の中心**
- PM 進捗報告 SSOT: [progress-report.md](../context/progress-report.md)
- Canvas 進捗詳細: `canvases/urms-progress-plan.canvas.tsx`
- [roadmap.md](../../docs/project/roadmap.md)
- [backlog.md](../../docs/project/backlog.md)
