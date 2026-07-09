# URMS 画面の見方（確認済み手順）

> User が画面を見るための手順。**サーバー起動は PM / AI が行います。**

## User 向け（推奨 · これだけ）

1. Cursor で Canvas **[urms-hub](C:/Users/infin/.cursor/projects/d-GitHub-URMS/canvases/urms-hub.canvas.tsx)** を開く
2. **製品 UI プレビュー** の青リンクをクリック — **チャットのリンクと同じ**（Cursor 内ブラウザ · HMR ライブ）

**PowerShell 操作は不要です。**

| 青リンク | 内容 |
|----------|------|
| 表示 · ハブ | 知覚の窓 |
| 表示 · 画面一覧 | 全モジュール入口 |
| 表示 · 天気詳細 | M-WEA-DET |

進捗 · サーバー状態: Canvas **[urms-progress-plan](C:/Users/infin/.cursor/projects/d-GitHub-URMS/canvases/urms-progress-plan.canvas.tsx)**

5173 · 5180 は **削除済**（2026-07-08）。見るのは **1420 のみ**。

---

## 開発者向け（手動起動）

### 0. 一括環境構築（推奨）

```powershell
cd D:\GitHub\URMS
scripts\launch\setup-env.bat
```

| スクリプト | 用途 |
|------------|------|
| `scripts\launch\setup-env.bat` | **初回 / 環境再構築** |
| `scripts\launch\start-dev-servers.bat` | **毎日の開発開始** — dev:prepare · API · **1420** |

---

## 1. 製品 UI（1420 · 正本）

### 前提

- **API + DB** が起動していること（日次ループ · Resource 連携を確認する場合）
- `pnpm dev:desktop:web` または `start-dev-servers.bat`

### URL

| URL | 内容 |
|-----|------|
| http://127.0.0.1:1420/ | ハブ（知覚の窓） |
| http://127.0.0.1:1420/#/screens | 画面一覧 v0.2 |
| http://127.0.0.1:1420/#/M-WEA-DET | 天気詳細 |
| http://127.0.0.1:1420/?phase=day | 昼プレビュー |

---

## 2. Docker Compose 一式

```powershell
cd D:\GitHub\URMS
copy .env.example .env
npx pnpm@9.15.4 docker:up
```

| URL | 内容 |
|-----|------|
| http://localhost:8080/ | 動くアプリ（nginx 経由） |

停止: `npx pnpm@9.15.4 docker:down`

---

## 3. 時間帯プレビュー（VT-3）

| 時間帯 | URL |
|--------|-----|
| 朝 | http://127.0.0.1:1420/?phase=morning |
| 昼 | http://127.0.0.1:1420/?phase=day |
| 夕 | http://127.0.0.1:1420/?phase=evening |
| 夜 | http://127.0.0.1:1420/?phase=night |

---

## 4. develop モード（1420）

1. `.env` に `URMS_FF_DEVELOP_ENABLED=true`
2. 1420 ヘッダ ModeSwitcher で **開発** を選択

---

## 5. 自動 smoke（開発者）

```powershell
cd D:\GitHub\URMS
npx pnpm@9.15.4 test:vision
```

---

## 変更履歴

| 日付 | 変更 |
|------|------|
| 2026-07-08 | v0.2 — 5173/5180 削除 · Canvas 青リンク · 1420 のみ |
| 2026-07-09 | Canvas リンク = チャットと同じ markdown 形式に統一 |
