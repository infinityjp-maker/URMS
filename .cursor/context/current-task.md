# 現在タスク

> **resource_type:** context  
> **resource_id:** context:current-task  
> **owner:** PM のみ更新

## Task

**Vision Track VT-2 + VT-4 — Context 合成 · 日次ループ**

SSOT（schedule · location · loop journal）と advance-task 接続済み。Context 脳が時間 · 予定 · 天気 · タスクから「今」を合成し、ループ完了が project_status と journal.md に残る段階。

## 進捗

| 項目 | 状態 |
|------|------|
| VT-1 SSOT 重力 | ✅ ~完了 |
| VT-2 Context 脳（合成 narrative） | 🔄 進行（地点 · 関係 · 予定 · **GPS 天気**） |
| VT-4 日次ループ | 🔄 進行（journal · narrative · 接続カード反映） |
| VT-3 知覚膜 | 🔄 着手（weatherCoords · loopNarrative 正直表示） |

## 直近の変更

- 地点 SSOT「現在地」+ 窓ブラウザ GPS → 天気座標（device override）
- perception meta — `weatherCoords`（device / ssot）· `loopNarrative`（接続カード）
- 接続カード — 座標 GPS/SSOT · ループ narrative 表示
- 環境構築 — `setup-env.ps1` · Docker/PostgreSQL · `load-root-env`（Prisma）
- `synthesizeSummaryNote` — 予定 · タスク · 天気から summary.note を合成
- VT-2 — relationType 内訳 · 予定 (あと Xm) · 地点ラベル
- VT-4 — loop journal → `→ 次:` narrative

## User

`pnpm ssot:sync` · API+DB 起動後、窓で「完了 → 次へ」→ ステータス行 · まとめが変わる · journal.md に 1 行追記 · 接続カードに GPS/SSOT · ループ narrative を確認。
