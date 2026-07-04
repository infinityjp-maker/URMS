# URMS Monorepo（Sprint S1）

Unified Resource Management System — pnpm workspace。

## 前提

- Node.js >= 20
- pnpm 9.x（`corepack enable` または `npx pnpm@9.15.4`）

## 起動手順

```bash
# 依存インストール
pnpm install

# 開発サーバー（Web）
pnpm dev

# ビルド・検証
pnpm build
pnpm lint
pnpm typecheck
```

Web: http://localhost:5173

## ワークスペース

| パッケージ | 説明 |
|-----------|------|
| `@urms/shared` | 型・エラーコード・Contract Loader |
| `@urms/domain` | Domain Core 骨格（S2 で拡張） |
| `@urms/web` | React + Vite ダッシュボード |

設計正本: [docs/implementation/01-implementation-contract.md](docs/implementation/01-implementation-contract.md)
