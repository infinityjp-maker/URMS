# URMS ユースケース一覧

> **resource_type:** knowledge  
> **resource_id:** knowledge:use-cases  
> **version:** 1.0  
> **phase:** 1

## 参照

- [VISION.md](../project/VISION.md)
- [URMS-Requirements-Specification.md](./URMS-Requirements-Specification.md)

---

## アクター

| アクター | 説明 |
|----------|------|
| User | システムオーナー |
| Operator | 運用者 |
| PM（AI） | AI チーム PM ロール |
| System | URMS / Context Engine |

---

## ユースケース一覧

| ID | 名称 | アクター | Mode | 優先度 | MVP |
|----|------|----------|------|--------|-----|
| UC-001 | Resource を登録する | Operator | operate | Must | ✅ |
| UC-002 | Resource を検索する | Operator | operate | Must | ✅ |
| UC-003 | Resource ライフサイクルを更新する | Operator | operate | Must | ✅ |
| UC-004 | Resource 詳細を参照する | Operator | operate / audit | Must | ✅ |
| UC-005 | Mode を切り替える | Operator | 全 Mode | Must | ✅ |
| UC-006 | Context ダッシュボードを表示する | Operator / PM | operate / plan | Must | ✅ |
| UC-007 | 計画フェーズを管理する | PM | plan | Must | ✅ |
| UC-008 | 監査ログを参照する | User | audit | Must | ✅ |
| UC-009 | AI Team Resource を参照する | PM | plan / operate | Must | ✅ |
| UC-010 | ADR / Glossary を参照する | 全員 | audit / plan | Must | ✅ |
| UC-011 | Resource リレーションを定義する | Operator | operate | Should | ❌ |
| UC-012 | AI Team Resource を更新する | PM | develop | Could | ❌（Phase 4） |

---

## 詳細（MVP 対象）

### UC-001 Resource を登録する

| 項目 | 内容 |
|------|------|
| 事前条件 | operate Mode、認証済み（将来） |
| 基本フロー | 1. Resource 種別選択 → 2. 必須属性入力 → 3. 保存 → 4. 監査ログ記録 |
| 事後条件 | Resource が SSOT（DB）に登録される |
| 関連 ADR | [ADR-002](../project/decisions/ADR-002-resource-model.md) |

### UC-002 Resource を検索する

| 項目 | 内容 |
|------|------|
| 事前条件 | operate または audit Mode |
| 基本フロー | 1. 検索条件入力（type/id/名称/状態）→ 2. 結果一覧 → 3. 詳細へ |
| 非機能 | 10,000 Resource 規模で 2 秒以内（目標、NFR 参照） |

### UC-006 Context ダッシュボードを表示する

| 項目 | 内容 |
|------|------|
| 事前条件 | 認証済み |
| 基本フロー | Context Engine が SSOT から要約を組立 → リンク表示（本文複製なし） |
| 関連 ADR | [ADR-004](../project/decisions/ADR-004-context-engine.md) |

### UC-009 AI Team Resource を参照する

| 項目 | 内容 |
|------|------|
| 説明 | 現行 `.cursor/` + `docs/ai-team/` 相当を Resource として参照 |
| 目的 | 将来 URMS 自身が AI チームを管理するためのメタモデル検証 |
| 関連 | [resource-catalog.md](./resource-catalog.md) § AI Team |

---

## 変更履歴

| 日付 | 変更 |
|------|------|
| 2026-07-05 | v1.0 初版 |
