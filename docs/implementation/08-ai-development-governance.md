# URMS AI Development Governance

> **resource_type:** knowledge  
> **resource_id:** knowledge:ai-development-governance  
> **version:** 1.0  
> **phase:** 2.9  
> **status:** draft — PM 承認待ち  
> **owner:** PM + Architect  
> **adr:** ADR-021

## 参照

| 柱 | 文書 | 役割 |
|----|------|------|
| **Contract** | [01-implementation-contract.md](./01-implementation-contract.md) | 実装契約 SSOT |
| **Quality Gate** | [07-quality-gate.md](./07-quality-gate.md) | PR / Review / Release 基準 |
| **Governance（本書）** | 本書 | AI と人間の共同開発運用 |

**Architecture Freeze（ADR-006〜016）維持。** ADR-017〜020 は変更しない。

---

## 1. Purpose

### 目的

Phase 3 実装開始前の **最終ガバナンス** として、AI と人間が共同開発する際の依頼・生成・レビュー・承認フローを標準化する。Contract（何を作るか）と Quality Gate（どう合格するか）に加え、**AI へどう依頼し、どう検証し、誰が承認するか** を定義する。

### 適用範囲

| 対象 | 適用 |
|------|------|
| Phase 3 MVP 実装（S1〜S10） | 全章 |
| Cursor Agent / Composer / サブエージェント | 全章 |
| 外部 AI（ChatGPT, Claude 等）への依頼 | §3, §7, §8 |
| ドキュメントのみ変更 | §4, §5, §6, §9 |

### 対象 AI

| 種別 | 例 |
|------|-----|
| IDE 組込 AI | Cursor, GitHub Copilot, VS Code AI |
| クラウド LLM | ChatGPT, Claude, Gemini, Grok |
| Provider 基盤 | OpenAI, Anthropic, Google, xAI |
| ローカル推論 | Ollama, LM Studio, vLLM |
| カスタム | Custom Provider + Adapter（ADR-016） |

いずれも **同一 Governance** を適用する。Provider 名でルールを変えない。

### 対象ロール

| ロール | 主な利用章 |
|--------|------------|
| PM | §6, §8, §14 |
| Developer / Developer AI | §3〜§5, §8, §9 |
| Reviewer | §6, §9 |
| Tester | §9, §13 |
| Architect | §5, §11 |
| Knowledge Manager | §5, §10, §14 |
| User | Phase 3 開始承認、Major エスカレーション |

---

## 2. AI Development Principles

AI は以下の原則を **常に** 守る。Contract §20 実装禁止事項と整合。

| 原則 | 意味 |
|------|------|
| **Human First** | 最終判断は人間（Reviewer / PM / User）。AI は提案者 |
| **Architecture First** | Architecture Freeze 内でのみ実装。変更は ADR + PM |
| **Resource First** | すべてのドメイン操作は Resource 集約経由 |
| **SSOT** | Knowledge が正本。Context / コード / AI 出力に本文複製しない |
| **Contract First** | 実装判断は Contract が最上位（Governance / Playbook より上） |
| **AI Provider Independent** | Core → AI Manager → Adapter のみ。Provider SDK 直 import 禁止 |
| **Plugin First** | Type / Provider 拡張は Plugin 経由 |
| **Security First** | Secret / PII 非出力。Prompt Injection 対策 |
| **Long-term Maintainability** | 10年保守。過剰抽象・魔法禁止 |

---

## 3. AI Document Priority

AI が実装・レビュー前に参照する **固定順序**。上ほど優先。

