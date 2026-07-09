# URMS UI デザインリンク（ビジュアル SSOT）

> **resource_type:** knowledge  
> **resource_id:** knowledge:ui-design-links  
> **version:** 2.0  
> **phase:** 6（製品 v0.2）  
> **status:** active  
> **owner:** PM + User

## 参照

- [07-full-product-v0.2-draft.md](../product/07-full-product-v0.2-draft.md) — 製品全体像
- [03-screen-catalog.md](../product/03-screen-catalog.md) — 画面 ID · ルート
- [ui-requirements.md](./ui-requirements.md) — 振る舞い（更新予定）

---

## 1. SSOT 定義（2026-07-08 確定）

| 領域 | 正本 |
|------|------|
| 製品全体像 · モジュール構成 | **[07-full-product-v0.2-draft.md](../product/07-full-product-v0.2-draft.md)** |
| 画面一覧 · ID | **[03-screen-catalog.md](../product/03-screen-catalog.md)** |
| 動作する UI 実装 | **`apps/desktop`**（1420 · Tauri dev） |
| 旧 HTML ワイヤー（SCR-01〜09） | **アーカイブ** — 本番正本外 · 5173/5180 削除済 |
| Figma | 未使用 — 1420 + 製品設計パックで共有 |

**画面 ID 規則（v0.2）:** `M-{MOD}-{ROLE}`（例: `M-WEA-DET`）

---

## 2. プレビュー URL（User 向け）

| 画面 | URL | 開き方 |
|------|-----|--------|
| ハブ | http://127.0.0.1:1420/ | Canvas urms-hub の青リンク |
| 画面一覧 | http://127.0.0.1:1420/#/screens | 同上 |
| 天気詳細 | http://127.0.0.1:1420/#/M-WEA-DET | 同上 |

**Cursor 内タブ**（統合ブラウザ）で開く。外部ブラウザ不要。

---

## 3. 画面 ↔ 実装（v0.2）

| 画面 ID | 名称 | ルート | 状態 |
|---------|------|--------|------|
| HUB | 知覚の窓 | `/` | ✅ |
| LIST | 画面一覧 | `#/screens` | ✅ S1 |
| M-WEA-DET | 天気詳細 | `#/M-WEA-DET` | ✅ S2 |
| M-CAL-MON | マンスリーカレンダー | `#/M-CAL-MON` | ✅ S3（Google 後半） |

---

## 4. 旧ワイヤーフレーム（参照のみ · 更新停止）

`docs/design/wireframes/` — Phase 3 の SCR 管理 UI 用。**製品 v0.2 とは無関係。**

---

## 変更履歴

| 日付 | 変更 |
|------|------|
| 2026-07-05 | v1.0 — HTML ワイヤーフレーム SSOT |
| 2026-07-08 | v2.0 — 製品 v0.2 · 1420 正本 · 5173/5180 削除 |
