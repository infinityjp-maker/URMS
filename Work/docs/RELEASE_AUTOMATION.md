# Release Automation

この文書では、GitHub Actions を用いたリリース自動化（リリースノートの下書き、タグ push → ビルド → 署名 → リリース作成 → アセット公開）の手順をまとめます。

## 構成済みファイル
- `.github/release-drafter.yml` — PR マージに基づいてドラフト（下書き）リリースノートを自動作成します。
- `.github/workflows/release.yml` — `v*` タグ push をトリガにビルド／署名／リリース作成を実行します。

## 必要な GitHub Secrets
- `SIGN_CERT_PFX` — コード署名用の PFX ファイルを Base64 エンコードした文字列。リポジトリの Secrets に登録してください。
- `SIGN_CERT_PASSWORD` — PFX のパスワード。
- `TIMESTAMP_URL`（任意）— タイムスタンプサーバーの URL（例: http://timestamp.digicert.com）。

> セキュリティ注意: PFX は強く保護してください。Organization シークレットを使い、必要最小限の権限で管理してください。

## PFX の作り方（例）
1. 証明書プロバイダから .pfx を取得または Windows で PFX をエクスポート。
2. Base64 に変換（ローカル）:

```powershell
$bytes = [System.IO.File]::ReadAllBytes('cert.pfx')
[System.Convert]::ToBase64String($bytes) | Out-File -Encoding ascii cert.b64.txt
```

3. `cert.b64.txt` の中身を `SIGN_CERT_PFX` シークレットにコピー。

## 便利なスクリプト
リポジトリに以下のスクリプトを追加しました:

- `scripts/encode-pfx.ps1` — PFX を Base64 に変換しファイルへ出力、オプションでクリップボードへコピーします。
- `scripts/set-github-secret.ps1` — `gh` CLI を使って指定リポジトリのシークレットを設定します（事前に `gh auth login` が必要）。

例:

```powershell
# Base64 に変換してファイルへ
.\scripts\encode-pfx.ps1 -PfxPath .\cert.pfx -OutFile cert.b64.txt -CopyToClipboard

# gh CLI でシークレットに登録
.\scripts\set-github-secret.ps1 -RepoOwner myorg -RepoName URMS -SecretName SIGN_CERT_PFX -SecretFile cert.b64.txt

# 同様にパスワードを登録
#gh secret set SIGN_CERT_PASSWORD --body 'your-password' --repo myorg/URMS
```

## シークレットのテスト
`release-preview.yml` ワークフローを workflow_dispatch で実行してビルドを検証できます（署名を必要としないプレビュー成果物が Actions アーティファクトとして取得できます）。

## ワークフローの概要
- タグ `vX.Y.Z` を push するとトリガ。
- フロントエンドの `npm run build`、Tauri の `npm run tauri:build -- --release` を実行してリリースバイナリ（exe）を生成。
- `SIGN_CERT_PFX` と `SIGN_CERT_PASSWORD` が設定されている場合、Windows runner 上で `signtool.exe` を使って署名を行う。
- 署名済みバイナリを GitHub Release にアップロードする。
- リリース本文はタグの注記（annotated tag のメッセージ）か、該当コミットのメッセージを簡易的に使用する。

## 手動でのリリースノート修正
- `release-drafter` が自動でドラフトを作成します。必要なら Draft を編集し、手動で Publish してください。

## トラブルシューティング
- `signtool.exe` が見つからない場合: Windows ランナーに Windows SDK が入っているか確認してください。カスタム runner を使用する場合は予め signtool をインストール／パスを通してください。
- タグのメッセージが空の場合、ワークフローは直近のコミットメッセージを利用します。

## 参考
- Release Drafter: https://github.com/release-drafter/release-drafter
- SignTool: https://learn.microsoft.com/en-us/windows/win32/seccrypto/signtool
