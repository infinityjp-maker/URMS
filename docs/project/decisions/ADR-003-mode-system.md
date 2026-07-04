# ADR-003: Mode System

> **resource_type:** decision  
> **resource_id:** decision:ADR-003  
> **status:** accepted  
> **date:** 2026-07-05  
> **author:** Architect

## コンテキスト

URMS 利用者は計画・日常運用・監査など **文脈が異なる操作** を行う。単一 UI では誤操作・権限過剰のリスクがある。[VISION](../VISION.md) は監査可能性を要求する。

## 決定

MVP では以下 **3 Mode** を採用する。

| Mode | 目的 | 主な操作 |
|------|------|----------|
| **plan** | 計画・設計 | 読取 + 草案 Resource、Context 編集（PM 相当） |
| **operate** | 日常運用 | Resource CRUD、検索 |
| **audit** | 監査 | 読取専用、監査ログ参照 |

**develop Mode**（システム設定・AI Team 更新）は MVP 外 → Phase 2 以降。

Mode 切替時:
- UI 表示要素が変わる
- API 権限が変わる（将来 RBAC と組合せ）
- Context Engine が現在 Mode を表示

## 理由

- 最小複雑性（VISION 設計思想）
- 監査 Mode で read-only を強制可能
- plan Mode で PM / 計画フェーズを表現

## 影響

- [use-cases.md](../../requirements/use-cases.md) UC-005
- Phase 2 API に `X-URMS-Mode` ヘッダまたは JWT claim

## 関連

- [ADR-002](./ADR-002-resource-model.md)
- [ADR-004](./ADR-004-context-engine.md)
