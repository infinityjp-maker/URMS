# 次タスク

> **resource_type:** context  
> **resource_id:** context:next-task  
> **owner:** PM のみ更新

## 実装順（User 了承済 — 2026-07-05）

| 順 | タスク | スコープ | 状態 |
|----|--------|----------|------|
| 1 | **v2b 簡易予定** | Resource / 簡易イベント → `nextEvents` | 次 |
| 2 | **S14** | Resource リレーション | v2b 後 |

## 将来（別途 Go）

- v2c 外部カレンダー
- k6 負荷テスト CI
- Secret Store 本番注入

## 参照

- [11-phase5-desktop-ui.md](../../docs/implementation/11-phase5-desktop-ui.md)
- Canvas: `urms-user-vision.canvas.tsx`
