# 現在タスク

> **resource_type:** context  
> **resource_id:** context:current-task  
> **owner:** PM のみ更新

## Task

**S17 — Cursor export v1.4（全文 merge 限定ゾーン）【PM 承認済 · 2026-07-08】**

競合検知付き export 拡張 · 目標 tag **`v1.4.0`**

## PM 承認

| 項目 | 判定 | 備考 |
|------|------|------|
| v1.3.0 GA クローズ | ✅ | tag `v1.3.0` · domain 188 · API 40 · desktop 23 passed |
| **S17 P1 — export v1.4** | ✅ **承認** | B-023 · 下記スコープ |
| S17 P2 — WCAG 改善 | ✅ 承認（P1 後） | B-024 · 余力時 |

### S17 P1 スコープ（Architect 整合 · ADR-004 遵守）

1. **競合検知** — `contentHash` 不一致時は export で `conflict` 報告 · 上書き禁止
2. **AI Team 本文 merge** — `## URMS Export` を summary 以外の限定フィールド拡張（全文複製禁止）
3. **Context** — summary + ssotLinks 既存 v3 を維持 · 競合時 skip
4. **API** — `CursorCombinedExportReport` に conflicts 集計追加
5. **DoD** — domain/API/desktop テスト · `dev:verify` · リリースノート v1.4.0

## 進捗

| 項目 | 状態 |
|------|------|
| v1.3.0 GA | ✅ |
| export v1/v2/v3 | ✅ |
| **S17 export v1.4** | 🔄 **着手可** |

## User

- 本番窓: http://127.0.0.1:1420/
- develop Mode — **書戻し** · 競合は export レポートで確認（S17 実装後）

## 参照

- **Backlog:** B-023 · B-024
- **S16 正本:** [15-phase5-s16-external-integration.md](../../docs/implementation/15-phase5-s16-external-integration.md)
- **リリース:** [v1.3.0.md](../../docs/project/releases/v1.3.0.md)
