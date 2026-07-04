# URMS Quality Gate

> **resource_type:** knowledge  
> **resource_id:** knowledge:quality-gate  
> **version:** 1.0  
> **phase:** 2.8  
> **status:** draft — PM 承認待ち  
> **owner:** PM + Architect + Reviewer + Tester  
> **adr:** ADR-020

## 参照（優先順位）

| 順位 | 文書 | 役割 |
|------|------|------|
| 1 | [VISION.md](../project/VISION.md) | 哲学 |
| 2 | [docs/architecture/](../architecture/) | Architecture Freeze |
| 3 | [docs/project/decisions/](../project/decisions/) | ADR |
| 4 | [01-implementation-contract.md](./01-implementation-contract.md) | **実装契約 SSOT（DoR/DoD 正本）** |
| 5 | **本 Quality Gate** | 品質・レビュー・リリース基準 |
| 6 | [02-developer-playbook.md](./02-developer-playbook.md) | 日常運用補助 |
| 7 | [04-sprint-planning.md](./04-sprint-planning.md) | Sprint ゲート |

**矛盾時:** Contract > Quality Gate > Playbook。DoR/DoD の正本は Contract §18/§19 のみ。本書はゲート手順とチェックリストを提供する。

---

## 1. Purpose

### 目的

Phase 3 実装開始前に、Developer・Reviewer・Tester・PM・AI が **同一品質基準** で開発・レビュー・リリースできる状態を確立する。Quality Gate は「何を満たせば次工程へ進めるか」を定義する。

### 適用範囲

| 対象 | 適用 |
|------|------|
| Phase 3 MVP 実装（S1〜S10） | 全章 |
| Phase 4〜5 拡張 | 本書をベースに Sprint Plan で上書き可 |
| ドキュメントのみ PR | §2, §3, §4（Documentation）, §13 |
| HotFix | §11 を優先 |

### 対象ロール

| ロール | 主な利用章 |
|--------|------------|
| Developer | §2, §3, §4, §14 |
| Reviewer | §4, §9, §13 |
| Tester | §5, §6, §7, §8, §10 |
| PM | §2, §10, §11, §12, §13 |
| Architect | §4（Architecture）, §8, §11 |
| AI（Reviewer 補助） | §9 |
| Knowledge Manager | §10（Documentation）, §13 |

---

## 2. Pull Request Gate

### PR 作成条件

| PR 種別 | 作成可能条件 |
|---------|--------------|
| **Architecture** | ADR ドラフトまたは改訂 PR 同時。PM + Architect 承認必須 |
| **Implementation** | DoR 満たす（Contract §18）。Sprint / Backlog ID 紐付け |
| **Bug Fix** | 再現手順または Issue ID。回帰テスト追加 |
| **Refactoring** | 振る舞い不変を明記。カバレッジ維持 |
| **Documentation** | SSOT 方針遵守。Context 本文複製禁止 |

### PR 必須項目

| # | 項目 | 必須 |
|---|------|------|
| 1 | **目的** — 1〜3 文 | ✅ |
| 2 | **対象 Backlog** — B-xxx / Sprint CP-x | ✅ |
| 3 | **ADR 有無** — なし / ADR-xxx 参照 / 新規 ADR リンク | ✅ |
| 4 | **変更内容** — ファイル・モジュール単位 | ✅ |
| 5 | **影響範囲** — API / DB / Plugin / UI / Flag | ✅ |
| 6 | **テスト結果** — `pnpm test` / E2E / CI リンク | Implementation 必須 |
| 7 | **スクリーンショット** | UI 変更時必須 |

### PR マージ条件

- Reviewer 承認 1 名以上（Architecture 変更は Architect 追加承認）
- CI green（lint, test, coverage gate）
- Contract §19 DoD 満たす
- OpenAPI 変更時は diff 確認済

---

## 3. Commit Quality

### Commit 基準

| 基準 | ルール |
|------|--------|
| **1 コミット 1 目的** | 無関係な変更を混在させない |
| **Semantic Commit** | `<type>(<scope>): <subject>` — Conventional Commits |
| **Revert 可能** | 各コミット単体で revert してもビルド可能（WIP コミット禁止） |
| **レビュー可能サイズ** | 目安 400 行以下。超過時は PR 分割 |
| **コミット粒度** | Sprint CP（[04-sprint-planning.md](./04-sprint-planning.md)）に整合 |

