# URMS システム境界定義

> **resource_type:** knowledge  
> **resource_id:** knowledge:system-boundary  
> **version:** 1.0  
> **phase:** 1

## 参照

- [VISION.md](../project/VISION.md)
- [mvp-definition.md](./mvp-definition.md)

---

## 1. システム概要

```
┌─────────────────────────────────────────────────────────┐
│                      URMS システム境界                      │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐  │
│  │  Web UI     │  │  API        │  │ Context Engine  │  │
│  │  (React)    │  │  (Fastify)  │  │                 │  │
│  └──────┬──────┘  └──────┬──────┘  └────────┬────────┘  │
│         └────────────────┼───────────────────┘          │
│                          ▼                              │
│  ┌─────────────────────────────────────────────────┐    │
│  │  Domain Layer（Resource / Mode / Lifecycle）       │    │
│  └──────────────────────┬──────────────────────────┘    │
│                         ▼                               │
│  ┌──────────────┐  ┌────────────────────────────────┐  │
│  │ Prisma ORM   │  │ PostgreSQL（View/Index/Function）│  │
│  └──────────────┘  └────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

---

## 2. 境界内（In Scope）

| 領域 | 内容 | Phase |
|------|------|-------|
| Web UI | Resource 管理、Mode 切替、Context 表示 | MVP |
| API | REST（将来 OpenAPI） | MVP |
| Context Engine | 現在状態スナップショット、SSOT リンク | MVP |
| Mode System | plan / operate / audit | MVP |
| Resource モデル | 統一 CRUD、ライフサイクル | MVP |
| 監査ログ | 操作記録 | MVP |
| Knowledge 参照 | ADR / Glossary / VISION リンク | MVP |
| AI Team メタ Resource | 読取参照 | MVP |

---

## 3. 境界外（Out of Scope）

| 領域 | 理由 | 将来 Phase |
|------|------|------------|
| 外部 ERP 連携 | MVP 範囲外 | Phase 3+ |
| IoT リアルタイム取込 | 複雑度 | Phase 3+ |
| モバイルネイティブ App | Web 優先 | Phase 3+ |
| Git / Cursor 直接統合 | 開発ツールは別系統 | Phase 4（Resource 化） |
| 多言語 UI | 日本語優先 | Phase 3 |
| 課金・マルチテナント | 単一組織想定 | 未定 |

---

## 4. 外部インターフェース（将来）

| IF | 方向 | 説明 | MVP |
|----|------|------|-----|
| User Browser | In | HTTPS Web UI | ✅ |
| REST API | In/Out | クライアント・AI 連携 | ✅ |
| PostgreSQL | Internal | 永続化 | ✅ |
| IdP（認証） | In | OIDC 等（未選定） | Phase 2 |
| Export CSV/JSON | Out | 監査・バックアップ | Should |

---

## 5. AI チームとの境界

| 項目 | 開発時（Cursor） | 実行時（URMS 将来） |
|------|------------------|---------------------|
| Context | `.cursor/context/` | Context Engine（DB + API） |
| Knowledge | `docs/project/` | Knowledge Resource + 文書 |
| Rules/Skills | `.cursor/rules/` 等 | AI Team Resource |

Phase 1 では **概念整合のみ**。実装は Phase 2 以降。

---

## 6. データ境界

| 層 | 担当 | 内容 |
|----|------|------|
| Prisma | ORM, schema, migrate | Resource エンティティ基本 |
| PostgreSQL | DBA 領域 | 監査ログ View、全文検索 Index、将来 pgvector |

---

## 変更履歴

| 日付 | 変更 |
|------|------|
| 2026-07-05 | v1.0 初版 |
