# ADR-013: テストアーキテクチャ

> **resource_type:** decision  
> **resource_id:** decision:ADR-013  
> **status:** accepted  
> **date:** 2026-07-05  
> **author:** Architect

## コンテキスト

NFR-003（重要ドメイン 80%+ カバレッジ）。10年保守にテスト可能性必須。

## 決定

1. **Vitest** — unit + integration
2. **Playwright** — E2E
3. **Testcontainers** — integration DB
4. ピラミッド: unit 最多 → integration → E2E 少数
5. domain 90%, api 80% 目標

## 理由

- TypeScript エコシステム統一
- Tester ロールゲート対応
- CI 統合容易

## 影響

- [15-test-architecture.md](../../architecture/15-test-architecture.md)

## 関連

- [ADR-006](./ADR-006-monorepo.md)
