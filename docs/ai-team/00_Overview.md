# URMS AI開発チーム — Overview

> **resource_type:** team  
> **resource_id:** team:urms-ai-v1  
> **version:** 1.0

## 目的

URMS（Unified Resource Management System）を **10年以上保守可能** な水準で開発するため、Cursor 上に AI 協調開発チームを構築する。

## 技術スタック（前提）

| 領域 | 技術 |
|------|------|
| フロントエンド | React + TypeScript |
| バックエンド | Fastify + TypeScript |
| ORM / Migration | Prisma（`schema.prisma`） |
| データベース | PostgreSQL（SQL / Index / View / Function 等） |
| パッケージ管理 | pnpm |

## 指揮系統

```
User
  ↓ （唯一の直接会話）
 PM
  ├── Architect
  ├── Developer
  ├── Reviewer
  ├── Tester
  ├── Document Writer
  └── Knowledge Manager
```

**PM 単一窓口:** User 以外のロールは PM 経由でのみ作業する。

## ロール一覧

| resource_id | ロール | ドキュメント | Command | 主 Skill |
|-------------|--------|--------------|---------|----------|
| `role:pm` | PM | [01_PM.md](./01_PM.md) | `/pm`, `/plan` | git-workflow |
| `role:architect` | Architect | [02_Architect.md](./02_Architect.md) | `/design` | prisma, postgresql, fastify |
| `role:developer` | Developer | [03_Developer.md](./03_Developer.md) | `/implement` | typescript, react, fastify, prisma |
| `role:reviewer` | Reviewer | [04_Reviewer.md](./04_Reviewer.md) | `/review` | — |
| `role:tester` | Tester | [05_Tester.md](./05_Tester.md) | `/test` | testing |
| `role:document-writer` | Document Writer | [06_DocumentWriter.md](./06_DocumentWriter.md) | `/document` | markdown-doc |
| `role:knowledge-manager` | Knowledge Manager | [07_KnowledgeManager.md](./07_KnowledgeManager.md) | `/knowledge` | — |

## 開発フロー（Multi-Agent Batch Gate · 2026-07-08）

```
PM — Package 定義（Backlog 1 件 · DoD · 影響範囲）
  ↓
Architect Agent — 設計 / ADR 整合（別 Agent · readonly 可）
  ↓
PM → User — **実装 Go**（スコープ・設計要約 · 1 画面）
  ↓
Developer Agent — 実装（Package 内コミット可 · Reviewer 不要）
  ↓
Tester Agent — テスト実行・合格判定（別 Agent 必須）
  ↓
Reviewer Agent — diff レビュー（別 Agent 必須 · 実装 Agent 禁止）
  ↓
PM → User — **完成 Go**（テスト · レビュー · dev:verify · 1 画面）
  ↓
/document → Knowledge Manager（必要時）
```

**コスト方針:** レビュー回数は Package 境界に集約。コミット毎の Reviewer 起動は行わない。

## 承認ゲート

| 操作 | 必要条件 |
|------|----------|
| **実装開始** | **User Go** + PM スコープ承認 + Architect 設計成果物 |
| 設計変更 | Architect 提案 → PM 承認 → KM 記録 |
| **完成（GA / tag）** | **User Go** + **別 Agent** Reviewer 承認 + **別 Agent** Tester 合格 |
| 知識更新 | KM が `docs/project/` を更新（PM 確認） |

## SSOT（情報の正本）

| 種別 | 正本 | resource_type |
|------|------|---------------|
| 長期知識 | `docs/project/` | knowledge |
| 標準・規約 | `docs/standards/` | knowledge |
| 現在状態 | `.cursor/context/` | context |
| 行動原則 | `.cursor/rules/` | rule |
| 起動入口 | `.cursor/commands/` | command |
| 手順・テンプレ | `.cursor/skills/` | skill |
| ロール定義 | `docs/ai-team/` | role |

## 将来拡張（URMS Resource モデル）

AI チーム構成要素は将来 URMS が管理する **Resource** として扱えるよう、各資産に `resource_type` / `resource_id` を付与する。

| Resource 種別 | 例 |
|---------------|-----|
| Team | `team:urms-ai-v1` |
| Role | `role:pm` |
| Rule | `rule:00-common` |
| Command | `command:design` |
| Skill | `skill:postgresql` |
| Context | `context:current-task` |
| Knowledge | `knowledge:roadmap` |
| Decision | `decision:ADR-001` |

v1.0 では URMS 本体による管理機能は実装しない。**拡張可能な命名・メタデータのみ** を各所に付与する。

## 拡張規約

| 追加対象 | 手順 |
|----------|------|
| ロール | `NN_{Role}.md` 作成 → 本 Overview 更新 → Rules/Commands 検討 |
| Command | `.cursor/commands/{name}.md` → Overview 更新 |
| Skill | `.cursor/skills/{name}/SKILL.md` → description に trigger 語彙 |
| Rule | PM + Architect 承認。原則追加は Skill/docs 優先 |
| Context | PM のみ更新。項目追加は Overview に記載 |

テンプレート: [99_Template.md](./99_Template.md)

## 参照

- Context: `.cursor/context/`
- Rules: `.cursor/rules/`
- Commands: `.cursor/commands/`
- Skills: `.cursor/skills/`
- Knowledge: `docs/project/`, `docs/standards/`
