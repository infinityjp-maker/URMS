# URMS 画面確認用 — ワイヤー(5180) + 本番窓(1420) を起動
$ErrorActionPreference = 'Stop'
$Root = Resolve-Path (Join-Path $PSScriptRoot '..\..')
Set-Location $Root

Write-Host 'URMS UI servers starting...'
Write-Host '  Wireframes: http://127.0.0.1:5180/index.html'
Write-Host '  Desktop:    http://127.0.0.1:1420/'

Start-Process powershell -ArgumentList @(
  '-NoProfile',
  '-ExecutionPolicy', 'Bypass',
  '-Command',
  "Set-Location '$Root'; npx pnpm@9.15.4 wireframes:serve"
)

Start-Process powershell -ArgumentList @(
  '-NoProfile',
  '-ExecutionPolicy', 'Bypass',
  '-Command',
  "Set-Location '$Root'; npx pnpm@9.15.4 --filter @urms/shared build; npx pnpm@9.15.4 --filter @urms/domain build; npx pnpm@9.15.4 dev:desktop:web"
)

Write-Host 'Done — 2 windows opened. Close them to stop servers.'
