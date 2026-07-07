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
| **ループ** | `.cursor/resources/loop/journal.md` | `pnpm loop:sync` · **`pnpm ssot:sync`** | **Resource 優先 + file マージ**（M2） |

loop journal は **M1–M3 実装済**（2026-07-08）。M4（Markdown export のみ）は PM 判断待ち。

**残負債（M4 以降）**

- 監査 · リレーション（Context · task · actor）の `relates_to` — 未決 #3
- 複数端末同期時の Markdown 正本 — M4 で PM 判断

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

| Phase | 内容 | ユーザー影響 | 状態 |
|-------|------|--------------|------|
| **M0** | Markdown append · file `readRecent()` | なし | 完了 |
| **M1 デュアルライト** | advance 時 **Markdown + Resource CREATE** | なし | ✅ 2026-07-07 |
| **M2 読取切替** | Resource 優先 + file マージ | なし | ✅ 2026-07-07 |
| **M3 同期 CLI** | `pnpm loop:sync` · `ssot:sync` + loop | 初回 migrate 1 回 | ✅ 2026-07-08 |
| **M4（任意）** | Markdown export のみ · 正本 DB | Git diff 運用変更 | 未着手 · PM 判断 |

**M0→M3 完了（Vision Track）。** M4 は PM 判断。

### 3. API · コマンド

| 操作 | 実装（2026-07-08） |
|------|---------------------|
| 追記 | `LoopJournalService.append` + `resourceService.create`（M1） |
| 読取 | `readRecent()` — Resource 優先 + file マージ（M2） |
| 一括同期 | `POST /v1/loop/sync` · `pnpm loop:sync`（M3） |
| ssot:sync | schedule + location + **loop** |

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
| `resource-catalog.md` | `loop-entry` Type 追加 | **✅ v1.3 2026-07-08** |
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
