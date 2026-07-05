# URMS 画面・UI 要件

> **resource_type:** knowledge  
> **resource_id:** knowledge:ui-requirements  
> **version:** 1.1  
> **phase:** 3  
> **status:** approved — 2026-07-05  
> **owner:** PM + Architect + Document Writer

## 参照

- [VISION.md](../project/VISION.md)
- [mvp-definition.md](./mvp-definition.md)
- [use-cases.md](./use-cases.md)
- [07-mode-system.md](../architecture/07-mode-system.md)
- [06-context-engine.md](../architecture/06-context-engine.md)
- [02-directory-structure.md](../architecture/02-directory-structure.md)
- [ui-design-links.md](./ui-design-links.md) — **Figma SSOT 索引**

**レイアウト・ビジュアルは Figma が SSOT。** 本書は振る舞い・Mode 連動・API 依存を定義する。

---

## 1. 目的

MVP（Phase 3）における Web UI の画面構成・振る舞い・Mode 連動を定義する。実装は Contract §11 および Sprint S5/S6 に従う。

---

## 2. 基本方針

| # | 方針 |
|---|------|
| UI-001 | **第一言語は日本語**（NFR-061） |
| UI-002 | **Mode 連動** — 操作可否は ModePolicy と一致 |
| UI-003 | **SSOT 非複製** — Context / Knowledge は要約 + リンクのみ |
| UI-004 | **デスクトップ優先** — MVP は 1280px 以上を主対象 |
| UI-005 | **Container / Presentational 分離**（Contract §11） |
| UI-006 | **アクセシビリティ** — セマンティック HTML、キーボード操作（主要フロー） |
| UI-007 | **ビジュアル SSOT** — [HTML ワイヤーフレーム](../design/wireframes/index.html) + 本書 |

---

## 3. グローバル UI

### 3.1 アプリシェル

| 要素 | 要件 ID | 説明 |
|------|---------|------|
| ヘッダ | UI-G01 | システム名、Mode Switcher、（将来）ユーザー表示 |
| メイン | UI-G02 | ルートコンテンツ領域 |
| ナビ | UI-G03 | MVP: 主要 feature へのリンク（Resource / Context / Audit / Knowledge） |
| フッタ | UI-G04 | バージョン表示（任意）、SSOT リンク 1 件まで |

### 3.2 Mode Switcher（UC-005）

| 要件 ID | 内容 |
|---------|------|
| UI-M01 | plan / operate / audit を明示選択 |
| UI-M02 | 切替時 `X-URMS-Mode` 相当を API Client に反映 |
| UI-M03 | 現在 Mode をバッジ表示 |
| UI-M04 | 禁止操作の UI は非表示または disabled + 理由ツールチップ |

### 3.3 Mode × 操作マトリクス（表示制御）

| 画面 / 操作 | plan | operate | audit |
|-------------|------|---------|-------|
| Resource 一覧・詳細（読取） | ✅ | ✅ | ✅ |
| Resource 作成・編集・削除 | ❌ 非表示 | ✅ | ❌ 非表示 |
| Context 更新 UI | ✅ | ❌ 非表示 | ❌ 非表示 |
| 監査ログ | ❌ | ❌ | ✅ |
| Knowledge 参照 | ✅ | ✅ | ✅ |

---

## 4. 画面一覧

| 画面 ID | 名称 | 主 UC | Sprint | API 依存 |
|---------|------|-------|--------|----------|
| SCR-01 | ホーム / ダッシュボード | UC-006 | S1 骨格 / S6 拡張 | `/v1/context` |
| SCR-02 | Resource 一覧 | UC-002 | S5 | `GET /v1/resources` |
| SCR-03 | Resource 詳細 | UC-004 | S5 | `GET /v1/resources/:type/:id` |
| SCR-04 | Resource 作成 | UC-001 | S5 | `POST /v1/resources` |
| SCR-05 | Resource 編集 | UC-001, UC-003 | S5 | `PATCH /v1/resources/...` |
| SCR-06 | Context ダッシュボード | UC-006, UC-007 | S6 | `GET/PUT /v1/context` |
| SCR-07 | 監査ログ一覧 | UC-008 | S5〜S6 | `GET /v1/audit` |
| SCR-08 | Knowledge 索引 | UC-010 | S5 | `GET /v1/knowledge/...` |
| SCR-09 | AI Team 参照 | UC-009 | S6 | Resource + Knowledge |

