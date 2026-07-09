# URMS — Canvas プレビュー用スクリーンショット（1420 · 開発者向け）
# User 向けライブプレビューは Canvas urms-hub の青リンク（Cursor 内タブ）
$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$Out = "C:/Users/infin/.cursor/projects/d-GitHub-URMS/assets"
New-Item -ItemType Directory -Force -Path $Out | Out-Null

Set-Location $Root

$shots = @(
  @{ Name = "urms-preview-hub.png"; Url = "http://127.0.0.1:1420/" },
  @{ Name = "urms-preview-screens.png"; Url = "http://127.0.0.1:1420/#/screens" },
  @{ Name = "urms-preview-morning.png"; Url = "http://127.0.0.1:1420/?phase=morning" },
  @{ Name = "urms-preview-day.png"; Url = "http://127.0.0.1:1420/?phase=day" },
  @{ Name = "urms-preview-evening.png"; Url = "http://127.0.0.1:1420/?phase=evening" },
  @{ Name = "urms-preview-night.png"; Url = "http://127.0.0.1:1420/?phase=night" }
)

foreach ($s in $shots) {
  $dest = Join-Path $Out $s.Name
  Write-Host "Capture $($s.Url) -> $dest"
  npx pnpm@9.15.4 exec playwright screenshot --browser chromium $s.Url $dest
}

Write-Host "Done — $($shots.Count) previews in $Out"