### 許可 type

| type | 用途 |
|------|------|
| `feat` | 新機能 |
| `fix` | バグ修正 |
| `refactor` | 振る舞い不変の整理 |
| `test` | テスト追加・修正 |
| `docs` | ドキュメント |
| `chore` | ビルド・CI・依存 |
| `perf` | 性能改善 |

### 禁止事項

| # | 禁止 |
|---|------|
| 1 | 秘密情報・`.env` 実値のコミット |
| 2 | `WIP` / `fixup` / 意味不明メッセージ |
| 3 | 複数 Sprint / 複数 Backlog を 1 コミットに混在 |
| 4 | `--no-verify` による hook 回避 |
| 5 | 大規模リネーム + 機能変更の同一コミット |
| 6 | Contract §20 実装禁止事項を含むコミット |

---

## 4. Code Review Gate

Reviewer は以下を確認する。詳細ルールの正本は Contract / Architecture。本節は **確認観点** のみ。

| 観点 | 確認内容 | 正本 |
|------|----------|------|
| **Architecture** | Freeze 範囲内、層依存遵守 | architecture/, ADR-006〜016 |
| **Contract** | §1〜§20 違反なし | Contract |
| **Playbook** | 日常ルール整合（Contract と矛盾時は Contract 優先） | Playbook |
| **Naming** | kebab-case ファイル、camelCase 変数、PascalCase 型 | Contract §2 |
| **Resource** | Resource First、論理 DELETE、metadata 規約 | Contract §5 |
| **Plugin** | Registry 経由、Plugin 間依存なし、SemVer | Contract §8, ADR-018 |
| **AI Provider** | Core → AI Manager → Adapter のみ | ADR-016, Contract §9 |
| **Mode** | plan/operate/audit + RBAC 二重チェック | ADR-003, Contract §17 |
| **Context** | SSOT リンクのみ、本文複製なし | ADR-004 |
| **Event** | Domain Event 命名、in-process Bus | ADR-011 |
| **Logging** | pino JSON、マスク、Audit 分離 | Contract §14 |
| **Security** | 認証・認可・Secret Store | §8, Contract §17 |
| **Performance** | NFR 目標内、N+1 なし | §7, NFR |
| **Test** | Unit/Integration/E2E 追加、Mock 方針 | Contract §13 |
| **Documentation** | OpenAPI 同期、ADR 更新、用語整合 | Contract §3 |

**承認:** Reviewer が最終承認。AI レビュー（§9）は補助のみ。

---

## 5. Test Quality Gate

| 種別 | 基準 | 正本 |
|------|------|------|
| **Unit** | domain, plugins — Vitest | Contract §13.1 |
| **Integration** | supertest + Testcontainers PostgreSQL | Contract §13.2 |
| **E2E** | Playwright — UC クリティカル 4 シナリオ | Contract §13.3, Sprint S9 |
| **AI Provider Mock** | AiProviderAdapter mock のみ。Provider SDK 実呼出禁止 | Contract §13.6 |
| **Coverage** | CI 閾値 — §6 参照 | Contract §13.4 |
| **Regression** | Bug Fix PR に再発防止テスト必須 | §2 |
| **Performance Test** | Phase 4 本格導入。MVP は NFR スポット計測（§7） | NFR-020〜022 |

### Tester ゲート（Sprint 完了時）

- 全 Unit / Integration green
- E2E 対象シナリオ green
- Coverage 閾値達成
- 手動探索テスト（UI 変更時）— チェックリスト Playbook §8

---

## 6. Coverage Policy

Contract §13 / [15-test-architecture.md](../architecture/15-test-architecture.md) と整合。数値の **正本は Contract §13**。

### 対象別基準

| 対象 | 最低基準 | 推奨基準 | MVP 基準（CI gate） |
|------|----------|----------|---------------------|
| **Domain** | 70% | 85% | **90%** |
| **Application（apps/api services）** | 60% | 75% | **80%** |
| **API（routes 含む）** | 60% | 75% | **80%** |
| **Plugin** | 70% | 80% | **80%** |
| **AI（AI Manager + Adapter）** | 70% | 85% | **80%** |
| **packages/db** | 60% | 75% | **80%** |
| **apps/web** | 50% | 65% | **70%** |

