# ADR-005: MVP スコープ

> **resource_type:** decision  
> **resource_id:** decision:ADR-005  
> **status:** accepted  
> **date:** 2026-07-05  
> **author:** Architect + PM

## コンテキスト

Phase 1 で要求定義完了後、Phase 2 実装に移行する。スコープクリープ（R-007）を防ぎ、VISION 整合の最小実装範囲を固定する必要がある。

## 決定

MVP（Phase 2 初回リリース）のスコープを [mvp-definition.md](../../requirements/mvp-definition.md) に固定する。

**Must:**
- Resource CRUD（4 ビジネス Type）
- 検索・ライフサイクル
- Mode: plan / operate / audit
- Context Engine ダッシュボード
- 監査ログ
- AI Team Resource read-only 参照

**Must NOT（MVP）:**
- Resource リレーション UI
- develop Mode
- 外部連携
- URMS からの AI Team 更新

## 理由

- VISION「最小複雑性」
- 10年保守: 小さく動く MVP でフィードバック取得
- AI Team Resource 参照で将来 Phase 4 への道筋を検証

## 影響

- Phase 2 backlog 生成の基準
- Phase 1 完了条件の MVP 章と一致

## 関連

- [ADR-002](./ADR-002-resource-model.md)
- [ADR-003](./ADR-003-mode-system.md)
- [ADR-004](./ADR-004-context-engine.md)
- [mvp-definition.md](../../requirements/mvp-definition.md)
