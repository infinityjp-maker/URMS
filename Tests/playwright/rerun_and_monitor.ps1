# Rerun latest pr-tauri-playwright workflow on feature/future-mode-base and monitor until completion
$ErrorActionPreference = 'Stop'
$repo = 'infinityjp-maker/URMS'
$workflow = 'pr-tauri-playwright.yml'
$branch = 'feature/future-mode-base'

$raw = gh run list --workflow=$workflow --branch $branch --limit 1 --json databaseId 2>$null
if (-not $raw) { Write-Error 'No run found for workflow'; exit 2 }
$runEntry = $raw | ConvertFrom-Json
$origRunId = $runEntry[0].databaseId
Write-Host "Rerunning run $origRunId"
gh run rerun $origRunId --repo $repo
Start-Sleep -Seconds 5
Write-Host 'Polling latest run until completed...'
while ($true) {
  $latestRaw = gh run list --workflow=$workflow --branch $branch --limit 1 --json databaseId,status,conclusion 2>$null
  if (-not $latestRaw) { Start-Sleep -Seconds 6; continue }
  $latest = $latestRaw | ConvertFrom-Json
  $rid = $latest[0].databaseId
  $status = $latest[0].status
  $conclusion = $latest[0].conclusion
  Write-Host ((Get-Date).ToString('o') + " RunId:$rid Status:$status Conclusion:$conclusion")
  if ($status -eq 'completed') {
    Write-Host 'Run completed.'
    Write-Host "--- Failed-step logs (if any) follow ---"
    gh run view $rid --repo $repo --log-failed --log | Out-Host
    break
  }
  Start-Sleep -Seconds 8
}
# Print summary JSON
gh run view $rid --repo $repo --json databaseId,status,conclusion,html_url | ConvertTo-Json -Depth 5 | Out-Host
