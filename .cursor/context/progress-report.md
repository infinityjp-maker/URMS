# PM 進捗報告（SSOT）

> **resource_type:** context  
> **resource_id:** context:progress-report  
> **owner:** PM のみ更新 · **適宜見直し**（User 指摘 · 月次 · 報告が冗長/不足と PM が判断したとき）

関連: [model-policy.md](./model-policy.md) · [usage-log.md](./usage-log.md) · Canvas **`urms-hub.canvas.tsx`**（User 入口）· `urms-progress-plan.canvas.tsx`（進捗詳細）

## User 向け入口（2026-07-08）

**開発中の情報中心 = Canvas `urms-hub.canvas.tsx`**

| 種類 | 入口 |
|------|------|
| すべて | **urms-hub** — 進捗 · ドキュメント · 画面（**Cursor 内 · 外部ブラウザなし**） |
| 製品 UI プレビュー | **urms-app-preview** — 全画面を Cursor 内表示 |
| 進捗詳細 | urms-progress-plan |
| 製品設計 | urms-product-design |

PM チャット報告の末尾に **Hub Canvas リンク** を添える（User が自己確認できるように）。

## いつ報告する

| タイミング | 必須度 |
|------------|--------|
| セッション終了 · **Go** 後 | **必須** |
| User「続けて」で実装完了時 | **必須** |
| ブロッカー（dev:verify NG · 枠停止） | **即時** |
| 設計-only · 質問-only | 1 行サマリ + Cursor 枠のみ可 |

## 報告の原則

