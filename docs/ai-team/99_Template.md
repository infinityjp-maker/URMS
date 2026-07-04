# テンプレート — ロール / Command / Skill / Rule 追加用

> **resource_type:** template  
> **resource_id:** template:ai-team-extension  
> **version:** 1.0

## ロール追加テンプレート

```markdown
# {Role Name}

> **resource_type:** role
> **resource_id:** role:{slug}
> **version:** 1.0

## 役割

## 責任範囲

## 権限

## 成果物

## 他 AI との連携

## 引き継ぎ方法

## Command

## Skill
```

**手順:** `NN_{Role}.md` 作成 → `00_Overview.md` 更新 → Rules/Commands 検討 → PM 承認

---

## Command 追加テンプレート

ファイル: `.cursor/commands/{name}.md`

```markdown
# {name}

> **resource_type:** command
> **resource_id:** command:{name}

## 担当ロール

## 実行条件

## 入力

## 出力

## 他 AI への依頼

## 参照

- `.cursor/context/current-task.md`
- （該当 Skill / docs）
```

---

## Skill 追加テンプレート

ディレクトリ: `.cursor/skills/{name}/SKILL.md`

```markdown
---
name: {name}
description: {WHAT}. Use when {WHEN}.
disable-model-invocation: true
---

> **resource_type:** skill
> **resource_id:** skill:{name}

# {Title}

## 適用条件

## 手順

## 成果物

## 参照
```

---

## ADR 追加テンプレート

ファイル: `docs/project/decisions/ADR-NNN-{slug}.md`

```markdown
# ADR-NNN: {Title}

> **resource_type:** decision
> **resource_id:** decision:ADR-NNN
> **status:** proposed | accepted | deprecated
> **date:** YYYY-MM-DD

## コンテキスト

## 決定

## 理由

## 影響

## 関連
```

---

## Rule 追加判断

Rule 追加前に以下を確認:

1. Skill または docs で足りないか
2. 原則・ゲートのみか（50行以内目安）
3. PM + Architect 承認があるか

---

## Context 項目追加判断

Context は **現在状態のみ**。追加前に:

1. 長期知識ではないか → `docs/project/` へ
2. 標準・規約ではないか → `docs/standards/` へ
3. PM のみが更新するか

---

## URMS Resource 拡張チェックリスト

新規 AI 資産作成時:

- [ ] `resource_type` を付与
- [ ] `resource_id` を一意に命名（`{type}:{slug}`）
- [ ] `00_Overview.md` を更新
- [ ] SSOT の正本パスを1つに限定
- [ ] 将来 URMS 管理 API 連携を想定したパス構造
