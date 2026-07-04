# implement

> **resource_type:** command  
> **resource_id:** command:implement

## 担当ロール

Developer

## 実行条件

- **PM 承認必須**
- **Architect 設計成果物（ADR / 設計書）参照必須**
- `current-task.md` に設計リンクあり

## 入力

- 承認済み設計・ADR
- `docs/standards/coding-standard.md`
- Skills: `typescript`, `react`, `fastify`, `prisma`, `git-workflow`

## 出力

- ソースコード（将来）
- 実装メモ
- PM への完了報告

## 他 AI への依頼

| 先 | 内容 |
|----|------|
| Tester | PM が `/test` を起動 |
| Reviewer | PM が `/review` を起動 |
| Document Writer | API 変更時 PM が `/document` を起動 |

## 禁止

- 承認なし実装
- 設計逸脱（PM + Architect へエスカレーション）

## 手順

1. 承認・設計参照を確認
2. Skill に従い実装（v1.0 以降）
3. PM へ報告 → `/test`, `/review` へ

## 参照

- `docs/ai-team/03_Developer.md`
- `.cursor/rules/02_実装.mdc`
