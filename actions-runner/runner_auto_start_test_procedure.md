Runner Auto Start — 疎通テスト手順

前提: `runner_auto_start.ps1` および `run_runner_auto_start.cmd` が `D:\GitHub\URMS\actions-runner` に配置され、ログ/ PID の書き込み権限があること。

1) ワークフローを手動で dispatch
- GitHub のリポジトリの `Actions` → `Runner Auto Start - Dispatch Test` → `Run workflow` を押す
- もしくは `gh` CLI を使う:
  gh workflow run runner_auto_start_test.yml --repo infinityflip-maker/URMS

2) PC 側での検証（dry-run の場合はログ観察のみ）
- スクリプトが稼働している場合: `runner_auto_start.ps1` は 5 秒毎に最新 dispatch を確認する。
- キューが検知されるとログに `Detected queued workflow run id=...` が追加されるはず。

3) run.cmd の起動確認
- キュー検知後、スクリプトは `run.cmd` を起動する。ログに `Starting run.cmd` が記録される。
- `Runner.Listener` プロセスが検出されたら `Runner.Listener detected; waiting for it to exit` が記録される。

4) ジョブ終了の検出
- ジョブが終了すると `Runner.Listener process exited; loop will resume polling` が記録され、再びポーリングに戻る。

5) ログの確認ポイント
- `Detected queued workflow run id=` → キュー検知
- `Starting run.cmd` → 起動試行
- `Runner.Listener detected` → Listener 出現
- `Runner.Listener process exited` → ジョブ完了
- 例外時は `Exception in main loop:` と詳細が記録される

注意: 実行は手動で `run_runner_auto_start.cmd` を起動してください（本作業では自動起動は行いません）。