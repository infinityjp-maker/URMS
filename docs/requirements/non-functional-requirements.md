# URMS 非機能要件

> **resource_type:** knowledge  
> **resource_id:** knowledge:nfr  
> **version:** 1.0  
> **phase:** 1

## 参照

- [VISION.md](../project/VISION.md)

---

## 1. 保守性（最優先）

| ID | 要件 | 目標 |
|----|------|------|
| NFR-001 | モジュール境界明確（apps/web, apps/api, packages） | Phase 2 設計 |
| NFR-002 | ADR 必須の設計変更 | 100% 遵守 |
| NFR-003 | テストカバレッジ（重要ドメイン） | 80%+ Phase 2 |
| NFR-004 | ドキュメントとコード同期 | PR 時必須 |

---

## 2. 拡張性

| ID | 要件 | 目標 |
|----|------|------|
| NFR-010 | Resource Type 追加が schema 変更最小 | プラグイン型 Phase 2 設計 |
| NFR-011 | Mode 追加が設定駆動 | コード変更最小 |
| NFR-012 | API バージョニング | `/v1/` プレフィックス |

---

## 3. 性能

| ID | 要件 | 目標 |
|----|------|------|
| NFR-020 | Resource 検索（10,000 件） | p95 < 2s |
| NFR-021 | Context Engine 表示 | p95 < 1s |
| NFR-022 | API 同時接続 | 100 ユーザー（初期） |

---

## 4. セキュリティ

| ID | 要件 | 目標 |
|----|------|------|
| NFR-030 | 認証必須（本番） | OIDC 等 Phase 2 |
| NFR-031 | Mode ベース認可 | RBAC + Mode |
| NFR-032 | 監査ログ改ざん防止 | append-only |
| NFR-033 | 秘密情報非コミット | .gitignore + CI |

---

## 5. 可用性・運用

| ID | 要件 | 目標 |
|----|------|------|
| NFR-040 | バックアップ | 日次 PostgreSQL |
| NFR-041 | 復旧時間目標（RTO） | 4 時間（初期） |
| NFR-042 | 復旧ポイント目標（RPO） | 24 時間（初期） |

---

## 6. AI 協調

| ID | 要件 | 目標 |
|----|------|------|
| NFR-050 | Context Engine は SSOT リンクのみ | 本文複製 0 |
| NFR-051 | Resource API が AI から利用可能 | OpenAPI Phase 2 |
| NFR-052 | AI Team Resource 参照 API | MVP |

---

## 7. 品質・標準

| ID | 要件 | 目標 |
|----|------|------|
| NFR-060 | UTF-8 / LF | 全ファイル |
| NFR-061 | 日本語 UI / 文書 | 第一言語 |
| NFR-062 | アクセシビリティ | WCAG 2.1 AA（Phase 3 目標） |

---

## 変更履歴

| 日付 | 変更 |
|------|------|
| 2026-07-05 | v1.0 初版 |
