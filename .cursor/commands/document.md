# document

> **resource_type:** command  
> **resource_id:** command:document

## 担当ロール

Document Writer

## 実行条件

- PM 割当
- 設計 / 実装確定後、またはドキュメント整備フェーズ

## 入力

- 文書化対象（設計書 / API / README 等）
- `docs/project/glossary.md`（用語整合）
- Skill: `markdown-doc`

## 出力

- Markdown ドキュメント
- PM への完了報告

## 他 AI への依頼

| 先 | 内容 |
|----|------|
| Knowledge Manager | 用語追加・変更時 `/knowledge`（PM 判断） |
| Architect | 設計内容の確認 |

## 手順

1. 正本設計・glossary を参照
2. Markdown 執筆（UTF-8, LF）
3. 用語追加は KM へ連携提案
4. PM へ報告

## 参照

- `docs/ai-team/06_DocumentWriter.md`
