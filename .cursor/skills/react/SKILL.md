---
name: react
description: URMS向けReact UI設計・実装。Reactコンポーネント、UI、フロントエンド設計時に使用する。
disable-model-invocation: true
---

# React UI 設計

> **resource_type:** skill  
> **resource_id:** skill:react

## 適用条件

- Developer `/implement`（フロント）
- Architect UI 設計

## 原則

- 関数コンポーネント
- 状態は必要最小限。複雑な状態は custom hook へ
- 1 コンポーネント 1 責務
- アクセシビリティを考慮（将来）

## 手順

1. Architect 設計・ワイヤー（将来）を確認
2. コンポーネント分割
3. TypeScript + React 19 想定
4. `/test` へ PM 経由で引き継ぎ

## 成果物

- `.tsx` コンポーネント（将来）

## 参照

- `skill:typescript`
- `docs/ai-team/02_Architect.md`
