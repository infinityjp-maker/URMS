$ErrorActionPreference = 'Continue'
New-Item -ItemType Directory -Force -Path .gh-run-scripts/selfhosted_repair/api_checks | Out-Null
$orig = 23149962343
$workflowId = 244654296
$repo = 'repos/infinityjp-maker/URMS'
$newId = 0
for ($i = 0; $i -lt 24 -and $newId -eq 0; $i++) {
    Start-Sleep -Seconds 5
    try { gh api repos/infinityjp-maker/URMS/actions/workflows/$workflowId/runs?per_page=10 > .gh-run-scripts/selfhosted_repair/api_checks/workflow_runs_tmp.json 2>&1 } catch { }
    try { $list = Get-Content .gh-run-scripts/selfhosted_repair/api_checks/workflow_runs_tmp.json -Raw | ConvertFrom-Json } catch { $list = $null }
    if ($null -ne $list -and $list.workflow_runs.Count -gt 0) {
        foreach ($r in $list.workflow_runs) {
            if ($r.id -ne $orig) {
                $newId = $r.id
                $r | ConvertTo-Json -Depth 10 | Out-File .gh-run-scripts/selfhosted_repair/api_checks/new_run_workflow_summary.json -Encoding utf8
                try { gh api repos/infinityjp-maker/URMS/actions/runs/$newId > .gh-run-scripts/selfhosted_repair/api_checks/run_$newId.json 2>&1 } catch { }
                try { $run = Get-Content .gh-run-scripts/selfhosted_repair/api_checks/run_$newId.json -Raw | ConvertFrom-Json } catch { $run = $null }
                if ($null -ne $run -and $run.check_suite_id) {
                    try { gh api repos/infinityjp-maker/URMS/check-suites/$($run.check_suite_id)/check-runs > .gh-run-scripts/selfhosted_repair/api_checks/check_runs_$($run.check_suite_id).json 2>&1 } catch { }
                }
                break
            }
        }
    }
}
Write-Output "WF_POLL_DONE $newId"
