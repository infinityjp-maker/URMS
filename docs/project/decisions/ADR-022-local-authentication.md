# ADR-022: ローカル認証（クラウド IdP 不使用）

> **resource_type:** knowledge  
> **resource_id:** decision:adr-022  
> **status:** Accepted — User 2026-07-05  
> **supersedes-in-part:** ADR-010（本番 OIDC IdP 要件）

## コンテキスト

ADR-010 では本番認証を **OIDC + 外部 IdP** としていた。User は URMS を **ローカルアプリ**（デスクトップ向け本番 UI）として位置づけ、**クラウド IdP（Azure AD 等）は不要** と判断した。

## 決定

1. **クラウド IdP（OIDC）は URMS 本番スコープ外** — B-010 / U-001 はクローズ
2. **本番認証** はローカル実行環境向けとする（OS セッション · ローカルユーザー · アプリ内アカウント等 — Phase 4 S11 で具体化）
3. **暫定 Web UI（Phase 3）** は引き続き開発用 mock 認証でよい
4. 将来クラウド展開が必要になった場合のみ ADR を再開し IdP を検討する
5. **ログイン画面は不要** — User 2026-07-05。ローカルアプリ起動後すぐ操作可能（OS ユーザーとして扱う）。UI に username/password フォームを置かない

## 影響

| 項目 | 変更 |
|------|------|
| Phase 4 S11 | ローカル単一ユーザー方針（**ログイン UI なし**） |
| B-010 | 不要（User 決定でクローズ） |
| ADR-010 | ローカルアプリ範囲では本番 OIDC 条項を適用しない |

## 参照

- [10-auth-authorization.md](../../architecture/10-auth-authorization.md)
- [10-phase4-readiness.md](../../implementation/10-phase4-readiness.md)

## 変更履歴

| 日付 | 変更 |
|------|------|
| 2026-07-05 | 初版 — User 判断を記録 |
| 2026-07-05 | ログイン画面不要 — ローカルアプリは OS ユーザーで即操作 |
