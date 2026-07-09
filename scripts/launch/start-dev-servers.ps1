# URMS — API + Desktop Web をバックグラウンド起動（CMD 窓なし）
$ErrorActionPreference = 'Stop'
. (Join-Path $PSScriptRoot '_dev-server-utils.ps1')

try {
    Start-UrmsDevServers -DesktopTarget web | Out-Null
} catch {
    Write-Host "[ERROR] $($_.Exception.Message)"
    exit 1
}
