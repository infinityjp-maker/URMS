# URMS デプロイ構成

> **resource_type:** knowledge  
> **resource_id:** knowledge:architecture-deploy  
> **version:** 1.0  
> **phase:** 2

## 参照

- [ADR-014](../project/decisions/ADR-014-deployment.md)
- [non-functional-requirements.md](../requirements/non-functional-requirements.md) NFR-040〜042

---

## 1. MVP デプロイモデル

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Nginx     │────→│  apps/web   │     │  apps/api   │
│  (reverse   │     │  (static)   │     │  (Fastify)  │
│   proxy)    │────→│             │────→│             │
└─────────────┘     └─────────────┘     └──────┬──────┘
                                               │
                                        ┌──────▼──────┐
                                        │ PostgreSQL  │
                                        └─────────────┘
```

単一 VPS または PaaS（Railway, Fly.io 等）。Phase 3 でホスト選定。

---

## 2. コンテナ構成

```yaml
# docker-compose.yml（Phase 3）
services:
  api:
    build: ./apps/api
    environment:
      - DATABASE_URL
      - JWT_SECRET
  web:
    build: ./apps/web
  db:
    image: postgres:16
  nginx:
    image: nginx:alpine
    ports:
      - "443:443"
```

---

## 3. 環境

| 環境 | 用途 |
|------|------|
| local | 開発（docker-compose db のみ） |
| staging | 統合検証 |
| production | 本番 |

---

## 4. 環境変数

| 変数 | 必須 | 説明 |
|------|------|------|
| DATABASE_URL | ✅ | PostgreSQL 接続 |
| JWT_SECRET | ✅ | JWT 署名 |
| OIDC_ISSUER | 本番 | IdP URL |
| OIDC_CLIENT_ID | 本番 | OIDC client |
| NODE_ENV | ✅ | development / production |

---

## 5. バックアップ

- PostgreSQL: 日次 pg_dump（NFR-040）
- 保持: 30 日
- 復旧手順: `docs/operations/backup-restore.md`（Phase 3）

---

## 6. ヘルスチェック

- `/health` — API liveness
- DB 接続確認含む
- Docker healthcheck / K8s probe 対応

---

## 変更履歴

| 日付 | 変更 |
|------|------|
| 2026-07-05 | v1.0 初版 |
