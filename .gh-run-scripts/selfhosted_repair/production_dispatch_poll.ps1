#!/usr/bin/env pwsh
# production_dispatch_poll.ps1
$repoOwner = "infinityjp-maker"
$repoName = "URMS"
$repo = "$repoOwner/$repoName"
$apiDir = ".gh-run-scripts/selfhosted_repair/api_checks"
if (-not (Test-Path $apiDir)) { New-Item -ItemType Directory -Path $apiDir -Force | Out-Null }

Write-Output "Getting workflow info..."
$raw = & gh api repos/$repoOwner/$repoName/actions/workflows
if (-not $raw) { Write-Output "gh api failed"; exit 2 }
$api = $raw | ConvertFrom-Json
$wf = $api.workflows | Where-Object { $_.path -eq '.github/workflows/selfheal-validate.yml' } | Select-Object id,name,path,state,updated_at
if (-not $wf) { Write-Output 'Workflow not found'; exit 2 }
$wf | ConvertTo-Json | Out-File -FilePath (Join-Path $apiDir "workflow_selfheal_production.json") -Encoding utf8
$id = $wf.id
Write-Output "Workflow id: $id"

Write-Output "Dispatching workflow..."
gh workflow run ".github/workflows/selfheal-validate.yml" --repo $repo --ref main

# Poll for run
$max = 60
$delay = 5
$result = $null
for ($i = 0; $i -lt $max; $i++) {
    Write-Output "Poll $($i+1)/$max..."
    $runsRespRaw = & gh api repos/$repoOwner/$repoName/actions/workflows/$id/runs
    if ($runsRespRaw) {
        $runsResp = $runsRespRaw | ConvertFrom-Json
        if ($runsResp.workflow_runs.Count -gt 0) {
            $run = $runsResp.workflow_runs[0]
            $run_id = $run.id
            $check_suite_id = $run.check_suite_id
            # jobs
            $jobsResp = & gh api repos/$repoOwner/$repoName/actions/runs/$run_id/jobs | ConvertFrom-Json
            $jobs_count = $jobsResp.total_count
            # check-runs via check-suite
            $checksResp = & gh api repos/$repoOwner/$repoName/check-suites/$check_suite_id/check-runs | ConvertFrom-Json
            $check_runs_total = $checksResp.total_count
            $obj = @{ run_id = $run_id; check_suite_id = $check_suite_id; jobs_count = $jobs_count; check_runs_total = $check_runs_total }
            $obj | ConvertTo-Json | Out-File -FilePath (Join-Path $apiDir "test_workflow_results_selfheal_production.json") -Encoding utf8
            $result = $obj
            break
        }
    }
    Start-Sleep -Seconds $delay
}
if (-not $result) {
    Write-Output "No run found after polling"
    $empty = @{ run_id = $null; check_suite_id = $null; jobs_count = 0; check_runs_total = 0 }
    $empty | ConvertTo-Json | Out-File -FilePath (Join-Path $apiDir "test_workflow_results_selfheal_production.json") -Encoding utf8
    exit 3
}

Write-Output "Downloading artifacts for run $($result.run_id)..."
$artDir = ".gh-run-scripts/selfhosted_repair/api_checks/artifacts_$($result.run_id)"
if (-not (Test-Path $artDir)) { New-Item -ItemType Directory -Path $artDir -Force | Out-Null }
gh run download $result.run_id --repo $repo --dir $artDir --quiet

# Check for expected files
$filesToCheck = @("selfheal_detected_issue.txt","selfheal_repair_start.txt","selfheal_repair_log.txt","selfheal_log_phase4.txt","selfheal_error_production.txt")
$foundFiles = @{}
foreach ($f in $filesToCheck) {
    $match = Get-ChildItem -Path $artDir -Recurse -Filter $f -ErrorAction SilentlyContinue | Select-Object -First 1
    if ($match) { $foundFiles[$f] = $match.FullName } else { $foundFiles[$f] = $null }
}
$foundFiles | ConvertTo-Json | Out-File -FilePath (Join-Path $apiDir "artifacts_listing_selfheal_production.json") -Encoding utf8

Write-Output "Done."
