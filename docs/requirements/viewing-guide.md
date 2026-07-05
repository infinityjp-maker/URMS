# URMS 画面の見方（確認済み手順）

> User がブラウザで画面を開くための手順。**サーバー起動が必要**です。

## 1. ワイヤーフレームだけ見る（DB 不要 · 最も簡単）

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
