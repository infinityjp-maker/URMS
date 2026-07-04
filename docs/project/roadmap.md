# URMS ロードマップ

> **resource_type:** knowledge  
> **resource_id:** knowledge:roadmap  
> **version:** 1.3  
> **owner:** PM（更新） / KM（整合）

## ビジョン（不変）

長期不変の理念・判断基準は **[VISION.md](./VISION.md)** を正本とする。  
本 roadmap は **更新可能な計画書** である。

## フェーズ概要

| Phase | 名称 | 状態 | 概要 |
|-------|------|------|------|
| 0 | AI チーム基盤 | **完了** | Cursor Rules / Commands / Skills / Knowledge 構築 |
| 0.5 | 開発基盤整備 | **完了** | Git / Editor / Workspace / cursorignore |
| 0.6 | プロジェクト固定 | **完了** | VISION.md 策定 |
| 1 | 要件定義 | **完了** | 要求仕様、ユースケース、Resource、MVP、ADR-002〜005 |
| 2 | アーキテクチャ設計 | **完了 — Architecture Freeze** | 全体設計、API/DB、ADR-006〜016 |
| 3 | コア実装 | **未着手（PM 最終承認待ち）** | React + Fastify + Prisma + PostgreSQL MVP |
| 4 | 品質・運用 | 未着手 | テスト、CI/CD、監視 |
| 5 | 本番・拡張 | 未着手 | デプロイ、AI チーム URMS Resource 化 |

## 現在

- **Phase 2 完了 — Architecture Freeze 確定（2026-07-05）**
- **Phase 3 開始条件:** PM 最終承認後のみ（ソースコード生成禁止中）

## マイルストーン（予定）

| ID | 内容 | 目標 | 状態 |
|----|------|------|------|
| M0 | AI チーム v1.0 完成 | Phase 0 | ✅ 完了 |
| M0.5 | 開発基盤整備 | Phase 0.5 | ✅ 完了 |
| M1 | 初回 Git コミット | Phase 0.6 後 | ✅ 完了（v0.1.0-ai-team） |
| M2 | Phase 1 要求定義完了 | Phase 1 | ✅ 完了 |
| M3 | Phase 2 Architecture Freeze | Phase 2 | ✅ 完了（2026-07-05） |
| M4 | MVP 実装完了 | Phase 3 | 未着手 |
| M5 | MVP リリース | Phase 3 | 未着手 |

## 参照

- [VISION.md](./VISION.md)
- [backlog.md](./backlog.md)
- [architecture/](../architecture/)
- [decisions/](./decisions/)
- [architecture-history.md](./architecture-history.md)
