# PM 進捗報告（SSOT）

> **resource_type:** context  
> **resource_id:** context:progress-report  
> **owner:** PM のみ更新 · **適宜見直し**（User 指摘 · 月次 · 報告が冗長/不足と PM が判断したとき）

関連: [model-policy.md](./model-policy.md) · [usage-log.md](./usage-log.md) · Canvas `urms-progress-plan.canvas.tsx`

## いつ報告する

| タイミング | 必須度 |
|------------|--------|
| セッション終了 · **Go** 後 | **必須** |
| User「続けて」で実装完了時 | **必須** |
| ブロッカー（dev:verify NG · 枠停止） | **即時** |
| 設計-only · 質問-only | 1 行サマリ + Cursor 枠のみ可 |

## 報告の原則

1. **誇張禁止** — 「すべて完了」「S11 完了」等 · 実態のみ（00_共通ルール）
2. **dev:verify** — 出力を **そのまま** 貼る（要約しない）
3. **未確認は未確認** — usage · 窓目視 · 数値の推測禁止
4. **1 画面** — User が 30 秒で把握できる長さ
5. **SSOT 更新とセット** — チャット報告だけで終わらない

## 必須セクション（この順 · PM チャット報告）

### 1. 一行サマリ

> 例: VT-4 statusLine 合成を domain に追加 · テスト 132 passed · コミット d581713

### 2. Vision Track（各 1 行 · 変化した Track のみ）

| Track | 状態 | 今回 |
|-------|------|------|
| VT-x | 🔄/✅ | 具体 1 行 |

### 3. 実施内容（3〜7 箇条書き · why 寄り）

- ユーザー向け: **何ができるようになったか**
- 技術詳細は diff / コミット に委ねる

### 4. 検証（dev:verify 全文）

```
[OK] ... （pnpm dev:verify の stdout をそのまま）
```

未実施なら `dev:verify: 未実施（理由）` と明記。

### 5. Cursor 枠

```
- 使用率: XX% | 未確認
- 当日増分: +X%
- 運用モード: 通常 | 削減 L1 | 削減 L2 | 停止
- 本セッション模型: …（PM 選定理由 1 行）
- 次セッション: 通常 / 削減 / 停止
```

→ 同内容を `usage-log.md` に 1 行追記。

### 6. 窓 · リンク（User 向け）

| 優先 | URL | 確認ポイント |
|------|-----|--------------|
| 1 | http://127.0.0.1:1420/ | 本番窓 · 接続カード |
| 2 | http://127.0.0.1:5180/ | ワイヤー（DB 不要） |

未起動なら `scripts\launch\start-dev-servers.bat` を記載。

### 7. Git（該当時）

- コミット: `hash` — 1 行メッセージ
- 未コミット: ファイル数 · Go 待ち

### 8. 次セッション（1 テーマのみ）

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
const LAST_VERIFY = { at, desktop1420, wireframes5180, web5173, api3000, db };
const LAST_CURSOR = { at, usagePct, dailyDelta, mode, model, nextSession };
```

---

## 見直しサイクル（適宜改善）

| 頻度 | PM アクション |
|------|---------------|
| **毎報告** | 上記 8 セクションを自己チェック · 欠けていれば次報告で修正 |
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
| 2026-07-07 | **コミットタイミング PM 任せ** — Go 待ち不要 · 論理単位で commit |

---

## 参照

- `.cursor/rules/00_共通ルール.mdc` — 作業完了時確認
- [viewing-guide.md](../../docs/requirements/viewing-guide.md)
