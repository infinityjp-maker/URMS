# Phase 4 Readiness — PM 提案

> **resource_type:** knowledge  
> **resource_id:** knowledge:phase4-readiness  
> **version:** 1.0  
> **phase:** 4 preparation  
> **status:** **User Go/No-Go 待ち**  
> **owner:** PM

## 参照

- [roadmap.md](../project/roadmap.md)
- [05-development-roadmap.md](./05-development-roadmap.md)
- [backlog.md](../project/backlog.md)
- **User 向け Canvas:** `canvases/urms-progress-plan.canvas.tsx` → 「これから」

---

## 1. Phase 3 完了の確認

| 項目 | 状態 | 根拠 |
|------|------|------|
| Sprint S1〜S10 | ✅ 完了 | Git tag `v0.2.0-mvp` |
| E2E · Coverage CI | ✅ | S9 · `9e8d940` |
| Docker Compose · CI build | ✅ | S10 · `0d3e18d` |
| 暫定 Web UI（開発確認） | ✅ | `:5173` 起動可能 |
| PostgreSQL（User 環境） | ⏳ | Docker 未導入時は Resource 保存不可（想定内） |

**結論:** Phase 3 MVP の受入条件は満たしている。Phase 4 開始を PM から提案する。

---

## 2. Phase 4 の目的

**品質 · 運用の本番準備** — MVP で作った URMS 本体を、本番に近い認証 · 監視 · 監査で hardening する。

| Sprint | 名称 | 主成果 | Version |
|--------|------|--------|---------|
| S11 | IdP 本番認証 | OIDC 連携 · mock auth からの移行 | v0.3.0-alpha |
| S12 | 監視 · ログ集約 | 構造化ログの集約 · アラート基盤 | v0.3.0-beta |
| S13 | 性能 · セキュリティ監査 | Rate limit · WCAG · セキュリティレビュー | **v0.3.0** |

> 本番 UI（デスクトップ）は Phase 4 スコープ外。Phase 5 以降で本格化。

---

## 3. User にお願いしたい判断

| # | 判断 | 選択肢（例） | 期限目安 |
|---|------|-------------|----------|
| 1 | **Phase 4 開始 Go/No-Go** | Go / 延期 / スコープ縮小 | PM 提案後 |
| 2 | **IdP 選定（U-001 / B-010）** | Azure AD · Google Workspace · Keycloak 等 | S11 開始前 Must |
| 3 | **Docker Desktop 導入（任意）** | 導入する / 開発側デモのみで十分 | 任意 |

Go 判断後、IdP が未決の場合は S11 を IdP 選定ワークショップ + 設計に分割可能。

---

## 4. User の日常作業（Phase 4 中も）

| 項目 | 内容 |
|------|------|
| 普段 | **作業なし** — 開発側が実装 · サーバー維持 |
| 確認 | 必要時のみ暫定 Web UI（`:5173`）をクリック |
| 進捗 | Canvas `urms-progress-plan.canvas.tsx` |
| 仕様 | Canvas `urms-docs.canvas.tsx` |

---

## 5. Phase 4 開始条件

| # | 条件 | 状態 |
|---|------|------|
| 1 | Phase 3 MVP 完了（`v0.2.0-mvp`） | ✅ |
| 2 | Phase 3 受入要件（IR-S1〜S10） | ✅ |
| 3 | backlog / roadmap / Context 同期 | ✅ |
| 4 | **User Phase 4 Go 承認** | ⏳ |
| 5 | IdP 選定（S11 実装前） | ⏳ |

---

## 6. 開発側の Phase 4 初動（Go 後）

1. S11 詳細タスク分解 · ADR 更新（認証本番化）
2. IdP 選定結果を `10-auth-authorization.md` / Contract に反映
3. CI に Phase 4 quality gate 追加
4. Canvas 進捗を Phase 4 Sprint 表示に更新

---

## 7. 未決事項（Phase 3 からの継続）

| ID | 項目 | Phase 4 での扱い |
|----|------|------------------|
| U-001 | IdP 具体選定 | **S11 Must — User 判断** |
| U-003 | TanStack Query | S5 済み想定 · 必要なら S11 で整理 |
| U-004 | Secret Store | S7 部分対応 · S11 で本番化 |
| U-005 | ホスト選定 | S12〜S13 で具体化 |

---

## 変更履歴

| 日付 | 変更 |
|------|------|
| 2026-07-05 | v1.0 — Phase 3 完了後の PM 提案初版 |
