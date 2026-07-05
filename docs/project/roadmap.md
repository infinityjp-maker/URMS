# URMS ロードマップ

> **resource_type:** knowledge  
> **resource_id:** knowledge:roadmap  
> **version:** 2.1  
> **owner:** PM / KM

## ビジョン（不変）

**[VISION.md](./VISION.md)** を正本とする。

## フェーズ概要

| Phase | 名称 | 状態 |
|-------|------|------|
| 0〜2 | 基盤〜Architecture Freeze | **完了** |
| 2.5 | Implementation Contract | **Accepted** |
| 2.6 | Developer Playbook | **Accepted** |
| 2.7 | Sprint Planning | **Accepted** |
| 2.8 | Quality Gate | **Accepted** |
| 2.9 | AI Development Governance | **完了（PM 承認待ち）** |
| 3 prep | Phase 3 Ready | **完了** |
| 3 | MVP 実装（S1〜S10） | **完了** — tag `v0.2.0-mvp` |
| 4 | 品質・運用（S11〜S13） | **進行中** — S12 監視 · ログ |
| 5 | 本番・拡張（S14〜S16） | 未着手 |

## 現在

- **Phase 3 MVP 完了** — Sprint S1〜S10 · tag `v0.2.0-mvp`（`0d3e18d`）
- **Phase 4 Go 承認済** — S11 実装済 · S12 監視 · ログ進行中
- **User 向け進捗:** Canvas `urms-progress-plan.canvas.tsx`

## Phase 3 開始条件（記録）

| # | 条件 | 状態 |
|---|------|------|
| 1 | Phase 3 Ready | ✅ |
| 2 | Contract（ADR-017） | ✅ |
| 3 | Playbook | ✅ |
| 4 | Sprint Planning（ADR-018/019） | ✅ |
| 5 | Quality Gate（ADR-020） | ✅ |
| 6 | AI Governance（ADR-021） | ✅ |
| 7 | **User Phase 3 実装開始承認** | ✅ 2026-07-05 |

## Phase 4 開始条件（未確定）

| # | 条件 | 状態 |
|---|------|------|
| 1 | Phase 3 MVP 完了レビュー | ✅ tag `v0.2.0-mvp` |
| 2 | 認証方針（ローカル · IdP 不要） | ✅ User 2026-07-05 · ADR-022 |
| 3 | **User Phase 4 実装開始承認** | ✅ Go — 2026-07-05 |

## 参照

- [08-ai-development-governance.md](../implementation/08-ai-development-governance.md)
- [07-quality-gate.md](../implementation/07-quality-gate.md)
- [backlog.md](./backlog.md)
