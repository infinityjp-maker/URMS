$ErrorActionPreference = 'Continue'
$repo = 'repos/infinityjp-maker/URMS'
$branch = 'validate/selfheal-tests'
$workflows = @(
    '.github/workflows/selfheal-validate-test-A.yml',
    '.github/workflows/selfheal-validate-test-B.yml',
    '.github/workflows/selfheal-validate-test-C.yml'
)
New-Item -ItemType Directory -Force -Path .gh-run-scripts/selfhosted_repair/api_checks | Out-Null
# Push current files to a test branch
try {
    git checkout -b $branch
} catch {}
git add .github/workflows/selfheal-validate-test-*.yml
git commit -m "Add selfheal validate test workflows" || Write-Output "Commit skipped"
git push -u origin $branch

# Refresh workflows list
try { gh api $repo/actions/workflows > .gh-run-scripts/selfhosted_repair/api_checks/workflows_after_add.json 2>&1 } catch {}
$wfList = @{}
try { $wl = Get-Content .gh-run-scripts/selfhosted_repair/api_checks/workflows_after_add.json -Raw | ConvertFrom-Json } catch { $wl = $null }
if ($null -ne $wl) {
    foreach ($w in $wl.workflows) { $wfList[$w.path] = $w.id }
}

$results = @()
foreach ($path in $workflows) {
    Write-Output "Dispatching $path"
    $wid = $wfList[$path]
    if (-not $wid) { Write-Output "Workflow id not found for $path"; continue }
    # dispatch via API
    gh api -X POST repos/infinityjp-maker/URMS/actions/workflows/$wid/dispatches -f ref=$branch
    # poll for new run
    $newId = 0
    for ($i=0;$i -lt 60 -and $newId -eq 0;$i++) {
        Start-Sleep -Seconds 5
        try { gh api repos/infinityjp-maker/URMS/actions/workflows/$wid/runs?per_page=5 > .gh-run-scripts/selfhosted_repair/api_checks/workflow_runs_$wid.json 2>&1 } catch {}
        try { $runs = Get-Content .gh-run-scripts/selfhosted_repair/api_checks/workflow_runs_$wid.json -Raw | ConvertFrom-Json } catch { $runs = $null }
        if ($null -ne $runs -and $runs.workflow_runs.Count -gt 0) {
            foreach ($r in $runs.workflow_runs) {
                if ($r.head_branch -eq $branch -or $r.head_sha -match 'fe23a011|bcfbf05a') {
                    $newId = $r.id; break
                }
            }
        }
    }
    if ($newId -ne 0) {
        gh api repos/infinityjp-maker/URMS/actions/runs/$newId > .gh-run-scripts/selfhosted_repair/api_checks/run_$newId.json
        try { $run = Get-Content .gh-run-scripts/selfhosted_repair/api_checks/run_$newId.json -Raw | ConvertFrom-Json } catch { $run = $null }
        $checkSuiteId = $null
        if ($null -ne $run -and $run.check_suite_id) { $checkSuiteId = $run.check_suite_id; gh api repos/infinityjp-maker/URMS/check-suites/$checkSuiteId/check-runs > .gh-run-scripts/selfhosted_repair/api_checks/check_runs_$checkSuiteId.json }
        # fetch jobs
        gh api repos/infinityjp-maker/URMS/actions/runs/$newId/jobs > .gh-run-scripts/selfhosted_repair/api_checks/run_${newId}_jobs.json
        $jobs = @{}
        try { $jobs = Get-Content .gh-run-scripts/selfhosted_repair/api_checks/run_${newId}_jobs.json -Raw | ConvertFrom-Json } catch { $jobs = $null }
        $results += [PSCustomObject]@{
            workflow_path = $path
            run_id = $newId
            check_suite_id = $checkSuiteId
            jobs_count = if ($null -ne $jobs) { $jobs.total_count } else { $null }
            check_runs_total = if ($checkSuiteId) { (Get-Content .gh-run-scripts/selfhosted_repair/api_checks/check_runs_$checkSuiteId.json -Raw | ConvertFrom-Json).total_count } else { $null }
        }
    } else {
        $results += [PSCustomObject]@{
            workflow_path = $path
            run_id = $null
            check_suite_id = $null
            jobs_count = $null
            check_runs_total = $null
        }
    }
}
$results | ConvertTo-Json -Depth 5 | Out-File .gh-run-scripts/selfhosted_repair/api_checks/test_workflow_results.json -Encoding utf8
Write-Output "DISPATCH_COMPLETE"
