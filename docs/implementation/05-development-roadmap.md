# URMS Development Roadmap（Phase 3〜5）

> **resource_type:** knowledge  
> **resource_id:** knowledge:development-roadmap  
> **version:** 1.0  
> **phase:** 2.7  
> **owner:** PM

## 参照

- [roadmap.md](../project/roadmap.md) — プロジェクトフェーズ
- [04-sprint-planning.md](./04-sprint-planning.md) — Sprint 詳細
- [ADR-018](../project/decisions/ADR-018-versioning-policy.md)
- [ADR-019](../project/decisions/ADR-019-feature-flag-policy.md)

---

## 全体フロー

```
Phase 3（MVP）     Sprint 1〜10    → v0.2.0-mvp
Phase 4（品質・運用） Sprint 11〜13   → v0.3.0
Phase 5（本番・拡張） Sprint 14〜16   → v1.0.0
```

---

## Phase 3 — MVP 実装（Sprint 1〜10）

| Sprint | Milestone | Version | 成果 |
|--------|-----------|---------|------|
| S1 | M4-start | — | Monorepo |
| S2 | M4-domain | — | Domain core |
| S3 | M4-db | — | Prisma + DB |
| S4 | M4-api | — | REST API |
| S5 | M4-web | — | React UI |
| S6 | M4-context | — | Context Engine |
| S7 | M4-ai | — | AI Manager |
| S8 | M4-plugin | — | Plugins |
| S9 | M4-test | — | E2E + Coverage |
| S10 | **M5 MVP Release** | **v0.2.0-mvp** | Docker + CI |

### Sprint 依存グラフ

```
S1 → S2 → S3 → S4 ─┬→ S5
                    ├→ S6
                    └→ S7 → S8
S5,S6,S7,S8 → S9 → S10
```

---

## Phase 4 — 品質・運用（Sprint 11〜13）

| Sprint | 名称 | Milestone | Version |
|--------|------|-----------|---------|
| S11 | **ローカル認証** | M6 | v0.3.0-alpha |
| S12 | 監視・ログ集約 | M6 | v0.3.0-beta |
| S13 | 性能・セキュリティ監査 | M7 | **v0.3.0** |

**対象:** ローカル認証（ADR-022 · IdP 不使用）、Loki/監視、Rate limit 強化、WCAG 改善

---

## Phase 5 — 本番・拡張（Sprint 14〜16）

| Sprint | 名称 | Milestone | Version |
|--------|------|-----------|---------|
| S14 | Resource リレーション | M8 | v0.4.0 |
| S15 | AI Team Resource 化 | M9 | v0.5.0 |
| S16 | 外部連携基盤 | M10 | **v1.0.0** |

**対象:** develop Mode、URMS↔Cursor 同期、Integration Plugin

---

## Version マップ

| Version | Phase | 内容 |
|---------|-------|------|
| v0.1.0-ai-team | 0 | AI チーム基盤（tag 済） |
| v0.2.0-mvp | 3 | MVP リリース |
| v0.3.0 | 4 | 品質・運用 |
| v1.0.0 | 5 | 本番 GA |

詳細: ADR-018

---

## Feature Flag ロードマップ（ADR-019）

| Flag | Sprint 導入 | 本番デフォルト |
|------|-------------|----------------|
| `ff.ai.enabled` | S7 | off → staging on |
| `ff.plugin.dynamic` | S8 | off |
| `ff.audit.export` | S4 | on |
| `ff.search.fulltext` | Phase 4 | off |
| `ff.context.export` | S6 | on |
| `ff.experimental.*` | 随時 | off |

---

## 変更履歴

| 日付 | 変更 |
|------|------|
| 2026-07-05 | v1.0 初版（Phase 2.7） |
| 2026-07-05 | v1.1 — S11 をローカル認証に変更（ADR-022） |
