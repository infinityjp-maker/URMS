# URMS ログ設計

> **resource_type:** knowledge  
> **resource_id:** knowledge:architecture-logging  
> **version:** 1.0  
> **phase:** 2

## 参照

- [ADR-012](../project/decisions/ADR-012-logging.md)

---

## 1. 方針

- **構造化 JSON ログ**（pino）
- レベル: trace, debug, info, warn, error, fatal
- 本番: info 以上。開発: debug

---

## 2. ログ種別

| 種別 | 出力先 | 内容 |
|------|--------|------|
| **Application Log** | stdout → 集約 | リクエスト、エラー、起動 |
| **Audit Log** | PostgreSQL `audit_logs` | ドメイン操作（NFR-032） |
| **Access Log** | stdout | HTTP method, path, status, duration |

Application Log と Audit Log は **分離**。監査は DB append-only。

---

## 3. リクエストログ形式

```json
{
  "level": "info",
  "time": "2026-07-05T00:00:00.000Z",
  "reqId": "uuid",
  "method": "GET",
  "url": "/v1/resources",
  "mode": "operate",
  "userId": "user-uuid",
  "statusCode": 200,
  "responseTime": 45
}
```

---

## 4. 機密情報

ログに含めない: パスワード, JWT 全文, metadata 内 PII（マスク処理）。

---

## 5. 集約（Phase 3 デプロイ）

- 開発: stdout
- 本番: Docker → Loki / CloudWatch / 等（ADR-014 と合わせて Phase 3 決定）

---

## 6. packages/logger

```typescript
// packages/logger/src/index.ts
export function createLogger(service: string): Logger;
```

apps/api, apps/web (SSR 将来) から共有。

---

## 変更履歴

| 日付 | 変更 |
|------|------|
| 2026-07-05 | v1.0 初版 |
