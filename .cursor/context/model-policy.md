# Cursor モデル選定方針

> **resource_type:** context  
> **resource_id:** context:model-policy  
> **owner:** PM のみ更新  
> **制定:** 2026-07-07  
> **次回見直し:** 2026-08-07（月次）· 枠 60% 超え時は随時

User 目標: **毎日 2〜3 時間** の URMS 開発を Cursor Pro 枠内で継続する。

## 基本方針

- **用途特化** — タスク種別ごとに得意モデルを固定する
- **枠節約** — 軽い作業は Fast、重い判断だけ Thinking
- **1 セッション 1 モデル** — 途中昇格は User 明示時のみ
- **Auto** — モデル未指定 · 枠逼迫週のフォールバック（万能剣にしない）

## タスク別 · 推奨モデル

| 用途 | 推奨モデル | 枠 |
|------|------------|-----|
| PM 日常（続けて · Go · status · Canvas） | Composer 2.5 Fast | 軽 |
| 実装（domain / api / desktop） | GPT-5.3 Codex または Composer 2.5 Fast | 中 |
| 設計 · アーキ判断（ADR · 境界 · Prisma） | Claude Sonnet Thinking（Plan モード） | 重 |
| 探索のみ（所在 · 影響範囲） | Composer 2.5 Fast | 軽 |
| デバッグ（dev:verify NG · 1 エラー） | まず Codex → 2 回失敗で Sonnet Thinking | 中→重 |
| レビュー（Go 前 · diff 100 行超） | Sonnet Thinking（readonly） | 重 |
| セキュリティ / Bugbot 相当 | Sonnet Thinking · **月 2 回まで** | 最重 |
| 長文ドキュメント | Composer 2.5 Fast | 軽 |

### 原則禁止

- **Opus / Thinking High** — ADR 級 · 重大インシデント時のみ User 明示
- **Max Mode** — 原則禁止
- **1 ターンごとのモデル切替** — 二重消費を招く

## 1 日 2〜3 時間の配分（PM 推奨）

| 時間 | モデル | 内容 |
|------|--------|------|
| 0:00–0:10 | Composer Fast | current-task · 今日 1 テーマ |
| 0:10–1:30 | Codex または Composer Fast | 実装 + テスト |
| 1:30–1:45 | Composer Fast | dev:verify · 窓確認 |
| 1:45–2:00 | Composer Fast | Go · current-task 更新 |

Sonnet Thinking は **週 1〜2 回**（設計変更 or 週次レビュー）。その日は実装 30 分短縮。

## 週次バジェット（目安）

| tier | 上限 |
|------|------|
| Fast（Composer） | 日常の ~80% |
| Codex | 毎日 1 セッション |
| Sonnet Thinking | 週 2 セッションまで |
| Opus / High | 月 1 回まで（User 承認） |

### 昇格条件

- 同バグで Fast/Codex が **2 回** 失敗 → Sonnet Thinking
- 設計書にない **新境界** → Plan + Sonnet Thinking
- diff **200 行超** · Go 前 → Sonnet Thinking（レビューのみ）

### 降格条件（usage 60% 超の週）

- 翌日以降 **Composer Fast のみ** + スコープ半分
- Thinking は **ブロッカー解消のみ**

## セッション運用

- **1 日 = 1 スレッド · 1 テーマ** — Go で区切り、翌日は新スレッド
- **1 セッション ≒ 1 コミット**（最大 2）
- User 依頼（任意）: `モデル: 実装（Codex）` / `テーマ: …`

## 監視

- [cursor.com/dashboard/usage](https://cursor.com/dashboard/usage) — **水曜** 確認
- **60%** → その週は Fast 中心 · スコープ半分
- **80%** → Auto のみ · Thinking 停止 · Pro+ 検討を PM が提案
- 従量課金 — オフ or 上限設定を推奨

## 定期見直し（必須）

| 頻度 | 内容 | 担当 |
|------|------|------|
| **週次（水曜）** | usage % · 降格/昇格の実効 | PM |
| **月次（制定日基準）** | モデル一覧 · Cursor 料金変更 · 表の更新 | PM + User |
| **随時** | 新モデル追加 · 枠 80% · Pro+ 移行判断 | PM |

見直し結果は本ファイルの **次回見直し** 日と `project-status.md` に 1 行記録する。

## 参照

- `.cursor/context/current-task.md`
- [Cursor Usage limits](https://cursor.com/help/models-and-usage/usage-limits)