- **最低基準:** PR マージ不可（例外は PM + Architect 承認、期限付き）
- **MVP 基準:** Sprint S9 完了時 CI で enforce
- カバレッジ除外: 生成コード、型定義のみファイル（要 Reviewer 承認）

---

## 7. Performance Gate

[NFR](../requirements/non-functional-requirements.md) 準拠。MVP は計測基盤 + 主要パス確認。

| 対象 | 指標 | MVP 目標 |
|------|------|----------|
| **API** | p95 レスポンス | 一覧 GET < 500ms（1,000 件）、詳細 GET < 200ms |
| **Database** | クエリ数 / 実行時間 | N+1 禁止；一覧 1 クエリ + count |
| **Search** | p95 | 10,000 件 **< 2s**（NFR-020） |
| **Context Engine** | p95 | 表示 **< 1s**（NFR-021） |
| **AI** | p95 / timeout | Adapter timeout 30s；Fallback 発動 < 60s |
| **Plugin** | 登録 / 実行 | 登録 < 100ms；validate < 50ms |

### リソース

| 指標 | MVP 目標 |
|------|----------|
| **メモリ** | api コンテナ < 512MB（idle + 通常負荷） |
| **ログ量** | 1 req < 5KB（prompt body 除く；Audit は別） |
| **キャッシュ** | MVP: in-memory 可。TTL 明示（ADR-012 cache 設計） |

Phase 4 で k6 / 負荷テスト CI 導入（Sprint Plan Phase 4）。

---

## 8. Security Gate

| 対象 | ゲート |
|------|--------|
| **Authentication** | 本番 OIDC 必須（B-010）；dev のみ bypass 可（Flag + 環境分離） |
| **Authorization** | JWT + RBAC + Mode 二重チェック |
| **Secret Store** | API Key 直書き禁止；`secretRef` のみ Resource に保存 |
| **SQL Injection** | Prisma パラメータ化；raw SQL は PostgreSQL Skill レビュー |
| **XSS** | React エスケープ；`dangerouslySetInnerHTML` 禁止 |
| **CSRF** | Cookie 認証時 SameSite + CSRF token（本番） |
| **Rate Limit** | `@fastify/rate-limit` — API 全体 + AI 厳格 |
| **Audit** | 変更操作 append-only；promptHash 保存 |
| **Log** | §14 Mask 対象をログ出力しない |
| **AI Provider** | Provider SDK は Adapter 内のみ |
| **Plugin** | サンドボックス Registry；未登録 Plugin 実行禁止 |

セキュリティ PR は Reviewer + Architect 確認推奨。

---

## 9. AI Review Gate

AI（Bugbot 等）は **Reviewer 補助** として以下を検出する。**最終承認は Reviewer** が行う。

| 検出項目 | 例 |
|----------|-----|
| Architecture 違反 | domain → db 逆依存、apps 相互依存 |
| Contract 違反 | §20 禁止事項、命名規則 |
| Naming 違反 | ファイル kebab-case 以外 |
| Plugin 違反 | Plugin 間 import |
| Provider 直接利用 | Core から OpenAI SDK import |
| Context 違反 | Knowledge 本文の Context 複製 |
| Resource 違反 | 物理 DELETE、metadata 必須欠落 |
| Event 違反 | 非 Domain Event 命名 |
| Performance | ループ内 DB クエリ |
| Security | 秘密情報ハードコード |

### AI レビュー運用

- AI 指摘は PR コメントに記録。Reviewer が dismiss / 修正要求を判断
- AI Critical 指摘 → Reviewer は解消または理由付き dismiss 必須
- AI は merge 権限を持たない

---

## 10. Release Gate

MVP リリース（`v0.2.0-mvp` / Sprint S10）前チェック:

| # | 項目 | 確認 |
|---|------|------|
| 1 | **Migration** | 本番 migration 手順書；rollback SQL 準備 |
| 2 | **OpenAPI** | `/v1/` 同期；breaking change なし |
| 3 | **Documentation** | README, `.env.example`, implementation 索引 |
| 4 | **Version** | SemVer（ADR-018）；tag 整合 |
| 5 | **Feature Flag** | prod デフォルト確認（ADR-019） |
| 6 | **Test** | CI 全 green；E2E 4 シナリオ |
| 7 | **Performance** | NFR 主要項目スポット計測 |
| 8 | **Security** | 秘密情報スキャン；Rate limit 有効 |
| 9 | **Backup** | DB バックアップ手順（docker-compose  doc） |
| 10 | **Rollback** | 前バージョン image tag 保持；migration down 手順 |

