$ErrorActionPreference='Stop'
$repo = 'infinityjp-maker/URMS'
$workflowFile = 'test-hosted-runner.yml'
$ref = 'main'
$workdir = Join-Path (Split-Path -Parent $MyInvocation.MyCommand.Path) '..' | Resolve-Path -Relative
$log = Join-Path $workdir 'trigger_test_hosted.log'
function Log([string]$m){ $t = "$(Get-Date -Format o) `t $m"; Add-Content -Path $log -Value $t; Write-Output $t }

Log "DISPATCH_WORKFLOW: $workflowFile ref=$ref"
Try{
    gh api --method POST repos/$repo/actions/workflows/$workflowFile/dispatches -f ref=$ref 2>&1 | Out-Null
    Log "DISPATCHED"
} Catch {
    Log "DISPATCH_ERROR: $_"
    Exit 2
}

# Poll for run
$maxWait = 300
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
    } else {
        Log "NO_RUNS_YET"
    }
    Start-Sleep -Seconds $interval
    $elapsed += $interval
}

if (-not $foundRun) { Log "TIMEOUT_WAITING_FOR_RUN"; Exit 3 }

# fetch jobs
$runId = $foundRun.id
Try{ $jobs = gh api repos/$repo/actions/runs/$runId/jobs 2>$null | ConvertFrom-Json } Catch { $jobs = $null }

$summary = @{
    run_id = $runId
    conclusion = $foundRun.conclusion
    status = $foundRun.status
    html_url = $foundRun.html_url
    jobs = @()
}
if ($jobs -and $jobs.jobs) {
    foreach ($j in $jobs.jobs) {
        $steps = @()
        if ($j.steps) { foreach ($s in $j.steps) { $steps += @{ name=$s.name; conclusion=$s.conclusion } } }
        $summary.jobs += @{ name=$j.name; conclusion=$j.conclusion; runner=$j.runner_name; steps=$steps }
    }
}
$outJson = Join-Path $workdir 'test_hosted_run_summary.json'
$summary | ConvertTo-Json -Depth 5 | Out-File -FilePath $outJson -Encoding utf8
Log "WRITTEN_SUMMARY: $outJson"
Write-Output 'DONE'