Param([int]$Limit=3)
Set-StrictMode -Version Latest
if (-not (Test-Path -Path '.gh-logs')) { New-Item -ItemType Directory -Path '.gh-logs' | Out-Null }
$runsJson = gh run list --workflow=playwright-smoke.yml --branch add-embedded-notojp --limit 10 --json id,createdAt 2>$null
if (-not $runsJson) { Write-Output "No runs found"; exit 1 }
$runs = $runsJson | ConvertFrom-Json
$ids = $runs | Sort-Object {[DateTime]$_.createdAt} -Descending | Select-Object -First $Limit -ExpandProperty id
Write-Output "Found run ids: $($ids -join ',')"
foreach ($id in $ids) {
  Write-Output "Polling run $id..."
  $deadline = (Get-Date).AddMinutes(20)
  while ((Get-Date) -lt $deadline) {
    $o = gh run view $id --json status,conclusion 2>$null | ConvertFrom-Json
    if ($o -ne $null) {
      $status = $o.status
      $conclusion = if ($o.conclusion) { $o.conclusion } else { 'null' }
      Write-Output "$id -> status=$status conclusion=$conclusion"
      if ($status -eq 'completed') { break }
    } else { Write-Output "$id -> (no data)" }
    Start-Sleep -Seconds 15
  }
  Write-Output "Fetching logs for $id..."
  gh run view $id --log > .gh-logs/run-$id.log 2>&1
  Write-Output "Saved .gh-logs/run-$id.log"
}
