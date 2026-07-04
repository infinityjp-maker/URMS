# URMS PM Operations Protocol

> **resource_type:** knowledge  
> **resource_id:** knowledge:pm-operations-protocol  
> **version:** 1.0  
> **phase:** 3 operations  
> **status:** active — PM 運用準備完了  
> **owner:** PM

## 参照（優先順位）

| 順位 | 正本 |
|------|------|
| 1 | [VISION.md](../project/VISION.md) |
| 2 | [01-implementation-contract.md](./01-implementation-contract.md) — **SSOT** |
| 3 | [07-quality-gate.md](./07-quality-gate.md) |
| 4 | [08-ai-development-governance.md](./08-ai-development-governance.md) |
| 5 | **本 Protocol** — PM 運用・開発フロー |
| 6 | [04-sprint-planning.md](./04-sprint-planning.md) |
| 7 | [02-developer-playbook.md](./02-developer-playbook.md) |

**Contract を変更しない。** 本書は運用フローのみ定義する。

---

## 1. PM 運用プロトコル

### 1.1 意思決定権限

| 区分 | PM 単独 | PM + User | PM + Architect | 不可（ADR + PM） |
|------|---------|-----------|----------------|------------------|
| Sprint 内タスク割当 | ✅ | — | — | — |
| 実装指示発行 | ✅ | — | — | — |
| スコープ追加・削減 | 提案 | **承認必須** | — | — |
| Phase / Sprint 遷移 | 宣言 | 実装開始は **承認必須** | — | — |
| Contract 条項変更 | — | — | — | **禁止（ADR-017）** |
| Architecture Freeze 変更 | — | **承認必須** | **必須** | ADR 必須 |
| HotFix / Rollback | ✅ | Critical 時 | — | — |
| Context 更新 | ✅ | — | — | — |
| Knowledge 正本更新 | 指示 | — | KM 実行 | ADR 連動時 Architect |

### 1.2 判断・承認・保留

| 状態 | 定義 | PM アクション |
|------|------|---------------|
| **判断** | Contract 状態に基づく次アクション決定 | backlog / current-task 更新 |
| **承認** | DoD 満たし次工程へ | Sprint CP 記録・Context 更新 |
| **保留** | 未決事項・ブロッカー | `blocked` + 理由明記（U-xxx / G-xxx） |

### 1.3 仕様変更の扱い

| 変更種別 | 手順 |
|----------|------|
| 実装詳細（Contract 内） | Sprint タスク → Developer → Reviewer |
| Contract 解釈疑義 | Architect 裁定 → 必要なら ADR-017 改訂 |
| Architecture / API 破壊 | ADR 新規・改訂 + User 承認 |
| 運用ルールのみ | 本 Protocol / Playbook 更新 + PM 承認 |

### 1.4 実装指示生成ルール

実装指示は [Governance §8](./08-ai-development-governance.md) Prompt Standard に従う。

| # | 必須項目 |
|---|----------|
| 1 | Backlog ID（B-xxx） |
| 2 | Sprint / CP（Sx / CP-x） |
| 3 | Contract § 参照 |
| 4 | 対象 Package / App |
| 5 | DoD（Contract §19 + Sprint DoD） |
| 6 | 禁止事項（Contract §20） |
| 7 | レビューゲート（Quality Gate §4） |

**PM 判断 = 実装トリガー。** User 実装開始承認後のみ `/implement` 相当のコード生成を許可。

---

## 2. URMS 開発フロー

### 2.1 フェーズ構造

| Phase | 意味 | 遷移条件 |
|-------|------|----------|
| 0〜2 | 要求・Architecture Freeze | 完了済 |
| 2.5〜2.9 | Contract / Playbook / Sprint / QG / Governance | User 承認 |
| **3** | **MVP 実装（S1〜S10）** | Phase 3 開始承認 + DoR |
| 4 | 品質・運用（S11〜S13） | MVP リリース後 |
| 5 | 本番・拡張（S14〜S16） | Phase 4 完了 |

**Phase = ワークフロー制御**（評価軸ではない）。Contract 状態が実装判断の唯一基準。

### 2.2 Sprint 構造

| 要素 | 正本 |
|------|------|
| Sprint 一覧 | [04-sprint-planning.md](./04-sprint-planning.md) |
| DoR | Contract §18 |
| DoD | Contract §19 + Sprint DoD |
| CP | Conventional Commit（Sprint Plan） |
| レビュー | Quality Gate §4 → Reviewer → Tester → PM |

**Sprint 進行:** DoR 確認 → PM 割当 → 実装 → PR → Reviewer → Tester → PM Sprint 完了 → CP

### 2.3 要件 → 反映 フロー

```
要件（requirements/）
  → 設計整合確認（Architecture + ADR + Contract）
  → PM 実装指示（Backlog + Sprint）
  → 実装（apps/*, packages/*）
  → 検証（Quality Gate + Tester）
  → 反映（merge + KM 更新 + Context 更新）
```

### 2.4 Rollback / Rework

| 条件 | 処理 |
|------|------|
| **Rework** | Reviewer 差戻し → Developer 修正 → 再レビュー |
| **Sprint Rework** | DoD 未達 → 同一 Sprint 内再実施 |
| **Rollback** | Quality Gate §11 — 前 tag / migration down / Flag OFF |
| **Phase Rework** | Architecture 影響 → ADR + PM + User |

