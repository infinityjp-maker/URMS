Runner Auto Start — 実行前チェックリスト

1) PAT 権限要件
- 必須スコープ: `repo`（リポジトリの runner 登録/削除が必要な場合は `repo` 管理権限）、`workflow` 実行のトリガー確認に必要な権限。
- トークンは `runner_auto_start.ps1` 内の `<TOKEN_PLACEHOLDER>` に手動で置換すること。

2) GitHub API 要件
- `api.github.com` へ HTTPS (443) で到達可能であること。
- レート制限に注意（認証付きで 5 秒間隔のポーリングは通常問題ないが、大量のリクエストがある場合は間隔調整）。
- ワークフロー取得エンドポイント: `/repos/{owner}/{repo}/actions/runs?event=workflow_dispatch&per_page=1` を使用。

3) ネットワーク要件
- 発信可能な HTTP(S) 通信（プロキシ経由の場合は PowerShell の環境で認証設定が必要）。
- ファイアウォールで `api.github.com` がブロックされないこと。

4) ファイルパス整合性
- `D:\GitHub\URMS\actions-runner\run.cmd` が存在することを確認。
- `runner_auto_start.ps1` と `run_runner_auto_start.cmd` は同一フォルダ内に配置されていること（スクリプトは相対パスでログ/PIDを扱います）。

5) PID ファイル排他要件
- `runner_auto_start.pid` を作成できる権限があること。
- 既存 PID ファイルがある場合はプロセス存在チェックにより安全に早期終了または削除される。

6) ログファイルの権限
- `runner_auto_start.log` に追記できること。
- ログのローテーションは別途運用で検討（本スクリプトは追記のみ）。

7) 実行環境
- PowerShell 7+/pwsh 推奨。`pwsh` がない場合は `powershell` でも動作するが動作確認が必要。
- 実行は管理者権限は不要。ただしフォルダ権限は必要。

8) テスト前チェック
- `git status` でワークツリーの清潔さを確認（任意）。
- `<TOKEN_PLACEHOLDER>` は実運用前に必ず置換。