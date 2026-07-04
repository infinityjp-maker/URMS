# URMS ディレクトリ構成設計

> **resource_type:** knowledge  
> **resource_id:** knowledge:architecture-directory  
> **version:** 1.0  
> **phase:** 2

## 参照

- [ADR-006](../project/decisions/ADR-006-monorepo.md)
- [03-monorepo.md](./03-monorepo.md)

---

## 1. リポジトリルート

```
URMS/
├── apps/
│   ├── web/                 # React フロントエンド
│   └── api/                 # Fastify バックエンド
├── packages/
│   ├── domain/              # ドメインロジック（Resource, Mode, Context）
│   ├── db/                  # Prisma schema, client, migrations
│   ├── shared/              # 型・定数・ユーティリティ
│   ├── logger/              # 構造化ログ
│   └── plugins/             # Resource Type プラグイン（将来）
├── docs/                    # SSOT 文書（既存）
├── .cursor/                 # AI チーム（既存）
├── .vscode/                 # Workspace（既存）
├── scripts/                 # ビルド・デプロイ補助
├── pnpm-workspace.yaml
├── package.json
├── tsconfig.base.json
└── turbo.json               # 将来（Monorepo ビルド）
```

**Phase 2:** 上記は設計のみ。ディレクトリ実体は Phase 3 で作成。

---

## 2. apps/web

```
apps/web/
├── src/
│   ├── app/                 # ルーティング・レイアウト
│   ├── features/
│   │   ├── resources/       # Resource CRUD UI
│   │   ├── mode/            # Mode 切替
│   │   ├── context/         # Context Dashboard
│   │   └── knowledge/       # ADR/Glossary 参照
│   ├── components/          # 共通 UI
│   ├── hooks/
│   ├── lib/                 # API client
│   └── types/
├── public/
├── index.html
├── vite.config.ts
├── tsconfig.json
└── package.json
```

---

## 3. apps/api

```
apps/api/
├── src/
│   ├── routes/
│   │   ├── resources/
│   │   ├── context/
│   │   ├── knowledge/
│   │   └── health/
│   ├── middleware/
│   │   ├── auth.ts
│   │   ├── mode.ts
│   │   └── error-handler.ts
│   ├── services/            # アプリケーションサービス
│   ├── plugins/             # Fastify プラグイン登録
│   └── server.ts
├── tsconfig.json
└── package.json
```

---

## 4. packages/domain

```
packages/domain/
├── src/
│   ├── resource/
│   │   ├── resource.entity.ts
│   │   ├── resource.repository.ts   # interface
│   │   ├── lifecycle.ts
│   │   └── resource-type.registry.ts
│   ├── mode/
│   │   ├── mode.enum.ts
│   │   └── mode.policy.ts
│   ├── context/
│   │   └── context.snapshot.ts
│   ├── audit/
│   │   └── audit.event.ts
│   ├── events/
│   │   └── domain-events.ts
│   └── plugins/
│       └── plugin.interface.ts
├── tsconfig.json
└── package.json
```

---

## 5. packages/db

```
packages/db/
├── prisma/
│   ├── schema.prisma
│   └── migrations/
├── src/
│   ├── client.ts
│   └── repositories/        # domain interface 実装
├── tsconfig.json
└── package.json
```

---

## 6. docs（既存 + Phase 2 追加）

```
docs/
├── architecture/            # Phase 2 設計書（本ディレクトリ）
├── requirements/            # Phase 1
├── project/                 # Knowledge SSOT
├── ai-team/
└── standards/
```

---

## 変更履歴

| 日付 | 変更 |
|------|------|
| 2026-07-05 | v1.0 初版 |
