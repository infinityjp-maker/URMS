# CI / Triage ワークフロー運用メモ

- ワークフロー: `.github/workflows/triage-summary-report.yml` — トリアージ集計とダッシュボード生成、gh-pages へ公開を行います。
- レガシー: `.github/workflows/triage-summary-report-legacy.yml` は履歴用のアーカイブです（編集不可）。
- 必要な権限: ワークフローが `gh-pages` に push するために `permissions: contents: write` と `actions/checkout` の `persist-credentials: true` が設定されています。
- 手動実行: GitHub 上の Actions タブまたは `gh workflow run triage-summary-report.yml --ref main` で `workflow_dispatch` を実行できます。
- 自己検証: 本リポジトリでは selftest 用ワークフローを別途用意することを推奨します（dry-run、gh-pages への push を行わない）。
- ダッシュボード出力: `dashboard/reports/latest.md`、`dashboard/diffs/*` が生成されます。UI が期待する場合は `dashboard/reports/index.json` の存在を確認してください。

## 運用手順（要約）

- 変更を `main` に push → ワークフローが定期実行または手動実行されます。
- 実行結果は Actions の該当ランで確認し、gh-pages の更新は `git ls-remote origin refs/heads/gh-pages` や公開ページで確認します。
- もしワークフローが dispatch できない場合は、登録状態が stale になっている可能性があります。安全な対応はワークフローを別名で一時追加して登録をトリガーする方法です（リスク低）。

---

作成日: 自動追記