1. **誇張禁止** — 「すべて完了」「S11 完了」等 · 実態のみ（00_共通ルール）
2. **dev:verify** — 出力を **そのまま** 貼る（要約しない）。User 向け見出しは **「動作確認の結果」**
3. **未確認は未確認** — usage · 窓目視 · 数値の推測禁止
4. **User は判断のみ** — 起動 · 実装 · dev:verify は PM/AI。User に「実行して」と書かない
5. **SSOT 更新とセット** — チャット報告だけで終わらない
6. **User 向けは専門用語禁止（2026-07-08）** — 判断依頼・進捗報告・Go 提示では [glossary 言い換え表](../../docs/project/glossary.md#pm--user-言い換え表) に従う。内部（Context · コミット · AI 間）は従来どおり可

### User 向け文体（必須）

- **GA** → 「正式版として区切った」
- **tag** → 「版番号 vX.Y.Z を付けた」
- **Go-1 / Go-2** → 「実装してよいですか？」「正式版にしてよいですか？」
- **Reviewer / Tester** → 「別担当のコード確認」「自動テスト」
- **Package** → 「作業の塊（B-023 など）」
- **Backlog / Sprint** → 「やることリスト」「開発の区切り」
- 英略語だけの文は書かない（例: ❌「S17 Go-2 待ちで tag 案 v1.4.0」→ ✅「作業 B-023 が終わったら、正式版 v1.4.0 にしてよいか確認します」）
- **機能名は「何が起きるか」で説明**（例: ❌「Cursor export v1.4」→ ✅「URMS の内容を Cursor 用メモに書き戻す · 食い違いは報告」）

用語の平易説明: [glossary.md § 平易語辞典](../../docs/project/glossary.md#平易語辞典userpm-報告向け)

## 必須セクション（この順 · PM チャット報告）

### 1. 一行サマリ

> 例: VT-4 statusLine 合成を domain に追加 · テスト 132 passed · コミット d581713

### 2. Vision Track（各 1 行 · 変化した Track のみ）

| Track | 状態 | 今回 |
|-------|------|------|
| VT-x | 🔄/✅ | 具体 1 行 |

### 3. 改修実績（完了 · 具体的に）

> **User が「何が変わったか」を 30 秒で把握できる表現。** 抽象語（改善 · 対応）だけにしない。

| # | 領域 | 改修内容（Before → After / 追加） | コミット |
|---|------|-----------------------------------|----------|
| 1 | 例: 天気カード | **Before:** 地点名なし → **After:** GPS 座標から地名（例: 東京都渋谷区）を表示 · 未取得は `—` | `c4f9c04` |

- 各項目は **画面・API・ファイル** のいずれかを明示
- ユーザー向け効果を 1 行添える（例: 「窓の天気カードに地名が出る」）
- 3〜10 件 · 古い完了分は週次でアーカイブ可

### 4. 改修予定（未着手 · 具体的に）

> **次に何をするか** を 1 テーマずつ · 完了条件付き。

| 優先 | 領域 | 予定内容 | 完了条件 |
|------|------|----------|----------|
| P0 | 例: VT-4 | 窓手動確認 — advance → journal 追記 · perception 変化 | User 目視 OK 1 回 |
| P1 | 例: ADR-024 M2 | `readRecent()` を Resource 優先に切替 | テスト + file フォールバック |

- **P0** = 次セッション最優先 · **P1** = その次 · **P2** = バックログ
- ADR フェーズ · DoD 残タスクをそのまま書く（推測で増やさない）

### 5. 実施内容（3〜7 箇条書き · why 寄り）

- ユーザー向け: **何ができるようになったか**
- 技術詳細は §3 改修実績 · diff / コミット に委ねる

### 6. 検証（dev:verify 全文）

```
[OK] ... （pnpm dev:verify の stdout をそのまま）
```

未実施なら `dev:verify: 未実施（理由）` と明記。

### 7. Cursor 枠

```
- 使用率: XX% | 未確認
- 当日増分: +X%
- 運用モード: 通常 | 削減 L1 | 削減 L2 | 停止
- 本セッション模型: …（PM 選定理由 1 行）
- 次セッション: 通常 / 削減 / 停止
```

→ 同内容を `usage-log.md` に 1 行追記。

### 8. 窓 · リンク（User 向け）

| 優先 | URL | 確認ポイント |
|------|-----|--------------|
| 1 | http://127.0.0.1:1420/ | 本番窓 · 接続カード |
| 2 | http://127.0.0.1:1420/#/screens | 画面一覧 v0.2 |

未起動なら `scripts\launch\start-dev-servers.bat` を記載。

### 9. Git（該当時）

- コミット: `hash` — 1 行メッセージ
- 未コミット: ファイル数 · Go 待ち

### 10. 次セッション（1 テーマのみ）

> 例: VT-4 日次ループ API 統合テスト 1 本

---

## 報告と同時に更新する SSOT

| 対象 | 条件 |
|------|------|
| `usage-log.md` | **毎回** |
| Canvas `SNAPSHOT` · `LAST_VERIFY` · `LAST_CURSOR` | 実装作業完了時 |
| Canvas `CHANGE_LOG` | ユーザー向けに意味ある変更時 |
| `current-task.md` 直近の変更 | 大きな機能/方針変更時 |
| `project-status.md` | ゲート · 方針 · インフラ変化時 |
| `model-policy.md` | 閾値 · 模型方針変更時 |

Canvas は Git 外 — チャットと Canvas の **数値・日時を一致** させる。

---

## Canvas 用定数（PM が手動同期）

```typescript
const LAST_VERIFY = { at, desktop1420, api3000, db };
const LAST_CURSOR = { at, usagePct, dailyDelta, mode, model, nextSession };
```

---

## 見直しサイクル（適宜改善）

| 頻度 | PM アクション |
|------|---------------|
| **毎報告** | 上記 10 セクションを自己チェック · 欠けていれば次報告で修正 |
| **週次** | 冗長セクション削減 · User が読んでいない欄がないか |
| **月次** | テンプレ全体 · model-policy 閾値 · Canvas レイアウト |
| **User 指摘時** | **即日** 本ファイル改定 + 次報告から反映 |

### 改善トリガー（見直し必須）

- User「長い」「足りない」「枠がわからない」
- 同一情報が 3 箇所以上に重複
- dev:verify と実態のズレが 2 回連続
- 進捗報告に 3 日連続で Cursor 枠が「未確認」

---

## 改善履歴

| 日付 | 変更 |
|------|------|
| 2026-07-07 | 初版 — 8 セクション · SSOT 連携 · 見直しサイクル |
| 2026-07-07 | Cursor 枠 · 運用モード · usage-log 連携 |
| 2026-07-07 | 閾値内最適/超過削減 · PM 単独模型選定 |
| 2026-07-08 | **PM 承認 S17** — B-023/B-024 · v1.3.0 GA クローズ確認 |
| 2026-07-08 | **Multi-Agent Batch Gate** — User 指示 · 複数 Agent 必須 · Package 単位レビュー |
| 2026-07-08 | **User 向け平易語** — glossary 拡充 · PM 報告で専門用語禁止 |
| 2026-07-08 | **v1.4.0 正式版** — B-023 書き戻し v1.4 · User Go-2 |

## Multi-Agent Batch Gate（運用正本 · 2026-07-08）

> User 指示: 同一 Agent の自己レビュー禁止 · レビューは塊で · PM 経由で User Go を 2 回取る。

### Package 定義

| 項目 | ルール |
|------|--------|
| 単位 | **Backlog 1 件**（例: B-023）または Sprint サブフェーズ |
| サイズ目安 | diff **400 行以下**（超過時は Package 分割） |
| 中間コミット | Developer のみ · Reviewer / 独立 Tester **不要** |

### 必須 Agent 分離

| 順 | Agent | 起動 | 兼務禁止 |
|----|-------|------|----------|
| 1 | **Architect** | Task explore / readonly | Developer |
| 2 | **Developer** | 実装 Agent（User 実装 Go 後） | Reviewer · Tester 最終判定 |
| 3 | **Tester** | Task shell — `pnpm test` 等 | Developer · Reviewer |
| 4 | **Reviewer** | Task bugbot · readonly · branch diff | Developer |

PM は **起票・要約・User Go 取得のみ**。Reviewer / Tester の役割を自分で兼務しない。

### User Go（2 回）— User 向けの言い方

| # | タイミング | PM が User に聞く言い方 | User 返答例 |
|---|------------|-------------------------|-------------|
| **Go-1** | 設計確認後 · コード着手前 | 「この内容で **実装を始めてよいですか？**」 | 「Go」「実装して」 |
| **Go-2** | 自動テスト OK + 別担当レビュー OK 後 | 「**正式版 vX.Y.Z として区切ってよいですか？**」 | 「Go」「正式版にして」 |

内部記録では Go-1 / Go-2 / tag / GA を使用可。**User チャットでは上表の言い方のみ。**

**Go-1 なしに実装開始禁止。** **Go-2 なしに版番号ラベル（tag）・正式リリース（GA）禁止。**

### コスト（User 仮説への PM 回答）

| 方式 | Agent 起動 | 概算コスト | リスク |
|------|------------|------------|--------|
| コミット毎 Reviewer | 多 | **高** | 低 |
| **Package 毎（採用）** | 少 | **中〜低** | 中（Package を小さく保てば許容） |
| Sprint 末のみ | 最少 | **最低** | **高**（手戻りで相殺しうる） |

**結論:** User の方針（塊レビュー + User Go 2 回）は **コスト削減と独立性の両立** に有効。Sprint 末一括のみは URMS 品質目標と合わないため **不採用**。

### Package 完了時 PM 報告テンプレ（Go-2 用）

1. 一行サマリ
2. 改修実績（Before → After）
3. Tester Agent — コマンド · passed/failed
4. Reviewer Agent — 承認/差戻し · 重大指摘有無
5. dev:verify 全文
6. Cursor 枠
7. **User Go-2 待ち**（正式版案: vX.Y.Z）

---

## User 向け用語（参照）

平易語・言い換え表: [docs/project/glossary.md](../../docs/project/glossary.md#pm--user-言い換え表)

---

## 最新 PM 承認（2026-07-08）

### 一行サマリ

v1.3.0 GA クローズを PM 承認 · 次 Sprint **S17（B-023 export v1.4）** 実装開始を承認。

### 承認内容

| ID | 内容 | 判定 |
|----|------|------|
| v1.3.0 GA | tag `v1.3.0` · export v1〜v3 · Desktop ErrorBoundary | ✅ クローズ承認 |
| **B-023** | Cursor export v1.4 — 競合検知 · 限定 merge · v1.4.0 目標 | ✅ **着手可** |
| **B-024** | WCAG 改善（5173） | **cancelled** — 5173 削除 |

### 検証（dev:verify · 承認時点）

```
[OK] API health http://localhost:3000/health
[OK] API readiness /health/ready (DB connected)
[OK] Desktop UI shell http://localhost:1420/ (本番UI dev)
```

5173 · 5180 は削除済（1420 のみ確認）。

---

## 参照

- `.cursor/rules/00_共通ルール.mdc` — 作業完了時確認
- [viewing-guide.md](../../docs/requirements/viewing-guide.md)
