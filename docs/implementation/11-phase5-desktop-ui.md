# Phase 5 — 本番 UI（知覚層ダッシュボード）

> **resource_type:** knowledge  
> **owner:** PM / Developer  
> **adr:** ADR-023  
> **status:** v0 着手（User Go 2026-07-05）

## 位置づけ

| UI | 用途 | ポート / パス |
|----|------|----------------|
| **apps/desktop（Tauri）** | 本番 — 知覚層ダッシュボード | デスクトップアプリ |
| apps/web | 暫定 Web — 開発確認のみ | 5173 |
| wireframes | 設計図 — SCR 参照（本番正本外） | 5180 |

## User Vision（要約）

> URMS ダッシュボード = 生活の状態を圧縮したリアルタイム知覚層（窓）

- 余白 · タイポ主役 · 呼吸レベルのアニメ
- 色は意味（危険 = 赤ではなく重みの変化）
- 時間帯 · 状況で情報量が変わる

正本: Canvas `urms-user-vision.canvas.tsx`

## v0 スコープ（Sprint 着手）

- [x] `apps/desktop` — Tauri 2 + React シェル
- [x] 知覚層 UI — 時刻 · 状態 · 天気 · 予定 · まとめ · AI メモ（モック）
- [ ] API 連携（Context Engine）
- [ ] 時間帯モード

## 開発コマンド

```bash
# ルートから
pnpm dev:desktop

# または
pnpm --filter @urms/desktop dev
```

前提: Node 20+ · Rust · Windows 開発環境

## 参照

- [ADR-023](../project/decisions/ADR-023-tauri-desktop-ui.md)
- [roadmap.md](../project/roadmap.md)
