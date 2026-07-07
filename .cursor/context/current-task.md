# 現在タスク

> **resource_type:** context  
> **resource_id:** context:current-task  
> **owner:** PM のみ更新

## Task

**Vision Track VT-2 + VT-4 — Context 合成 · 日次ループ**

SSOT（schedule · location · loop journal）と advance-task 接続済み。Context 脳が時間 · 予定 · 天気 · タスクから「今」を合成し、ループ完了が project_status と journal.md に残る段階。

## 進捗

| 項目 | 状態 |
|------|------|
| VT-1 SSOT 重力 | ✅ ~完了 |
| VT-2 Context 脳（合成 narrative） | 🔄 ~完了（contract テスト 5 件 ✅ · 維持） |
| VT-3 知覚膜 | ✅ ~完了（Playwright smoke ✅ · 天気地点名 ✅） |
| VT-4 日次ループ | 🔄 ~完了（API E2E ✅ · **窓手動確認** · ADR-024 草案 ✅） |

## Vision Track 完了定義（DoD · PM）

| Track | ~完了条件（残タスク） |
|-------|----------------------|
| VT-1 | schedule · location → 窓信号 · `ssot:sync` — **維持のみ** |
| VT-2 | 合成 narrative 全信号 · **contract テスト 5 件** ✅ — 維持 |
| VT-3 | 接続/天気/予定の `—` 表示 · 偽データなし — **§6 時間帯表** ✅ · **Playwright smoke 1420** ✅ |
| VT-4 | advance → journal → perception — **API E2E ✅** · **ADR-024 草案** · 窓手動確認 |

## 直近の変更

- A4 — **ADR-024 草案**（loop journal → `loop-entry` Resource · デュアルライト移行計画）
- 天気カード — **地点名**表示（SSOT 名 · GPS 時は現在地 · 未取得は —）
- A3 — **Playwright smoke**（1420 · 接続カード · 時間帯プレビュー）· `playwright.vision.config.ts` · `test:vision` 統合
- VT-2 — perception **契約テスト**（空 SSOT · 新しい一日 · ループ済 · 直近ループ優先 · 全信号）
- viewing-guide §0 — setup-env（初回）vs start-dev-servers（毎日）の使い分け
- VT-4 — API E2E（advance-task → journal → perception status/meta）
- `test:vision` — domain + api routes + desktop 限定テスト
- PM — progress-report · model-policy 閾値運用 · コミットタイミング PM 任せ
- VT-4 — advance-task が `meta.journalEntry` を返却 · 窓に journal 追記メッセージ
- 接続カード — `journal N 件` / `journal —` を表示
- VT-3 — 天気カードに座標 GPS/SSOT/— を表示（接続カードと同じ正直表示）
- 起動 — `start-dev-servers.bat` が 1420 本番窓を起動 · `open-desktop-web.bat` 追加
- perception meta — `weatherCoords`（device / ssot）· `loopNarrative`（接続カード）
- 接続カード — 座標 GPS/SSOT · ループ narrative 表示
- 環境構築 — `setup-env.ps1` · Docker/PostgreSQL · `load-root-env`（Prisma）
- `synthesizeSummaryNote` — 予定 · タスク · 天気から summary.note を合成
- VT-2 — relationType 内訳 · 予定 (あと Xm) · 地点ラベル
- VT-4 — loop journal → `→ 次:` narrative

## User

`pnpm ssot:sync` · API+DB 起動後、窓で「完了 → 次へ」→ ステータス行 · まとめが変わる · journal.md に 1 行追記 · 接続カードに GPS/SSOT · ループ narrative · 未取得は — を確認。

## 運用

- **進捗報告 SSOT:** [progress-report.md](./progress-report.md) — 8 セクション · 適宜見直し
- **モデル選定 · 枠監視:** [model-policy.md](./model-policy.md) — **閾値内は最適 · 超過で削減** · PM 単独選定 · 日次監視
- **使用率ログ:** [usage-log.md](./usage-log.md)