| 順位 | 正本 | パス |
|------|------|------|
| 1 | **VISION** | [VISION.md](../project/VISION.md) |
| 2 | **Requirements** | [docs/requirements/](../requirements/) |
| 3 | **Architecture** | [docs/architecture/](../architecture/) — Freeze |
| 4 | **ADR** | [docs/project/decisions/](../project/decisions/) |
| 5 | **Implementation Contract** | [01-implementation-contract.md](./01-implementation-contract.md) |
| 6 | **Quality Gate** | [07-quality-gate.md](./07-quality-gate.md) |
| 7 | **Sprint Planning** | [04-sprint-planning.md](./04-sprint-planning.md) |
| 8 | **Developer Playbook** | [02-developer-playbook.md](./02-developer-playbook.md) |
| 9 | **Knowledge** | [docs/project/](../project/), [docs/standards/](../standards/) |
| 10 | **Context** | `.cursor/context/` — **補助のみ** |

### Context の位置づけ

- Context は **現在状態の要約 + SSOT リンク** のみ
- **SSOT ではない** — Context と Knowledge が矛盾する場合、Knowledge を正とする
- AI は Context を正本として Architecture / Contract を上書きしてはならない
- Context 更新は PM のみ（ADR-004）

---

## 4. AI Allowed Actions

PM 割当・DoR 満たしたタスクにおいて、**Reviewer 承認前** に AI が自動実施してよい内容:

| カテゴリ | 許可内容 |
|----------|----------|
| **コード** | Contract 準拠の新規 / 修正コード生成 |
| **テスト** | Unit / Integration / E2E テスト生成 |
| **コメント** | 非自明ロジックへの NOTE / ADR 参照コメント |
| **OpenAPI** | Route 変更に伴う OpenAPI 同期案 |
| **SQL** | PostgreSQL Skill レビュー前提の migration 補助 SQL |
| **README** | 実装に伴う README / `.env.example` 更新案 |
| **リファクタリング提案** | 振る舞い不変の整理案（PR 分割提案含む） |
| **ドキュメント** | Knowledge 更新 **案**（KM / PM 承認後に反映） |
| **調査** | コードベース探索、影響範囲分析 |

**条件:** Sprint / Backlog ID 紐付け、§8 Prompt Standard 使用、§9 Validation 合格。

---

## 5. AI Forbidden Actions

AI が **絶対に** 行ってはいけないこと（Contract §20 含む）:

| # | 禁止 | 理由 |
|---|------|------|
| 1 | **Architecture 変更** | Freeze — ADR + PM 必須 |
| 2 | **ADR-006〜020 変更** | ガバナンス正本 |
| 3 | **Contract 変更** | ADR-017 改訂 + PM のみ |
| 4 | **Provider 直接利用** | ADR-016 — Adapter 経由のみ |
| 5 | **Secret 埋め込み** | コード / Prompt / Log 禁止 |
| 6 | **Plugin 契約破壊** | Plugin 間依存、Registry 迂回 |
| 7 | **Context を SSOT 化** | Knowledge 複製禁止 |
| 8 | **Resource モデル変更** | resource_type 追加は ADR + Plugin |
| 9 | **命名規則変更** | Contract §2 固定 |
| 10 | **レビューなし Merge** | Reviewer 承認必須 |
| 11 | **勝手な依存追加** | package 追加は PM / Architect 確認 |
| 12 | **Git commit / push** | User / PM 明示指示まで禁止 |
| 13 | **物理 DELETE 実装** | Resource 論理 DELETE のみ |
| 14 | **Feature Flag 無視** | ADR-019 デフォルト尊重 |
| 15 | **AI 同士による設計決定** | §7 — 設計変更は Architect + PM |

---

## 6. AI Review Policy

| 段階 | 担当 | 責任 |
|------|------|------|
| **AI レビュー** | Bugbot / Cursor Agent 等 | Architecture / Contract 違反検出。**指摘のみ** |
| **Reviewer レビュー** | Reviewer（人間） | Code Review Gate（Quality Gate §4）。**merge 可否の最終判断** |
| **PM 承認** | PM | スコープ外、Architecture 影響、Phase 開始 / リリース、HotFix |

### 明記事項

- **AI は最終承認者ではない**
- AI Critical 指摘 → Reviewer は解消または理由付き dismiss 必須（Quality Gate §9）
- AI が「Approved」と表示しても merge 不可 — Reviewer 承認が必須
- Phase 3 実装開始は **User + PM 承認**（Governance 外ゲート）

