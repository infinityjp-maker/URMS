# URMS リスク一覧

> **resource_type:** knowledge  
> **resource_id:** knowledge:risk-register  
> **version:** 1.0  
> **phase:** 1

## 参照

- [VISION.md](../project/VISION.md)

---

## 凡例

| 影響 | 確率 | スコア |
|------|------|--------|
| H/M/L | H/M/L | H=要対策, M=監視, L=受容 |

---

## リスク一覧

| ID | リスク | 影響 | 確率 | スコア | 対策 |
|----|--------|------|------|--------|------|
| R-001 | Resource モデル過剰抽象化 | H | M | **H** | MVP 最小 Type のみ。ADR-002 で固定 |
| R-002 | SSOT 違反（Context への複製） | H | M | **H** | Context Engine 設計レビュー、Tester ドキュメントテスト |
| R-003 | Prisma/PostgreSQL 境界混乱 | M | M | **M** | Skill 分離、ADR、レビュー |
| R-004 | Mode 権限設計の複雑化 | M | M | **M** | MVP は 3 Mode のみ。ADR-003 |
| R-005 | 10年保守不能な技術選定 | H | L | **M** | VISION 技術方向固定、ADR 必須 |
| R-006 | AI チーム運用逸脱（PM 窓口無視） | M | M | **M** | Rules エスカレーション、レビュー |
| R-007 | 要求スコープクリープ | H | H | **H** | MVP 定義厳守、PM 承認ゲート |
| R-008 | 認証未設計のまま実装開始 | H | M | **H** | Phase 2 で IdP ADR 必須 |
| R-009 | ドキュメント陳腐化 | M | H | **H** | KM 更新、/knowledge 運用 |
| R-010 | 単一開発者属人化 | M | M | **M** | ドキュメント駆動、AI チーム |

---

## 監視項目

- Phase 2 開始前: R-008（認証 ADR）必須
- 各 Phase 完了時: R-002, R-009 レビュー

---

## 変更履歴

| 日付 | 変更 |
|------|------|
| 2026-07-05 | v1.0 初版 |
