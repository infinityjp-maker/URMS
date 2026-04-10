# Deep investigation of GitHub Actions server state for selfheal-validate
$repo = 'infinityjp-maker/URMS'
$org = 'infinityjp-maker'
$outdir = '.gh-run-scripts/actions_investigate'
New-Item -ItemType Directory -Force -Path $outdir | Out-Null

function Save-Api([string]$path, [string]$outFile) {
  Write-Output "gh api $path -> $outFile"
  try {
    gh api $path 2> "$outdir/$outFile.err" | Out-File -FilePath "$outdir/$outFile" -Encoding utf8
  } catch {
    Write-Output "API call failed: $path -> $_"
  }
}

# 1. workflows list
Save-Api "repos/$repo/actions/workflows?per_page=100" "workflows_list.json"

# parse to find relevant workflows
$wjson = $null
try { $wjson = Get-Content "$outdir/workflows_list.json" -Raw | ConvertFrom-Json } catch { }
$targets = @()
if ($wjson -and $wjson.workflows) {
  foreach ($w in $wjson.workflows) {
    if (($w.path -match 'selfheal-validate') -or ($w.name -match 'Self-heal' -or $w.path -match 'selfheal')) {
      $targets += @{ id = $w.id; name = $w.name; path = $w.path }
    }
  }
}

# save targets
$targets | ConvertTo-Json -Depth 5 | Out-File "$outdir/targets.json" -Encoding utf8

# 2. workflow details for each target
foreach ($t in $targets) {
  $id = $t.id
  Save-Api "repos/$repo/actions/workflows/$id" "workflow_$id.json"
}

# 3. repo actions permissions
Save-Api "repos/$repo/actions/permissions" "repo_actions_permissions.json"
Save-Api "repos/$repo/actions/permissions/workflow" "repo_actions_permissions_workflow.json"

# 4. org-level actions permissions
Save-Api "orgs/$org/actions/permissions" "org_actions_permissions.json"
Save-Api "orgs/$org/actions/permissions/repositories" "org_actions_permissions_repositories.json"

# 5. latest run for test branch: find recent runs for branch
$testBranch = 'validate/final-trigger-test'
# get recent runs and filter
Save-Api "repos/$repo/actions/runs?per_page=100" "runs_list.json"
$runsJson = $null
try { $runsJson = Get-Content "$outdir/runs_list.json" -Raw | ConvertFrom-Json } catch { }
$foundRun = $null
if ($runsJson -and $runsJson.workflow_runs) {
  foreach ($r in $runsJson.workflow_runs) {
    if ($r.head_branch -eq $testBranch -and $r.event -eq 'push') { $foundRun = $r; break }
  }
}
if ($foundRun) {
  $runId = $foundRun.id
  $foundRun | ConvertTo-Json -Depth 6 | Out-File "$outdir/found_run.json" -Encoding utf8
  Save-Api "repos/$repo/actions/runs/$runId" "run_$runId.json"
  Save-Api "repos/$repo/actions/runs/$runId/jobs" "run_${runId}_jobs.json"
} else {
  Write-Output 'No run found for test branch in recent runs.'
}

# produce combined summary
$summary = [ordered]@{
  timestamp = (Get-Date).ToString('o')
  repo = $repo
  org = $org
  targets = $targets
  foundRun = $foundRun
}
$summary | ConvertTo-Json -Depth 6 | Out-File "$outdir/summary.json" -Encoding utf8
Write-Output "Investigation files written to $outdir"
exit 0
