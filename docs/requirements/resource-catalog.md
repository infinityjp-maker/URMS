# URMS Resource 一覧（Resource Catalog）

> **resource_type:** knowledge  
> **resource_id:** knowledge:resource-catalog  
> **version:** 1.0  
> **phase:** 1

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

### 2.3 将来 Resource Type

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
| `member_of` | role → team |

---

## 変更履歴

| 日付 | 変更 |
|------|------|
| 2026-07-05 | v1.0 初版 |
