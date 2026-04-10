$ErrorActionPreference = 'Stop'
$dir = ".gh-run-scripts/selfhosted_repair/api_checks"
New-Item -ItemType Directory -Force -Path $dir | Out-Null
$files = Get-ChildItem -Path $dir -File -Recurse | Sort-Object FullName
$repoRoot = (Get-Location).Path
$rel = $files | ForEach-Object { $_.FullName.Replace($repoRoot + '\\','') }
$now = Get-Date
$readmePath = Join-Path $dir 'support_readme.txt'
@(
"対象リポジトリ: infinityjp-maker/URMS",
"問題の概要: check-suite は生成されるが check-runs が 0 のまま",
"再現した run_id: 23149962343, 24198346858",
"再現した check_suite_id: 60777492111, 63967813492",
"発生日時 (ローカル): $($now.ToString('yyyy-MM-dd HH:mm:ss zzz'))",
"期待動作: ワークフロー実行でチェックラン/ジョブが1件以上生成されること",
"実際の動作: チェックスイートは作成されるが check-runs/jobs が0件のまま",
"取得済み API 一覧 (ファイル名):"
) | Out-File -FilePath $readmePath -Encoding utf8
foreach ($f in $rel) { " - $f" | Out-File -FilePath $readmePath -Append -Encoding utf8 }
$zipPath = Join-Path $repoRoot 'support_package.zip'
if (Test-Path $zipPath) { Remove-Item $zipPath -Force }
Compress-Archive -Path (Join-Path $dir '*') -DestinationPath $zipPath -Force
Write-Output "CREATED $zipPath and $readmePath"
