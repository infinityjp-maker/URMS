---
name: git-workflow
description: URMS向けGit運用。コミット、ブランチ、PR、Git操作時に使用する。
disable-model-invocation: true
---

# Git Workflow

> **resource_type:** skill  
> **resource_id:** skill:git-workflow

## 適用条件

- Developer コミット・PR
- PM リリース判断

## 原則

- コミットは **User 明示依頼時のみ**
- force push to main 禁止
- 秘密情報をコミットしない
- smart commit 無効（Workspace 設定）

## ブランチ（予定）

| ブランチ | 用途 |
|----------|------|
| `main` | 安定版 |
| `feature/*` | 機能開発 |

## コミットメッセージ

- 1〜2 文で「なぜ」を説明
- 例: `feat(api): add asset listing endpoint`

## 手順

1. 変更範囲を最小化
2. lint / test 通過後にコミット提案
3. PM 承認 → Reviewer `/review` 後にマージ

## 参照

- `.cursor/rules/02_実装.mdc`
- `docs/ai-team/01_PM.md`
