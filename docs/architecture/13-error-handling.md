# URMS エラーハンドリング方針

> **resource_type:** knowledge  
> **resource_id:** knowledge:architecture-errors  
> **version:** 1.0  
> **phase:** 2

---

## 1. 原則

- すべての API エラーは **統一 JSON 形式**
- 内部スタックトレースはクライアントに返さない
- エラーコードは **機械可読 + 安定**（AI 連携考慮）

---

## 2. エラーコード体系

| Prefix | 領域 | 例 |
|--------|------|-----|
| `AUTH_` | 認証 | AUTH_INVALID_TOKEN |
| `MODE_` | Mode | MODE_NOT_ALLOWED |
| `RESOURCE_` | Resource | RESOURCE_NOT_FOUND |
| `CONTEXT_` | Context | CONTEXT_VALIDATION_FAILED |
| `VALIDATION_` | 入力 | VALIDATION_REQUIRED_FIELD |
| `INTERNAL_` | サーバー | INTERNAL_ERROR |

---

## 3. HTTP ステータスマッピング

| 状況 | Status |
|------|--------|
| バリデーション失敗 | 400 |
| 未認証 | 401 |
| 権限不足 / Mode 拒否 | 403 |
| 未存在 | 404 |
| 競合（duplicate resource_id） | 409 |
| サーバーエラー | 500 |

---

## 4. Fastify Error Handler

```typescript
// 疑似コード
app.setErrorHandler((error, request, reply) => {
  if (error instanceof AppError) {
    return reply.status(error.statusCode).send({
      error: { code: error.code, message: error.message, details: error.details }
    });
  }
  logger.error(error);
  return reply.status(500).send({
    error: { code: 'INTERNAL_ERROR', message: 'Internal server error', details: [] }
  });
});
```

---

## 5. Web UI

- API エラーを toast / inline message で表示
- `RESOURCE_NOT_FOUND` → 404 ページ
- ネットワークエラー → リトライ UI

---

## 変更履歴

| 日付 | 変更 |
|------|------|
| 2026-07-05 | v1.0 初版 |