---

## 7. Multi AI Collaboration

### 対象 Provider / ツール

| 分類 | 例 |
|------|-----|
| クラウド LLM | ChatGPT, Claude, Gemini, Grok |
| Provider API | OpenAI, Anthropic, Google, xAI |
| ローカル | Ollama, LM Studio, vLLM |
| カスタム | Custom Provider（Adapter 追加） |
| IDE | Cursor, GitHub Copilot, VS Code AI |

### 協調ルール

| ルール | 内容 |
|--------|------|
| **単一 SSOT** | すべての AI は §3 Document Priority に従う |
| **設計変更禁止** | AI 同士の合意で Architecture / ADR / Contract を変更しない |
| **出力の競合** | 複数 AI 出力が矛盾 → Reviewer + Architect が裁定 |
| **Provider 中立** | 実装コードは Provider 非依存（Adapter 内のみ SDK） |
| **URMS AI Manager** | 本番 AI 呼出は URMS AI Manager 経由（Phase 3 S7 以降） |

**Cursor 上の AI チーム**（PM, Architect, Developer 等）はロール定義 [docs/ai-team/](../ai-team/) に従い、PM 単一窓口原則を維持する。

---

## 8. AI Prompt Standard

AI へ実装を依頼する際の **標準テンプレート**（PM / Developer が使用）:

```markdown
## 目的
[1〜3 文 — 何を達成するか]

## 対象
- Backlog: B-xxx
- Sprint: Sx / CP-x
- Package / App: [paths]

## 入力
- 参照: [Contract §x, ADR-xxx, Architecture yy]
- 既存コード: [file paths]
- 制約: [Feature Flag, Mode 等]

## 期待出力
- [ファイル / テスト / OpenAPI 等の具体物]
- Contract §19 DoD 項目

## 禁止事項
- Architecture / ADR / Contract 変更
- Provider 直接 import
- Secret / PII 出力
- [タスク固有禁止]

## レビュー条件
- Quality Gate §4 観点
- Reviewer 承認必須

## 完了条件
- DoR 満たす（Contract §18）
- DoD 満たす（Contract §19 + Quality Gate §14）
- テスト / lint 合格
```

---

## 9. AI Output Validation

AI 成果物は merge 前に以下を確認する（Quality Gate §4 / §9 と整合）:

| 観点 | 確認 |
|------|------|
| **Architecture** | 層依存、Freeze 範囲 |
| **Contract** | §1〜§20 準拠 |
| **Naming** | kebab-case ファイル、camelCase 変数 |
| **Plugin** | Registry 登録、SemVer（ADR-018） |
| **Mode** | plan / operate / audit + RBAC |
| **Context** | SSOT リンクのみ — 本文複製なし |
| **Resource** | Resource First、論理 DELETE |
| **AI Provider** | AI Manager → Adapter 経由 |
| **Security** | Secret / PII / Injection 対策 |
| **Performance** | N+1 なし、NFR 意識 |
| **Test** | Unit / Integration 追加 |
| **Documentation** | OpenAPI 同期、用語 glossary 整合 |

**担当:** Developer 自己確認 → Reviewer 最終確認 → Tester（テストゲート）。

---

## 10. AI Logging

URMS および開発 AI 利用の監査対象（ADR-016 ai-usage Resource 整合）:

| 項目 | 保存 |
|------|------|
| **AI 利用履歴** | ai-usage Resource / ai_audit_logs |
| **Prompt** | promptHash（本文は Flag 制御） |
| **Model** | resource_id: ai-model:* |
| **Provider** | resource_id: ai-provider:* |
| **Token** | input / output tokens |
| **Cost** | 推定コスト |
| **Latency** | latencyMs |
| **Timestamp** | ISO 8601 |
| **Review Result** | approved / rejected / dismissed + Reviewer ID |

開発時（Cursor 等）: Phase 3 以降、重要 PR には Prompt 要約を PR 説明に記載推奨。

---

