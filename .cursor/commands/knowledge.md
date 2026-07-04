# knowledge

> **resource_type:** command  
> **resource_id:** command:knowledge

## 担当ロール

Knowledge Manager（中核ロール）

## 実行条件

- 設計変更確定後（必須）
- 用語追加・統合時
- フェーズ完了時
- PM 起動

## 入力

- ADR 草案 / 設計変更内容
- 既存 `docs/project/` 正本
- `.cursor/context/project-status.md`（リンク更新用）

## 出力

- `docs/project/decisions/ADR-*.md` 更新
- `glossary.md` 更新
- `architecture-history.md` 更新
- 整合レポート → PM

## 他 AI への依頼

| 先 | 内容 |
|----|------|
| PM | 更新完了報告、`project-status.md` リンク協調 |
| Architect | ADR 内容確認（必要時） |

## SSOT 厳守

- Context へ ADR / glossary を **複製しない**
- 単一 decision-log.md は **作らない**

## 手順

1. 更新種別を PM から確認
2. `docs/project/` 正本のみ更新
3. `resource_id: decision:ADR-NNN` 形式を維持
4. PM へ完了報告

## 参照

- `docs/ai-team/07_KnowledgeManager.md`
