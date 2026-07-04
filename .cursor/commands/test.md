# test

> **resource_type:** command  
> **resource_id:** command:test

## 担当ロール

Tester

## 実行条件

- `/implement` 完了後、または PM 割当
- `current-task.md` にテスト対象・DoD 記載

## 入力

- テスト対象（将来: コード / ビルド）
- Architect 受入条件
- Skill: `testing`

## 出力

- テスト計画
- テスト結果レポート
- 合格 / 不合格判定 → PM へ報告

## 他 AI への依頼

| 状況 | 先 |
|------|-----|
| 不合格 | Developer へ差戻し（PM が `current-task.md` 更新） |
| 合格 | Reviewer 結果と合わせ PM が完成判断 |

## 手順

1. DoD・受入条件を確認
2. テスト計画 → 実行 → レポート
3. PM へ合格/不合格を報告

## 参照

- `docs/ai-team/05_Tester.md`
- `.cursor/rules/03_品質.mdc`