---

## 5. 画面詳細要件

### SCR-02 Resource 一覧

| 項目 | 内容 |
|------|------|
| 入力 | type, status, 名称部分一致（`q`）, page, limit |
| 表示 | テーブル: type, id, name, status, updatedAt |
| 操作 | 行クリック → 詳細、新規作成ボタン（operate のみ） |
| 空状態 | 「Resource がありません」+ 作成導線（operate） |
| エラー | Contract 統一エラー形式をトースト表示 |
| 性能 | NFR-020 — 10,000 件規模 p95 < 2s（API 依存） |

### SCR-03 Resource 詳細

| 項目 | 内容 |
|------|------|
| 表示 | 基本属性 + metadata（JSON 整形）+ ライフサイクル状態 |
| 操作 | 編集・ライフサイクル変更（operate）、一覧へ戻る |
| audit | 編集系ボタン非表示 |

### SCR-04 / SCR-05 Resource 作成・編集

| 項目 | 内容 |
|------|------|
| 必須 | resourceType, resourceId, name |
| 任意 | metadata（Plugin 検証 — S8 以降強化） |
| バリデーション | クライアント + API 二重（Contract §3） |
| 成功 | 詳細画面へ遷移 + 成功メッセージ |

### SCR-06 Context ダッシュボード

| 項目 | 内容 |
|------|------|
| 表示 key | current_phase, current_task, project_status, ssot_links, active_mode |
| 制約 | summary 500 字以内表示、**本文複製 UI 禁止** |
| 更新 | plan Mode + PM ロールのみ編集フォーム（S6） |
| リンク | ssotLinks は新規タブまたはアプリ内ルート（Knowledge） |

### SCR-07 監査ログ一覧

| 項目 | 内容 |
|------|------|
| 表示 | 日時, actor, action, resourceRef, mode |
| フィルタ | 日付範囲, resourceType, actor（MVP 最小） |
| Mode | audit のみメニュー表示 |

### SCR-08 / SCR-09 Knowledge / AI Team

| 項目 | 内容 |
|------|------|
| 表示 | ADR / Glossary / VISION へのリンク一覧（read-only） |
| AI Team | role, team, command, skill Resource の read-only 一覧 |
| 禁止 | URMS UI から `.cursor/` 直接編集（Phase 4 まで） |

---

## 6. 画面遷移（MVP）

```
[ホーム SCR-01]
  ├→ [Resource 一覧 SCR-02] → [詳細 SCR-03] → [編集 SCR-05]
  │                         └→ [作成 SCR-04]
  ├→ [Context SCR-06]        (plan)
  ├→ [監査 SCR-07]           (audit)
  └→ [Knowledge SCR-08] → [AI Team SCR-09]
```

---

## 7. 非画面要件（UI 関連）

| ID | 要件 |
|----|------|
| UI-N01 | ローディング状態表示（スケルトンまたはスピナー） |
| UI-N02 | ネットワークエラー時リトライ UI |
| UI-N03 | 楽観的更新は MVP 外（TanStack Query 導入後検討 U-003） |
| UI-N04 | ダークモード — MVP 外 |

---

## 8. MVP 外（明示）

- Resource リレーション UI（UC-011）
- develop Mode UI（UC-012）
- AI Provider / Cost ダッシュボード（Phase 4）
- モバイル専用レイアウト
- ワイヤーフレーム付きデザインシステム文書

---

## 9. 承認

| ロール | 状態 | 日付 |
|--------|------|------|
| Architect | レビュー済（Architecture 整合） | 2026-07-05 |
| PM | 承認 | 2026-07-05 |
| User | **承認** | 2026-07-05 |

## 変更履歴

| 日付 | 変更 |
|------|------|
| 2026-07-05 | v1.0 初版（Phase 3 要件拡張） |
| 2026-07-05 | v1.1 — Figma SSOT 採用、User 承認 |
