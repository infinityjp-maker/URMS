# URMS — バックグラウンド dev サーバー停止
$ErrorActionPreference = 'Stop'
. (Join-Path $PSScriptRoot '_dev-server-utils.ps1')

$stopped = Stop-UrmsDevServers
if ($stopped -gt 0) {
    Write-Host "Stopped $stopped dev server process(es)."
} else {
    Write-Host 'No tracked dev servers (pids.json). If CMD windows remain, close them manually.'
}
