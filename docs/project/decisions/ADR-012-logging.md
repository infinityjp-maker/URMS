# ADR-012: ログ設計

> **resource_type:** decision  
> **resource_id:** decision:ADR-012  
> **status:** accepted  
> **date:** 2026-07-05  
> **author:** Architect

## コンテキスト

運用・監査・デバッグに構造化ログが必要。Audit Log（DB）と Application Log（stdout）の分離。

## 決定

1. **pino** 構造化 JSON ログ
2. **packages/logger** 共有
3. Application Log ≠ Audit Log（DB append-only）
4. 機密情報マスク
5. 本番 info 以上

## 理由

- Fastify 標準互換
- NFR-032 監査分離
- 10年保守: ログ形式安定

## 影響

- [14-logging.md](../../architecture/14-logging.md)

## 関連

- [ADR-011](./ADR-011-event-model.md)
