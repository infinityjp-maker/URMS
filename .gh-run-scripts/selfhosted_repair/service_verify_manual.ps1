param(
    [ValidateSet('before','after','both')]
    [string]$Phase = 'both'
)

$repo = 'D:\GitHub\URMS'
$workdir = Join-Path $repo '.gh-run-scripts\selfhosted_repair'
New-Item -ItemType Directory -Path $workdir -Force | Out-Null
Set-Location $repo

# Files
$before = Join-Path $workdir 'service_status_before.txt'
$after = Join-Path $workdir 'service_status_after.txt'
$run = Join-Path $workdir 'run.json'
$jobs = Join-Path $workdir 'jobs.json'
$summary = Join-Path $workdir 'summary.json'
$summary_txt = Join-Path $workdir 'summary.txt'

function Save-ServiceStatus($path) {
    try {
        Get-Service | Where-Object { $_.Name -like '*runner*' -or $_.DisplayName -like '*runner*' } | Select-Object Name,DisplayName,Status,ServiceType | ConvertTo-Json -Depth 4 | Out-File -FilePath $path -Encoding utf8
        Write-Output "WROTE: $path"
    } catch {
        "ERROR_GetService: $_" | Out-File -FilePath $path -Encoding utf8
    }
}

if ($Phase -eq 'before' -or $Phase -eq 'both') {
    Save-ServiceStatus $before
}

if ($Phase -eq 'after' -or $Phase -eq 'both') {
    Read-Host "実行済みなら管理者 PowerShell で RunnerService.exe install/start を行い Enter を押してください。中止するには Ctrl+C"

    Save-ServiceStatus $after

    # push empty commit
    try {
        git checkout -B validate/final-trigger-test
        git commit --allow-empty -m "self-hosted runner service verification"
        git push -u origin validate/final-trigger-test --force
    } catch {
        Write-Output "GIT_ERROR: $_"
    }

    Start-Sleep -Seconds 6

    # fetch latest run
    try { gh api repos/infinityjp-maker/URMS/actions/workflows/selfheal-validate.yml/runs?per_page=1 | Out-File -FilePath $run -Encoding utf8 } catch { "GH_RUN_ERROR: $_" | Out-File -FilePath $run -Encoding utf8 }

    # fetch jobs
    try {
        $raw = Get-Content -Raw -Path $run -ErrorAction SilentlyContinue
        $obj = $null
        try { $obj = $raw | ConvertFrom-Json } catch { }
        if ($obj -and $obj.total_count -gt 0 -and $obj.workflow_runs -and $obj.workflow_runs.Count -gt 0) {
            $rid = $obj.workflow_runs[0].id
            gh api repos/infinityjp-maker/URMS/actions/runs/$rid/jobs | Out-File -FilePath $jobs -Encoding utf8
        } else {
            "{}" | Out-File -FilePath $jobs -Encoding utf8
        }
    } catch { "GH_JOBS_ERROR: $_" | Out-File -FilePath $jobs -Encoding utf8 }

    # analyze and write summary
    $svc_before_text = Get-Content -Raw -Path $before -ErrorAction SilentlyContinue
    $svc_after_text = Get-Content -Raw -Path $after -ErrorAction SilentlyContinue
    $run_text = Get-Content -Raw -Path $run -ErrorAction SilentlyContinue
    $jobs_text = Get-Content -Raw -Path $jobs -ErrorAction SilentlyContinue

    $runner_online = $false
    $jobs_count = 0
    $needs_approval = $false

    try {
        $jobs_obj = $jobs_text | ConvertFrom-Json -ErrorAction SilentlyContinue
        if ($jobs_obj) {
            if ($jobs_obj.total_count) { $jobs_count = $jobs_obj.total_count }
            if ($jobs_obj.jobs) {
                foreach ($j in $jobs_obj.jobs) {
                    if ($j.runner_name) { $runner_online = $true }
                    if ($j.status -eq 'waiting') { $needs_approval = $true }
                }
            }
        }
    } catch {}

    $summary_obj = [PSCustomObject]@{
        timestamp = (Get-Date).ToString('o')
        service_status_before = $before
        service_status_after = $after
        run_file = $run
        jobs_file = $jobs
        runner_online = $runner_online
        jobs_count = $jobs_count
        needs_approval = $needs_approval
        notes = if ($jobs_count -gt 0) { 'Jobs found.' } else { 'No jobs — runner may be offline or workflow needs approval.' }
    }
    $summary_obj | ConvertTo-Json -Depth 10 | Out-File -FilePath $summary -Encoding utf8

    @(
        "timestamp: $((Get-Date).ToString('o'))",
        "runner_online: $runner_online",
        "jobs_count: $jobs_count",
        "needs_approval: $needs_approval",
        "service_status_before:",
        $svc_before_text,
        "service_status_after:",
        $svc_after_text,
        "run.json:",
        $run_text,
        "jobs.json:",
        $jobs_text
    ) -join "`n`n" | Out-File -FilePath $summary_txt -Encoding utf8

    Write-Output "SUMMARY_WRITTEN: $summary"
}

Write-Output "DONE"
