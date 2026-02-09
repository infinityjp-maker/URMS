$ErrorActionPreference = 'Stop'
$run = gh run list --workflow pr-tauri-playwright.yml --branch feature/future-mode-base --limit 1 --json databaseId | ConvertFrom-Json
if (!$run) { Write-Error 'no run found'; exit 2 }
$runId = $run[0].databaseId
Write-Output "Monitoring run $runId"
for ($i=0; $i -lt 360; $i++) {
  $info = gh run view $runId --json status,conclusion | ConvertFrom-Json
  $conc = ''
  if ($info.conclusion) { $conc = $info.conclusion }
  $statusLine = (Get-Date).ToString('o') + ' ' + $info.status + '|' + $conc
  Write-Output $statusLine
  if ($info.status -eq 'completed') { break }
  Start-Sleep -Seconds 8
}
if ($info.status -ne 'completed') { Write-Error 'Timeout waiting for run to complete'; exit 2 }
$final = gh run view $runId --json databaseId,status,conclusion | ConvertFrom-Json
Write-Output 'FINAL:'
$final | ConvertTo-Json -Depth 5 | Write-Output

# fetch logs and extract relevant lines
$log = gh run view $runId --log
$patterns = @('Run future-mode capture','DEBUG_ENV','apply_future_mode.cjs','Run smoke capture','smoke.cjs','Compare screenshots','page.goto: net::ERR_CONNECTION_REFUSED','Call log:')
$matches = Select-String -InputObject $log -Pattern $patterns -Context 5,5
if ($matches) { $matches | Out-String -Width 4096 | Write-Output } else { Write-Output 'No matching log lines found.' }
