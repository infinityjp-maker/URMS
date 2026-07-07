# 現在タスク

> **resource_type:** context  
> **resource_id:** context:current-task  
> **owner:** PM のみ更新

## Task

**Vision Track 完了 → Phase 4 S13 次 Sprint 待ち**

VT-1〜VT-4 DoD 達成。次テーマは PM / User が backlog から選定。

## 進捗

| 項目 | 状態 |
|------|------|
| VT-1 SSOT 重力 | ✅ 完了 |
| VT-2 Context 脳（合成 narrative） | ✅ 完了（contract テスト 5 件） |
| VT-3 知覚膜 | ✅ 完了（Playwright smoke · 地名） |
| VT-4 日次ループ | ✅ 完了（API E2E · ADR-024 M1–M3 · Playwright advance E2E） |

## Vision Track 完了定義（DoD · クローズ 2026-07-08）

| Track | 完了条件 | 状態 |
|-------|----------|------|
| VT-1 | schedule · location · loop → 窓信号 · `ssot:sync` | ✅ |
| VT-2 | 合成 narrative · contract テスト 5 件 | ✅ |
| VT-3 | 正直表示 · Playwright smoke 1420 | ✅ |
| VT-4 | advance → journal → perception · Playwright E2E | ✅ |

## 直近の変更

- **Vision Track クローズ** — VT-1〜VT-4 DoD 達成
- **resource-catalog v1.3** — schedule · location · loop-entry 追加
- **ADR-024** — M1–M3 実装状態を文書反映 · M4 は PM 判断待ち
- Playwright VT-4 E2E · advance POST `{}` 修正 · URMS_REPO_ROOT 自動設定
- ADR-024 M3 loop:sync · M2 読取 · M1 デュアルライト

## 次 Sprint 候補（PM · 未承認）

| 優先 | 候補 | 備考 |
|------|------|------|
| P1 | ADR-024 M4 | Markdown export のみ · 正本 DB — **PM 判断必須** |
| P2 | `loop-entry` → Context `relates_to` | ADR-024 未決 #3 |
| P2 | develop Mode（B-020） | backlog |
| P2 | Phase 4 S13 続行 | project-status 参照 |

## User

Vision Track 完了。1420 窓 · `pnpm ssot:sync` · advance フローは E2E で自動検証済。次の開発テーマを PM に指示してください。

## 運用

- **進捗報告 SSOT:** [progress-report.md](./progress-report.md)
- **モデル選定:** [model-policy.md](./model-policy.md)
- **使用率ログ:** [usage-log.md](./usage-log.md)
