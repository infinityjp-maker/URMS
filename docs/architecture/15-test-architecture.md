# URMS テストアーキテクチャ

> **resource_type:** knowledge  
> **resource_id:** knowledge:architecture-test  
> **version:** 1.0  
> **phase:** 2

## 参照

- [ADR-013](../project/decisions/ADR-013-test-architecture.md)
- [non-functional-requirements.md](../requirements/non-functional-requirements.md) NFR-003

---

## 1. テストピラミッド

```
        ┌─────────┐
        │  E2E    │  Playwright（少数・クリティカルパス）
       ┌┴─────────┴┐
       │ Integration │  API + Test DB
      ┌┴─────────────┴┐
      │     Unit       │  domain, plugins（最多）
      └────────────────┘
```

---

## 2. ツール

| 層 | ツール | 対象 |
|----|--------|------|
| Unit | Vitest | packages/domain, packages/db |
| Integration | Vitest + supertest | apps/api routes |
| E2E | Playwright | apps/web 主要フロー |
| DB | Testcontainers PostgreSQL | integration |

---

## 3. カバレッジ目標

| パッケージ | 目標 |
|------------|------|
| packages/domain | 90% |
| packages/db | 80% |
| apps/api | 80% |
| apps/web | 70%（コンポーネント） |

重要ドメイン: Resource lifecycle, Mode policy, Context validation。

---

## 4. テスト DB

- Integration: Testcontainers で PostgreSQL 起動 → migrate → test → destroy
- CI: GitHub Actions（Phase 3）
- 並列: 各 test file 独立 DB schema

---

## 5. テスト命名

```
describe('ResourceService')
  describe('create')
    it('should create resource with draft status')
    it('should reject duplicate resource_id')
```

---

## 6. E2E シナリオ（MVP）

1. ログイン → operate Mode → Resource 作成
2. Resource 検索 → 詳細表示
3. audit Mode → 監査ログ参照
4. plan Mode → Context 更新

---

## 7. CI パイプライン（Phase 3）

```
lint → unit test → integration test → build → e2e (optional gate)
```

---

## 変更履歴

| 日付 | 変更 |
|------|------|
| 2026-07-05 | v1.0 初版 |
