Param()
$ErrorActionPreference = 'Stop'
$owner = 'infinityjp-maker'
$repo = 'URMS'
$prNumber = 15
$workflowFile = 'playwright-smoke.yml'
Write-Output "[orchestrator] start for PR #$prNumber"

function Get-PrChecksComplete {
    param($pr)
    $sc = $pr.statusCheckRollup
    if(-not $sc) { return $false }
    foreach($c in $sc){ if($c.status -ne 'COMPLETED'){ return $false } }
    return $true
}

# Wait for PR checks to finish and handle transient failures with automatic reruns.
# We'll loop: wait for checks -> if failures and transient -> rerun failed jobs and wait again; else break.
$maxWaitMinutes = 180
$deadline = (Get-Date).AddMinutes($maxWaitMinutes)
$handledRerun = $false
while((Get-Date) -lt $deadline){
    Write-Output "Polling PR #$prNumber checks..."
    $raw = gh pr view $prNumber --json number,state,statusCheckRollup,headRefName,mergeable,mergeStateStatus --jq '.' 2>$null | Out-String
    try{ $pr = $raw | ConvertFrom-Json } catch { Start-Sleep -Seconds 5; continue }
    $allDone = $true
    if(-not $pr.statusCheckRollup){ $allDone = $false } else {
        foreach($c in $pr.statusCheckRollup){ if($c.status -ne 'COMPLETED'){ $allDone = $false; break } }
    }
    if(-not $allDone){ Start-Sleep -Seconds 10; continue }
    Write-Output "All checks completed — evaluating results"

    # find failing checks
    $failed = @()
    foreach($c in $pr.statusCheckRollup){ if($c.conclusion -and $c.conclusion -ne 'SUCCESS'){ $failed += $c } }

    if($failed.Count -eq 0){ Write-Output "No failing checks"; break }

    Write-Output "Found $($failed.Count) failed checks. Inspecting logs for transient errors..."
    $didRerun = $false
    foreach($f in $failed){
        Write-Output "Check: $($f.name) -> $($f.detailsUrl)"
        if($f.detailsUrl -match '/actions/runs/(\d+)'){
            $runId = $matches[1]
            Write-Output "Fetching logs for run $runId"
            gh run view $runId --log > ".gh-run-logs/run_$runId.log" 2>$null
            $log = Get-Content ".gh-run-logs/run_$runId.log" -Raw -ErrorAction SilentlyContinue
            if($log -match 'ECONNREFUSED|connect ECONNREFUSED|Connection refused'){
                Write-Output "Transient error detected: ECONNREFUSED -> rerunning failed jobs for run $runId"
                gh run rerun $runId --failed | Out-Null
                $didRerun = $true
                Continue
            }
            if($log -match 'out of memory|JS heap out of memory|Heap out of memory'){
                Write-Output "OOM detected in run $runId; saving logs for review and not auto-patching"
                Continue
            }
            if($log -match 'YAML syntax error|Invalid workflow file'){
                Write-Output "Workflow YAML syntax error detected; creating tentative fix PR"
                git switch -c fix/playwright-yaml-auto || git switch fix/playwright-yaml-auto
                $wf = ".github/workflows/playwright-smoke.yml"
                $content = Get-Content $wf -Raw
                if($content -notmatch "\n$" ){ Add-Content $wf "`n" }
                git add $wf
                git commit -m "chore(workflow): whitespace fix to reindex workflow (auto)" || Write-Output "commit skipped"
                git push -u origin HEAD
                gh pr create --title "chore(workflow): reindex workflow (auto whitespace)" --body "Auto-generated whitespace fix to help Actions reindex workflow." --head $(git rev-parse --abbrev-ref HEAD) --base main
                Continue
            }
            Write-Output "Saved logs to .gh-run-logs/run_$runId.log for review"
        } else {
            Write-Output "No run id in detailsUrl; saving detailsUrl for review: $($f.detailsUrl)"
        }
    }

    if($didRerun){
        Write-Output "Issued rerun for transient failures — will wait for rerun to complete and re-evaluate"
        $handledRerun = $true
        Start-Sleep -Seconds 10
        continue
    }

    Write-Output "No transient failures detected that we can auto-rerun. Exiting automation for manual review."; exit 0
}

if((Get-Date) -ge $deadline){ Write-Warning "Checks did not reach a stable passing state within timeout ($maxWaitMinutes minutes)" }

# If no failures, request auto-merge
Write-Output "No failing checks. Requesting auto-merge for PR #$prNumber"
try{ gh pr merge $prNumber --auto -m -b "Auto-merge when checks pass (automation)" | Out-Null } catch { Write-Warning "auto-merge request failed: $_" }

