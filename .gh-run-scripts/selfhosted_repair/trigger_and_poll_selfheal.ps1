$ErrorActionPreference='Stop'
$repo = 'infinityjp-maker/URMS'
$workflowFile = 'selfheal-validate.yml'
$ref = 'main'
$workdir = Join-Path (Split-Path -Parent $MyInvocation.MyCommand.Path) '..' | Resolve-Path -Relative
$log = Join-Path $workdir 'trigger_selfheal.log'
function Log([string]$m){ $t = "$(Get-Date -Format o) `t $m"; Add-Content -Path $log -Value $t; Write-Output $t }

Log "TRIGGER_WORKFLOW: $workflowFile ref=$ref"
Try{
    gh api --method POST repos/$repo/actions/workflows/$workflowFile/dispatches -f ref=$ref 2>&1 | Out-Null
    Log "DISPATCHED"
} Catch {
    Log "DISPATCH_ERROR: $_"
    Exit 2
}

# Poll for run
$maxWait = 300 # seconds
$interval = 5
$elapsed = 0
$foundRun = $null
while ($elapsed -lt $maxWait) {
    Try{
        $resp = gh api repos/$repo/actions/workflows/$workflowFile/runs 2>$null | ConvertFrom-Json
    } Catch {
        Log "API_ERROR_LIST_RUNS: $_"
        Start-Sleep -Seconds $interval
        $elapsed += $interval
        continue
    }
    if ($resp.workflow_runs -and $resp.workflow_runs.Count -gt 0) {
        $run = $resp.workflow_runs | Sort-Object created_at | Select-Object -Last 1
        Log "FOUND_RUN: id=$($run.id) status=$($run.status) conclusion=$($run.conclusion) created_at=$($run.created_at)"
        if ($run.status -eq 'completed') { $foundRun = $run; break }
        # otherwise keep waiting
    } else {
        Log "NO_RUNS_YET"
    }
    Start-Sleep -Seconds $interval
    $elapsed += $interval
}

if (-not $foundRun) {
    Log "TIMEOUT_WAITING_FOR_RUN"
    Exit 3
}

# Poll jobs until completed
$runId = $foundRun.id
$jobsJson = $null
Try{
    $jobsResp = gh api repos/$repo/actions/runs/$runId/jobs 2>$null | ConvertFrom-Json
    $jobsJson = $jobsResp
} Catch {
    Log "ERROR_FETCH_JOBS: $_"
}

# summarize
$summary = @{
    run_id = $runId
    run_name = $foundRun.name
    status = $foundRun.status
    conclusion = $foundRun.conclusion
    branch = $foundRun.head_branch
    commit = $foundRun.head_sha
    html_url = $foundRun.html_url
}
$jobSummaries = @()
if ($jobsJson -and $jobsJson.jobs) {
    foreach ($j in $jobsJson.jobs) {
        $jobSummaries += [PSCustomObject]@{
            name = $j.name
            status = $j.status
            conclusion = $j.conclusion
            runner = $j.runner_name
            started_at = $j.started_at
            completed_at = $j.completed_at
        }
    }
}
$summary.jobs = $jobSummaries
$outJson = Join-Path $workdir 'selfheal_run_summary.json'
$outTxt = Join-Path $workdir 'selfheal_run_summary.txt'
$summary | ConvertTo-Json -Depth 6 | Out-File -FilePath $outJson -Encoding utf8
$summary | Out-String | Out-File -FilePath $outTxt -Encoding utf8
Log "SUMMARY_WRITTEN: $outJson"
Write-Output "DONE"
