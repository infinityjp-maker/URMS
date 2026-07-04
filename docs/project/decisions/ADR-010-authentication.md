# ADR-010: 認証・認可

> **resource_type:** decision  
> **resource_id:** decision:ADR-010  
> **status:** accepted  
> **date:** 2026-07-05  
> **author:** Architect

## コンテキスト

本番 API は認証必須（NFR-030）。Mode ベース認可（NFR-031）。R-008 対策。

## 決定

1. 本番: **OIDC** + JWT（IdP は Phase 3 前に選定）
2. 開発: mock JWT + `AUTH_BYPASS` オプション
3. 認可: **Mode** + **RBAC** 二層
4. ロール: viewer, operator, planner, admin
5. JWT claim: `roles`, `allowed_modes`

## 理由

- 業界標準 OIDC
- Mode System（ADR-003）と自然統合
- 単一組織想定で MVP 4 ロール固定

## 影響

- [10-auth-authorization.md](../../architecture/10-auth-authorization.md)
- Phase 3 開始前: IdP 具体選定（backlog B-010）

## 関連

- [ADR-003](./ADR-003-mode-system.md)