---

## 3. 状態管理ルール

### 3.1 Contract（SSOT）更新

| 操作 | 権限 | 記録 |
|------|------|------|
| 参照 | 全ロール | — |
| 改訂 | ADR-017 改訂 + PM + Architect | architecture-history |
| 解釈 | Architect 裁定 | ADR または glossary |

**実装コードは Contract の下位。** 実装と Contract の差分は **Contract が正** — コードを修正する。

### 3.2 ADR 運用

| 操作 | 条件 |
|------|------|
| **追加** | Architecture 影響 or ガバナンス新設 — PM + Architect |
| **改訂** | ADR-006〜016 は Freeze ルール厳守 |
| **廃止** | 後継 ADR + KM 記録（削除しない、status: superseded） |

ADR-017〜021：運用・Contract・Governance — 本 Protocol 改訂時は ADR 整合確認。

### 3.3 Knowledge / Context

| 層 | 正本 | 更新者 | ルール |
|----|------|--------|--------|
| **Knowledge** | `docs/project/`, `docs/implementation/` | KM（PM 指示） | 長期 SSOT |
| **Context** | `.cursor/context/` | PM のみ | 要約 + リンクのみ |
| **コード** | `apps/`, `packages/` | Developer | Contract 準拠 |

**Context に Knowledge 本文複製禁止**（ADR-004）。

### 3.4 設計と実装の差分管理

| 状態 | 処理 |
|------|------|
| 実装 ⊂ Contract | 正常 |
| 実装 > Contract（スコープ外） | Rework — 削除 or ADR |
| 実装 < Contract（未実装） | Backlog / Sprint 残タスク |
| 実装 ≠ Contract（矛盾） | **Contract 優先** — コード修正 |

差分確認：`06-phase3-master-checklist.md` + Sprint DoD。

---

## 4. 実行責任モデル

### 4.1 責務マップ（5 領域 × AI チーム）

| 実行領域 | 主責任 | AI チームロール | 対象 |
|----------|--------|-----------------|------|
| **意思決定** | PM | PM | スコープ・承認・Phase/Sprint |
| **Architecture** | 構造整合 | Architect | Freeze / ADR / 層境界 |
| **Domain** | ドメイン実装 | Developer | packages/domain, db, api ロジック |
| **Evaluation** | 検証 | Reviewer + Tester | Quality Gate / テスト |
| **UI** | 表現 | Developer | apps/web（S5+） |

**API / Plugin / AI Manager** は Domain + Architecture 共有（Web 前提に限定しない）。

### 4.2 責務境界

| 境界 | ルール |
|------|--------|
| PM ↔ Architect | 設計変更は Architect 起票、PM 承認 |
| Architect ↔ Developer | Contract + ADR 準拠実装のみ |
| Developer ↔ Reviewer | merge 前 Reviewer 必須 |
| Tester ↔ PM | Tester ゲート合格で Sprint 完了候補 |
| KM ↔ 全員 | Knowledge 更新は KM、Context は PM |

### 4.3 衝突時優先順位

```
VISION
  → Architecture Freeze + ADR
  → Contract（SSOT）
  → Quality Gate
  → Governance / 本 Protocol
  → Playbook / Sprint Plan
  → Context（補助）
  → 実装コード（Contract 整合時のみ有効）
```

---

## 5. 全体運用フロー図

```
┌─────────┐
│  User   │
└────┬────┘
     │ 要件 / 承認
     ▼
┌─────────┐     実装指示      ┌────────────┐
│   PM    │ ────────────────► │ Developer  │
│(意思決定)│ ◄── 進捗/ブロック │ (Domain/UI)│
└────┬────┘                   └─────┬──────┘
     │                              │
     │ 設計疑義                       │ PR
     ▼                              ▼
┌─────────┐                   ┌────────────┐
│Architect│                   │  Reviewer  │
│(構造)   │                   │ (Evaluation)│
└────┬────┘                   └─────┬──────┘
     │                              │
     │ ADR                          │ テスト依頼
     ▼                              ▼
┌─────────┐                   ┌────────────┐
│   KM    │ ◄── Knowledge ────│   Tester   │
│(SSOT)   │                   │(Evaluation)│
└─────────┘                   └─────┬──────┘
                                    │
     Contract（SSOT）◄───────────────┘
            │
            ▼
     Sprint CP / Phase 遷移
            │
            ▼
     Context 更新（PM）
```

---

## 6. PM 運用準備完了（Definition of Ready）

| # | 条件 | 状態 |
|---|------|------|
| 1 | PM 意思決定ルール | ✅ 本書 §1 |
| 2 | 開発フロー定義 | ✅ 本書 §2 |
| 3 | 状態管理ルール | ✅ 本書 §3 |
| 4 | 実行責任モデル | ✅ 本書 §4 |
| 5 | 継続開発構造 | ✅ Sprint S1 着手済 + 本 Protocol |

---

## 変更履歴

| 日付 | 変更 |
|------|------|
| 2026-07-05 | v1.0 初版 — PM 運用フロー構築 |