**承認:** PM MVP 完了レビュー（Sprint S10 レビューゲート）。

---

## 11. Emergency Fix

### HotFix ルール

| 条件 | 手順 |
|------|------|
| 本番 Critical（データ損失・セキュリティ） | PM 承認 → 最小修正 PR → 緊急 Reviewer → 即デプロイ |
| 本番 Major（機能停止） | PM 承認 → HotFix ブランチ → 4h 以内 Review |

### Rollback

1. 前 tag の container image に切替
2. migration down（破壊的 migration の場合は ADR 済み手順）
3. Feature Flag で機能無効化（ADR-019）
4. PM + KM に incident 記録

### 緊急レビュー

- Reviewer 1 名 + PM 口頭承認可（24h 以内に PR 化）
- Tester: 回帰テスト最小セット実行

### ADR 不要条件

- 振る舞い不変の typo / 設定値修正
- Feature Flag OFF による機能停止
- 既存 ADR 範囲内の Bug Fix

### ADR 必要条件

- Architecture / API breaking change
- 新 Resource Type / Plugin 契約変更
- Security モデル変更
- Schema 破壊的 migration

---

## 12. Quality Metrics

Phase 3 以降 PM がトラッキング。初期は手動、S10 以降 CI / GitHub Insights。

| 指標 | 定義 | MVP 目標 |
|------|------|----------|
| **Bug** | 本番 Critical / Major 件数 | Critical 0 at release |
| **Coverage** | 全体 line coverage | ≥ Contract §13 閾値 |
| **Build** | CI 成功率 | ≥ 95% |
| **Review Time** | PR 作成 → 初回 Reviewer コメント | < 24h |
| **PR Time** | PR 作成 → merge | < 3 営業日（通常） |
| **Lead Time** | Backlog done → 本番 | Sprint 単位で計測 |
| **Change Failure Rate** | デプロイ後 24h 以内ロールバック率 | < 10% |
| **MTTR** | 障害検知 → 復旧 | < 4h（Major） |

---

## 13. Roles

| ロール | 責任範囲 |
|--------|----------|
| **PM** | スコープ承認、Release Gate、HotFix 判断、メトリクス |
| **Architect** | Architecture PR 承認、ADR 整合、Performance / Security  escalations |
| **Developer** | DoR 確認、Commit/PR 品質、テスト作成 |
| **Reviewer** | Code Review Gate、AI 指摘の最終判断、merge 承認 |
| **Tester** | Test / Coverage / Performance ゲート、E2E 維持 |
| **Knowledge Manager** | ドキュメント SSOT、ADR 登録、glossary 更新 |

---

## 14. DoR / DoD

### SSOT 宣言

**Definition of Ready / Definition of Done の正本は [Implementation Contract §18 / §19](./01-implementation-contract.md) のみ。** 本書はゲート適用時のチェックリストを提供する。項目の追加・変更は Contract 改訂（ADR + PM）が必要。

### DoR ゲート（実装開始）

Contract §18 の 7 条件に加え、Quality Gate 適用時:

| # | 追加確認 |
|---|----------|
| Q1 | Sprint / CP 紐付け明確 |
| Q2 | Quality Gate §4 対象観点を PR テンプレに記載予定 |
| Q3 | Feature Flag 影響ある場合 ADR-019 確認 |

### DoD ゲート（タスク完了）

Contract §19 の 9 条件に加え:

| # | 追加確認 |
|---|----------|
| Q4 | PR Gate §2 必須項目充足 |
| Q5 | Code Review Gate §4 承認 |
| Q6 | Coverage §6 MVP 基準（S9 以降 enforce） |

Sprint 完了 DoD は [04-sprint-planning.md](./04-sprint-planning.md) 各 Sprint + 本書横断ルール。

---

## 変更履歴

| 日付 | 変更 |
|------|------|
| 2026-07-05 | v1.0 初版（Phase 2.8） |
