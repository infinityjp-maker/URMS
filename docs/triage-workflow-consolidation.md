# Triage Workflow Consolidation Report — 2026-03-04

**作業完了レポート — Triage Summary ワークフロー統合**

## 1. 作業の全体サマリ

- 目的：`triage-summary-report.yml` の stale registration を解消し、promoted 版を本番化して一本化する一連の作業を完了しました。
- 実施した主な手順:
  - 古い / stale な `triage-summary-report.yml` を一時的に削除して登録状態のクリアを待機。
  - 登録を強制するために promoted 版（作業中は `triage-summary-report-promoted.yml` 等を利用）をリポジトリへ追加・実行。
  - promoted 版の内容を基に `triage-summary-report.yml` を再生成（`main` にコミット）して再登録を確保。
  - 手動 dispatch を実行し、ワークフローが正常に実行されることを確認（run ID と結論は下記）。
  - `gh-pages` ブランチが更新されることを確認（旧ハッシュ → 新ハッシュ）。
  - 最終的に `triage-summary-report-promoted.yml` を削除し、`triage-summary-report.yml` を本番として一本化。
- 成果（主要イベント）:
  - Dispatch 実行成功（代表的な run ID）:
    - run 22654518016 — promoted（v2）実行 → 成功
    - run 22654706266 — promoted（promoted）実行 → 成功
    - run 22655102626 — 再生成した `triage-summary-report.yml` を dispatch → 成功（本番確定）
  - gh-pages 更新（観測された履歴ハッシュ）:
    - `9c2909b2...` → `9e835d70...` → `c6b0394...` → `8617c428...`（最終反映ハッシュ: `8617c428...`）

## 2. 技術的ポイント（要点）

- **`permissions: contents: write` の必要性**:
  - デフォルトではワークフローのトークン（`GITHUB_TOKEN`）からリポジトリの contents 書き込みが制限される場合があります。`gh-pages` ブランチへ Actions から push するために `permissions.contents: write` を workflow レベルで明示する必要があります。これが無いと push が 403/拒否されます。
- **`actions/checkout` の `persist-credentials: true` の理由**:
  - `actions/checkout` がデフォルトでトークンをワークスペースへ永続化しない設定だと、後続の `git push` は認証できません。`persist-credentials: true` を指定することで `GITHUB_TOKEN` を使った git 操作（push）を行えるようにします。
- **GitHub Actions の stale workflow registration の挙動**:
  - ワークフローファイルのパスや内容をリポジトリに push しても、GitHub の内部登録状態が不整合（古いメタデータ）になることがあります。この場合、API/CLI で `workflow_dispatch` を呼んでも HTTP 422（"does not have 'workflow_dispatch' trigger"）となることが観測されました。安全な回避策は別名でワークフローファイルを追加して再登録をトリガーするか、一時的に元ファイルを削除して再作成することです。
- **再登録が成功した根拠**:
  - `gh workflow list` によるワークフローリストで `.github/workflows/triage-summary-report.yml` が `active` として表示されている（workflow id 241272091 が確認済み）。
  - CLI/API 経由での `gh workflow run`（あるいは dispatch）で run が生成され、上記 run IDs（22654518016、22654706266、22655102626）が成功しているログがある点（実行済み → 成功）が実行成功の根拠です。
  - 最終的に `gh-pages` のリモートハッシュが更新されたこと（以下に示すハッシュ差分）でデプロイ成功を確認。

## 3. 現在の最終構成（現状）

- `triage-summary-report.yml`（本番）: 存在・登録済み・dispatch 可（canonical）。
- `triage-summary-report-legacy.yml`（履歴）: 存在（アーカイブ目的、編集不可推奨）。
- `triage-summary-report-promoted.yml`: 削除済（登録用に一時追加して利用、最終的に削除）。
- `gh-pages` の最新状態:
  - 直近の更新ハッシュ（観測）: `c6b0394...` → `8617c428...`（最終反映ハッシュ `8617c428...`）。
  - 履歴の一部: `9c2909b2...` → `9e835d70...` → `c6b0394...` → `8617c428...`（段階的に更新されたことを確認）

## 4. 今後の運用ガイド（短縮）

- `triage-summary-report.yml` を本番として運用してください。変更→`main` へ push でワークフローが走ります。
- `triage-summary-report-legacy.yml` は履歴用途のため触らないでください（破壊的変更を避けるため）。
- gh-pages の更新確認方法:

```bash
# リモート gh-pages の最新ハッシュを確認
git ls-remote origin refs/heads/gh-pages
```

- もしワークフローが dispatch できない（422 等）場合:
  - 一時的に別名（例 `triage-summary-report-promoted-temp.yml`）でワークフローを追加・commit して GitHub に再登録を促し、その後元ファイルを元に戻す手順が有効です（今回使用した運用）。
- Nightly schedule の扱い:
  - 現行 `triage-summary-report.yml` は cron（例: `0 4 * * *`）を持つため、追加のスケジュールが必要なら別途非破壊的に `schedule:` を追記してください（ただし既存スケジュールは残す方針を推奨）。

## 5. 付録（主要ログ & 参考）

- 代表的コミットログ（短縮）:
  - `ci: allow gh-pages push (contents: write) and persist-credentials for checkout`
  - `ci: add triage-summary-report-promoted to register dispatchable workflow`
  - `ci: remove stale triage-summary-report.yml to allow re-registration`
  - `ci: recreate triage-summary-report.yml from promoted workflow (re-register)`
  - `ci: finalize triage workflow consolidation (remove promoted copy)`
- 主要 Diff（短縮）:
  - 1) `permissions.contents: read` → `permissions.contents: write`
  - 2) `actions/checkout@v4` に `persist-credentials: true` を追加
  - 3) ワークフロー名/ファイルの一時複製 → 再生成 → 元ファイル復帰
- 実行した run（placeholder URL 例）:
  - run 22654518016 — https://github.com/infinityjp-maker/URMS/actions/runs/22654518016
  - run 22654706266 — https://github.com/infinityjp-maker/URMS/actions/runs/22654706266
  - run 22655102626 — https://github.com/infinityjp-maker/URMS/actions/runs/22655102626

---

作成日: 2026-03-04
