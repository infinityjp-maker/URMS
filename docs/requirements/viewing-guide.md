# URMS 画面の見方（確認済み手順）

> User がブラウザで画面を開くための手順。**サーバー起動が必要**です。

## User 向け（推奨）

**PowerShell 操作は不要です。** Cursor → `canvases` → **`urms-docs.canvas.tsx`** の「画面の見方」セクションから http リンクをクリックしてください。

進捗 · サーバー状態: **`urms-progress-plan.canvas.tsx`**

---

## 開発者向け（手動起動 · 以下は Markdown 正本）

### 0. 一括環境構築（推奨）

初回または環境を整え直すとき:

```powershell
cd D:\GitHub\URMS
scripts\launch\setup-env.bat
```

または `npx pnpm@9.15.4 setup:env`

- Node · pnpm install · `.env` · `dev:prepare` を実行
- **Docker Desktop** があれば PostgreSQL 起動 · migrate · `ssot:sync`
- 開発サーバー（1420 · 5180 · 5173 · 3000）を別ウィンドウで起動
- ブラウザは **本番窓 UI（1420）** を自動で開く
- 最後に `dev:verify` で疎通確認

Docker 初回起動時は Desktop のセットアップ完了後、もう一度 `setup-env.bat` を実行してください。

| スクリプト | 用途 |
|------------|------|
| `scripts\launch\setup-env.bat` | **初回 / 環境再構築** — Docker · migrate · ssot:sync · サーバー起動 |
| `scripts\launch\start-dev-servers.bat` | **毎日の開発開始** — dev:prepare · API · 5173 · 5180 · **1420** |

---

### 1. ワイヤーフレームだけ見る（DB 不要 · 最も簡単）

PowerShell:

```powershell
cd D:\GitHub\URMS
npx pnpm@9.15.4 install
npx pnpm@9.15.4 wireframes:serve
```

ブラウザで開く:

**http://localhost:5180/**

> `file://` で HTML を直接開く方法は環境によって CSS が効かないことがあるため **使わない**。

---

## 2. 動く Web アプリ（Resource 操作まで）

### 前提

- **Docker Desktop** をインストール・起動
- または PostgreSQL を `localhost:5432` に用意

### 手順

**ターミナル 1 — DB**

```powershell
cd D:\GitHub\URMS
copy .env.example .env
npx pnpm@9.15.4 db:up
npx pnpm@9.15.4 db:migrate
npx pnpm@9.15.4 dev:api
```

**ターミナル 2 — Web**

```powershell
cd D:\GitHub\URMS
npx pnpm@9.15.4 dev
```

ブラウザ:

| URL | 内容 |
|-----|------|
| http://localhost:5173/ | 動くアプリ（ホーム） |
| http://localhost:5173/wireframes/ | ワイヤーフレーム（同一サーバー） |

---

## 3. Docker がない場合

| 見られるもの | URL |
|--------------|-----|
| ワイヤーフレーム | http://localhost:5180/（`wireframes:serve`） |
| アプリの骨格 | http://localhost:5173/（`dev` のみ · Resource は API エラー） |

Resource 一覧など API 連携画面は **PostgreSQL + API 起動後** に動作します。

---

## 4. Docker Compose 一式（MVP · DB + API + Web + nginx）

開発用の「ターミナル 2 本立て」ではなく、**1 コマンドで公開に近い形** を起動する手順です。

### 前提

- **Docker Desktop** をインストール・起動

### 手順

```powershell
cd D:\GitHub\URMS
copy .env.example .env
npx pnpm@9.15.4 docker:up
```

初回はイメージ build のため数分かかることがあります。

| URL | 内容 |
|-----|------|
| http://localhost:8080/ | 動くアプリ（nginx 経由） |
| http://localhost:8080/health | API ヘルスチェック |

停止:

```powershell
npx pnpm@9.15.4 docker:down
```

> セクション 2 の `db:up` は **PostgreSQL だけ** 起動します。API/Web も Docker で動かす場合は本セクションを使ってください。

---

## 5. 本番窓 UI（知覚層 · 日次ループ）

**VT-4 の確認用。** Resource CRUD ではなく「今」を合成表示する窓です。

### 前提

