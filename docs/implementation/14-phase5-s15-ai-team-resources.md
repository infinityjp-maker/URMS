# Phase 5 — S15 AI Team Resource 化

> **resource_type:** knowledge  
> **owner:** PM / Developer  
> **sprint:** S15  
> **target:** v0.5.0

## スコープ

| 項目 | 実装 | 状態 |
|------|------|------|
| 正本ファイル → Resource 同期 | rules · commands · skills · roles · team · decisions · context | ✅ |
| System Resource Plugin | role · rule · command · skill · team · decision · context | ✅ |
| `member_of` リレーション | role → team:urms-ai-v1 | ✅ |
| API | `POST /v1/ai-team/sync` | ✅ |
| CLI | `pnpm ai-team:sync` | ✅ |

## 同期対象

| 正本 | resource_type |
|------|---------------|
| `.cursor/rules/*.mdc` | rule |
| `.cursor/commands/*.md` | command |
| `.cursor/skills/*/SKILL.md` | skill |
| `.cursor/context/*.md` | context |
| `docs/ai-team/*.md` | role / team |
| `docs/project/decisions/ADR-*.md` | decision |

各ファイルの `> **resource_id:** type:id` を SSOT として読み取ります。

## 実行

```bash
# DB マイグレーション後
pnpm ai-team:sync

# または API（operate Mode）
POST /v1/ai-team/sync
```

環境変数 `URMS_REPO_ROOT` でリポジトリルートを上書き可能。

## 残課題（S16 以降）

- URMS ↔ Cursor 双方向同期
- develop Mode
- Integration Plugin

## 参照

- [08-resource-management.md](../architecture/08-resource-management.md) §7
- [resource-catalog.md](../requirements/resource-catalog.md) §4
