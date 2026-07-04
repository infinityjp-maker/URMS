# URMS コーディング標準

> **resource_type:** knowledge  
> **resource_id:** knowledge:coding-standard  
> **version:** 1.0  
> **owner:** Architect（内容） / KM（正本管理）

## 目的

URMS ソースコード（将来）の一貫性を保つ。詳細手順は Skills、原則は Rules へ分離する。

## 正本

本ファイルが **コーディング標準の SSOT**。`.cursor/context/` には置かない。

## 基本方針

| 項目 | 標準 |
|------|------|
| 言語 | TypeScript（strict 予定） |
| インデント | 2 スペース |
| 改行 | LF |
| エンコーディング | UTF-8 |
| パッケージ管理 | pnpm |
| フォーマット | Prettier（設定ファイルはソース追加時） |
| Lint | ESLint（設定ファイルはソース追加時） |

## 命名

| 対象 | 規約 |
|------|------|
| ファイル（コンポーネント） | PascalCase.tsx |
| ファイル（その他 TS） | kebab-case.ts |
| 変数・関数 | camelCase |
| 型・インターフェース | PascalCase |
| 定数 | UPPER_SNAKE_CASE |

## モジュール境界（予定）

| パッケージ | 責務 |
|------------|------|
| apps/web | React UI |
| apps/api | Fastify API |
| packages/shared | 共有型・ユーティリティ |

## 禁止

- `any` の乱用
- 秘密情報のコミット
- 設計書・ADR なしの大規模変更
- PM / Architect 承認なしのスコープ外実装

## 参照

- `.cursor/rules/02_実装.mdc`
- [01-implementation-contract.md](../implementation/01-implementation-contract.md) — **実装契約（Phase 2.5）**
- `.cursor/skills/typescript/SKILL.md`
- `.cursor/skills/git-workflow/SKILL.md`
- `.vscode/settings.json`

## 更新履歴

| 日付 | 変更 |
|------|------|
| 2026-07-05 | v1.0 初版（AI チーム基盤フェーズ） |
