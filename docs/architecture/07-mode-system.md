# Mode System 詳細設計

> **resource_type:** knowledge  
> **resource_id:** knowledge:architecture-mode-system  
> **version:** 1.0  
> **phase:** 2

## 参照

- [ADR-003](../project/decisions/ADR-003-mode-system.md)
- [07-mode-system.md](./07-mode-system.md) — 本書

---

## 1. Mode 定義

| Mode | 値 | 目的 | MVP |
|------|-----|------|-----|
| Plan | `plan` | 計画・設計・Context 更新 | ✅ |
| Operate | `operate` | 日常 Resource 管理 | ✅ |
| Audit | `audit` | 読取専用・監査 | ✅ |
| Develop | `develop` | システム設定・AI Team 更新 | ❌ Phase 3+ |

---

## 2. 権限マトリクス（MVP）

| 操作 | plan | operate | audit |
|------|------|---------|-------|
| Resource 読取 | ✅ | ✅ | ✅ |
| Resource 作成/更新/削除 | ❌ | ✅ | ❌ |
| Context 更新 | ✅ | ❌ | ❌ |
| 監査ログ参照 | ❌ | ❌ | ✅ |
| Knowledge 参照 | ✅ | ✅ | ✅ |
| Mode 切替 | ✅ | ✅ | ✅ |

---

## 3. 実装レイヤー

### 3.1 API Middleware

```
Request → Auth (JWT) → Mode Header Validation → ModePolicy.check(route, method)
  → 403 if denied → Handler
```

`X-URMS-Mode` ヘッダ必須（`/health` 除く）。未指定時は `operate` デフォルト（開発時のみ、本番は 400）。

### 3.2 Domain Policy

```typescript
interface ModePolicy {
  canReadResource(mode: Mode): boolean;
  canWriteResource(mode: Mode): boolean;
  canUpdateContext(mode: Mode): boolean;
  canViewAudit(mode: Mode): boolean;
}
```

### 3.3 Web UI

- グローバル Mode Switcher（ヘッダ）
- Mode 変更時: API ヘッダ更新 + UI 要素 show/hide
- audit Mode: 編集ボタン非表示

---

## 4. JWT Claim（将来）

```json
{
  "sub": "user-id",
  "roles": ["operator", "pm"],
  "allowed_modes": ["plan", "operate", "audit"]
}
```

Mode 切替は allowed_modes 内のみ許可。

---

## 5. 拡張: develop Mode

Phase 3+ で追加。AI Team Resource 更新、Plugin 登録、システム設定。別 ADR で権限定義。

---

## 変更履歴

| 日付 | 変更 |
|------|------|
| 2026-07-05 | v1.0 初版 |
