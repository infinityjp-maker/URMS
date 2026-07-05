# URMS 要求仕様書（Requirements Specification）

> **resource_type:** knowledge  
> **resource_id:** knowledge:requirements-spec  
> **version:** 1.1  
> **phase:** 1 / 3  
> **status:** Phase 3 MVP 完了 · Phase 4 準備中  
> **owner:** PM + Document Writer

## 参照（最上位）

- [VISION.md](../project/VISION.md) — **必ず整合すること**

## 1. 概要

### 1.1 システム名称

**URMS** — Unified Resource Management System（統合リソース管理システム）

### 1.2 目的

組織内のあらゆる **Resource（資産）** を単一の SSOT 下で登録・分類・検索・ライフサイクル管理し、10年以上にわたって監査可能かつ AI と人間が協調できる基盤を提供する。

### 1.3 スコープ

| 対象 | Phase 1 | Phase 2 以降 |
|------|---------|----------------|
| 要求定義・設計文書 | ✅ | 継続更新 |
| アプリケーションソース | ❌ | 実装 |
| AI チーム基盤 | ✅ 完了 | URMS Resource 化 |

### 1.4 関連文書（SSOT）

| # | 文書 | パス |
|---|------|------|
| 1 | ユースケース一覧 | [use-cases.md](./use-cases.md) |
| 2 | システム境界 | [system-boundary.md](./system-boundary.md) |
| 3 | Resource 一覧 | [resource-catalog.md](./resource-catalog.md) |
| 4 | MVP 定義 | [mvp-definition.md](./mvp-definition.md) |
| 5 | 非機能要件 | [non-functional-requirements.md](./non-functional-requirements.md) |
| 6 | リスク一覧 | [risk-register.md](./risk-register.md) |
| 7 | **画面・UI 要件** | [ui-requirements.md](./ui-requirements.md) |
| 8 | **Phase 3 実装要件** | [phase3-implementation-requirements.md](./phase3-implementation-requirements.md) |
| 9 | ADR | [../project/decisions/](../project/decisions/) |

---

## 2. ステークホルダー

| ロール | 説明 | 主な関心 |
|--------|------|----------|
| User（オーナー） | システムオーナー・意思決定者 | VISION 達成、長期保守 |
| 運用者 | 日常の Resource 管理 | 操作性、正確性 |
| 開発者 | 実装・保守 | 変更容易性、ドキュメント |
| 監査者 | コンプライアンス確認 | 追跡可能性、監査ログ |
| AI チーム | 協調開発 | SSOT、Context、Resource モデル |

---

## 3. 基本思想（VISION 整合）

1. **SSOT** — Resource の正本は URMS DB + Knowledge 文書。Context は要約とリンクのみ。
2. **Resource 中心** — 管理対象はすべて Resource として統一モデル化する。
3. **Mode による文脈** — 操作は Mode System により権限と UI が切り替わる。
4. **Context Engine** — 現在状態を SSOT を壊さず提示する。
5. **承認ゲート** — 重要変更は ADR + PM 承認 + KM 記録。

---

## 4. 機能要求（概要）

### 4.1 Resource 管理

| ID | 要求 | 優先度 |
|----|------|--------|
| FR-001 | Resource を `resource_type` + `resource_id` で一意識別 | Must |
| FR-002 | Resource の CRUD | Must（MVP） |
| FR-003 | Resource 間リレーション定義 | Should |
| FR-004 | ライフサイクル状態管理 | Must（MVP） |
| FR-005 | Resource 検索・フィルタ | Must（MVP） |

### 4.2 Mode System

| ID | 要求 | 優先度 |
|----|------|--------|
| FR-010 | Mode 切替（plan / operate / audit） | Must（MVP） |
| FR-011 | Mode ごとの権限・UI 制御 | Must |
| FR-012 | develop Mode（システム設定） | Could（MVP 外） |

### 4.3 Context Engine

| ID | 要求 | 優先度 |
|----|------|--------|
| FR-020 | 現在フェーズ・タスクのスナップショット表示 | Must（MVP） |
| FR-021 | SSOT へのリンク集約（本文複製なし） | Must |
| FR-022 | AI 向け Context エクスポート | Should |

### 4.4 AI Team Resource（メタ Resource）

| ID | 要求 | 優先度 |
|----|------|--------|
| FR-030 | AI チーム構成（Role/Rule/Command/Skill）を Resource として登録・参照 | Must（MVP） |
| FR-031 | 将来 URMS 自身による AI チーム更新 | Could（Phase 4） |

### 4.5 監査・Knowledge

| ID | 要求 | 優先度 |
|----|------|--------|
| FR-040 | 操作監査ログ | Must（MVP） |
| FR-041 | ADR / Glossary 参照 | Must |
| FR-042 | architecture-history 連携 | Should |

### 4.6 AI 連携（Phase 3 S7）

| ID | 要求 | 優先度 |
|----|------|--------|
| FR-050 | AI Manager 経由の Provider 呼出 | Must（MVP S7） |
| FR-051 | ai-usage 記録 | Must |
| FR-052 | Feature Flag による AI 段階有効化 | Must（ADR-019） |

---

## 5. Phase 3 要件拡張（2026-07-05）

Phase 1 機能要求に加え、実装フェーズ向け詳細は以下を正本とする。

| 文書 | 内容 |
|------|------|
| [ui-requirements.md](./ui-requirements.md) | 画面一覧 SCR-01〜09、Mode 連動、遷移 |
| [phase3-implementation-requirements.md](./phase3-implementation-requirements.md) | Sprint S1〜S10 受入要件 IR-Sx-xx |

---

## 6. 制約

- 技術: React, Fastify, Prisma, PostgreSQL, pnpm（[VISION](../project/VISION.md)）
- Phase 1: **ソースコード作成禁止**
- Git LFS 不使用
- LF / UTF-8 標準

---

## 7. 用語

[../project/glossary.md](../project/glossary.md) を正本とする。

---

## 8. 承認

| ロール | 状態 | 日付 |
|--------|------|------|
| Architect | Phase 1 + Phase 3 拡張レビュー済 | 2026-07-05 |
| Reviewer | Phase 1 レビュー済 | 2026-07-05 |
| PM | Phase 3 要件拡張 · MVP 実装完了 | 2026-07-05 |
| User | Phase 4 Go | ✅ 2026-07-05 |
| User | IdP 不要（ローカルアプリ） | ✅ 2026-07-05 · ADR-022 |

## 変更履歴

| 日付 | 変更 |
|------|------|
| 2026-07-05 | v1.1 — UI 要件・Phase 3 実装要件・FR-050〜052 |
| 2026-07-05 | v1.2 — Phase 3 MVP 完了 · Phase 4 準備 |
| 2026-07-05 | v1.0 初版（Phase 1） |
