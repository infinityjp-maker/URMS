# URMS UI デザインリンク（Figma SSOT）

> **resource_type:** knowledge  
> **resource_id:** knowledge:ui-design-links  
> **version:** 1.0  
> **phase:** 3  
> **status:** active — Figma フレーム作成待ち  
> **owner:** PM + User

## 参照

- [ui-requirements.md](./ui-requirements.md) — 画面要件・振る舞い
- [VISION.md](../project/VISION.md)

---

## 1. SSOT 定義

| 領域 | 正本 |
|------|------|
| レイアウト・ビジュアル・コンポーネント | **Figma** |
| 振る舞い・Mode 制御・API 連携 | [ui-requirements.md](./ui-requirements.md) |
| 実装構造 | [Contract §11](../implementation/01-implementation-contract.md) |

**Figma フレーム名:** `{SCR-ID} {画面名} / {mode}`（例: `SCR-02 Resource List / operate`）

---

## 2. Figma プロジェクト

| 項目 | 値 |
|------|-----|
| プロジェクト名 | URMS MVP |
| Figma URL | **（ファイル作成後に User が記載）** |
| Figma アカウント | ✅ User 作成済（2026-07-05） |
| 作成主体 | User |
| 対象 Sprint | S5 本格 UI — Developer は ui-requirements 準拠で先行実装中 |

---

## 3. 画面 ↔ Figma フレーム

| 画面 ID | 名称 | Figma フレーム | 状態 |
|---------|------|----------------|------|
| SCR-01 | ホーム / ダッシュボード | — | 未作成 |
| SCR-02 | Resource 一覧 | — | 未作成 |
| SCR-03 | Resource 詳細 | — | 未作成 |
| SCR-04 | Resource 作成 | — | 未作成 |
| SCR-05 | Resource 編集 | — | 未作成 |
| SCR-06 | Context ダッシュボード | — | 未作成 |
| SCR-07 | 監査ログ一覧 | — | 未作成 |
| SCR-08 | Knowledge 索引 | — | 未作成 |
| SCR-09 | AI Team 参照 | — | 未作成 |

Mode バリアント: `plan` / `operate` / `audit`（SCR-02〜05, 07 は operate / audit 優先）

---

## 4. 更新ルール

1. 画面変更は **Figma 先行** → 本表 URL 更新 → `ui-requirements.md` 該当 SCR 参照更新
2. S5 着手前に Architect が Figma × API × Mode 整合レビュー
3. MVP はピクセル完全一致不要（構造・状態・導線一致を優先）

---

## 変更履歴

| 日付 | 変更 |
|------|------|
| 2026-07-05 | v1.0 — Figma SSOT 採用（User 承認） |
