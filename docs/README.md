# URMS ドキュメント管理

> **resource_type:** knowledge  
> **resource_id:** knowledge:documentation-index  
> **version:** 1.0  
> **owner:** PM + Document Writer

## 2 種類の正本（役割分担）

| 種類 | 場所 | 読者 | 役割 |
|------|------|------|------|
| **Markdown（開発 SSOT）** | `docs/` | 開発者 · AI チーム · CI | 要求・設計・契約の **唯一の編集正本** |
| **Canvas（閲覧 SSOT）** | Cursor `canvases/` | User（オーナー）· PM | 読みやすい **閲覧専用ビュー**（編集しない） |

```
docs/*.md（編集・レビュー・ADR 整合）
        │
        ▼ 要約・表形式で反映（内容変更時に同期）
canvases/urms-docs.canvas.tsx（User 向け閲覧）
canvases/urms-progress-plan.canvas.tsx（進捗 · リンク）
```

**原則:** 内容を変えるときは **必ず Markdown を先に更新** し、User 向け表示が必要なら Canvas を追随更新する。

---

## User（オーナー）が開くもの

| 目的 | 開くファイル |
|------|-------------|
| 進捗 · サーバー · クイックリンク | `canvases/urms-progress-plan.canvas.tsx` |
| 要件 · VISION · 用語 · 画面の見方 等 | `canvases/urms-docs.canvas.tsx` |

Cursor サイドバー → **canvases** フォルダから開いてください。

---

## 開発者 · AI チームが開くもの

| ディレクトリ | 索引 | 内容 |
|-------------|------|------|
| `docs/requirements/` | [README.md](./requirements/README.md) | 要求仕様 · UI 要件 · MVP |
| `docs/architecture/` | [README.md](./architecture/README.md) | アーキテクチャ設計（Freeze 済） |
| `docs/implementation/` | [README.md](./implementation/README.md) | Contract · Sprint · Quality Gate |
| `docs/project/` | [VISION.md](./project/VISION.md) | VISION · ADR · ロードマップ |
| `docs/ai-team/` | [00_Overview.md](./ai-team/00_Overview.md) | AI チームロール定義 |
| `docs/standards/` | [coding-standard.md](./standards/coding-standard.md) | コーディング標準 |

参照優先順位:

```
VISION → Requirements → Architecture → ADR → Implementation Contract
```

---

## 更新ルール

| 変更内容 | 更新先 |
|----------|--------|
| 要求・UI・MVP の追加変更 | `docs/requirements/*.md` → `urms-docs.canvas.tsx` |
| アーキテクチャ決定 | ADR + `docs/architecture/*.md` → Canvas ADR 索引 |
| 実装ルール · Sprint | `docs/implementation/*.md`（Canvas には概要のみ） |
| 進捗 · 起動状態 | `urms-progress-plan.canvas.tsx` のみ |
| 用語追加 | `docs/project/glossary.md` → Canvas 用語集 |

---

## 変更履歴

| 日付 | 変更 |
|------|------|
| 2026-07-05 | v1.0 — Canvas / Markdown 二層管理を定義 |
| 2026-07-05 | v1.1 — Phase 3 MVP 完了 · Phase 4 準備を roadmap/backlog/Context に反映 |
