$outdir = '.gh-run-scripts/2fa_retest'
New-Item -ItemType Directory -Force -Path $outdir | Out-Null

Write-Output "Starting 2FA retest: empty commit to validate/final-trigger-test"

# Ensure latest origin
git fetch origin --prune

# Attempt to checkout target branch; if not exist remotely create from main
$branch = 'validate/final-trigger-test'
$remoteBranch = "origin/$branch"
$checked = $false
try {
  git rev-parse --verify $branch | Out-Null; git checkout $branch; $checked = $true
} catch {
  try {
    git checkout -b $branch $remoteBranch; $checked = $true
  } catch {
    Write-Output "Remote branch not found; create from origin/main"
    git checkout -b $branch origin/main
    $checked = $true
  }
}

if (-not $checked) { Write-Output "Failed to prepare branch"; exit 1 }

# Create empty commit and push
$msg = "2FA enabled test $(Get-Date -Format o)"
git commit --allow-empty -m "$msg"
$pushResult = git push origin $branch 2>&1 | Tee-Object -Variable pushOut
Write-Output $pushOut

# Wait briefly for GitHub to register run
Start-Sleep -Seconds 6

# 2: fetch latest run for workflow path
$workflowPath = 'selfheal-validate.yml'
$encPath = [System.Uri]::EscapeDataString('.github/workflows/' + $workflowPath)
# Use workflow filename route
$runApi = "repos/infinityjp-maker/URMS/actions/workflows/$workflowPath/runs?per_page=1"
Write-Output "Fetching latest run via GH API: $runApi"
try {
  gh api $runApi 2> "$outdir/run_fetch.err" | Out-File -FilePath "$outdir/run.json" -Encoding utf8
} catch {
  Write-Output "gh api failed: $_"
}

# Parse run id if present
$runId = $null
try {
  $r = Get-Content "$outdir/run.json" -Raw | ConvertFrom-Json
  if ($r.workflow_runs -and $r.workflow_runs.Count -gt 0) { $runId = $r.workflow_runs[0].id }
} catch {
}

if ($runId) {
  Write-Output "Found run id: $runId"
  gh api repos/infinityjp-maker/URMS/actions/runs/$runId 2> "$outdir/run_detail.err" | Out-File -FilePath "$outdir/run_detail.json" -Encoding utf8
  gh api repos/infinityjp-maker/URMS/actions/runs/$runId/jobs 2> "$outdir/jobs.err" | Out-File -FilePath "$outdir/jobs.json" -Encoding utf8
} else {
  Write-Output "No run found in recent workflow runs."
}

# Summary
$summary = [ordered]@{
  timestamp = (Get-Date).ToString('o')
  branch = $branch
  pushed = $pushOut -join "`n"
  runId = $runId
}
$summary | ConvertTo-Json -Depth 6 | Out-File "$outdir/summary.json" -Encoding utf8
Write-Output "Outputs written to $outdir"
exit 0
