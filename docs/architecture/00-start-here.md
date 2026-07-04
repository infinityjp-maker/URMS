# URMS 設計ドキュメント — 読み方ガイド

> **resource_type:** knowledge  
> **resource_id:** knowledge:architecture-start-here  
> **version:** 1.0  
> **phase:** 3  
> **owner:** PM

## 誰が何を読むか

| ロール | 最初に読む | 実装時 |
|--------|------------|--------|
| **User / PM** | [VISION.md](../project/VISION.md) → [requirements/](../requirements/) → **Figma** | Sprint レビュー |
| **Architect** | [architecture/README.md](./README.md) → 該当 ADR | Contract 整合 |
| **Developer** | [Contract §](../implementation/01-implementation-contract.md) → [Playbook](../implementation/02-developer-playbook.md) | Sprint Planning |
| **Tester** | [use-cases.md](../requirements/use-cases.md) → [Quality Gate](../implementation/07-quality-gate.md) | 受入・E2E |

---

## SSOT 早見表

| 知りたいこと | 正本 |
|--------------|------|
| なぜ作るか | [VISION.md](../project/VISION.md) |
| 何を作るか（機能） | [URMS-Requirements-Specification.md](../requirements/URMS-Requirements-Specification.md) |
| 画面の見た目 | **Figma** → [ui-design-links.md](../requirements/ui-design-links.md) |
| 画面の振る舞い | [ui-requirements.md](../requirements/ui-requirements.md) |
| システム構造 | [architecture/](./README.md)（**Freeze 維持**） |
| 実装ルール | [01-implementation-contract.md](../implementation/01-implementation-contract.md) |
| 今の Sprint | [04-sprint-planning.md](../implementation/04-sprint-planning.md) |
| 今のタスク | `.cursor/context/current-task.md` |

---

## Phase 3 開発フロー（3 トラック）

```
Track A: Figma Must 画面（User、S5 前）
Track B: S2 Domain → S3 DB → S4 API（Developer）
Track C: Git / CI（S10）
```

**S5 以降の UI 本格化は Figma + S4 API 完了後。**

---

## 変更履歴

| 日付 | 変更 |
|------|------|
| 2026-07-05 | v1.0 初版 |
