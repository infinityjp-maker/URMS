# Phase 4 Readiness — PM 提案

> **resource_type:** knowledge  
> **resource_id:** knowledge:phase4-readiness  
> **version:** 1.1  
> **phase:** 4 preparation  
> **status:** **User Go/No-Go 待ち**（IdP 判断は完了）  
> **owner:** PM

## 参照

- [roadmap.md](../project/roadmap.md)
- [ADR-022-local-authentication.md](../project/decisions/ADR-022-local-authentication.md)
- **User 向け Canvas:** `canvases/urms-progress-plan.canvas.tsx` → 「これから」

---

## User 決定（記録）

| 日付 | 判断 | 内容 |
|------|------|------|
| 2026-07-05 | **IdP 不要** | URMS はローカルアプリ。クラウド IdP（Azure AD 等）は使わない → ADR-022 |

---

## 1. Phase 3 完了の確認

| 項目 | 状態 | 根拠 |
|------|------|------|
| Sprint S1〜S10 | ✅ 完了 | Git tag `v0.2.0-mvp` |
| E2E · Coverage CI | ✅ | S9 · `9e8d940` |
| Docker Compose · CI build | ✅ | S10 · `0d3e18d` |
| 暫定 Web UI（開発確認） | ✅ | `:5173` 起動可能 |

**結論:** Phase 3 MVP の受入条件は満たしている。Phase 4 開始を PM から提案する。

---

## 2. Phase 4 の目的（更新）

**品質 · 運用の本番準備** — ローカルアプリとしての URMS を hardening する。

| Sprint | 名称 | 主成果 | Version |
|--------|------|--------|---------|
| S11 | **ローカル認証** | OS / ローカルユーザー方式 · mock からの移行設計 | v0.3.0-alpha |
| S12 | 監視 · ログ集約 | 構造化ログ · ローカル運用向け | v0.3.0-beta |
| S13 | 性能 · セキュリティ監査 | Rate limit · セキュリティレビュー | **v0.3.0** |

> クラウド IdP · OIDC 連携は **スコープ外**（ADR-022）。本番 UI はデスクトップ向け（Phase 5 以降で本格化）。

---

## 3. User にお願いしたい判断

| # | 判断 | 状態 |
|---|------|------|
| 1 | **Phase 4 開始 Go/No-Go** | ⏳ 未回答 |
| 2 | ~~IdP 選定~~ | ✅ **不要**（ローカルアプリ · 2026-07-05） |
| 3 | Docker Desktop 導入（任意） | 任意 |

---

## 4. User の日常作業（Phase 4 中も）

| 項目 | 内容 |
|------|------|
| 普段 | **作業なし** |
| 確認 | 必要時のみ暫定 Web UI（`:5173`） |
| 進捗 | Canvas `urms-progress-plan.canvas.tsx` |

---

## 5. Phase 4 開始条件

| # | 条件 | 状態 |
|---|------|------|
| 1 | Phase 3 MVP 完了 | ✅ |
| 2 | 認証方針（ローカル · IdP 不要） | ✅ User 2026-07-05 |
| 3 | **User Phase 4 Go 承認** | ⏳ |

---

## 6. 開発側の Phase 4 初動（Go 後）

1. S11 — ローカル認証方式の設計 · ADR-022 反映
2. S12 — 監視 · ログ（ローカル運用想定）
3. Canvas 進捗を Phase 4 Sprint 表示に更新

---

## 変更履歴

| 日付 | 変更 |
|------|------|
| 2026-07-05 | v1.0 — PM 提案初版 |
| 2026-07-05 | v1.1 — User: IdP 不要 · ADR-022 · S11 をローカル認証に変更 |
