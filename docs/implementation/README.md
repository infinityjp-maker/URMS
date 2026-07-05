# URMS Implementation 文書索引

> **resource_type:** knowledge  
> **resource_id:** knowledge:implementation-index  
> **version:** 1.7  
> **phase:** 2.5 / 2.6 / 2.7 / 2.8 / 2.9 / 3 ops / 3 prep

## User（オーナー）向け

本ディレクトリは **開発者 · AI チーム専用** の Markdown 正本です。User 向けの読み物は **`canvases/urms-docs.canvas.tsx`**（概要のみ）および **`urms-progress-plan.canvas.tsx`**（進捗）を使用してください。

## 目的

Phase 3 実装に関する **契約（SSOT）**、**品質基準**、**AI ガバナンス**、**運用ガイド**、**計画文書** の索引。

## Phase 3 ガバナンス三本柱

| 柱 | 文書 | 役割 |
|----|------|------|
| **Contract** | [01-implementation-contract.md](./01-implementation-contract.md) | 何をどう作るか（SSOT） |
| **Quality Gate** | [07-quality-gate.md](./07-quality-gate.md) | どう合格するか |
| **Governance** | [08-ai-development-governance.md](./08-ai-development-governance.md) | AI と人間の協調運用 |

## 参照順序（実装時）

```
1. VISION → Requirements → Architecture → ADR
2. Implementation Contract（SSOT）
3. Quality Gate
4. AI Development Governance
5. Sprint Planning → Developer Playbook → Master Checklist
```

Context（`.cursor/context/`）は補助のみ — SSOT ではない。

## 文書一覧

| # | 文書 | パス | 役割 | ADR |
|---|------|------|------|-----|
| 01 | Implementation Contract | [01-implementation-contract.md](./01-implementation-contract.md) | **実装契約 SSOT** | ADR-017 |
| 02 | Developer Playbook | [02-developer-playbook.md](./02-developer-playbook.md) | 日常参照 | ADR-017 補助 |
| 03 | Phase 3 Readiness | [03-phase3-readiness.md](./03-phase3-readiness.md) | 開始判定 | — |
| 04 | Sprint Planning | [04-sprint-planning.md](./04-sprint-planning.md) | Sprint 1〜10 詳細 | ADR-018, 019 |
| 05 | Development Roadmap | [05-development-roadmap.md](./05-development-roadmap.md) | Phase 3〜5 | ADR-018 |
| 06 | Master Checklist | [06-phase3-master-checklist.md](./06-phase3-master-checklist.md) | 進捗チェック | — |
| 07 | Quality Gate | [07-quality-gate.md](./07-quality-gate.md) | PR / Review / Release 基準 | ADR-020 |
| 08 | AI Development Governance | [08-ai-development-governance.md](./08-ai-development-governance.md) | AI 共同開発運用 | ADR-021 |
| 09 | PM Operations Protocol | [09-pm-operations-protocol.md](./09-pm-operations-protocol.md) | PM 運用・開発フロー | — |
| 10 | Phase 4 Readiness | [10-phase4-readiness.md](./10-phase4-readiness.md) | **Phase 4 開始 PM 提案** | — |
| 11 | Phase 5 Desktop UI | [11-phase5-desktop-ui.md](./11-phase5-desktop-ui.md) | **本番 UI · 知覚層 v0** | ADR-023 |
| 12 | Phase 4 S13 Security | [12-phase4-s13-security-audit.md](./12-phase4-s13-security-audit.md) | 性能 · セキュリティ監査 | — |
| 13 | Phase 5 S14 Relations | [13-phase5-s14-resource-relations.md](./13-phase5-s14-resource-relations.md) | Resource リレーション API | — |
| 14 | Phase 5 S15 AI Team | [14-phase5-s15-ai-team-resources.md](./14-phase5-s15-ai-team-resources.md) | AI Team Resource 同期 | — |

## ADR（実装関連）

| ADR | 内容 |
|-----|------|
| ADR-017 | Implementation Contract |
| ADR-018 | Versioning Policy |
| ADR-019 | Feature Flag Policy |
| ADR-020 | Quality Gate |
| ADR-021 | AI Development Governance |
| ADR-022 | Local Authentication（IdP 不使用 · User 2026-07-05） |
| ADR-023 | Tauri 2 + React 本番 UI（知覚層 · User Go 2026-07-05） |

**Contract が唯一の実装契約 SSOT。** 他文書は補助。

## 変更履歴

| 日付 | 変更 |
|------|------|
| 2026-07-05 | v1.6 — PM Operations Protocol |
| 2026-07-05 | v1.7 — Phase 4 Readiness PM 提案 |
| 2026-07-05 | v2.0 — Phase 4 S13 security audit |
| 2026-07-05 | v1.5 — AI Development Governance, ADR-021 |
| 2026-07-05 | v1.4 — Quality Gate, ADR-020 |
