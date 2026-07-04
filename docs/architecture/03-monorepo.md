# URMS Monorepo 設計

> **resource_type:** knowledge  
> **resource_id:** knowledge:architecture-monorepo  
> **version:** 1.0  
> **phase:** 2

## 参照

- [ADR-006](../project/decisions/ADR-006-monorepo.md)
- [02-directory-structure.md](./02-directory-structure.md)

---

## 1. 方針

pnpm workspace による Monorepo。apps（実行可能）と packages（共有ライブラリ）を分離する。

---

## 2. Workspace 定義

```yaml
# pnpm-workspace.yaml（Phase 3 で作成）
packages:
  - 'apps/*'
  - 'packages/*'
```

---

## 3. パッケージ依存関係

```
apps/web  ──→ packages/shared
         ──→ packages/domain (types only, 間接)

apps/api  ──→ packages/domain
         ──→ packages/db
         ──→ packages/shared
         ──→ packages/logger

packages/db ──→ packages/domain (interface impl)
packages/domain ──→ packages/shared
```

**ルール:** apps 同士の直接依存禁止。packages は apps を import しない。

---

## 4. ビルド・タスク

| コマンド | 対象 | 用途 |
|----------|------|------|
| `pnpm dev` | web + api | 開発サーバー |
| `pnpm build` | 全 workspace | 本番ビルド |
| `pnpm test` | domain, db, api | テスト |
| `pnpm lint` | 全 workspace | ESLint |
| `pnpm db:migrate` | packages/db | Prisma migrate |

MVP では turbo なしで pnpm filter で十分。規模拡大時に turbo 導入（Could）。

---

## 5. TypeScript 設定

- ルート `tsconfig.base.json` — 共通 compilerOptions
- 各パッケージ `tsconfig.json` — `"extends": "../../tsconfig.base.json"`
- Project references で IDE パフォーマンス向上

---

## 6. バージョニング

Monorepo 全体で **単一バージョン**（URMS x.y.z）。個別パッケージの npm publish は想定しない（内部利用のみ）。

---

## 変更履歴

| 日付 | 変更 |
|------|------|
| 2026-07-05 | v1.0 初版 |
