# ADR-004: Context Engine

> **resource_type:** decision  
> **resource_id:** decision:ADR-004  
> **status:** accepted  
> **date:** 2026-07-05  
> **author:** Architect

## コンテキスト

User と AI は「今何が進行中か」を頻繁に必要とする。Knowledge（`docs/project/`）に毎回アクセスすると遅く、Context に複製すると SSOT 違反になる。[VISION](../VISION.md) と AI チーム運用（`.cursor/context/`）の両立が必要。

## 決定

1. **Context Engine** を URMS サブシステムとして設計する
2. 保持するのは **要約 + SSOT リンク** のみ（本文複製禁止）
3. MVP スナップショット項目:
   - current_phase
   - current_task
   - next_task
   - project_status（リンク集）
   - active_mode
4. 開発時の `.cursor/context/` は Context Engine の **参照実装** とみなす
5. Phase 2 で DB テーブル `context_snapshot` + API として実装

## 理由

- NFR-050（SSOT リンクのみ）を満たす
- AI チーム v1.0 Context 4 ファイルとの概念整合
- 10年保守: Knowledge 更新と Context 更新の責務分離（KM vs PM）

## 影響

- [use-cases.md](../../requirements/use-cases.md) UC-006, UC-007
- Context 更新権限: PM 相当ロールのみ

## 関連

- [ADR-003](./ADR-003-mode-system.md)
- [ADR-001](./ADR-001-ai-team-v1.md)
