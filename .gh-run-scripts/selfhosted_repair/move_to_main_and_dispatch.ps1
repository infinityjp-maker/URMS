$ErrorActionPreference = 'Continue'
$repo = 'repos/infinityjp-maker/URMS'
$workflows = @('.github/workflows/selfheal-validate-test-A.yml', '.github/workflows/selfheal-validate-test-B.yml', '.github/workflows/selfheal-validate-test-C.yml')
$apiDir = '.gh-run-scripts/selfhosted_repair/api_checks'
New-Item -ItemType Directory -Force -Path $apiDir | Out-Null
# Checkout main and add files
try { git checkout main } catch {}
try { git pull origin main } catch {}
git add .github/workflows/selfheal-validate-test-*.yml || Write-Output 'git add skipped'
git commit -m "Add selfheal validate test workflows to main" || Write-Output 'commit skipped (maybe no changes)'
git push origin main
# Refresh workflows
gh api $repo/actions/workflows > "$apiDir/workflows_main.json" 2>&1 || Write-Output 'gh workflows fetch failed'
$wl = $null
try { $wl = Get-Content "$apiDir/workflows_main.json" -Raw | ConvertFrom-Json } catch { }
$map = @{}
if ($wl -ne $null) { foreach ($w in $wl.workflows) { $map[$w.path] = $w.id } }
$results = @()
foreach ($p in $workflows) {
    $wid = $null
    if ($map.ContainsKey($p)) { $wid = $map[$p] }
    if (-not $wid) { Write-Output "No workflow id for $p"; $results += [PSCustomObject]@{workflow_path=$p; error='no_workflow_id'; workflow_id=$null}; continue }
    Write-Output "Dispatching $p (id $wid) on main"
    # dispatch using workflow run command
    gh workflow run $p --repo infinityjp-maker/URMS --ref main || gh api -X POST repos/infinityjp-maker/URMS/actions/workflows/$wid/dispatches -f ref=main
    # poll for run
    $newId = $null
    for ($i=0;$i -lt 60 -and -not $newId;$i++) {
        Start-Sleep -Seconds 5
        gh api repos/infinityjp-maker/URMS/actions/workflows/$wid/runs?per_page=10 > "$apiDir/wf_runs_$wid.json" 2>&1
        try { $runs = Get-Content "$apiDir/wf_runs_$wid.json" -Raw | ConvertFrom-Json } catch { $runs = $null }
        if ($runs -and $runs.workflow_runs.Count -gt 0) {
            foreach ($r in $runs.workflow_runs) {
                if ($r.head_branch -eq 'main') { $newId = $r.id; break }
            }
        }
    }
    if ($newId) {
        gh api repos/infinityjp-maker/URMS/actions/runs/$newId > "$apiDir/run_$newId.json" 2>&1
        gh api repos/infinityjp-maker/URMS/actions/runs/$newId/jobs > "$apiDir/run_${newId}_jobs.json" 2>&1
        try { $run = Get-Content "$apiDir/run_$newId.json" -Raw | ConvertFrom-Json } catch { $run = $null }
        $checkSuiteId = $null
        if ($run -and $run.check_suite_id) { $checkSuiteId = $run.check_suite_id; gh api repos/infinityjp-maker/URMS/check-suites/$checkSuiteId/check-runs > "$apiDir/check_runs_$checkSuiteId.json" 2>&1 }
        $jobsTotal = $null
        try { $jobs = Get-Content "$apiDir/run_${newId}_jobs.json" -Raw | ConvertFrom-Json; $jobsTotal = $jobs.total_count } catch { }
        $crTotal = $null
        if ($checkSuiteId) { try { $cr = Get-Content "$apiDir/check_runs_$checkSuiteId.json" -Raw | ConvertFrom-Json; $crTotal = $cr.total_count } catch { } }
        $results += [PSCustomObject]@{workflow_path=$p; workflow_id=$wid; run_id=$newId; check_suite_id=$checkSuiteId; jobs_count=$jobsTotal; check_runs_total=$crTotal}
    } else {
        $results += [PSCustomObject]@{workflow_path=$p; workflow_id=$wid; run_id=$null; check_suite_id=$null; jobs_count=$null; check_runs_total=$null}
    }
}
$results | ConvertTo-Json -Depth 6 | Out-File "$apiDir/test_results_main.json" -Encoding utf8
Write-Output 'DONE'