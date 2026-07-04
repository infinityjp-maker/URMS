# ADR-021: AI Development Governance 正式採用

> **resource_type:** decision  
> **resource_id:** decision:ADR-021  
> **status:** accepted  
> **date:** 2026-07-05  
> **author:** PM + Architect

## コンテキスト

Phase 2.8 で Quality Gate（ADR-020）が完了した。Phase 3 実装開始前の最終ガバナンスとして、AI と人間の共同開発運用（依頼・生成・レビュー・承認）を標準化する必要がある。Architecture Freeze（ADR-006〜016）および ADR-017〜020 を変更せず、AI 開発ルールを追加する。

## 決定

### 1. AI Development Governance 正式採用

[08-ai-development-governance.md](../../implementation/08-ai-development-governance.md) を Phase 3 以降の **AI 共同開発運用基準** として採用する。

### 2. Phase 3 開始の三本柱

Phase 3 MVP 実装のガバナンスは以下 **3 文書** で構成する:

| 柱 | 文書 | ADR | 役割 |
|----|------|-----|------|
| **Contract** | Implementation Contract | ADR-017 | **何をどう作るか** — 実装契約 SSOT |
| **Quality Gate** | Quality Gate | ADR-020 | **どう合格するか** — PR / Review / Release |
| **Governance** | AI Development Governance | ADR-021 | **AI と人間がどう協調するか** |

**優先順位（実装判断）:** VISION > Architecture > ADR > **Contract** > Quality Gate > Governance > Playbook > Sprint Plan

DoR / DoD の正本は Contract §18/§19 のみ（変更なし）。

### 3. Phase 3 開始条件（更新）

Phase 3 MVP 実装（Sprint S1）開始前に **すべて** 満たすこと:

| # | 条件 | 状態 |
|---|------|------|
| 1 | Architecture Freeze 維持 | ✅ |
| 2 | Implementation Contract（ADR-017） | ✅ |
| 3 | Developer Playbook Accepted | ✅ |
| 4 | Sprint Planning（ADR-018/019） | ✅ |
| 5 | Quality Gate（ADR-020） | ✅ |
| 6 | **AI Development Governance（ADR-021）** | ✅ |
| 7 | Phase 3 Ready 判定 | ✅ |
| 8 | **User Phase 3 実装開始承認** | ⏳ |

### 4. ADR-016 整合

- AI Provider 追加・Adapter 追加は Governance §11 に従う
- Core から Provider SDK 直接 import 禁止（変更なし）
- AI レビューは Reviewer 補助 — 最終承認は Reviewer（Governance §6）

### 5. 変更ルール

Governance 変更は PM + Architect 合意 + KM 記録。Contract / Quality Gate 条項の変更は各 ADR 改訂が必要。

## 理由

- AI 共同開発の再現性と監査可能性
- Contract / Quality Gate / Governance の役割分離
- 10年保守 — 複数 Provider / 複数 AI ツールでも同一ルール

## 影響

- [08-ai-development-governance.md](../../implementation/08-ai-development-governance.md)
- [07-quality-gate.md](../../implementation/07-quality-gate.md) §9 — 整合維持
- [02-developer-playbook.md](../../implementation/02-developer-playbook.md) — 日常補助（Governance 下位）

## 関連

- [ADR-016](./ADR-016-ai-provider-abstraction.md)
- [ADR-017](./ADR-017-implementation-contract.md)
- [ADR-020](./ADR-020-quality-gate.md)
