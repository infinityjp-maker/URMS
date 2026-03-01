Write-Output 'Dispatching run-health-smoke.yml (ref: main)'
gh workflow run run-health-smoke.yml --ref main
Start-Sleep -Seconds 5
$r = gh run list --workflow=run-health-smoke.yml --branch main --limit 1 --json databaseId | ConvertFrom-Json
$runid = $r[0].databaseId
Write-Output ("Dispatched run id: $runid")
Write-Output 'Polling run for completion'
while ($true) {
  $s = gh run view $runid --json status,conclusion | ConvertFrom-Json
  Write-Output ("status: $($s.status) conclusion: $($s.conclusion)")
  if ($s.status -eq 'completed') { break }
  Start-Sleep -Seconds 10
}
Write-Output 'Saving logs and downloading artifacts'
gh run view $runid --log > last-smoke-run-$runid.log
New-Item -ItemType Directory -Force -Path artifacts-$runid | Out-Null
gh run download $runid -D artifacts-$runid || Write-Output 'download-artifacts-failed'
Get-ChildItem -Recurse artifacts-$runid | Select-Object FullName,Length | Format-Table -AutoSize
Write-Output 'Done'
