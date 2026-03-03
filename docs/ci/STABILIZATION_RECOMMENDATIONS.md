# CI 安定化の恒久対応案

目的: ホストランナー／セルフホストの両方で `run-health-smoke.yml` が安定して動作するよう、今回の最小変更を恒久化するときの実装案。

優先度の高い対応:

- ping-server の明示的 CORS および OPTIONS サポート（既適用）
  - 理由: ブラウザコンテキストから `fetch`/`sendBeacon` による到達確認を行うために必須。
  - 実装: 現在の `.github/workflows/ping-server.cjs` をそのまま恒久化し、必要なら `Access-Control-Allow-Origin` を限定ドメインに変更可能にする設定を追加。

- ワークフローのコンテナ化の扱い
  - 提案: `container:` を用いて Playwright イメージで実行する選択肢は維持するが、ドキュメント化して意図を明確にする。セルフホストでは `container:` を外すか、ラベルで分岐する。
  - 理由: Hosted runner のネットワーク名前空間制約に対処できる一方、Docker 未サポート環境へのフォールバックが必要。

- `CI_BROWSER_ARGS` の安全運用
  - 提案: ワークフロー inputs (`ci_browser_args`) を用いて運用者が実行時に Chromium 引数を指定できるようにしました（既存のデフォルトは引き続き使用可能）。
  - 理由: 将来の環境差を迅速に調整可能にするため。

- PowerShell (`pwsh`) 前提の処理
  - 提案: PowerShell スクリプトは `scripts/health-check.ps1` として残し、workflow では `pwsh` がない場合の代替（Node ベースの pre-smoke probes）を明示する。
  - 理由: Windows 環境では pwsh を使うが、コンテナイメージには入っていないことがある為。

-- /etc/hosts マッピングの扱い
  - 提案: `/etc/hosts` 直接編集は推奨手段としない。代替案として Playwright の `host-resolver-rules` を使ったブラウザ側の名前解決上書き（環境変数経由）を優先する。

- `ping-server` の CORS 設定を環境変数化
  - 変更: `CORS_ALLOW_ORIGIN` 環境変数で `ping-server` の `Access-Control-Allow-Origin` を指定できるようにしました（デフォルトは `*`）。
  - 理由: CI 環境ではワイルドカードが便利だが、運用環境では origin を限定した方が安全なため、設定可能にしておくと良い。

中〜低優先度の改善:

- ブラウザ側 CSP の緩和手順を検討
  - 一部の環境でアプリの CSP が外部接続を拒むため、CI 用に診断ページの CSP を緩和するオプションを用意する。

- artifacts と診断の改善
  - `builds/diagnostics/` に上がるファイルを整理し、`smoke-summary.txt` に失敗トリアージのキー（CORS, TCP, HTTP, page-errors）を明示する。

運用手順（短く）:

1. `run-health-smoke.yml` を `container: mcr.microsoft.com/playwright:focal` で実行するデフォルトを維持。
2. セルフホストが提供されたら、workflow_dispatch の `runner` 入力にセルフホストラベルを指定して実行検証。
3. 失敗時は `builds/diagnostics/browser-resolve.json` と `smoke-result.full.json` をまず確認して、ブラウザ到達可否（CORS / ERR_CONNECTION_REFUSED）を判定。
