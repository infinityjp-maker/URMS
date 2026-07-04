# URMS 認証・認可設計

> **resource_type:** knowledge  
> **resource_id:** knowledge:architecture-auth  
> **version:** 1.0  
> **phase:** 2

## 参照

- [ADR-010](../project/decisions/ADR-010-authentication.md)
- [07-mode-system.md](./07-mode-system.md)
- [risk-register.md](../requirements/risk-register.md) R-008

---

## 1. 認証方針

| 環境 | 方式 |
|------|------|
| 開発 | ローカル JWT（mock user） |
| 本番 | **OIDC**（IdP 未選定 — Phase 3 前に確定必須） |

候補 IdP: Keycloak, Auth0, Azure AD, Google Workspace（ADR-010 で Phase 3 前に1つ選定）。

---

## 2. フロー（OIDC）

```
User → Web → IdP Login → Authorization Code
  → API /auth/callback → Token Exchange
  → JWT (access + refresh) → Web stores (httpOnly cookie)
  → API requests: Authorization: Bearer {access_token}
```

---

## 3. JWT 構造

```json
{
  "sub": "user-uuid",
  "email": "user@example.com",
  "roles": ["operator", "auditor"],
  "allowed_modes": ["operate", "audit"],
  "iat": 0,
  "exp": 0
}
```

---

## 4. 認可モデル

**二層:**

1. **Mode** — 操作文脈（plan / operate / audit）
2. **RBAC** — ロールベース

| ロール | allowed_modes | 説明 |
|--------|---------------|------|
| `viewer` | audit | 読取・監査のみ |
| `operator` | operate, audit | 日常運用 |
| `planner` | plan, operate, audit | PM 相当 |
| `admin` | 全 Mode + develop（将来） | システム管理 |

MVP: 4 ロール固定。カスタム RBAC は Phase 3+。

---

## 5. API Middleware 順序

```
1. helmet / cors
2. rateLimit
3. authenticate (JWT)
4. authorize (roles)
5. modeCheck (X-URMS-Mode + allowed_modes)
6. route handler
```

---

## 6. 開発時バイパス

`NODE_ENV=development` かつ `AUTH_BYPASS=true` で mock JWT。本番では無効化必須。

---

## 変更履歴

| 日付 | 変更 |
|------|------|
| 2026-07-05 | v1.0 初版 |
