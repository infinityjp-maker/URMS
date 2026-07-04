---
name: typescript
description: URMS向けTypeScript実装。TypeScriptコードの実装・修正・型設計時に使用する。
disable-model-invocation: true
---

# TypeScript 実装

> **resource_type:** skill  
> **resource_id:** skill:typescript

## 適用条件

- Developer `/implement`
- フロント・バック共通 TS コード

## 原則

- strict 型（将来 tsconfig）
- `any` 禁止（やむを得ない場合は理由をコメント）
- `import type` を型のみ import に使用
- 相対 import はプロジェクト方針に従う（将来 path alias）

## 手順

1. 設計・ADR を確認
2. `docs/standards/coding-standard.md` に従う
3. 実装 → 型チェック（将来 `pnpm type-check`）
4. Reviewer へ PM 経由で引き継ぎ

## 成果物

- `.ts` / `.tsx` ソース（将来）

## 参照

- `.cursor/rules/02_実装.mdc`
