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
| 本番（ローカルアプリ） | **ローカル認証**（OS / ローカルユーザー — ADR-022） |
| クラウド IdP（OIDC） | **スコープ外** — User 2026-07-05 決定 |

---

## 2. フロー（ローカル認証 · ADR-022）

```
User → 暫定 Web UI / 本番 UI → POST /v1/auth/login（username + password）
  → API が JWT を発行
  → Authorization: Bearer {access_token}
  → Mode middleware（X-URMS-Mode）
```

開発時は `URMS_AUTH_MODE=bypass` で mock ユーザーを継続利用可能。

## 2b. フロー（OIDC · スコープ外）

クラウド IdP 連携は User 2026-07-05 決定により **スコープ外**。将来クラウド展開時のみ再検討。

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