## 11. AI Provider Governance

[ADR-016](../project/decisions/ADR-016-ai-provider-abstraction.md) 整合:

| 操作 | 許可 | 条件 |
|------|------|------|
| **Provider 追加** | ✅ | 新 AiProviderPlugin + Adapter のみ |
| **Capability 追加** | ✅ | ProviderCapability 拡張 + glossary |
| **Adapter 追加** | ✅ | packages/plugins/ai-providers/ |
| **Model 追加** | ✅ | ai-model Resource 登録 |
| **Core 変更** | ❌ | AI Manager interface 変更は ADR 必須 |

**Core 変更禁止:** domain / apps から Provider SDK を import しない。Routing / Fallback / Cost は AI Manager 内。

---

## 12. AI Security

| 脅威 | 運用ルール |
|------|------------|
| **Prompt Injection** | 外部入力を System Prompt に直接連結しない。サニタイズ + 境界明示 |
| **Secret** | AI 入力に API Key / .env 実値を含めない |
| **PII** | 個人データを Prompt / Log に載せない。匿名化 fixture のみ |
| **Credential** | Secret Store + secretRef のみ |
| **Sandbox** | Plugin 実行は Registry 経由。任意コード実行禁止 |
| **Code Execution** | AI 生成コードの自動実行は CI / ローカル test のみ |
| **Tool 権限** | MCP / Tool は最小権限。本番 DB 直結禁止 |
| **Network** | Adapter 以外から Provider API 直 call 禁止 |

---

## 13. AI Quality

Phase 3 以降 PM がトラッキングする AI 品質指標:

| 指標 | 定義 | MVP 目標 |
|------|------|----------|
| **レビュー通過率** | 初回 Reviewer 承認 PR / 全 AI 生成 PR | ≥ 60% |
| **再生成率** | AI 再依頼回数 / タスク | < 2 回平均 |
| **修正率** | Reviewer 修正コメント / PR | 週次トレンド下降 |
| **採用率** | merge された AI 生成行 / 提案行 | 記録のみ（Phase 4 目標設定） |
| **生成時間** | 依頼 → 初回出力 | 記録 |
| **レビュー時間** | PR 作成 → Reviewer 初回コメント | Quality Gate §12 と整合 |

---

## 14. AI Roles

| ロール | 人間 | AI  agent | 責任 |
|--------|------|-----------|------|
| **PM** | ✅ | 補助 | スコープ、承認、User 窓口、Governance 遵守 |
| **Architect** | ✅ | 補助 | Freeze 整合、ADR 起票、設計レビュー |
| **Developer** | ✅ | ✅ | 実装、テスト、PR 作成 — §4 許可範囲 |
| **Reviewer** | ✅ | 補助（§6） | **最終 merge 判断** |
| **Tester** | ✅ | 補助 | テストゲート、E2E、Coverage |
| **Knowledge Manager** | ✅ | 補助 | SSOT 更新、ADR 登録、glossary |

**AI Developer** はコード生成可。**AI Reviewer** は指摘のみ — merge 不可。

---

## 15. Future AI

将来追加される AI 形態への拡張方針（Architecture 変更なし）:

| 将来形態 | 方針 |
|----------|------|
| **MCP Server** | Tool 権限 §12 に従う。Registry 登録 |
| **Agent（自律）** | PM 割当 Sprint 内のみ。設計変更不可 |
| **Auto Coding** | §4 許可 + Reviewer 必須 |
| **Auto Review** | Quality Gate §9 — 補助のみ |
| **Planning AI** | Sprint / Backlog 案 — PM 承認後に反映 |
| **Code AI** | Developer AI と同一 Governance |
| **Research AI** | Read-only 調査。Knowledge 更新は KM 経由 |

新 AI 形態追加時: 本書 §4/§5 更新 + PM 承認（ADR 不要）。Architecture 影響時は ADR 必須。

---

## 変更履歴

| 日付 | 変更 |
|------|------|
| 2026-07-05 | v1.0 初版（Phase 2.9） |
