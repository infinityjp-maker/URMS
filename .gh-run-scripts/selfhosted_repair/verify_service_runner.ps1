# verify_service_runner.ps1
# Usage: run from workspace (script will cd into repo)
$repo = 'D:\GitHub\URMS'
$workdir = Join-Path $repo '.gh-run-scripts\selfhosted_repair'
New-Item -ItemType Directory -Path $workdir -Force | Out-Null
Set-Location $repo

# 1) capture service status (runner-related services)
$svc_out = Join-Path $workdir 'service_status_after.txt'
try {
    Get-Service | Where-Object { $_.Name -like '*runner*' -or $_.DisplayName -like '*runner*' } |
      Select-Object Name,DisplayName,Status,ServiceType | ConvertTo-Json -Depth 4 | Out-File -FilePath $svc_out -Encoding utf8
    Write-Output "WROTE_SERVICE_STATUS: $svc_out"
} catch {
    "ERROR_GetService: $_" | Out-File -FilePath $svc_out -Encoding utf8
}

# 2) create branch validate/final-trigger-test, empty commit, push
$branch = 'validate/final-trigger-test'
try {
    git checkout -B $branch
    git commit --allow-empty -m "self-hosted runner service verification"
    git push -u origin $branch --force
    Write-Output "PUSHED_BRANCH: $branch"
} catch {
    Write-Output "GIT_ERROR: $_"
}

Start-Sleep -Seconds 6

# 3) fetch latest run for the workflow
$run_file = Join-Path $workdir 'run.json'
$jobs_file = Join-Path $workdir 'jobs.json'
try {
    gh api repos/infinityjp-maker/URMS/actions/workflows/selfheal-validate.yml/runs?per_page=1 | Out-File -FilePath $run_file -Encoding utf8
    Write-Output "WROTE_RUN: $run_file"
} catch {
    "ERROR_GH_RUNS: $_" | Out-File -FilePath $run_file -Encoding utf8
}

# 4) extract run_id and fetch jobs
try {
    $raw = Get-Content $run_file -Raw
    $obj = $null
    try { $obj = $raw | ConvertFrom-Json } catch { }
    if ($obj -and $obj.total_count -gt 0 -and $obj.workflow_runs -and $obj.workflow_runs.Count -gt 0) {
        $run_id = $obj.workflow_runs[0].id
        gh api repos/infinityjp-maker/URMS/actions/runs/$run_id/jobs | Out-File -FilePath $jobs_file -Encoding utf8
        Write-Output "WROTE_JOBS: $jobs_file (run_id=$run_id)"
    } else {
        "{}" | Out-File -FilePath $jobs_file -Encoding utf8
        Write-Output "NO_RUN_FOUND"
    }
} catch {
    "ERROR_FETCH_JOBS: $_" | Out-File -FilePath $jobs_file -Encoding utf8
}

# 5) build summary.json
$summary_file = Join-Path $workdir 'summary.json'
$summary_txt = Join-Path $workdir 'summary.txt'
$svc_text = Get-Content $svc_out -Raw -ErrorAction SilentlyContinue
$run_text = Get-Content $run_file -Raw -ErrorAction SilentlyContinue
$jobs_text = Get-Content $jobs_file -Raw -ErrorAction SilentlyContinue

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
                if ($j.status -eq 'waiting' -or $j.conclusion -eq $null -and $j.status -eq 'completed' -and $j.conclusion -eq 'skipped') { $needs_approval = $true }
            }
        }
    }
} catch {
    # ignore
}

$summary = [PSCustomObject]@{
    timestamp = (Get-Date).ToString('o')
    service_status_file = $svc_out
    run_file = $run_file
    jobs_file = $jobs_file
    runner_online = $runner_online
    jobs_count = $jobs_count
    needs_approval = $needs_approval
    notes = if ($jobs_count -gt 0) { 'Jobs found; check jobs.json for details.' } else { 'No jobs found — runner may be offline or workflow requires approval.' }
}
$summary | ConvertTo-Json -Depth 10 | Out-File -FilePath $summary_file -Encoding utf8

# human readable summary
@(
    "timestamp: $((Get-Date).ToString('o'))",
    "runner_online: $runner_online",
    "jobs_count: $jobs_count",
    "needs_approval: $needs_approval",
    "service_status:",
    $svc_text,
    "run.json:",
    $run_text,
    "jobs.json:",
    $jobs_text
) -join "`n`n" | Out-File -FilePath $summary_txt -Encoding utf8

Write-Output "VERIFICATION_DONE"
