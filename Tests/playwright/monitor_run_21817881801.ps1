$runId=21817881801
Write-Host "Monitoring run $runId"
while ($true) {
  $info = gh run view $runId --json status,conclusion | ConvertFrom-Json
  $concl = ''
  if ($info.conclusion) { $concl = $info.conclusion }
  Write-Host "$(Get-Date -Format o) $($info.status)|$concl"
  if ($info.status -eq 'completed') { break }
  Start-Sleep -Seconds 8
}
gh run view $runId --json databaseId,status,conclusion,html_url | ConvertFrom-Json | ConvertTo-Json -Depth 5
