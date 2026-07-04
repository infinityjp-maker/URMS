# URMS ロードマップ

> **resource_type:** knowledge  
> **resource_id:** knowledge:roadmap  
> **version:** 1.7  
> **owner:** PM（更新） / KM（整合）

## ビジョン（不変）

長期不変の理念・判断基準は **[VISION.md](./VISION.md)** を正本とする。

## フェーズ概要

| Phase | 名称 | 状態 | Git |
|-------|------|------|-----|
| 0〜2 | 基盤〜Architecture Freeze | **完了** | `d75c53c` |
| 2.5 | Implementation Contract | **Accepted** | `3e61468` |
| 2.6 | Developer Playbook | **Accepted** | `3e61468` |
| 3 prep | Phase 3 Preparation | **完了 — Phase 3 Ready** | — |
| 3 | コア実装（MVP） | **未着手** | 実装開始承認待ち |

## 現在

- **Phase 2.6 Accepted / Phase 3 Ready** — 設計・契約完了
- **Commit:** `3e61468`（2.5/2.6）、記録コミット pending
- **Phase 3 実装:** 未開始（User「Phase3実装開始承認」待ち）

## 合同レビュー結果（2026-07-05）

| 区分 | 件数 | 概要 |
|------|------|------|
| Critical | 0 | — |
| Major | 3 | IdP 未決、実装開始未承認、Secret Store 方式未決 |
| Minor | 3 | Turbo Optional、AI Provider 段階実装、Rules リンク済 |
| Suggestion | 3 | Developer.md 更新、OpenAPI 初 PR、IdP 時 ADR |

## 未解決事項（Remaining Issues）

| ID | 項目 | ブロッカー（実装開始） |
|----|------|------------------------|
| U-001 | IdP 選定 | No（mock 可） |
| U-002 | Turbo 導入 | No |
| U-003 | TanStack Query 確定 | No |
| U-004 | Secret Store 方式 | No（AI 前 Must） |
| U-005 | 本番ホスト | No |

## Phase 3 開始条件

| # | 条件 | 状態 |
|---|------|------|
| 1 | Architecture Freeze 維持 | ✅ |
| 2 | ADR-002〜017 整合 | ✅ |
| 3 | Implementation Contract（唯一 SSOT） | ✅ |
| 4 | Playbook Accepted（補助） | ✅ |
| 5 | Phase 3 Ready 判定 | ✅ |
| 6 | **User Phase 3 実装開始承認** | ⏳ |

## マイルストーン

| ID | 内容 | 状態 |
|----|------|------|
| M3.5 | Implementation Contract | ✅ `3e61468` |
| M3.6 | Developer Playbook Accepted | ✅ `3e61468` |
| M3.7 | Phase 3 Ready | ✅ |
| M4 | MVP 実装 | blocked |

## 参照

- [implementation/](../implementation/)
- [backlog.md](./backlog.md)
