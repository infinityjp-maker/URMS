# URMS バックログ

> **resource_type:** knowledge  
> **resource_id:** knowledge:backlog  
> **version:** 1.1  
> **owner:** PM

## 凡例

| 優先度 | 意味 |
|--------|------|
| Must | 次イテレーション必須 |
| Should | 重要だが延期可 |
| Could | 余力があれば |

| 状態 | 意味 |
|------|------|
| todo | 未着手 |
| doing | 進行中 |
| done | 完了 |
| blocked | ブロック中 |

---

## Must

| ID | タスク | 担当 | 状態 | 備考 |
|----|--------|------|------|------|
| B-001 | AI チーム v1.0 構築 | PM | done | Phase 0 |
| B-001b | Phase 0.5 / 0.6 開発基盤整備 | PM | done | Git / Workspace / VISION |
| B-002 | 初回 Git コミット | PM | done | v0.1.0-ai-team |
| B-003 | Phase 1 要求定義 | PM + Architect + DW | done | PM 承認待ち |
| B-004 | Phase 1 PM レビュー・承認 | PM + User | todo | 完了条件 §11 確認 |
| B-005 | Phase 2 アーキテクチャ設計 | Architect | todo | Phase 1 承認後 |

## Should

| ID | タスク | 担当 | 状態 | 備考 |
|----|--------|------|------|------|
| B-010 | 認証方式 ADR（IdP 選定） | Architect | todo | R-008 対策、Phase 2 開始前 |
| B-011 | モノレポ構成 ADR | Architect | todo | Phase 2 |
| B-012 | Resource リレーション設計 | Architect | todo | MVP 外、Phase 2 |

## Could

| ID | タスク | 担当 | 状態 | 備考 |
|----|--------|------|------|------|
| B-020 | develop Mode 設計 | Architect | todo | Phase 2 以降 |
| B-021 | pgvector 利用方針 | Architect | todo | Phase 3 |

---

## Phase 1 成果物（完了）

| # | 成果物 | パス |
|---|--------|------|
| 1 | 要求仕様書 | [URMS-Requirements-Specification.md](../requirements/URMS-Requirements-Specification.md) |
| 2 | ユースケース | [use-cases.md](../requirements/use-cases.md) |
| 3 | システム境界 | [system-boundary.md](../requirements/system-boundary.md) |
| 4 | Resource 一覧 | [resource-catalog.md](../requirements/resource-catalog.md) |
| 5 | MVP 定義 | [mvp-definition.md](../requirements/mvp-definition.md) |
| 6 | 非機能要件 | [non-functional-requirements.md](../requirements/non-functional-requirements.md) |
| 7 | リスク一覧 | [risk-register.md](../requirements/risk-register.md) |
| 8 | ADR-002〜005 | [decisions/](./decisions/) |

## 参照

- [roadmap.md](./roadmap.md)
- `.cursor/context/current-task.md`
