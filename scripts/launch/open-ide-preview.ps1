# URMS — 1420 疎通確認（Canvas 青リンクで Cursor 内タブを開く）
$Url = "http://127.0.0.1:1420/"
$WaitSeconds = 30
if ($args.Count -ge 1 -and $args[0]) { $Url = $args[0] }
if ($args.Count -ge 2 -and $args[1]) { $WaitSeconds = [int]$args[1] }

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
Set-Location $Root

Write-Host "URMS live preview — waiting for 1420 ..."
$deadline = (Get-Date).AddSeconds($WaitSeconds)
$ready = $false
while ((Get-Date) -lt $deadline) {
  try {
    $r = Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec 2
    if ($r.StatusCode -eq 200) { $ready = $true; break }
  } catch { }
  Start-Sleep -Seconds 1
}

if (-not $ready) {
  Write-Host "[WARN] 1420 not ready — run scripts\launch\start-dev-servers.bat"
  exit 1
}

Write-Host "[OK] 1420 ready"
Write-Host ""
Write-Host "Open in Cursor: Canvas urms-hub -> click blue preview link (integrated browser tab)."
