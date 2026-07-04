# URMS Developer Playbook

> **resource_type:** knowledge  
> **resource_id:** knowledge:developer-playbook  
> **version:** 1.0  
> **phase:** 2.6  
> **owner:** Architect + PM  
> **status:** accepted — Phase 2.6 正式承認（2026-07-05）

## 本書の位置づけ

| 文書 | 役割 |
|------|------|
| [01-implementation-contract.md](./01-implementation-contract.md) | **実装契約の正本（SSOT）** — ADR-017 |
| **本 Playbook** | 運用ガイド — Contract を変更・複製しない |

矛盾時は [§11 参照優先順位](#11-参照優先順位) に従い、正本を優先する。

---

## 1. Purpose

### 目的

Developer AI・Developer・Reviewer・Tester が Phase 3（MVP 実装）を **効率よく・一貫して** 進めるための日常参照ガイド。Implementation Contract 全文を毎回読まなくてよいよう、チェックリストと早見表を提供する。

### 適用範囲

- Phase 3 MVP 実装（`apps/*`, `packages/*`）
- Plugin / AI Provider Adapter 実装
- テスト・レビュー・引き継ぎフロー

### 対象ロール

| ロール | 主な利用章 |
|--------|------------|
| Developer / Developer AI | §2〜§6, §9, §10 |
| Reviewer | §7, §10, §11 |
| Tester | §8, §11 |
| PM | 承認ゲート確認 |

---

## 2. 実装前チェックリスト

実装開始前に **すべて** 確認する。未確認のままコードを書かない。

| # | 確認項目 | 正本 |
|---|----------|------|
| 1 | **VISION** — 10年保守・SSOT・AI 協調 | [VISION.md](../project/VISION.md) |
| 2 | **ADR** — 関連 ADR（Resource, Mode, AI Provider 等） | [decisions/](../project/decisions/) |
| 3 | **Architecture** — Freeze 範囲内か | [architecture/](../architecture/) |
| 4 | **Implementation Contract** — DoR 満たすか | [01-implementation-contract.md](./01-implementation-contract.md) §18 |
| 5 | **Coding Standard** — 基本方針 | [coding-standard.md](../standards/coding-standard.md) |
| 6 | **Backlog** — タスク ID・DoD | [backlog.md](../project/backlog.md) |
| 7 | **Current Context** — 今のフェーズ・タスク | `.cursor/context/current-task.md` |

**PM 承認:** スコープ外・Architecture 変更・新 ADR が必要な場合は PM にエスカレーション。

---

## 3. 実装時ルール

Developer / Developer AI が **必ず守る** 事項。詳細は Contract 参照。

| ルール | 要点 | Contract |
|--------|------|----------|
| **Resource First** | すべてのドメイン操作は Resource 集約経由 | §5 |
| **SSOT** | Knowledge を Context / コードに複製しない | §20 |
| **DRY** | 重複ロジックは shared / domain に集約 | §1 |
| **SOLID** | 単一責務、interface 分離（Repository 等） | §1, §6 |
| **Clean Architecture** | domain → db 逆依存禁止 | §1.3 |
| **Plugin First** | Type / Provider 拡張は Plugin 経由 | §8, §9 |
| **AI Provider 直接参照禁止** | AI Manager → Registry → Adapter のみ | §9, ADR-016 |
| **Secret 直書き禁止** | Secret Store + `secretRef` | §9.7, §17 |
| **TODO 禁止（本番コード）** | TODO は Backlog/Issue 化。暫定は NOTE + 期限 | §15 |
| **Magic Number 禁止** | 定数化（`shared/constants`） | §2, §10 |

その他: 物理 DELETE 禁止、OpenAPI 同期、Mode + RBAC 二重チェック → Contract §3, §5.7, §17。

---

## 4. 実装順序

1 タスク内の **推奨実装順**（下ほど後）。

```
Interface（domain: Repository, Plugin interface）
    ↓
Domain（Entity, Lifecycle, Policy, AI Manager）
    ↓
Application（Service — apps/api または domain service）
    ↓
Infrastructure（packages/db: Repository 実装, Prisma）
    ↓
API（Fastify Route + Schema + Middleware）
    ↓
UI（React Container → Presentational）
    ↓
Test（Unit → Integration → E2E）
```

**原則:** 下位層から。API/UI を先に書いて domain を後追いしない。

---

## 5. 命名ルール早見表

Contract §2 の **要約**。詳細・例外は Contract 正本。

| 対象 | 規約 | 例 |
|------|------|-----|
| Resource `resource_type` | kebab-case | `ai-provider` |
| Resource `resource_id` | kebab-case | `server-rack-a01` |
| Entity / 型 | PascalCase | `ResourceEntity` |
| DTO / Request | PascalCase + 接尾辞 | `CreateResourceDto` |
| API Path | kebab-case, `/v1/` | `/v1/resources` |
| Query | camelCase | `page`, `resourceType` |
| Component | PascalCase.tsx | `ResourceList.tsx` |
| Hook | `use` + PascalCase | `useResources` |
| Event | PascalCase 過去形 | `ResourceCreated` |
| Plugin ID | kebab-case | `openai` |
| Repository | `{domain}.repository.ts` | `resource.repository.ts` |
| Service | `{domain}.service.ts` | `resource.service.ts` |
| Migration | Prisma 自動 | `20260705_*` |
| DB テーブル | snake_case 複数 | `audit_logs` |
| Prisma Model | PascalCase | `AuditLog` |
| Env | UPPER_SNAKE | `DATABASE_URL` |
| Error Code | UPPER_SNAKE | `RESOURCE_NOT_FOUND` |
| Capability | kebab-case | `image-generation` |

---

## 6. AI 実装ガイドライン

Developer AI（Cursor Agent 等）が守る事項。

| # | 事項 |
|---|------|
| 1 | **コード生成前** — §2 チェックリストを確認 |
| 2 | **既存コード優先** — 新規より拡張。Convention を読む |
| 3 | **勝手な仕様変更禁止** — 要件・MVP 外は PM 承認 |
| 4 | **Architecture 変更禁止** — Freeze 対象は ADR + PM |
| 5 | **ADR 未承認変更禁止** — 設計変更は ADR 草案 → PM |
| 6 | **Provider 依存禁止** — Core から SDK / Adapter 直接 import しない |
| 7 | **重複実装禁止** — shared / domain に既存がないか検索 |
| 8 | **最小 diff** — 依頼範囲外のリファクタ禁止 |
| 9 | **Contract 参照** — 判断に迷ったら §11 優先順位 |
| 10 | **テスト同時** — ロジック変更時は Unit を同 PR |

---

## 7. レビュー依頼前チェックリスト

Reviewer へ PR / レビュー依頼する前に自己確認。

| カテゴリ | 確認 |
|----------|------|
| **Lint** | `pnpm lint` エラー 0 |
| **Format** | Prettier 適用済み |
| **Type** | `tsc --noEmit` エラー 0 |
| **Test** | 関連 Unit / Integration 合格 |
| **Coverage** | 閾値未達でない（Contract §13） |
| **Architecture** | 依存方向・層境界 OK |
| **ADR** | 該当 ADR 準拠、必要 ADR あり |
| **Naming** | §5 早見表準拠 |
| **Logging** | 秘密マスク、pino 経由 |
| **Error** | `AppError` + 安定 code |
| **Security** | Secret 非コミット、入力検証 |

PR 説明に **Backlog ID** と **変更概要** を記載。

---

## 8. Tester 引き継ぎチェック

Tester へ渡す前に Developer が確認。

| 種別 | 確認 |
|------|------|
| **Unit** | domain / plugin の主要パス |
| **Integration** | API + DB（Testcontainers） |
| **E2E** | 影響するクリティカルパス（該当時） |
| **Mock** | 外部依存は mock / container |
| **AI Provider Mock** | `AiProviderAdapter` mock — 実 API 呼出なし |

引き継ぎメモ: テスト実行コマンド、既知の制限、未カバー領域。

---

## 9. よくある実装ミス

AI / 人間が起こしやすい問題。

| ミス | 正しい対応 |
|------|------------|
| Provider SDK を apps/api から直接 import | AI Manager 経由のみ |
| Resource を bypass して独自テーブル CRUD | Resource 集約 + Plugin |
| 巨大 Service / Route Handler | thin handler → service 分割 |
| domain ↔ db 循環参照 | interface in domain, impl in db |
| Context md に VISION 本文複製 | SSOT リンクのみ |
| Contract 未参照で命名 | §5 + Contract §2 |
| Architecture 無断変更 | Freeze → ADR + PM |
| API が `/v2/` や RPC 風 URI | `/v1/` REST + Contract §3 |
| API Key を metadata に保存 | Secret Store + secretRef |
| `any` で型エラー回避 | `unknown` + 型ガード |
| Plugin 間 import | Plugin 独立 |

---

## 10. AI の禁止事項

**絶対禁止** — 違反時は実装を止め PM に報告。

1. Architecture Freeze 対象の無断変更
2. ADR 無視・未承認の設計変更
3. SSOT 破壊（Knowledge 複製、二重正本）
4. Context への本文複製
5. 確定済み `resource_type` / `resource_id` 規約の破壊
6. Core から Provider / Adapter 直接呼び出し
7. API Key・Secret のコード / Resource / ログへの保存
8. Implementation Contract 違反（正本は Contract）
9. PM / Architect 承認なしのスコープ拡大
10. ソースコード以外の無依頼コミット

---

## 11. 参照優先順位

判断に迷った場合、**上ほど優先**（Playbook は最下位）。

| 順位 | 正本 |
|------|------|
| 1 | [VISION.md](../project/VISION.md) |
| 2 | [ADR](../project/decisions/) |
| 3 | [Architecture](../architecture/)（Freeze） |
| 4 | [Implementation Contract](./01-implementation-contract.md) |
| 5 | [Coding Standard](../standards/coding-standard.md) |
| 6 | **本 Playbook**（運用補助のみ） |

**Playbook と Contract が矛盾する場合 → Contract（ADR-017）を正とする。**

---

## 変更履歴

| 日付 | 変更 |
|------|------|
| 2026-07-05 | v1.0 初版（Phase 2.6）— ADR-017 運用補助 |