- セクション 0 または 2 と同様に **API + DB** が起動していること
- 開発サーバー `pnpm dev:desktop:web`（または `setup-env.bat` 一括起動）

### 手順

1. ブラウザで **http://127.0.0.1:1420/** を開く（位置情報を許可すると GPS 天気）
2. 接続カードに `Context API` · `journal N 件` · ループ narrative · 天気カードに **座標 GPS/SSOT** が出ることを確認
3. タスクカードの **「完了 → 次へ」** を押す
4. 成功メッセージに `journal.md に追記` と表示されること
5. リポジトリの `.cursor/resources/loop/journal.md` に 1 行追記されていること
6. 接続カードの `今日ループ済` · narrative が更新されること

> DB 未起動時は Context ローカル fallback になり、「完了 → 次へ」は表示されません。

---

## 6. 時間帯プレビュー（本番窓 · VT-3）

本番窓は **時間帯（DayPhase）** で表示するパネルが変わります。未取得の SSOT 信号は **「—」** で正直表示します（偽データなし）。

### 実 clock による時間帯（JST · ローカル時刻）

| 時間帯 | 時刻 | デフォルト statusLine の雰囲気 |
|--------|------|-------------------------------|
| 朝 morning | 5:00–9:59 | 静かな朝 |
| 昼 day | 10:00–16:59 | 判断と実行 |
| 夕 evening | 17:00–20:59 | 一日を整える |
| 夜 night | 21:00–4:59 | 情報を少なく |

### 開発用プレビュー URL（`?phase=` · DEV のみ）

| 時間帯 | URL | 主な表示 |
|--------|-----|----------|
| 朝 | http://127.0.0.1:1420/?phase=morning | 天気 · 次の予定 1 件 · AI ひとこと |
| 昼 | http://127.0.0.1:1420/?phase=day | **フル** — まとめ · タスク · 接続 · 「完了 → 次へ」 |
| 夕 | http://127.0.0.1:1420/?phase=evening | まとめ · タスク · 接続（天気なし） |
| 夜 | http://127.0.0.1:1420/?phase=night | AI ひとことのみ（最小） |

画面下部の **時間帯** リンク（開発ビルドのみ）からも切り替えできます。

### パネル一覧（API 接続 · DB 起動時）

| パネル | 朝 | 昼 | 夕 | 夜 |
|--------|:--:|:--:|:--:|:--:|
| 天気（座標 GPS/SSOT 表示） | ✅ | ✅ | — | — |
| 次の予定（空なら **予定 —** カード） | 1 件まで | 3 件まで | 2 件まで | — |
| 今日のまとめ | — | ✅ | ✅ | — |
| タスク · **完了 → 次へ** | — | ✅ | ✅ | — |
| AI からのひとこと | ✅ | ✅ | ✅ | ✅ |
| 接続（journal · ループ narrative · — 表示） | — | ✅ | ✅ | — |

### 確認ポイント（VT-3 正直表示）

- 接続カード: `地点 —` · `journal —` · `座標 —` 等 — **未取得を隠さない**
- 天気カード: **地名**（GPS/座標から API 解決 · `place_name` で上書き可）· 地点コンテキスト（自宅/勤務先）は接続カード
- DB 未起動: ヘッダーが **Context ローカル** · タスク advance ボタンなし

> プレビュー（`?phase=`）中は statusLine が時間帯用デモ文になる場合があります。ループ narrative の確認は **昼（day）** 推奨。

### 自動 smoke（開発者）

初回のみ `pnpm exec playwright install chromium`。API+DB 起動後:

```powershell
cd D:\GitHub\URMS
npx pnpm@9.15.4 test:vision
```

1420 本番窓の HTML · 接続カード · 時間帯プレビュー · **VT-4 advance（journal 追記）** を Playwright で検証します（`playwright.vision.config.ts`）。

### SSOT 同期（VT-1 · DB 起動後）

```powershell
cd D:\GitHub\URMS
npx pnpm@9.15.4 ssot:sync    # schedule + location + loop 一括
# 個別:
npx pnpm@9.15.4 loop:sync     # journal.md → loop-entry Resource
npx pnpm@9.15.4 schedule:sync
npx pnpm@9.15.4 location:sync
```

API: `POST /v1/schedule/sync` · `/v1/location/sync` · `/v1/loop/sync`
