param(
    [string]$Url = $(if ($env:URL) { $env:URL } else { 'http://localhost:1420/' }),
    [int[]]$Ports = @(8765,8877)
)

Write-Output "Running health-check against $Url (ports: $($Ports -join ','))"
pwsh ./scripts/health-check.ps1 -Url $Url -Ports $Ports
if ($LASTEXITCODE -ne 0) {
    Write-Output "health-check failed (exit $LASTEXITCODE). Aborting smoke run."
    exit $LASTEXITCODE
}

Write-Output "health-check OK — running smoke.cjs with URL=$Url"
$env:URL = $Url
node Tests/playwright/smoke.cjs > .github/actions-runs/last-smoke.log 2>&1
Write-Output "smoke finished; logs: .github/actions-runs/last-smoke.log; diagnostics: builds/diagnostics/"
