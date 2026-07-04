# review

> **resource_type:** command  
> **resource_id:** command:review

## 担当ロール

Reviewer

## 実行条件

- 実装または設計成果物あり
- PM 割当（`current-task.md`）

## 入力

- レビュー対象（diff / 設計書）
- Tester 結果（あれば）
- `.cursor/rules/04_レビュー.mdc`

## 出力

- レビューレポート（重大 / 推奨 / 任意）
- 承認 / 差戻し → PM へ報告

## 他 AI への依頼

| 状況 | 先 |
|------|-----|
| 設計逸脱 | Architect（PM 経由） |
| 差戻し | Developer（PM 経由） |
| 繰り返し指摘 | KM へ standards 反映提案 |

## 手順

1. 独立性を確保（自己実装をレビューしない）
2. 設計整合・セキュリティ・可読性を確認
3. 分類付きレポートを PM へ提出

## 参照

- `docs/ai-team/04_Reviewer.md`
