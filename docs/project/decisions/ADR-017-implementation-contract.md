# ADR-017: Implementation Contract 採用

> **resource_type:** decision  
> **resource_id:** decision:ADR-017  
> **status:** accepted  
> **date:** 2026-07-05  
> **author:** Architect + PM

## コンテキスト

Phase 2 Architecture Freeze 完了後、Phase 3（MVP 実装）に移行する。Developer / Reviewer / Tester が同一基準で開発するため、Architecture を **実装可能な契約** へ具体化する必要がある。既存 coding-standard.md は原則のみで、API・DB・Plugin・AI Provider 等の実装ルールが不足。

## 決定

1. **Phase 2.5 Implementation Contract** を新設
2. 正本: `docs/implementation/01-implementation-contract.md`
3. 索引: `docs/implementation/README.md`
4. 本 Contract は Architecture Freeze（ADR-006〜016）を **変更せず** 実装ルールへ落とし込む
5. Contract 変更は ADR 改訂 + PM 承認 + KM 記録
6. Phase 3 実装は本 Contract + DoR / DoD 準拠必須

### 主要契約領域（20 章）

ディレクトリ、命名、API、Error、Resource、DB、Event、Plugin、AI Provider、TypeScript、React、Fastify、Test、Logging、コメント、Git、Security、DoR、DoD、禁止事項

## 理由

- VISION「10年保守」「AI 協調」— 一貫した実装基準
- Architecture Freeze 維持しつつ実装具体化
- Reviewer / Tester の客観的ゲート

## 影響

- Phase 3 全 Developer タスクの DoR / DoD 基準
- coding-standard.md は原則層、本 Contract は実装層（役割分離）
- `.cursor/rules/02_実装.mdc` から本 Contract 参照

## 関連

- [ADR-006](./ADR-006-monorepo.md) 〜 [ADR-016](./ADR-016-ai-provider-abstraction.md)
- [01-implementation-contract.md](../../implementation/01-implementation-contract.md)
- [coding-standard.md](../../standards/coding-standard.md)
