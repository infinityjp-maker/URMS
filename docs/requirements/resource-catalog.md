# URMS Resource 一覧（Resource Catalog）

> **resource_type:** knowledge  
> **resource_id:** knowledge:resource-catalog  
> **version:** 1.3 — SSOT Perception Resource 追加  
> **phase:** 1 / 2（AI Resource は ADR-016）

## 参照

- [VISION.md](../project/VISION.md)
- [ADR-002](../project/decisions/ADR-002-resource-model.md)

---

## 1. Resource モデル概要

すべての管理対象は **Resource** として統一表現する。

```
Resource
├── resource_id      … 一意識別子（例: asset:server-001）
├── resource_type    … 種別（例: physical, digital, role）
├── name             … 表示名
├── status           … ライフサイクル状態
├── metadata         … JSON 拡張属性
├── relationships[]  … 他 Resource への参照
└── audit            … 作成/更新/削除の追跡
```

---

## 2. Resource Type 一覧

### 2.1 ビジネス Resource（MVP 対象）

| resource_type | 説明 | 例 resource_id | MVP |
|---------------|------|----------------|-----|
| `physical` | 物理資産 | `physical:server-rack-a01` | ✅ |
| `digital` | デジタル資産 | `digital:license-ms365-001` | ✅ |
| `human` | 人的資産（役割・スキル） | `human:operator-tanaka` | ✅ |
| `knowledge` | 知識資産（文書参照） | `knowledge:vision` | ✅ |

### 2.2 システム Resource（MVP 対象）

| resource_type | 説明 | 例 resource_id | MVP |
|---------------|------|----------------|-----|
| `team` | チーム | `team:urms-ai-v1` | ✅ |
| `role` | AI / 組織ロール | `role:pm` | ✅ |
| `rule` | 行動規則 | `rule:00-common` | ✅ |
| `command` | 起動コマンド | `command:plan` | ✅ |
| `skill` | 手順 Skill | `skill:postgresql` | ✅ |
| `context` | 現在状態項目 | `context:current-task` | ✅ |
| `decision` | ADR | `decision:ADR-002` | ✅ |

### 2.3 AI Resource（ADR-016 — Architecture Freeze）

| resource_type | 説明 | 例 resource_id | Phase |
|---------------|------|----------------|-------|
| `ai-provider` | 生成AI Provider | `openai`, `anthropic`, `ollama` | 3 |
| `ai-model` | Chat / Vision モデル（Provider 非依存） | `gpt-5.5`, `claude-opus` | 3 |
| `embedding-model` | Embedding 専用（Chat と分離） | `text-embedding-3-large` | 3 |
| `generated-image` | 画像生成結果 | `img-20260705-001` | 3 |
| `ai-usage` | AI 利用履歴（Cost） | `usage-20260705-001` | 3 |

- Provider と Model は **別 Resource**。Model は Provider に依存しない独立 Resource
- API Key は Resource に保存しない（Secret Store + `secretRef`）
- Capability で利用可否判定（Provider 名では判定しない）

ADR-016 / [18-ai-provider-architecture.md](../architecture/18-ai-provider-architecture.md) 参照。

### 2.4 SSOT Perception Resource（Vision Track · 実装済）

窓の Context 合成 · 日次ループ用。Markdown SSOT → `pnpm *:sync` → DB Resource → `GET /v1/perception` で読取。

| resource_type | 説明 | SSOT 正本 | 同期 CLI | API |
|---------------|------|-----------|----------|-----|
| `schedule` | 予定イベント | `.cursor/resources/schedule/*.md` | `pnpm schedule:sync` | `POST /v1/schedule/sync` |
| `location` | 地点（天気 SSOT） | `.cursor/resources/location/*.md` | `pnpm location:sync` | `POST /v1/location/sync` |
| `loop-entry` | 日次ループ完了 1 件 | **DB 正本** · `.cursor/resources/loop/journal.md`（export） | `pnpm loop:export` | `POST /v1/loop/export` |

一括: **`pnpm ssot:sync`**（schedule + location + loop）。

- `loop-entry` の `resource_id` 例: `loop:2026-07-07T13:00:00.000Z`（`occurredAt` ISO8601）
- 詳細: [ADR-024](../project/decisions/ADR-024-loop-journal-resource.md) · [11-phase5-desktop-ui.md](../implementation/11-phase5-desktop-ui.md)

### 2.5 将来 Resource Type

| resource_type | 説明 | Phase |
|---------------|------|-------|
| `mode` | Mode 定義 | Phase 2 |
| `workflow` | 承認ワークフロー | Phase 3 |
| `integration` | 外部連携 | Phase 3+ |

---

## 3. ライフサイクル状態（共通）

| status | 説明 |
|--------|------|
| `draft` | 草案 |
| `active` | 有効 |
| `deprecated` | 非推奨（参照のみ） |
| `archived` | アーカイブ |

---

## 4. AI Team Resource マッピング（現行 → 将来 URMS）

| 現行（Cursor） | resource_type | resource_id | 正本 |
|----------------|---------------|-------------|------|
| `docs/ai-team/` | role, team | `role:*`, `team:urms-ai-v1` | docs |
| `.cursor/rules/` | rule | `rule:*` | .cursor/rules |
| `.cursor/commands/` | command | `command:*` | .cursor/commands |
| `.cursor/skills/` | skill | `skill:*` | .cursor/skills |
| `.cursor/context/` | context | `context:*` | .cursor/context |
| `docs/project/` | knowledge, decision | `knowledge:*`, `decision:*` | docs/project |

**Phase 1:** マッピング定義のみ。URMS DB への取込は Phase 2。

---

## 5. Resource リレーション（Should / MVP 外）

| 関係 | 例 |
|------|-----|
| `depends_on` | digital → physical |
| `owned_by` | physical → human |
| `governed_by` | resource → decision（ADR） |
| `provided_by` | ai-model → ai-provider |
| `generated_from` | generated-image → 親 Resource |
| `member_of` | role → team |
| `relates_to` | loop-entry → context:current-task（日次ループ完了） |

---

## 変更履歴

| 日付 | 変更 |
|------|------|
| 2026-07-05 | v1.0 初版 |
| 2026-07-05 | v1.1 — ai-provider, ai-model 追加（ADR-016） |
| 2026-07-08 | v1.4 — loop-entry M4（DB 正本 · journal export · ADR-024 完了） |
