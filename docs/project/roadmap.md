# URMS ロードマップ

> **resource_type:** knowledge  
> **resource_id:** knowledge:roadmap  
> **version:** 1.5  
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
| 2.5 | Implementation Contract | **完了** | 実装契約、ADR-017 |
| 2.6 | Developer Playbook | **完了（PM 承認待ち）** | 運用ガイド（Contract 非複製） |
| 3 | コア実装 | **未着手** | React + Fastify + Prisma + PostgreSQL MVP |
| 4 | 品質・運用 | 未着手 | テスト、CI/CD、監視 |
| 5 | 本番・拡張 | 未着手 | デプロイ、AI チーム URMS Resource 化 |

## 現在

- **Phase 2.6 完了 — Developer Playbook 確定（PM 承認・Git コミット待ち）**
- **Phase 3:** PM 最終承認後のみ開始

## マイルストーン（予定）

| ID | 内容 | 目標 | 状態 |
|----|------|------|------|
| M3 | Phase 2 Architecture Freeze | Phase 2 | ✅ 完了 |
| M3.5 | Implementation Contract | Phase 2.5 | ✅ 完了 |
| M3.6 | Developer Playbook | Phase 2.6 | ✅ 完了（PM 承認待ち） |
| M4 | MVP 実装完了 | Phase 3 | 未着手 |

## 参照

- [implementation/](../implementation/)
- [architecture/](../architecture/)
- [backlog.md](./backlog.md)
