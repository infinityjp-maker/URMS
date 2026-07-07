# ADR-024: 日次ループジャーナル — Resource 化（草案）

> **resource_type:** decision  
> **resource_id:** decision:ADR-024  
> **status:** draft — PM / Architect 承認待ち  
> **date:** 2026-07-07  
> **author:** Architect（PM 依頼 · Vision Track A4）

## コンテキスト

VT-4 日次ループは、窓の **「完了 → 次へ」** 操作を `POST /v1/context/advance-task` 経由で Context を更新し、同時に **loop journal** に 1 行追記する。追記先は現状 **Markdown ファイルのみ**:

```
.cursor/resources/loop/journal.md
```

`LoopJournalService` が append · `readRecent()` し、`GET /v1/perception` が journal から **昨日 / 今日** の連続 narrative（`statusLine` · summary · aiMemo · `meta.sources.loopContinuity` · `loopNarrative`）を合成している。

一方、VT-1 SSOT 重力では **schedule** · **location** がすでに次のパターンを採用している:

| SSOT | 正本 Markdown | 同期 | 実行時読取 |
|------|-----------------|------|------------|
| 予定 | `.cursor/resources/schedule/*.md` | `pnpm schedule:sync` | `schedule` Resource |
| 地点 | `.cursor/resources/location/*.md` | `pnpm location:sync` | `location` Resource |
| **ループ** | `.cursor/resources/loop/journal.md` | **なし** | **ファイル直読** |

loop journal だけが Resource 重力場の外にあり、以下の負債が残る:

- 監査 · 検索 · リレーション（Context · task · actor）が Resource API と非対称
- 複数端末 · 将来クラウド同期で file append のみでは競合リスク
- `ssot:sync` 一括の対象外 — 運用が二系統

## 決定（提案）

### 1. 新 Resource Type

| 項目 | 値 |
|------|-----|
| `resource_type` | `loop-entry` |
| `resource_id` | `loop:{ISO8601}` 例: `loop:2026-07-07T22:00:00+09:00` |
| `name` | 完了タスクの先頭 40 文字（表示用） |
| `status` | `active`（追記のみ · 論理削除は将来） |
| `metadata` | 下表 |

**metadata スキーマ（MVP）**

| キー | 型 | 必須 | 説明 |
|------|-----|------|------|
| `completed` | string | ✅ | 完了した `current_task` |
| `next` | string | — | 切替後の `current_task` |
| `actorId` | string | ✅ | advance 実行者 |
| `occurredAt` | string (ISO8601) | ✅ | ループ完了時刻 |
| `sourcePath` | string | — | 移行元行 · 監査用（`loop/journal.md`） |

### 2. 移行フェーズ（段階的 · 破壊的変更なし）

| Phase | 内容 | ユーザー影響 |
|-------|------|--------------|
| **M0（現状）** | Markdown append · file `readRecent()` | なし |
| **M1 デュアルライト** | advance 時に **Markdown + Resource CREATE** | なし（読取は file のまま） |
| **M2 読取切替** | `readRecent()` → ResourceRepository 優先 · file フォールバック | なし |
| **M3 同期 CLI** | `pnpm loop:sync` — 既存 `journal.md` 行を Resource に import | 初回 migrate 1 回 |
| **M4（任意）** | Markdown を export のみ · 正本は DB | Git diff 運用変更 · PM 判断 |

**M0→M1 は VT-4 DoD 完了後。** M3 までを Vision Track VT-1 拡張として扱う。

### 3. API · コマンド

| 操作 | 現状 | 将来 |
|------|------|------|
| 追記 | `LoopJournalService.append` | 同上 + `resourceService.create` |
| 読取 | `readRecent(limit)` file | `list({ resourceType: 'loop-entry', ... })` 時系列 |
| 一括同期 | — | `POST /v1/loop/sync` · `pnpm loop:sync` |
| ssot:sync | schedule + location | **+ loop（M3）** |

### 4. perception 合成への影響

- `LoopJournalEntry` 型は **domain 内部 DTO のまま維持**（UI / API 契約を安定化）
- 読取アダプタ `LoopJournalRepository` を導入し、file / Resource 実装を差し替え可能にする
- `meta.sources.loopJournalEntries` · `loopContinuity` · `loopNarrative` の意味は **変更しない**

### 5. 却下した候補

| 候補 | 理由 |
|------|------|
| journal.md のみ継続 | VT-1 重力 · 監査 · ssot:sync 非対称が残る |
| 1 ファイル = 1 Resource（journal 全体） | 行単位の時系列クエリ · narrative 合成に不向き |
| Context snapshot に埋め込み | SSOT 複製 · 履歴が消える · ADR-004 違反 |
| Event Bus のみ（Resource なし） | 検索 · リレーション · UC-001 系 CRUD と非整合 |

## 理由

- ADR-002「すべてを Resource として考える」と VT-1 SSOT 重力の自然な延長
- schedule / location と **同型の sync パターン**で10年保守時の学習コストを抑える
- デュアルライトにより **既存 journal.md 運用 · Git  diff · 手動確認**を M1–M2 で維持

## 影響

| 項目 | 変更 |
|------|------|
| `resource-catalog.md` | `loop-entry` Type 追加（承認後） |
| `packages/domain/loop-journal/` | Repository 抽象 · sync service（M1 以降） |
| `pnpm ssot:sync` | loop sync 追加（M3） |
| `.cursor/resources/loop/journal.md` | M0–M2 は正本のまま · M4 で export 化検討 |
| Playwright / API E2E | M1 以降 `loop-entry` 件数 assert 追加 |

## 未決（承認時に確定）

1. `resource_type` 名称 — `loop-entry` vs `loop_journal`（schedule/location の単数形に合わせ **loop-entry** 推奨）
2. M4 で Markdown 正本をやめるか — Git 可視性 vs SSOT 単一化
3. `loop-entry` → `context:current-task` への `relates_to` リレーションを S14 と同時に入れるか

## 関連

- [ADR-002](./ADR-002-resource-model.md)
- [ADR-004](./ADR-004-context-engine.md)
- [11-phase5-desktop-ui.md](../../implementation/11-phase5-desktop-ui.md) — VT-4 日次ループ
- `packages/domain/src/loop-journal/loop-journal-service.ts`
