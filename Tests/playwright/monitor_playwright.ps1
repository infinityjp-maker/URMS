$run = gh run list --workflow=pr-playwright.yml --branch feature/future-mode-base --limit 1 --json databaseId | ConvertFrom-Json
if (-not $run) { Write-Output "No runs found."; exit 2 }
$runId = $run[0].databaseId
Write-Output "Monitoring run $runId"
while ($true) {
  $info = gh run view $runId --json status,conclusion | ConvertFrom-Json
  $conc = if ($null -ne $info.conclusion -and $info.conclusion -ne '') { $info.conclusion } else { '' }
  Write-Output ((Get-Date).ToString('o') + ' ' + $info.status + '|' + $conc)
  if ($info.status -eq 'completed') { break }
  Start-Sleep -Seconds 8
}
$summary = gh run view $runId --json databaseId,status,conclusion,url | ConvertFrom-Json
$summary | ConvertTo-Json -Depth 5
exit 0
