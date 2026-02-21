Param([long]$run = 21952270892)
Set-StrictMode -Version Latest
if (-not (Test-Path -Path '.gh-logs')) { New-Item -ItemType Directory -Path '.gh-logs' | Out-Null }
$deadline = (Get-Date).AddMinutes(20)
while ((Get-Date) -lt $deadline) {
  $o = gh run view $run --json status,conclusion 2>$null | ConvertFrom-Json
  if ($o -ne $null) {
    $status = $o.status
    $conclusion = if ($o.conclusion) { $o.conclusion } else { 'null' }
    Write-Output "$run -> status=$status conclusion=$conclusion"
    if ($status -eq 'completed') { break }
  } else { Write-Output "$run -> (no data)" }
  Start-Sleep -Seconds 15
}
gh run view $run --log > .gh-logs/run-$run.log 2>&1
Write-Output "Saved .gh-logs/run-$run.log"
