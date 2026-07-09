# ADR-023: 本番 UI — Tauri 2 + React（知覚層ダッシュボード）

> **resource_type:** knowledge  
> **resource_id:** decision:adr-023  
> **status:** Accepted — User Go 2026-07-05  
> **supersedes-in-part:** Phase 5 デスクトップ UI 技術未決状態  
> **注記（2026-07-08）:** 5173 · 5180 は削除済。製品 UI 正本は **1420（apps/desktop）** のみ。v0.2 は [07-full-product-v0.2-draft.md](../../product/07-full-product-v0.2-draft.md)。

## コンテキスト

User Vision（2026-07-05）により、本番 UI は **生活の状態を圧縮したリアルタイム知覚層（窓）** と定義された。5180 SCR ワイヤー · 旧 URMS（VSCode+Copilot 失敗作）は正本ではない。

~~Phase 3 の暫定 Web UI（5173）は開発確認用のまま維持する。~~ **2026-07-08 削除。1420 のみ。**

## 決定

1. **本番 UI スタック:** Tauri 2 + React（TypeScript）— monorepo `apps/desktop`
2. **起動体験:** ログイン画面なし（ADR-022）— 起動即ダッシュボード
3. **UI 設計:** 情報設計 · 認知設計 · 生活モデリング（User Vision Canvas 正本）
4. **バックエンド:** 既存 Fastify API（:3000）· Context Engine · Resource SSOT を裏方として利用
5. **5180 ワイヤー:** 開発確認用として残置 · 本番 UI 正本ではない

## 却下した候補

| 候補 | 理由 |
|------|------|
| Electron + React | 実績はあるがメモリ · バイナリが重い |
| Flutter | Dart 別系統 · 既存 React 資産不可 · User 指摘の思想ズレ |
| WinUI（旧 URMS） | User 除外 — 失敗試作 |

## 実装段階（Phase 5）

| 段階 | 内容 |
|------|------|
| v0 | Tauri シェル + 知覚層 UI（モック状態 · タイポ主役） |
| v1 | API / Context Engine 連携（状態文 · AI メモ · 重み） |
| v2 | 時間帯 · 状況モード（朝/昼/移動/トラブル） |

## 影響

| 項目 | 変更 |
|------|------|
| `apps/desktop` | 新規追加 |
| Phase 5 | UI 実装開始（S14 リレーションと並行可能） |
| 5173 暫定 Web | 変更なし（開発用） |

## 参照

- User Vision Canvas `canvases/urms-user-vision.canvas.tsx`
- [ADR-022](./ADR-022-local-authentication.md)
- [11-phase5-desktop-ui.md](../../implementation/11-phase5-desktop-ui.md)

## 変更履歴

| 日付 | 変更 |
|------|------|
| 2026-07-05 | 初版 — User Go（Tauri 2 + React） |
