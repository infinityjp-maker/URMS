# ADR-001: AI 開発チーム v1.0 構成

> **resource_type:** decision  
> **resource_id:** decision:ADR-001  
> **status:** accepted  
> **date:** 2026-07-05  
> **author:** PM + Architect

## コンテキスト

URMS を10年以上保守するにあたり、Cursor 上で AI 協調開発を行う必要がある。単一 Agent では役割混在・承認ゲート欠如・Knowledge 散逸のリスクがある。

## 決定

1. **7ロール**（PM, Architect, Developer, Reviewer, Tester, Document Writer, Knowledge Manager）を定義
2. **PM 単一窓口** — User は PM のみと直接会話
3. **SSOT 分離** — Context（現在）/ docs/project（Knowledge）/ docs/standards（規約）
4. **Prisma / PostgreSQL Skill 分離** — ORM と DB 本体の責務を分ける
5. **Commands 8件** — `/pm`, `/plan`, `/design`, `/implement`, `/test`, `/review`, `/document`, `/knowledge`
6. **将来 URMS Resource モデル** — 各資産に `resource_type` / `resource_id` を付与

## 理由

- 長期保守: 承認ゲートと Knowledge 正本化
- AI 協調: ロール分離と Command 入口
- 拡張性: URMS 自身が AI チームを Resource として管理する将来を見据える

## 影響

- v1.0 はソースコード未作成。AI 基盤のみ構築
- User が非 PM Command を実行した場合はエスカレーション必須

## 関連

- [00_Overview.md](../../ai-team/00_Overview.md)
- [architecture-history.md](../architecture-history.md)

---

## ADR テンプレート

新規 ADR は本ファイルをコピーし `ADR-NNN-{slug}.md` として作成する。詳細: [99_Template.md](../../ai-team/99_Template.md)
