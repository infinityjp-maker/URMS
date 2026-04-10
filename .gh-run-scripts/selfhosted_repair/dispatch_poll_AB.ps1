$ErrorActionPreference = 'Continue'
$repo = 'repos/infinityjp-maker/URMS'
$branch = 'validate/selfheal-tests'
$files = @('.github/workflows/selfheal-validate-test-A.yml','.github/workflows/selfheal-validate-test-B.yml')
New-Item -ItemType Directory -Force -Path .gh-run-scripts/selfhosted_repair/api_checks | Out-Null
$wl = Get-Content .gh-run-scripts/selfhosted_repair/api_checks/workflows_current.json -Raw | ConvertFrom-Json
foreach ($f in $files) {
    $wf = $wl.workflows | Where-Object { $_.path -eq $f }
    if (-not $wf) { Write-Output "workflow not found for $f"; continue }
    $wid = $wf.id
    Write-Output "Dispatching $f (id $wid)"
    gh workflow run $f --repo infinityjp-maker/URMS --ref $branch
    # poll
    $newId = 0
    for ($i=0;$i -lt 60 -and $newId -eq 0;$i++) {
        Start-Sleep -Seconds 5
        gh api repos/infinityjp-maker/URMS/actions/workflows/$wid/runs?per_page=10 > .gh-run-scripts/selfhosted_repair/api_checks/wf_runs_$wid.json
        try { $runs = Get-Content .gh-run-scripts/selfhosted_repair/api_checks/wf_runs_$wid.json -Raw | ConvertFrom-Json } catch { $runs = $null }
        if ($null -ne $runs -and $runs.workflow_runs.Count -gt 0) {
            foreach ($r in $runs.workflow_runs) {
                if ($r.head_branch -eq $branch) { $newId = $r.id; break }
            }
        }
    }
    if ($newId -ne 0) {
        gh api repos/infinityjp-maker/URMS/actions/runs/$newId > .gh-run-scripts/selfhosted_repair/api_checks/run_$newId.json
        gh api repos/infinityjp-maker/URMS/actions/runs/$newId/jobs > .gh-run-scripts/selfhosted_repair/api_checks/run_${newId}_jobs.json
        try { $run = Get-Content .gh-run-scripts/selfhosted_repair/api_checks/run_$newId.json -Raw | ConvertFrom-Json } catch { $run = $null }
        if ($run -and $run.check_suite_id) { gh api repos/infinityjp-maker/URMS/check-suites/$($run.check_suite_id)/check-runs > .gh-run-scripts/selfhosted_repair/api_checks/check_runs_$($run.check_suite_id).json }
        Write-Output "Collected run $newId for $f"
    } else {
        Write-Output "No run found for $f"
    }
}
