# Phase 5 — 本番 UI（知覚層ダッシュボード）

> **resource_type:** knowledge  
> **owner:** PM / Developer  
> **adr:** ADR-023  
> **status:** v2 完了（v2a 天気 · v2b 予定）· **S14 次**

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
- [x] 知覚層 UI — 時刻 · 状態 · 天気 · 予定 · まとめ · AI メモ
- [x] API 連携 v1 — `GET /v1/perception`（Context → 窓）
- [x] 時間帯モード — 朝/昼/夕/夜で表示項目を切替

## v2 スコープ（User 了承 — 2026-07-05）

| 段階 | 内容 | 状態 |
|------|------|------|
| **v2a** | 天気 — Open-Meteo · location Resource SSOT 優先 | ✅ |
| **v2b** | 予定 — `schedule` Resource · `metadata.startAt` | ✅ |
| v2c | 外部カレンダー連携 | 将来 · 別途 Go |

**schedule Resource 例（`POST /v1/resources` · status `active`）:**

```json
{
  "resourceType": "schedule",
  "resourceId": "standup-20260705",
  "name": "プロジェクト定例",
  "metadata": {
    "startAt": "2026-07-05T09:30:00+09:00",
    "tone": "calm",
    "note": "集中時間推奨"
  }
}
```

作成後 `PATCH /v1/resources/schedule/{id}/lifecycle` で `active` にすると窓に表示されます。

**SSOT 同期（VT-1）**

| 正本 | コマンド | API |
|------|----------|-----|
| `.cursor/resources/schedule/*.md` | `pnpm schedule:sync` | `POST /v1/schedule/sync` |
| `.cursor/resources/location/*.md` | `pnpm location:sync` | `POST /v1/location/sync` |
| 両方一括 | **`pnpm ssot:sync`** | — |

- schedule: `recurrence: daily` + `time` で毎日窓に表示
- location: `primary: true` の地点が天気 API の緯度経度 SSOT（env より優先）

**日次ループ（VT-4）:** API+DB 接続時、窓タスクカードの **「完了 → 次へ」** → `POST /v1/context/advance-task`（operate Mode）→ perception 再合成。

**実装:** `@urms/domain` · `ResourceScheduleService` + `OpenMeteoWeatherService` → `GET /v1/perception` · 未取得時は空（偽フィクスチャなし）。

**S14（Resource リレーション）:** v2b 完了後に着手（設計メモのみ先行可）。

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
