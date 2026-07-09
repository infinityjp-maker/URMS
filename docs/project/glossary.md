# URMS 用語集（Glossary）

> **resource_type:** knowledge  
> **resource_id:** knowledge:glossary  
> **version:** 2.1  
> **owner:** Knowledge Manager

## 運用

- 新規用語は KM が `/knowledge` で追加
- 同義語は **正本用語1つ** に統合
- Document Writer / Architect は執筆前に本 glossary を参照
- **User 向け PM 報告** は [平易語辞典](#平易語辞典userpm-報告向け) の表現を優先（専門用語は内部記録のみ）

---

## A

### ADR（Architecture Decision Record）

アーキテクチャ上の重要決定を記録する文書。正本: `docs/project/decisions/ADR-*.md`

### AI チーム

Cursor 上で URMS を協調開発する7ロール（PM, Architect, Developer, Reviewer, Tester, Document Writer, Knowledge Manager）の総称。

### AI Manager

生成AI Provider を抽象化する URMS サブシステム。Routing、Fallback、Cost 管理を担う。Core は Adapter Interface のみ参照。ADR-016 参照。

### ai-model（Resource Type）

利用可能な生成AIモデル。`resource_type: ai-model`, `resource_id: gpt-5.5` 等。Provider とは別 Resource。

### ai-provider（Resource Type）

生成AIサービス Provider。`resource_type: ai-provider`, `resource_id: openai` 等。Adapter Plugin と対応。

## C

### Context

`.cursor/context/` に置く **現在状態のみ** のスナップショット。PM のみ更新。

### Context Engine

URMS サブシステム。現在フェーズ・タスク・Mode 等の **要約 + SSOT リンク** のみ保持。本文複製禁止。ADR-004 参照。

### Command

`.cursor/commands/` のスラッシュコマンド。ロール起動の入口。

### ai-usage（Resource Type）

AI 利用履歴。Provider, Model, Tokens, Cost, Latency, Timestamp を保持。ADR-016 参照。

### Capability（AI）

AI Model の能力（chat, streaming, vision, image-generation 等）。**Provider 名ではなく Capability で判定。** ADR-016 参照。

### embedding-model（Resource Type）

Embedding 専用モデル。Chat Model（ai-model）と分離。ADR-016 参照。

### generated-image（Resource Type）

画像生成結果 Resource。prompt, seed, provider, model, parameters 等を metadata に保持。ADR-016 参照。

## D

### Domain Event

Resource / Context 操作時に発行されるイベント。Audit 連携に使用。ADR-011 参照。

## E

### Event Bus

Domain Event の publish/subscribe 抽象。MVP は in-process。

### Implementation Contract

Phase 3 実装前の実装ルール正本。`docs/implementation/01-implementation-contract.md`。ADR-017 参照。

### Developer Playbook

実装時の運用ガイド。`docs/implementation/02-developer-playbook.md`。Contract を複製せず、チェックリスト・早見表を提供。ADR-017 運用補助。

## F

### Feature Flag

Runtime で機能を有効/無効化するスイッチ。命名 `ff.{domain}.{feature}`。dev / staging / production でデフォルトを分離。ADR-019 参照。

## G

### GA（General Availability）

**正式版として区切りを付けた完成** のこと。テストとレビューを経て、版番号（例: v1.3.0）を付けて「この時点の URMS はここまでできている」と記録する段階。平易語: [正式リリース](#正式リリースga-と同じ)。

### Git タグ（tag）

Git 上の **版番号ラベル**（例: `v1.3.0`）。いつの状態か後から辿れる目印。コミット（保存記録）に名前を付けるイメージ。平易語: [版番号ラベル](#版番号ラベルtag-と同じ)。

## K

### Knowledge

`docs/project/` および `docs/standards/` の長期正本。KM が管理。

## M

### Mode System

URMS の操作文脈切替。MVP: `plan` / `operate` / `audit`。ADR-003 参照。

### MVP

Minimum Viable Product。Phase 3 初回リリース範囲。[mvp-definition.md](../requirements/mvp-definition.md) が正本。

### Monorepo

pnpm workspace による apps + packages 構成。ADR-006 参照。

## O

### OpenAPI

REST API 契約の記述形式。`/v1/` プレフィックス。ADR-007 参照。

## P

### PM 単一窓口

User と直接会話するのは PM のみ。他ロールは PM 経由。

### PostgreSQL Skill

DB 本体（SQL, Index, View, Function, Trigger, チューニング, pgvector 等）を管轄する Skill。Prisma Skill とは独立。

### Plugin（ResourceTypePlugin）

Resource Type 別バリデーション・メタデータを提供する拡張点。ADR-009 参照。

### Prisma Skill

ORM, Migration, `schema.prisma` を管轄する Skill。

## R

### Resource

URMS が管理する統一資産単位。`resource_type` + `resource_id` で識別。物理・デジタル・人的・知識・AI チーム構成要素を含む。ADR-002 参照。

### resource_id

Resource の一意識別子。形式: `{resource_type}:{name}`（例: `physical:server-001`）。

### resource_type

Resource の種別（例: `physical`, `digital`, `role`, `decision`）。[resource-catalog.md](../requirements/resource-catalog.md) が Type 定義の正本。

### SSOT（Single Source of Truth）

情報の正本を1箇所に限定し、複製による不整合を防ぐ原則。

### Phase 3 Ready

Phase 3 実装準備完了判定。[03-phase3-readiness.md](../implementation/03-phase3-readiness.md)。**Phase 3 MVP 完了済（v0.2.0-mvp）。**

## S

### Secret Store

AI Provider API Key 等の秘密情報を保持する暗号化ストア。Resource には `secretRef` のみ保存。ADR-016 参照。

### Semantic Versioning（SemVer）

`MAJOR.MINOR.PATCH` 形式のバージョン規約。Application / Plugin / Schema 等に適用。ADR-018 参照。

### Sprint Planning

Phase 3 MVP を Sprint 1〜10 に分割した実装計画。`docs/implementation/04-sprint-planning.md`。

### Quality Gate

PR・Commit・Review・Test・Release の品質基準。DoR/DoD 正本は Contract。`docs/implementation/07-quality-gate.md`。ADR-020 参照。

### AI Development Governance

AI と人間の共同開発運用（依頼・生成・レビュー・承認）。Phase 3 三本柱の一つ。`docs/implementation/08-ai-development-governance.md`。ADR-021 参照。

## U

### URMS

Unified Resource Management System。10年以上保守を前提とした資産統合管理システム。

### VISION

`docs/project/VISION.md`。存在理由・哲学・判断基準の長期不変正本。ROADMAP とは役割分離。

### Phase 3 Readiness

Phase 3 実装開始判定。`docs/implementation/03-phase3-readiness.md`。

### Phase 3 Master Checklist

実装進捗チェック。`docs/implementation/06-phase3-master-checklist.md`。

## T

### tag

→ [Git タグ（tag）](#git-タグtag)

---

## 平易語辞典（User・PM 報告向け）

> **対象:** システム開発に精通していない User への説明・判断依頼  
> **ルール:** PM チャット報告・Go 依頼では **この欄の言い方を使う**。括弧内の英語は補足のみ。

### 版番号ラベル（tag と同じ）

プログラムの **「第何版か」を示す名前**（例: v1.3.0）。本棚の本に「2024年改訂版」とシールを貼るイメージ。Git 上では **tag** と呼ぶ。

### 正式リリース（GA と同じ）

ある機能セットを **「ここまで完成・使える状態」と宣言すること**。内部では **GA** と略す。User への報告では **「正式版 v1.3.0 として区切りました」** のように書く。

### 保存記録（commit / コミット）

変更内容を Git に **1 回分として記録したもの**。「いつ・何を変えたか」の履歴。短い識別子（例: `8a52986`）が付く。

### 変更の差分（diff）

**変更前と変更後の違い** の一覧。レビュー担当が「何が変わったか」を確認するときに見る。

### 作業の塊（Package）

**Backlog 1 件分**（例: B-023）をまとめて実装・テスト・レビューする単位。コミットのたびにレビューせず、**塊が終わったときに一度だけ** チェックする。

### 実装の許可（Go-1）

コードを書き始める **前** に、PM が内容を説明し User が **「Go」「実装して」** と返すこと。設計と範囲の合意。

### 完成の許可（Go-2）

実装・自動テスト・別担当レビューが終わった **後** に、PM が結果を報告し User が **「Go」「正式版にして」** と返すこと。版番号ラベル（tag）を付ける直前の合意。

### 続行の合図（Go）

User が **「進めてよい」** と返す短い返答。「Go」「続けて」「実装して」「正式版にして」など。文脈で Go-1（着手）か Go-2（完成）かを PM が区別する。

### 別 AI 担当（Agent / エージェント）

Cursor 上で **別の AI セッション** として起動する作業者。実装を書いた AI と、レビューする AI を **別人** にするための仕組み。

### 設計担当（Architect）

**設計図・ルール整合** を確認する AI ロール。コードを書く前の「こう作る」案を出す。

### 実装担当（Developer）

**プログラムを書く** AI ロール。

### テスト担当（Tester）

**自動テストを実行し、合格/不合格を判定** する AI ロール。実装担当本人の「大丈夫です」だけでは足りない。

### レビュー担当（Reviewer）

**別の目でコードを読み、問題がないか確認** する AI ロール。実装した本人はレビューしない。

### プロジェクト管理（PM）

User と AI チームの **窓口**。進捗報告・許可（Go）の取り次ぎ・優先順位の整理。

### やることリスト（Backlog）

これからやる作業の一覧。1 件ごとに ID（例: **B-023**）が付く。

### 開発の区切り（Sprint）

数週間単位の **まとまった開発期間**（例: **S17**）。その中で Backlog を消化する。

### 完了の条件（DoD / Definition of Done）

「これができたらタスク完了」と決めた **チェックリスト**（テスト合格・レビュー OK など）。

### サーバー疎通確認（dev:verify）

開発中の URMS が **正常に動いているか** を一括で確認するコマンド（`pnpm dev:verify`）。画面・API・DB の起動状態を `[OK]` / `[NG]` で表示する。**User 報告では「動作確認の結果」** と呼ぶ。

### 画面の API 窓口（API）

ブラウザや Desktop アプリが **データを取りに行く入口**（例: `http://localhost:3000`）。裏方のプログラムが User の操作を受け付ける部分。

### データベース（DB / PostgreSQL）

データを **永続的に保存** する場所。Docker で起動することが多い。未起動だとデータ機能は使えない。

### 本番に近い画面（Desktop / 1420）

User が主に見る URMS 画面の開発版。**http://127.0.0.1:1420/** — Canvas urms-hub の青リンクから **Cursor 内タブ** で開く。

### 旧設計図プレビュー（5180 · 削除済）

2026-07-08 に削除。製品 UI は 1420 のみ。

### 正本（SSOT）

同じ情報を **1 箇所だけ** に置き、他はリンクで参照するルール。「どのファイルが正しいか迷わない」ための決まり。

### 設計決定の記録（ADR）

「なぜこう決めたか」を残す **設計メモ**（Architecture Decision Record）。例: ADR-004 は Context に本文を複製しない、など。

### Cursor の利用枠

Cursor Pro の **月間 AI 利用量**。PM が `usage-log` で記録。枠が少ないときは作業量を抑える（削減モード）。

### 進捗ボード（Canvas）

チャット横に開ける **URMS 進捗の見える化**（React）。数値は PM 報告と一致させる。

### マージ（merge）

**2 つの変更履歴を1つに合わせる** こと。export 機能では「外部の内容を URMS に取り込む」意味でも使う（競合時は上書きしない）。

### 競合（conflict）

**同じ場所を別々に変更していて、自動では合体できない** 状態。S17 では export 時に報告し、勝手に上書きしない。

### Cursor への書き戻し（export · 書き出し · 書戻し）

**URMS に記録した内容を、Cursor が読むテキストファイルに反映する** 機能。

| 比喩 | 説明 |
|------|------|
| **URMS** | プロジェクトの「台帳」（データベースに現在の状態を保存） |
| **Cursor** | いまこのチャットで AI と会話している **エディタ** |
| **`.cursor/` フォルダ** | Cursor の AI が読む **メモ置き場**（ルール・今のタスク・チーム説明など） |

**流れ:**

1. URMS で「今のタスク」「進捗」「AI チームの役割」などを管理する  
2. **書き戻し** ボタン（開発モードの画面）または API を実行する  
3. URMS が **`.cursor/context/`** や **AI チーム用の Markdown** などを **最新の内容に更新** する  
4. 次に Cursor で AI と話すとき、**古いメモではなく URMS の最新情報** を AI が参照できる  

**User 向けの呼び方:** 「**URMS から Cursor 用のメモファイルを更新する**」  
**画面のボタン名:** 「**書戻し**」（1420 · 開発モード · 連携パネル）

**v1.3.0 まで:** タスク概要・リンク・一部の要約を書き戻せる  
**次の作業（B-023）:** 内容が **食い違ったとき** は勝手に上書きせず、「どこが違うか」を報告する

---

## PM → User 言い換え表

| 内部（AI・ドキュメント） | User 向け PM 報告で使う言い方 |
|--------------------------|-------------------------------|
| GA | 正式版として区切った / 正式リリース |
| tag `v1.3.0` | 版番号 v1.3.0 を付けた |
| commit | 変更を保存した（記録 ID: …） |
| diff | 変更内容 |
| Package | 作業の塊（B-023 など 1 件分） |
| Go-1 | **実装してよいですか？**（着手の許可） |
| Go-2 | **正式版にしてよいですか？**（完成の許可） |
| Agent | 別 AI 担当 |
| Reviewer 承認 | 別担当のコード確認 OK |
| Tester 合格 | 自動テスト OK |
| dev:verify | 動作確認（結果をそのまま貼る） |
| Backlog B-023 | やること No.023 |
| Sprint S17 | 開発区切り S17 |
| DoD | 完了条件 |
| API | データの窓口 / 裏方プログラム |
| SSOT | 正本（情報の正式な置き場所） |
| ADR-004 | 設計決定メモ（Context は要約のみ） |
| merge | 取り込み / 合体 |
| conflict | 競合（上書きできない不一致） |
| export / 書き出し / 書戻し | **URMS から Cursor 用メモファイルを更新する** |
| readonly | 読み取り専用（変更しない確認） |
| Multi-Agent Batch Gate | 別 AI でまとめて確認するルール |
| NG / OK | 問題あり / 問題なし |

---

## 参照

- [99_Template.md](../ai-team/99_Template.md) — 用語追加手順
