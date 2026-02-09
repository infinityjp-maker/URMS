$run = gh run list --workflow=pr-tauri-playwright.yml --branch feature/future-mode-base --limit 1 --json databaseId | ConvertFrom-Json
$runId = $run[0].databaseId
Write-Host "Monitoring run $runId"
while ($true) {
  $info = gh run view $runId --json status,conclusion | ConvertFrom-Json
  $concl = ''
  if ($info.conclusion) { $concl = $info.conclusion }
  Write-Host "$(Get-Date -Format o) $($info.status)|$concl"
  if ($info.status -eq 'completed') { break }
  Start-Sleep -Seconds 8

gh run view $runId --json databaseId,status,conclusion,html_url | ConvertFrom-Json | ConvertTo-Json -Depth 5
