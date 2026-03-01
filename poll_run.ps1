$runid=22546875022
Write-Output "Polling run $runid for completion (every 10s)"
while ($true) {
  try {
    $s = gh run view $runid --json status,conclusion | ConvertFrom-Json
  } catch {
    Write-Output "gh query failed: $_"
    Start-Sleep -Seconds 5
    continue
  }
  Write-Output ("status: " + $s.status + " conclusion: " + ($s.conclusion -as [string]))
  if ($s.status -eq 'completed') { break }
  Start-Sleep -Seconds 10
}
Write-Output 'Saving logs and downloading artifacts'
gh run view $runid --log > last-smoke-run-$runid.log
New-Item -ItemType Directory -Force -Path artifacts-$runid | Out-Null
gh run download $runid -D artifacts-$runid || Write-Output 'download-artifacts-failed'
Get-ChildItem -Recurse artifacts-$runid | Select-Object FullName,Length | Format-Table -AutoSize
Write-Output 'Done'
