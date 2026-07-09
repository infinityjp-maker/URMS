# URMS 画面確認用 — 製品窓(1420) + API(3000) をバックグラウンド起動
$ErrorActionPreference = 'Stop'
$Root = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
Set-Location $Root

. (Join-Path $Root 'scripts\launch\_dev-server-utils.ps1')

Write-Host 'URMS UI launcher (background)'
Write-Host '  Product UI: http://127.0.0.1:1420/'
Write-Host '  Screen list: http://127.0.0.1:1420/#/screens'
Write-Host ''

Start-UrmsDevServers -DesktopTarget web | Out-Null
Write-Host 'Done — servers run in background. Stop: scripts\launch\stop-dev-servers.bat'
