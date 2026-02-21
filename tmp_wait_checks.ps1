$deadline=(Get-Date).AddMinutes(10)
Write-Host "Polling PR checks until no pending/failing (timeout 10m)"
while((Get-Date) -lt $deadline) {
  $out = gh pr checks 6 --repo infinityjp-maker/URMS 2>&1
  Write-Host (Get-Date).ToString('o')
  Write-Host $out
  if ($out -match '0 pending' -and $out -match '0 failing') {
    Write-Host 'All checks pass or none pending/failing'; break
  }
  Start-Sleep -Seconds 8
}
Write-Host 'Final summary:'
gh pr checks 6 --repo infinityjp-maker/URMS
$out
if ($out -match '0 pending' -and $out -match '0 failing') {
  Write-Host 'Attempting to merge PR #6'
  gh pr merge 6 --merge --delete-branch --body "Merging stabilized Playwright visuals and Future Mode baseline (CI passed)."
} else {
  Write-Host 'Not merging: checks still pending/failing'
}