# Poll origin/main for update
$initial = (git ls-remote origin refs/heads/main | Select-String -Pattern '^[0-9a-f]+' | ForEach-Object { ($_ -split '\t')[0] })[0]
Write-Output "initial origin/main: $initial"
$end = (Get-Date).AddSeconds(600)
$newHash = $initial
while((Get-Date) -lt $end) {
    git fetch origin main | Out-Null
    $cur = (git ls-remote origin refs/heads/main | Select-String -Pattern '^[0-9a-f]+' | ForEach-Object { ($_ -split '\t')[0] })[0]
    Write-Output "origin/main: $cur"
    $prView = gh pr view $prNumber --json state,mergedAt 2>$null | Out-String
    try{ $pv = $prView | ConvertFrom-Json } catch { $pv = $null }
    if($pv -and $pv.mergedAt){ Write-Output "PR merged at $($pv.mergedAt)" }
    if($cur -and $cur -ne $initial){ $newHash = $cur; Write-Output "main updated -> $newHash"; break }
    Start-Sleep -Seconds 10
}
if($newHash -eq $initial){ Write-Warning 'origin/main did not update within 10 minutes' }

# Attempt programmatic dispatch
Write-Output "Attempting programmatic dispatch of $workflowFile on main"
$runId = $null
for($i=1; $i -le 5; $i++){
    Write-Output "Dispatch attempt $i"
    $out = gh workflow run $workflowFile --ref main 2>&1 | Out-String
    Write-Output $out
    if($out -match 'actions/runs/(\d+)'){
        $runId = $matches[1]; Write-Output "Created run $runId"; break
    }
    if($out -match "workflow does not have 'workflow_dispatch'" -or $out -match '422'){
        Write-Output "Dispatch rejected; sleeping and retrying"; Start-Sleep -Seconds 30; continue
    }
    $runs = gh run list --workflow $workflowFile --branch main --limit 5 --json databaseId,createdAt | ConvertFrom-Json
    if($runs -and $runs.Count -gt 0){ $runId = $runs[0].databaseId; Write-Output "Found recent run $runId"; break }
    Start-Sleep -Seconds 30
}
# fallback push-trigger
if(-not $runId){
    Write-Output "Dispatch failed; creating fallback push branch"
    $ts = [int][double]::Parse((Get-Date -UFormat %s))
    $branch = "feature/auto-dispatch-$ts"
    git switch -c $branch
    New-Item -Path ".auto-dispatch-trigger-$ts" -ItemType File -Force | Out-Null
    git add .auto-dispatch-trigger-$ts
    git commit -m "ci: trigger playwright smoke via push - $ts" -ErrorAction SilentlyContinue | Out-Null
    git push -u origin $branch
    $end2 = (Get-Date).AddSeconds(300)
    while((Get-Date) -lt $end2){
        $runs = gh run list --workflow $workflowFile --branch $branch --limit 5 --json databaseId,headBranch,createdAt | ConvertFrom-Json
        if($runs -and $runs.Count -gt 0){ $runId = $runs[0].databaseId; Write-Output "Found run $runId for branch $branch"; break }
        Start-Sleep -Seconds 5
    }
}
if(-not $runId){ Write-Warning 'No run id found; aborting'; exit 0 }

# Monitor run until completed (1h)
Write-Output "Monitoring run $runId"
$end3 = (Get-Date).AddHours(1)
while((Get-Date) -lt $end3){
    $s = gh run view $runId --json status,conclusion -q '.status + " " + (.conclusion // "null")' 2>$null
    Write-Output "status: $s"
    if($s -and $s -match 'completed') { Write-Output "run completed: $s"; break }
    Start-Sleep -Seconds 10
}

# Download artifacts
$outDir = Join-Path -Path '.' -ChildPath ".gh-run-artifacts/$runId"
New-Item -ItemType Directory -Path $outDir -Force | Out-Null
$artJson = gh api repos/$owner/$repo/actions/runs/$runId/artifacts 2>$null | Out-String
try { $art = $artJson | ConvertFrom-Json } catch { $art = $null }
if(-not $art -or -not $art.artifacts -or $art.artifacts.Count -eq 0){ Write-Warning 'No artifacts present for run'; exit 0 }
foreach($a in $art.artifacts){ $id = $a.id; $name = ($a.name -replace '[\\/:*?"<>| ]','_'); $zipPath = Join-Path $outDir "$name`_$id.zip"; Write-Output "Downloading artifact: $($a.name) id=$id -> $zipPath"; gh api repos/$owner/$repo/actions/artifacts/$id/zip -H 'Accept: application/zip' --output $zipPath; if(Test-Path $zipPath){ $dest = Join-Path $outDir "$name`_$id"; New-Item -ItemType Directory -Path $dest -Force | Out-Null; try { Expand-Archive -Path $zipPath -DestinationPath $dest -Force } catch { Write-Warning "failed unzip $zipPath" } } }

Write-Output "Artifacts downloaded to $outDir"
Write-Output "Orchestration for PR #$prNumber completed"
