# Poll GH Actions runs and merge PR #9 when all succeed
$prNumber = 9
$maxAttempts = 40
$delaySeconds = 30
$maxAttempts = 40
$delaySeconds = 30
$prNumber = 9

Write-Output "Monitoring PR #$prNumber status checks"
for ($i=1; $i -le $maxAttempts; $i++) {
  Write-Output "Attempt ${i}/${maxAttempts}: fetching PR status..."
  $json = gh pr view $prNumber --json statusCheckRollup,mergeable,mergeStateStatus --jq '.' 2>$null | Out-String
  if (-not $json) { Write-Output "Failed to fetch PR status"; Start-Sleep -Seconds $delaySeconds; continue }
  $obj = $json | ConvertFrom-Json
  $checks = $obj.statusCheckRollup
  $anyInProgress = $false
  $anyFailed = $false
  foreach ($c in $checks) {
    $name = $c.name
    $status = ($c.status).ToUpper()
    $conclusion = if ($c.conclusion) { ($c.conclusion).ToUpper() } else { $null }
    Write-Output "Check: $name status=$status conclusion=$conclusion"
    if ($status -ne 'COMPLETED') { $anyInProgress = $true }
    if ($status -eq 'COMPLETED' -and $conclusion -ne 'SUCCESS') { $anyFailed = $true }
  }

  if ($anyFailed -and -not $anyInProgress) {
    Write-Output "One or more checks completed with failure and no checks are running. Aborting automated merge."
    exit 2
  }
  if ($anyFailed -and $anyInProgress) {
    Write-Output "One or more checks failed but some checks are still in progress; waiting for reruns to finish..."
    Start-Sleep -Seconds $delaySeconds
    continue
  }

  if (-not $anyInProgress) {
    Write-Output "All checks completed successfully. Verifying PR mergeability..."
    Write-Output "PR mergeable=$($obj.mergeable), mergeStateStatus=$($obj.mergeStateStatus)"
    if ($obj.mergeable -eq 'MERGEABLE' -and $obj.mergeStateStatus -ne 'BLOCKED') {
      Write-Output "Merging PR #$prNumber..."
      gh pr merge $prNumber --merge --delete-branch
      Write-Output "Merge command issued." 
      exit 0
    } else {
      Write-Output "PR still blocked (mergeable=$($obj.mergeable), mergeStateStatus=$($obj.mergeStateStatus)). Waiting..."
    }
  }

  Start-Sleep -Seconds $delaySeconds
}
Write-Output "Timeout waiting for PR checks to succeed. Manual intervention required." 
exit 1
