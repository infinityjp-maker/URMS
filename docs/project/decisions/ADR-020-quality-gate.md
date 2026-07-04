# ADR-020: Quality Gate 正式採用

> **resource_type:** decision  
> **resource_id:** decision:ADR-020  
> **status:** accepted  
> **date:** 2026-07-05  
> **author:** PM + Architect + Reviewer + Tester

## コンテキスト

Phase 2.7 で Sprint Planning（ADR-018/019）が完了した。Phase 3 実装開始前に、PR・Commit・Review・Test・Release の品質基準を標準化し、Developer / Reviewer / Tester / PM / AI が同一基準で開発できる状態が必要。Architecture Freeze（ADR-006〜016）および Contract（ADR-017）を変更せず、品質ゲートを追加する。

## 決定

### 1. Quality Gate 正式採用

[07-quality-gate.md](../../implementation/07-quality-gate.md) を Phase 3 以降の **品質・レビュー・リリース基準** として採用する。

| 文書 | 役割 |
|------|------|
| Implementation Contract | **実装契約 SSOT**（DoR/DoD 正本） |
| Developer Playbook | 日常運用補助 |
| Sprint Planning | Sprint 単位の CP / DoD |
| **Quality Gate** | PR / Review / Test / Release / HotFix 基準 |

**優先順位:** Contract > Quality Gate > Playbook > Sprint Plan（詳細は Quality Gate §1）。

### 2. DoR / DoD

DoR / DoD の **唯一の正本は Contract §18 / §19**。Quality Gate §14 はゲートチェックリストのみ。Contract と矛盾する Quality Gate 条項は無効。

### 3. Phase 3 開始条件（更新）

Phase 3 MVP 実装（Sprint S1）開始前に **すべて** 満たすこと:

| # | 条件 | 状態 |
|---|------|------|
| 1 | Architecture Freeze 維持 | ✅ |
| 2 | Implementation Contract（ADR-017） | ✅ |
| 3 | Developer Playbook Accepted | ✅ |
| 4 | Sprint Planning（ADR-018/019） | ✅ |
| 5 | **Quality Gate（ADR-020）** | ✅ |
| 6 | Phase 3 Ready 判定 | ✅ |
| 7 | **User Phase 3 実装開始承認** | ⏳ |

### 4. AI レビュー

AI によるコードレビューは Reviewer 補助とする。最終 merge 承認は Reviewer が行う（Quality Gate §9）。

### 5. 変更ルール

Quality Gate の変更は PM + Reviewer + Tester 合意 + KM 記録。Contract 条項の変更は ADR-017 改訂が必要。

## 理由

- 10年保守: 品質基準の一貫性
- Sprint レビューゲートと PR ゲートの橋渡し
- AI チーム全ロールの共通チェックリスト

## 影響

- [07-quality-gate.md](../../implementation/07-quality-gate.md)
- [03-phase3-readiness.md](../../implementation/03-phase3-readiness.md) — 開始条件参照更新推奨
- [04-sprint-planning.md](../../implementation/04-sprint-planning.md) — 横断ルールと整合

## 関連

- [ADR-017](./ADR-017-implementation-contract.md)
- [ADR-018](./ADR-018-versioning-policy.md)
- [ADR-019](./ADR-019-feature-flag-policy.md)
