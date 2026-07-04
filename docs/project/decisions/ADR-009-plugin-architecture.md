# ADR-009: Plugin アーキテクチャ

> **resource_type:** decision  
> **resource_id:** decision:ADR-009  
> **status:** accepted  
> **date:** 2026-07-05  
> **author:** Architect

## コンテキスト

Resource Type 追加時にコア変更を避ける必要がある（NFR-010, R-001）。

## 決定

1. **ResourceTypePlugin** インターフェースで Type 別ロジックを分離
2. **PluginRegistry** で起動時 register
3. MVP: 組込 Plugin（11 Type）
4. 将来: `packages/plugins/*` 動的 load（develop Mode）
5. Plugin は domain 層のみ、Repository 経由で DB アクセス

## 理由

- VISION「拡張可能な構造」
- 過剰抽象化回避（MVP は組込のみ）

## 影響

- [09-plugin-architecture.md](../../architecture/09-plugin-architecture.md)
- [08-resource-management.md](../../architecture/08-resource-management.md)

## 関連

- [ADR-002](./ADR-002-resource-model.md)
