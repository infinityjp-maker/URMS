# URMS MVP 定義

> **resource_type:** knowledge  
> **resource_id:** knowledge:mvp-definition  
> **version:** 1.0  
> **phase:** 1

## 参照

- [VISION.md](../project/VISION.md)
- [ADR-005](../project/decisions/ADR-005-mvp-scope.md)

---

## 1. MVP の目的

**最小限の Resource 管理 + Mode + Context Engine + AI Team メタ参照** を実装し、URMS のコア思想（SSOT / Resource 統一 / 10年保守）を検証する。

---

## 2. MVP スコープ

### 2.1 含む（In）

| 機能 | 説明 |
|------|------|
| Resource CRUD | physical / digital / human / knowledge 基本型 |
| Resource 検索 | type, id, name, status フィルタ |
| ライフサイクル | draft → active → deprecated → archived |
| Mode System | plan / operate / audit |
| Context Engine | ダッシュボード（要約 + SSOT リンク） |
| 監査ログ | CRUD 操作記録 |
| AI Team 参照 | Role/Rule/Command/Skill の read-only 一覧 |
| Knowledge リンク | VISION / ADR / Glossary 参照 |

### 2.2 含まない（Out）

| 機能 | 延期先 |
|------|--------|
| Resource リレーション UI | Phase 2 |
| develop Mode | Phase 2 |
| AI Team 更新（URMS から） | Phase 4 |
| 外部連携 | Phase 3+ |
| 多言語 | Phase 3 |
| 高度分析 / pgvector | Phase 3 |

---

## 3. MVP ユースケース

[use-cases.md](./use-cases.md) の MVP ✅ 項目:

- UC-001 〜 UC-010（UC-011, UC-012 は除外）

---

## 4. MVP 成功基準

| # | 基準 |
|---|------|
| 1 | Resource を登録・検索・状態更新できる |
| 2 | 3 Mode 切替が動作し権限が変わる |
| 3 | Context Engine が SSOT リンクのみで現状を表示 |
| 4 | 監査ログが操作を記録 |
| 5 | AI Team Resource 一覧が参照できる |
| 6 | VISION / ADR 整合レビュー合格 |
| 7 | 非機能要件 NFR-001〜010 を満たす（Phase 2 実装時検証） |

---

## 5. MVP 後の拡張パス

```
MVP（Phase 2 実装）
  → リレーション + develop Mode（Phase 2）
  → 外部連携 + 分析（Phase 3）
  → AI Team 自己管理（Phase 4）
```

---

## 6. タイムライン（計画）

| マイルストーン | Phase | 内容 |
|----------------|-------|------|
| M2 | 1 | 要求定義完了（本 Phase） |
| M3 | 2 | アーキテクチャ + MVP 実装 |
| M4 | 2 | MVP リリース |

---

## 変更履歴

| 日付 | 変更 |
|------|------|
| 2026-07-05 | v1.0 初版 |
