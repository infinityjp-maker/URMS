---
name: testing
description: URMS向けテスト計画・実行。Vitest、E2E、テスト設計、Testerロール作業時に使用する。
disable-model-invocation: true
---

# Testing

> **resource_type:** skill  
> **resource_id:** skill:testing

## 適用条件

- Tester `/test`

## 原則

- テスト計画 → 実行 → レポート → 合格/不合格
- 受入条件（Architect）と DoD（PM）を満たす
- 重要ロジックはテスト必須（将来）

## テスト種別（予定）

| 種別 | ツール |
|------|--------|
| 単体 | Vitest |
| E2E | Playwright（将来検討） |

## 手順

1. `current-task.md` の DoD を確認
2. テスト計画作成
3. 実行 → 結果記録
4. PM へ合格/不合格報告

## 成果物

- テスト計画
- テスト結果レポート

## 参照

- `.cursor/rules/03_品質.mdc`
- `docs/ai-team/05_Tester.md`
