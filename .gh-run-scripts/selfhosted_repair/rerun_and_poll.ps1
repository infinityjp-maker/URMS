$ErrorActionPreference = 'Continue'
New-Item -ItemType Directory -Force -Path .gh-run-scripts/selfhosted_repair/api_checks | Out-Null
$orig = 23149962343
$repo = 'repos/infinityjp-maker/URMS'
try { gh api -X POST $repo/actions/runs/$orig/rerun > .gh-run-scripts/selfhosted_repair/api_checks/rerun_output.json 2>&1 } catch { }
$newId = 0
for ($i = 0; $i -lt 24 -and $newId -eq 0; $i++) {
    Start-Sleep -Seconds 5
    try { gh api $repo/actions/runs > .gh-run-scripts/selfhosted_repair/api_checks/list_runs_tmp.json 2>&1 } catch { }
    try { $list = Get-Content .gh-run-scripts/selfhosted_repair/api_checks/list_runs_tmp.json -Raw | ConvertFrom-Json } catch { $list = $null }
    if ($null -ne $list -and $list.workflow_runs.Count -gt 0) {
        $candidate = $list.workflow_runs[0].id
        if ($candidate -ne $orig) {
            $newId = $candidate
            $list.workflow_runs[0] | ConvertTo-Json -Depth 10 | Out-File .gh-run-scripts/selfhosted_repair/api_checks/new_run_summary.json -Encoding utf8
            try { gh api $repo/actions/runs/$newId > .gh-run-scripts/selfhosted_repair/api_checks/run_$newId.json 2>&1 } catch { }
            try { $run = Get-Content .gh-run-scripts/selfhosted_repair/api_checks/run_$newId.json -Raw | ConvertFrom-Json } catch { $run = $null }
            if ($null -ne $run -and $run.check_suite_id) {
                try { gh api repos/infinityjp-maker/URMS/check-suites/$($run.check_suite_id)/check-runs > .gh-run-scripts/selfhosted_repair/api_checks/check_runs_$($run.check_suite_id).json 2>&1 } catch { }
            }
        }
    }
}
Write-Output "RERUN_DONE $newId"
