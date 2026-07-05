# URMS S13 performance spot check (API must be running on :3000)
$ErrorActionPreference = "Stop"

function Measure-Endpoint {
  param([string]$Url)
  $sw = [System.Diagnostics.Stopwatch]::StartNew()
  try {
    $resp = Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec 5
    $sw.Stop()
    return @{ Ok = ($resp.StatusCode -ge 200 -and $resp.StatusCode -lt 400); Ms = $sw.ElapsedMilliseconds }
  } catch {
    $sw.Stop()
    return @{ Ok = $false; Ms = $sw.ElapsedMilliseconds }
  }
}

Write-Host "=== URMS Performance Spot Check (S13) ==="

$targets = @(
  @{ Name = "health"; Url = "http://localhost:3000/health"; BudgetMs = 200 },
  @{ Name = "perception"; Url = "http://localhost:3000/v1/perception"; BudgetMs = 500 },
  @{ Name = "context"; Url = "http://localhost:3000/v1/context"; BudgetMs = 500 }
)

$fail = 0
foreach ($t in $targets) {
  $r = Measure-Endpoint $t.Url
  if (-not $r.Ok) {
    Write-Host "[NG] $($t.Name) — not reachable ($($t.Url))"
    $fail++
    continue
  }
  if ($r.Ms -le $t.BudgetMs) {
    Write-Host "[OK] $($t.Name) $($r.Ms)ms (budget $($t.BudgetMs)ms)"
  } else {
    Write-Host "[WARN] $($t.Name) $($r.Ms)ms exceeds budget $($t.BudgetMs)ms"
  }
}

Write-Host ""
if ($fail -gt 0) {
  Write-Host "Start API first: pnpm dev:api"
  exit 1
}
exit 0
