Triage Summary Operations
=========================

目的
----
このドキュメントは、`triage-summary` 関連の改善・保守作業を安全に進めるための手順とルールを示します。既存の出力を破壊せず上位互換を実装することを最優先とします。

ブランチ / コミット規約
---------------------
- ブランチ名: `ci/triage-summary-improve-<short-task>`（例: `ci/triage-summary-improve-phase8`）
- コミットメッセージ: `ci: triage summary → <short description> (phaseX)`

変更フロー（推奨）
-----------------
1. ローカルでブランチを作成する。
2. 変更を最小限にし、非破壊で実装する（既存出力は必ず残す）。
3. `npm ci` を実行して依存を準備する。
4. `TRIAGE_INPUT` 環境変数や `.github/testdata/triage.json` を用いて `generate-triage-summary.cjs` を実行し、生成物を確認する。
   - 例: `RUNNER_TEMP=/tmp node .github/workflows/generate-triage-summary.cjs DEST=/tmp/triage-summary.md`
5. `node .github/triage-tools/validate-triage-output.cjs` を実行して必須ファイルと gzip 整合性を確認する。
6. 変更をコミットし、リモートにプッシュ、PR を作成する。
7. PR の検証: `.github/workflows/validate-triage-on-pr.yml` が triage 出力を検証します。

CI での確認ポイント
-------------------
- `triage-summary.md` に `## Overview` と `### Summary` が含まれること
- `triage-summary.html` に severity バッジ（例: `critical` / 色コード）が存在すること
- `.gz` ファイルが存在し、展開可能であること
- 長い `internalErrors` は `triage-internal-errors.txt` に切り出されること（あれば）

Exit code 仕様
-------------
- `validate-triage-output.cjs` は正常時に `0` を返します。
- 欠損ファイルや gzip 整合性エラーを検出した場合は非ゼロを返します（現実装ではエラー時に `process.exit(2)` を呼びます）。
- ワークフローでこの検証が非ゼロを返すと、そのステップは失敗となりジョブが停止します（意図した動作です）。

相互関係図（概要）
-----------------
- `run-health-smoke.yml`: 実稼働ジョブ。`generate-triage-summary.cjs` 実行直後に `validate-triage-output.cjs` を呼び、生成物を検証します。失敗時はジョブを fail させます。
- `triage-summary-selftest.yml`: 自己テスト。生成物の検証を行い、自己テスト結果の整合性を保証します。
- `triage-summary-report.yml`: レポート生成前に検証を行い、信頼できる情報のみを集約します。
- `validate-triage-on-pr.yml`: PR の差分に対してテスト用入力で検証を実行し、変更が triage 出力を壊していないかを早期に検出します。

機能追加前に必ず実行するローカル検証手順
---------------------------------
1. `npm ci` を実行して依存関係を用意する。
2. テストデータを用いて generator を実行:

```bash
RUNNER_TEMP=/tmp node .github/workflows/generate-triage-summary.cjs DEST=/tmp/triage-summary.md TRIAGE_INPUT=.github/testdata/triage.json
```

3. バリデータを実行して生成物を検証:

```bash
node .github/triage-tools/validate-triage-output.cjs /tmp
```

4. `npm run test:triage-tools` を実行して triage-tools のユニットテストを確認する（ローカルでのテストカバレッジ向上）

5. 変更をコミットして PR を作成する。PR 作成後、`.github/workflows/validate-triage-on-pr.yml` による自動検証が実行されます。

運用のヒント
-----------
- 変更が多い場合は小さなコミットに分ける。
- テストデータは `.github/testdata/triage.json` を更新して検証ケースを追加できる。
- 自動通知を有効にする前にレポートワークフロー（`triage-summary-report.yml`）から手動でレポートを取得して確認する。

検証コマンド（例）
-----------------
Bash の例:

```bash
RUNNER_TEMP=/tmp node .github/workflows/generate-triage-summary.cjs DEST=/tmp/triage-summary.md
node .github/triage-tools/validate-triage-output.cjs /tmp
```

PowerShell の例:

```powershell
$env:RUNNER_TEMP = 'C:\Temp'
node .github\workflows\generate-triage-summary.cjs DEST="$env:RUNNER_TEMP\triage-summary.md"
node .github\triage-tools\validate-triage-output.cjs $env:RUNNER_TEMP
```
