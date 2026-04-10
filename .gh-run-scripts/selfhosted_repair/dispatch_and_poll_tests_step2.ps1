$ErrorActionPreference = 'Continue'
$repo = 'repos/infinityjp-maker/URMS'
$branch = 'validate/selfheal-tests'
$workflows = @(
    '.github/workflows/selfheal-validate-test-A.yml',
    '.github/workflows/selfheal-validate-test-B.yml',
    '.github/workflows/selfheal-validate-test-C.yml'
)
New-Item -ItemType Directory -Force -Path .gh-run-scripts/selfhosted_repair/api_checks | Out-Null
# Wait for workflows to be available in API
$wfList = @{}
for ($t=0;$t -lt 30;$t++) {
    Start-Sleep -Seconds 4
    try { gh api $repo/actions/workflows > .gh-run-scripts/selfhosted_repair/api_checks/workflows_after_add.json 2>&1 } catch {}
    try { $wl = Get-Content .gh-run-scripts/selfhosted_repair/api_checks/workflows_after_add.json -Raw | ConvertFrom-Json } catch { $wl = $null }
    if ($null -ne $wl) {
        foreach ($w in $wl.workflows) { $wfList[$w.path] = $w.id }
    }
    $found = $true
    foreach ($p in $workflows) { if (-not $wfList.ContainsKey($p)) { $found = $false } }
    if ($found) { break }
}
if (-not ($workflows | ForEach-Object { $wfList.ContainsKey($_) } | Where-Object { $_ -eq $false } )) {
    Write-Output "Workflows available"
} else {
    Write-Output "Timeout waiting for workflows to register. Proceeding with whatever is available"
}

$results = @()
foreach ($path in $workflows) {
    $wid = $null
    if ($wfList.ContainsKey($path)) { $wid = $wfList[$path] }
    if (-not $wid) { Write-Output "Skipping dispatch for $path (no workflow id)"; $results += [PSCustomObject]@{ workflow_path=$path; error='no_workflow_id' }; continue }
    Write-Output "Dispatching workflow id $wid for $path"
    gh api -X POST repos/infinityjp-maker/URMS/actions/workflows/$wid/dispatches -f ref=$branch
    # poll for new run
    $newId = 0
    for ($i=0;$i -lt 60 -and $newId -eq 0;$i++) {
        Start-Sleep -Seconds 5
        try { gh api repos/infinityjp-maker/URMS/actions/workflows/$wid/runs?per_page=10 > .gh-run-scripts/selfhosted_repair/api_checks/workflow_runs_$wid.json 2>&1 } catch {}
        try { $runs = Get-Content .gh-run-scripts/selfhosted_repair/api_checks/workflow_runs_$wid.json -Raw | ConvertFrom-Json } catch { $runs = $null }
        if ($null -ne $runs -and $runs.workflow_runs.Count -gt 0) {
            foreach ($r in $runs.workflow_runs) {
                if ($r.head_branch -eq $branch) { $newId = $r.id; break }
            }
        }
    }
    if ($newId -ne 0) {
        gh api repos/infinityjp-maker/URMS/actions/runs/$newId > .gh-run-scripts/selfhosted_repair/api_checks/run_$newId.json
        try { $run = Get-Content .gh-run-scripts/selfhosted_repair/api_checks/run_$newId.json -Raw | ConvertFrom-Json } catch { $run = $null }
        $checkSuiteId = $null
        if ($null -ne $run -and $run.check_suite_id) { $checkSuiteId = $run.check_suite_id; gh api repos/infinityjp-maker/URMS/check-suites/$checkSuiteId/check-runs > .gh-run-scripts/selfhosted_repair/api_checks/check_runs_$checkSuiteId.json }
        gh api repos/infinityjp-maker/URMS/actions/runs/$newId/jobs > .gh-run-scripts/selfhosted_repair/api_checks/run_${newId}_jobs.json
        $jobs = $null
        try { $jobs = Get-Content .gh-run-scripts/selfhosted_repair/api_checks/run_${newId}_jobs.json -Raw | ConvertFrom-Json } catch { $jobs = $null }
        $crTotal = $null
        if ($checkSuiteId) { try { $crTotal = (Get-Content .gh-run-scripts/selfhosted_repair/api_checks/check_runs_$checkSuiteId.json -Raw | ConvertFrom-Json).total_count } catch { $crTotal = $null } }
        $results += [PSCustomObject]@{
            workflow_path = $path
            workflow_id = $wid
            run_id = $newId
            check_suite_id = $checkSuiteId
            jobs_count = if ($null -ne $jobs) { $jobs.total_count } else { $null }
            check_runs_total = $crTotal
        }
    } else {
        $results += [PSCustomObject]@{ workflow_path = $path; workflow_id=$wid; run_id=$null; check_suite_id=$null; jobs_count=$null; check_runs_total=$null }
    }
}
$results | ConvertTo-Json -Depth 6 | Out-File .gh-run-scripts/selfhosted_repair/api_checks/test_workflow_results_step2.json -Encoding utf8
Write-Output "STEP2_COMPLETE"
