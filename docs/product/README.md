# URMS 製品設計パック（User 向け正本）

> **resource_type:** knowledge  
> **resource_id:** knowledge:product-design-pack  
> **version:** 0.2  
> **owner:** PM  
> **User Go:** 2026-07-08 — v0.2 実装再開

## このパックの目的

**あなたが判断するためだけ** に書く設計書です。  
AI・開発者向けの内部設計（`docs/architecture/` 等）とは **役割を分離** します。

| 層 | 正本 | 誰が読む |
|----|------|----------|
| **製品設計（本パック）** | `docs/product/` | **あなた** → 承認 |
| 内部設計 | `docs/architecture/` · `docs/implementation/` | AI · 開発者 |
| 旧管理 UI ワイヤー | ~~`docs/design/wireframes/`~~ | **削除済**（1420 のみ） |

## 読む順（30 分）

| 順 | ファイル | 内容 |
|----|----------|------|
| 1 | [07-full-product-v0.2-draft.md](./07-full-product-v0.2-draft.md) | **URMS 全体像（正）** |
| 2 | [01-product-overview.md](./01-product-overview.md) | URMS を **何のために使うか** |
| 3 | [03-screen-catalog.md](./03-screen-catalog.md) | 画面一覧（1420 · v0.2） |
| 4 | [02-feature-scope.md](./02-feature-scope.md) | 今期 **入れる / 入れない** |
| 5 | [04-navigation-and-actions.md](./04-navigation-and-actions.md) | 画面遷移 · ボタン |
| 6 | [05-mock-strategy.md](./05-mock-strategy.md) | 画面モックの方式 |
| 7 | [06-production-definition.md](./06-production-definition.md) | **本番** の定義と道筋 |

## 承認の流れ（v0.2 Go 後）

```
07 v0.2 を読む → あなたが Go / 修正指示（済: 2026-07-08）
  → PM が差分を v1.0 に確定 → 内部設計を同期 → 実装継続
```

## 開発中の情報入口

| 種類 | 入口 |
|------|------|
| **すべて** | Canvas **`urms-hub`** — 進捗 · ドキュメント · プレビュー |
| 製品設計 | Canvas `urms-product-design` · [07-full-product-v0.2-draft.md](./07-full-product-v0.2-draft.md) |
| 進捗詳細 | Canvas `urms-progress-plan` |

## あなたが毎日見るもの

| 入口 | 役割 |
|------|------|
| **Canvas urms-hub** | 開発ポータル — 青リンク = チャットと同じ |
| [PREVIEW.md](./PREVIEW.md) | プレビューリンク一覧 |
| http://127.0.0.1:1420/ | 製品 UI（サーバー起動後） |
| http://127.0.0.1:1420/#/screens | 画面一覧 |

5173 · 5180 は **削除済**（2026-07-08）。製品 UI は **1420 のみ**。

## 変更履歴

| 日付 | 変更 |
|------|------|
| 2026-07-08 | v0.1 初版 — 設計再出発 · User Go |
| 2026-07-08 | v0.2 — 全体像確定 · モジュール画面 · 実装再開 |
