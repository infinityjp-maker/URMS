#!/usr/bin/env pwsh
# Dispatch the selfheal-production-autotest workflow and download artifacts when complete
$repoOwner = "infinityjp-maker"
$repoName = "URMS"
$repo = "$repoOwner/$repoName"
$wfPath = '.github/workflows/selfheal-production-autotest.yml'

Write-Output "Locating workflow..."
$apiRaw = gh api repos/$repoOwner/$repoName/actions/workflows
if (-not $apiRaw) { Write-Output "gh api failed"; exit 2 }
$api = $apiRaw | ConvertFrom-Json
$wf = $api.workflows | Where-Object { $_.path -eq $wfPath }
if (-not $wf) { Write-Output "Workflow not found: $wfPath"; exit 3 }
$wf | ConvertTo-Json | Out-File -FilePath ".gh-run-scripts/selfhosted_repair/api_checks/workflow_autotest.json" -Encoding utf8
$id = $wf.id
Write-Output "Workflow id: $id"

Write-Output "Dispatching workflow..."
gh workflow run "$wfPath" --repo $repo --ref main

# Poll for run
$max = 120
$delay = 5
$run_id = $null
for ($i = 0; $i -lt $max; $i++) {
    Write-Output "Poll $($i+1)/$max..."
    $runsRespRaw = gh api repos/$repoOwner/$repoName/actions/workflows/$id/runs
    if ($runsRespRaw) {
        $runsResp = $runsRespRaw | ConvertFrom-Json
        if ($runsResp.workflow_runs.Count -gt 0) {
            $run = $runsResp.workflow_runs[0]
            $run_id = $run.id
            $run | ConvertTo-Json | Out-File -FilePath ".gh-run-scripts/selfhosted_repair/api_checks/latest_autotest_run.json" -Encoding utf8
            break
        }
    }
    Start-Sleep -Seconds $delay
}
if (-not $run_id) { Write-Output "No run found after polling"; exit 4 }

Write-Output "Found run id: $run_id"

# Poll run status until completed
$max2 = 360
for ($j = 0; $j -lt $max2; $j++) {
    $runRespRaw = gh api repos/$repoOwner/$repoName/actions/runs/$run_id
    if ($runRespRaw) {
        $runResp = $runRespRaw | ConvertFrom-Json
        $status = $runResp.status
        $conclusion = $runResp.conclusion
        Write-Output "Run status: $status (conclusion: $conclusion)"
        if ($status -eq 'completed') { break }
    }
    Start-Sleep -Seconds 10
}

Write-Output "Downloading artifacts for run $run_id..."
$artDir = ".gh-run-scripts/selfhosted_repair/api_checks/autotest_artifacts_$run_id"
if (-not (Test-Path $artDir)) { New-Item -ItemType Directory -Path $artDir -Force | Out-Null }
gh run download $run_id --repo $repo --dir $artDir

Write-Output "Downloaded artifacts to: $artDir"
Get-ChildItem -Path $artDir -Recurse -File | Select-Object FullName,Length | ConvertTo-Json
