# URMS AI 連携アーキテクチャ

> **resource_type:** knowledge  
> **resource_id:** knowledge:architecture-ai-integration  
> **version:** 1.0  
> **phase:** 2

## 参照

- [ADR-015](../project/decisions/ADR-015-ai-integration.md)
- [VISION.md](../project/VISION.md)
- [17-ai-integration.md](./17-ai-integration.md) — 本書

---

## 1. 目的

AI（Cursor Agent 等）が URMS を **Resource API 経由** で参照・操作し、人間と協調できる基盤を設計する（VISION「AI と人間が協調して進化」）。

---

## 2. 連携パターン

| パターン | 説明 | MVP |
|----------|------|-----|
| **API 消費** | AI が REST API を呼び出し | ✅ |
| **OpenAPI 契約** | API 仕様を AI コンテキストに提供 | ✅ |
| **Context Export** | Context Engine → AI 向け JSON | Should |
| **Resource メタ** | AI Team を Resource として参照 | ✅ |
| **双方向 Cursor 同期** | URMS ↔ .cursor/ | Phase 4 |

---

## 3. AI 向け API 設計原則

1. **安定エラーコード** — AI が retry / 報告判断可能
2. **OpenAPI 完全記述** — 型・例・制約
3. **Mode 明示** — `X-URMS-Mode: plan` で計画操作
4. **ページネーション** — 大量 Resource の chunk 取得
5. **Idempotent** — PATCH/DELETE は幂等

---

## 4. Context Export API（Should）

```
GET /v1/context/export
```

Response:

```json
{
  "phase": "Phase 2 — Architecture",
  "task": "API design review",
  "mode": "plan",
  "ssotLinks": [
    { "label": "VISION", "path": "/docs/project/VISION.md" }
  ],
  "resourcesSummary": { "active": 42, "draft": 3 }
}
```

本文複製なし。AI は ssotLinks から必要時のみ fetch。

---

## 5. AI Team Resource 参照

MVP: AI が URMS API で以下を取得可能:

- `GET /v1/resources/role/pm` — ロール定義
- `GET /v1/resources/skill/postgresql` — Skill 手順
- `GET /v1/knowledge/decisions/ADR-002` — ADR

将来 Phase 4: URMS から AI Team 更新 → Cursor へ反映。

---

## 6. 認証（AI Agent）

- Service Account + JWT（`roles: ["planner"]`）
- 人間 User とは別 principal
- 監査ログに `actorId: ai-agent-{id}` 記録

---

## 7. Cursor 開発時との関係

| 開発時 | 実行時 URMS |
|--------|-------------|
| `.cursor/context/` | Context Engine API |
| `.cursor/skills/` | Resource type `skill` |
| `docs/project/` | Knowledge API |
| Cursor 内蔵 LLM | **AI Manager + Provider Adapter**（ADR-016） |

Phase 1〜2: 概念整合。Phase 3: AI Manager 実装。Phase 4: Cursor 双方向。

**AI Provider 抽象化:** [18-ai-provider-architecture.md](./18-ai-provider-architecture.md)

---

## 変更履歴

| 日付 | 変更 |
|------|------|
| 2026-07-05 | v1.0 初版 |
