# URMS UI デザインリンク（ビジュアル SSOT）

> **resource_type:** knowledge  
> **resource_id:** knowledge:ui-design-links  
> **version:** 1.1  
> **phase:** 3  
> **status:** active  
> **owner:** PM + User

## 参照

- [ui-requirements.md](./ui-requirements.md) — 画面要件・振る舞い
- [wireframes/index.html](../design/wireframes/index.html) — **ビジュアル SSOT（HTML）**

---

## 1. SSOT 定義

| 領域 | 正本 |
|------|------|
| レイアウト・ビジュアル・画面構成 | **[HTML ワイヤーフレーム](../design/wireframes/index.html)** |
| 振る舞い・Mode 制御・API 連携 | [ui-requirements.md](./ui-requirements.md) |
| 動作する UI 実装 | `apps/web`（S5 完了） |
| Figma（任意・将来） | 未使用 — User 作業不要 |

**フレーム名規則:** `SCR-{ID} {画面名} / {mode}`（HTML ファイル名と一致）

---

## 2. ワイヤーフレーム（MVP SSOT）

| 項目 | 値 |
|------|-----|
| 索引 | [docs/design/wireframes/index.html](../design/wireframes/index.html) |
| 開き方 | エクスプローラーで `index.html` をダブルクリック（ブラウザで開く） |
| 作成 | PM / Developer（2026-07-05） |
| 画面数 | SCR-01〜09（10 HTML + 索引） |

---

## 3. 画面 ↔ ワイヤーフレーム

| 画面 ID | 名称 | ファイル | 状態 |
|---------|------|----------|------|
| SCR-01 | ホーム / ダッシュボード | [scr-01-home-operate.html](../design/wireframes/scr-01-home-operate.html) | ✅ |
| SCR-02 | Resource 一覧 | [scr-02-resource-list-operate.html](../design/wireframes/scr-02-resource-list-operate.html) | ✅ |
| SCR-03 | Resource 詳細 | [scr-03-resource-detail-operate.html](../design/wireframes/scr-03-resource-detail-operate.html) | ✅ |
| SCR-03 | Resource 詳細 (audit) | [scr-03-resource-detail-audit.html](../design/wireframes/scr-03-resource-detail-audit.html) | ✅ |
| SCR-04 | Resource 作成 | [scr-04-resource-create-operate.html](../design/wireframes/scr-04-resource-create-operate.html) | ✅ |
| SCR-05 | Resource 編集 | [scr-05-resource-edit-operate.html](../design/wireframes/scr-05-resource-edit-operate.html) | ✅ |
| SCR-06 | Context ダッシュボード | [scr-06-context-plan.html](../design/wireframes/scr-06-context-plan.html) | ✅ |
| SCR-07 | 監査ログ一覧 | [scr-07-audit-log-audit.html](../design/wireframes/scr-07-audit-log-audit.html) | ✅ |
| SCR-08 | Knowledge 索引 | [scr-08-knowledge-operate.html](../design/wireframes/scr-08-knowledge-operate.html) | ✅ |
| SCR-09 | AI Team 参照 | [scr-09-ai-team-operate.html](../design/wireframes/scr-09-ai-team-operate.html) | ✅ |

---

## 4. Figma（任意）

Figma アカウントは作成済み。MVP では **HTML ワイヤーフレームを SSOT** とし、Figma 作業は **User 不要**。

将来 Figma に移行する場合のみ本表に URL を追記。

---

## 変更履歴

| 日付 | 変更 |
|------|------|
| 2026-07-05 | v1.0 — Figma SSOT 採用（User 承認） |
| 2026-07-05 | v1.1 — HTML ワイヤーフレームを SSOT に変更（User 作業代替） |
