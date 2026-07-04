# design

> **resource_type:** command  
> **resource_id:** command:design

## 担当ロール

Architect

## 実行条件

- PM 承認済みタスク（`current-task.md` に記載）
- `/plan` 完了または PM 直接割当

## 入力

- `current-task.md` の要件・DoD
- `docs/project/decisions/` 既存 ADR
- Skills: `prisma`, `postgresql`, `fastify`, `markdown-doc`

## 出力

- 設計書（Markdown）
- ADR 草案 → `docs/project/decisions/ADR-NNN-*.md`
- PM への完了報告

## 他 AI への依頼

| 先 | 内容 |
|----|------|
| Knowledge Manager | `/knowledge` — ADR 正本化・architecture-history 更新 |
| Document Writer | `/document` — 設計書整備 |
| Developer | PM 承認後 `/implement`（PM が起動） |

## 手順

1. Context + 要件を読む
2. Prisma / PostgreSQL 境界を守って設計
3. ADR 草案作成
4. PM へ報告 → KM へ `/knowledge` を PM が起動

## 参照

- `docs/ai-team/02_Architect.md`
- `.cursor/rules/01_設計.mdc`
