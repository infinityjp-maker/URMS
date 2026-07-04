---
name: markdown-doc
description: URMS向けMarkdown設計書・仕様書・ADRの作成。設計書、仕様書、ドキュメント、ADR執筆時に使用する。
disable-model-invocation: true
---

# Markdown 設計書作成

> **resource_type:** skill  
> **resource_id:** skill:markdown-doc

## 適用条件

- Document Writer の `/document`
- Architect の設計書・ADR 草案

## 手順

1. `docs/project/glossary.md` で用語を確認
2. UTF-8 / LF で執筆
3. 見出し階層を浅く保つ（H1 は1つ）
4. 表・リストで構造化
5. ADR は `docs/project/decisions/ADR-NNN-{slug}.md` 形式
6. 用語追加は KM へ `/knowledge` 連携を PM に提案

## テンプレート

- ADR: `docs/project/decisions/ADR-001-ai-team-v1.md` 参照
- ロール: `docs/ai-team/99_Template.md`

## 成果物

- 設計書 / 仕様書 / ADR 草案

## 参照

- `docs/standards/coding-standard.md`（Markdown 執筆環境）
- Workspace: `[markdown]` 設定
