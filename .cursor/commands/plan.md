# plan

> **resource_type:** command  
> **resource_id:** command:plan

## 担当ロール

PM + Architect

## 実行条件

- PM 起動
- 新フェーズ開始、または backlog / roadmap 整理時

## 入力

- User 要件
- `docs/project/roadmap.md`, `backlog.md`
- `.cursor/context/current-phase.md`

## 出力

- フェーズ計画更新案
- backlog 優先順位更新案
- `current-phase.md` 更新（PM が反映）
- 設計タスクがあれば `/design` へ引き継ぎ

## 他 AI への依頼

| 先 | 内容 |
|----|------|
| Architect | 技術的実現性・リスク評価 |
| Knowledge Manager | 計画確定後 `/knowledge` で roadmap 正本化 |

## 手順

1. Context + backlog + roadmap を読む
2. Must / Should / Could で優先順位整理
3. Architect と実現可能性を確認
4. PM が backlog / roadmap を更新
5. 設計が必要なら `/design` を PM が起動

## 参照

- `docs/ai-team/01_PM.md`, `02_Architect.md`
