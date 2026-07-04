# Context Engine 詳細設計

> **resource_type:** knowledge  
> **resource_id:** knowledge:architecture-context-engine  
> **version:** 1.0  
> **phase:** 2

## 参照

- [ADR-004](../project/decisions/ADR-004-context-engine.md)
- [06-context-engine.md](./06-context-engine.md) — 本書

---

## 1. 責務

現在のプロジェクト状態を **要約 + SSOT リンク** で提供する。本文（VISION 全文、ADR 全文等）の複製は禁止。

---

## 2. スナップショット項目（MVP）

| key | 説明 | 更新権限 |
|-----|------|----------|
| `current_phase` | 現在フェーズ名 | plan Mode + PM ロール |
| `current_task` | 現在タスク要約 | plan Mode + PM ロール |
| `next_task` | 次タスク要約 | plan Mode + PM ロール |
| `project_status` | 1行サマリ | plan Mode + PM ロール |
| `active_mode` | 現在 Mode | システム自動 |
| `ssot_links` | 正本リンク集 | plan Mode + PM ロール |

---

## 3. データ構造

```typescript
interface ContextSnapshot {
  key: string;
  summary: string;           // max 500 chars
  ssotLinks: SsotLink[];
  updatedAt: string;
  updatedBy: string;
}

interface SsotLink {
  label: string;             // "VISION", "Roadmap"
  path: string;              // "/docs/project/VISION.md" or API path
  resourceType?: string;     // knowledge, decision
  resourceId?: string;
}
```

---

## 4. 更新フロー

```
PM (plan Mode) → PUT /v1/context
  → ContextService.validate(summary length, no body duplication)
  → ContextRepository.upsert
  → AuditLog (CONTEXT_UPDATE)
  → Domain Event: ContextUpdated
```

**検証ルール:**

- `summary` は 500 文字以内
- `ssotLinks.path` は許可リスト prefix のみ（`/docs/`, `/v1/knowledge/`）
- Markdown 本文パターン（`##`, 長文）を reject

---

## 5. 表示（Web UI）

Context Dashboard:

1. 各 key の summary 表示
2. ssotLinks をクリック可能リンクとして表示
3. active_mode バッジ
4. 更新日時・更新者

---

## 6. Cursor との対応

| Cursor | URMS Context Engine |
|--------|---------------------|
| `.cursor/context/current-phase.md` | `current_phase` |
| `.cursor/context/current-task.md` | `current_task` |
| `.cursor/context/project-status.md` | `project_status` + `ssot_links` |

Phase 4 で双方向同期を検討。MVP は URMS 内完結。

---

## 変更履歴

| 日付 | 変更 |
|------|------|
| 2026-07-05 | v1.0 初版 |
