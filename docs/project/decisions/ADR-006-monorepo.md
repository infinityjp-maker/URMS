# ADR-006: Monorepo 構成

> **resource_type:** decision  
> **resource_id:** decision:ADR-006  
> **status:** accepted  
> **date:** 2026-07-05  
> **author:** Architect

## コンテキスト

URMS は Web + API + 共有ドメイン + DB 層を持つ。単一パッケージでは10年保守時に境界が曖昧になる。

## 決定

pnpm workspace Monorepo を採用する。

```
apps/web, apps/api
packages/domain, packages/db, packages/shared, packages/logger, packages/plugins
```

- apps 同士の直接依存禁止
- packages は apps を import しない
- 単一バージョン（内部利用、npm publish なし）

## 理由

- NFR-001 モジュール境界
- VISION「変更容易性」
- pnpm は既存 Workspace 方針と一致

## 影響

- [03-monorepo.md](../../architecture/03-monorepo.md)
- [02-directory-structure.md](../../architecture/02-directory-structure.md)
- Phase 3 で pnpm-workspace.yaml 作成

## 関連

- [ADR-001](./ADR-001-ai-team-v1.md)
