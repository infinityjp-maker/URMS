# URMS Implementation 文書索引

> **resource_type:** knowledge  
> **resource_id:** knowledge:implementation-index  
> **version:** 1.2  
> **phase:** 2.5 / 2.6 / 3 prep

## 目的

Phase 3 実装に関する **契約（SSOT）**、**運用ガイド**、**準備文書** の索引。

## 文書一覧

| 文書 | パス | 役割 | ADR |
|------|------|------|-----|
| Implementation Contract | [01-implementation-contract.md](./01-implementation-contract.md) | **実装契約正本（SSOT）** | ADR-017 |
| Developer Playbook | [02-developer-playbook.md](./02-developer-playbook.md) | 日常参照・チェックリスト | ADR-017 補助 |
| Phase 3 Readiness | [03-phase3-readiness.md](./03-phase3-readiness.md) | 実装開始判定 | — |
| Phase 3 Master Checklist | [04-phase3-master-checklist.md](./04-phase3-master-checklist.md) | 実装進捗チェック | — |

## 位置づけ

| 層 | 正本 | 運用・準備 |
|----|------|------------|
| 哲学 | VISION.md | — |
| アーキテクチャ | docs/architecture/*（Freeze） | — |
| 実装契約 | **01-implementation-contract.md** | Playbook, Readiness, Checklist |
| コーディング標準 | docs/standards/coding-standard.md | Playbook §5 |

**Contract が唯一の実装契約 SSOT。** Playbook は上書きしない。

Architecture / Contract と矛盾 → Architecture + ADR + Contract 優先。

## 変更履歴

| 日付 | 変更 |
|------|------|
| 2026-07-05 | v1.0 — Implementation Contract |
| 2026-07-05 | v1.1 — Developer Playbook |
| 2026-07-05 | v1.2 — Phase 3 Readiness + Master Checklist |
