# URMS Monorepo

Unified Resource Management System — pnpm workspace（MVP v0.2.0）。

## 前提

- Node.js >= 20
- pnpm 9.x（`corepack enable` または `npx pnpm@9.15.4`）
- フルスタック起動: Docker Desktop

## クイックスタート

### 開発（Web + API を別プロセス）

```bash
cp .env.example .env   # Windows: copy .env.example .env
pnpm install
pnpm db:up && pnpm db:migrate
pnpm dev:api   # ターミナル 1
pnpm dev       # ターミナル 2
```

- Web: http://localhost:5173/
- API: http://localhost:3000/health

### Docker Compose 一式（MVP 公開形）

```bash
cp .env.example .env
pnpm docker:up
```

- アプリ: http://localhost:8080/
- ヘルス: http://localhost:8080/health

停止: `pnpm docker:down`

## 検証

```bash
pnpm build
pnpm lint
pnpm typecheck
pnpm test
pnpm test:coverage
pnpm test:integration
pnpm test:e2e
```

## ワークスペース

| パッケージ | 説明 |
|-----------|------|
| `@urms/shared` | 型・エラーコード・Contract Loader |
| `@urms/domain` | Domain / Mode / Resource / Context / AI |
| `@urms/db` | Prisma + Repository |
| `@urms/api` | Fastify API |
| `@urms/web` | React + Vite UI |

設計正本: [docs/implementation/01-implementation-contract.md](docs/implementation/01-implementation-contract.md)

画面の見方: [docs/requirements/viewing-guide.md](docs/requirements/viewing-guide.md)
