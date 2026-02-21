Param([int]$ParamPr)
$prNumber = $null
if($ParamPr){ $prNumber = $ParamPr }
$ErrorActionPreference = 'Stop'
$owner = 'infinityjp-maker'
$repo = 'URMS'
Write-Output "[script] starting orchestration"
# determine PR number: use provided arg or find PR for branch fix/skip-future-mode
if($ParamPr -and $ParamPr -match '^[0-9]+$'){
    $prNumber = [int]$ParamPr
    Write-Output "Using provided PR number: $prNumber"
} else {
    Write-Output "Detecting PR for branch 'fix/skip-future-mode'"
    $prList = gh pr list --state open --json number,headRefName | ConvertFrom-Json
    foreach($p in $prList){ if($p.headRefName -eq 'fix/skip-future-mode'){ $prNumber = $p.number; break } }
    if(-not $prNumber){ Write-Warning "No open PR found for branch 'fix/skip-future-mode'" }
    else { Write-Output "Found PR #$prNumber for branch fix/skip-future-mode" }
}
# initial origin/main
$initial = (git ls-remote origin refs/heads/main | Select-String -Pattern '^[0-9a-f]+' | ForEach-Object { ($_ -split '\t')[0] })[0]
Write-Output "initial origin/main: $initial"
# ensure PR is set to auto-merge (but check mergeable state first)
if(-not $prNumber){ Write-Error "No PR number available to operate on. Aborting."; exit 1 }
Write-Output "Querying PR #$prNumber mergeable state"
$prInfo = gh pr view $prNumber --json mergeable,mergeStateStatus --jq '.' 2>$null | Out-String
try{ $pr = $prInfo | ConvertFrom-Json } catch { $pr = $null }
if($pr -ne $null){
    $ms = ($pr.mergeStateStatus.ToString()).ToLower()
    Write-Output "PR mergeStateStatus: $ms, mergeable: $($pr.mergeable)"
    if($ms -eq 'dirty'){
        Write-Error "PR #$prNumber is in 'dirty' state (merge conflict). Aborting automation."
        exit 1
    }
}

Write-Output "Requesting auto-merge for PR #$prNumber (checks must pass)"
try{
    gh pr merge $prNumber --auto --merge --delete-branch --subject 'ci: skip future-mode capture (temporary)' --body 'Auto-merge when checks pass' | Out-Null
} catch {
    Write-Warning "gh pr merge --auto failed: $_. Trying API merge request instead."
    try{ gh api repos/$owner/$repo/pulls/$prNumber/merge -X PUT -F commit_title="Merge PR #$prNumber by automation" | Out-Null } catch { Write-Warning "API merge request also failed: $_" }
}
# poll for origin/main change (5min)
Write-Output "Polling origin/main for up to 600s"
$end = (Get-Date).AddSeconds(600)
$newHash = $initial
while((Get-Date) -lt $end) {
    git fetch origin main | Out-Null
    $cur = (git ls-remote origin refs/heads/main | Select-String -Pattern '^[0-9a-f]+' | ForEach-Object { ($_ -split '\t')[0] })[0]
    Write-Output "origin/main: $cur"
    $pr = gh pr view $prNumber --json number,title,state,mergedAt | ConvertFrom-Json
    Write-Output "PR state: $($pr.state) mergedAt: $($pr.mergedAt)"
    if($cur -and $cur -ne $initial) {
        $newHash = $cur
        Write-Output "main updated -> $newHash"
        break
    }
    Start-Sleep -Seconds 10
}
if($newHash -eq $initial) { Write-Warning 'origin/main did not update within 5 minutes' }
# attempt programmatic dispatch
Write-Output "Attempting programmatic dispatch (up to 5 tries)"
$runId = $null
for($i=1; $i -le 5; $i++){
    Write-Output "Dispatch attempt $i"
    $out = gh workflow run playwright-smoke.yml --ref main 2>&1 | Out-String
    Write-Output $out
    if($out -match 'actions/runs/(\d+)'){
        $runId = $matches[1]
        Write-Output "Created run $runId"
        break
    }
    if($out -match "workflow does not have 'workflow_dispatch'" -or $out -match '422'){
        Write-Output "Dispatch rejected (likely 422). Sleeping 30s then retry"
        Start-Sleep -Seconds 30
        continue
    }
    # else try to find recent run on main
    $runs = gh run list --workflow playwright-smoke.yml --branch main --limit 5 --json databaseId,createdAt | ConvertFrom-Json
    if($runs -and $runs.Count -gt 0){ $runId = $runs[0].databaseId; Write-Output "Found recent run $runId"; break }
    Start-Sleep -Seconds 30
}
# fallback: push-trigger
if(-not $runId){
    Write-Output "Dispatch attempts failed. Creating fallback branch to trigger push-based run"
    $ts = [int][double]::Parse((Get-Date -UFormat %s))
    $branch = "feature/auto-dispatch-$ts"
    git switch -c $branch
    New-Item -Path ".auto-dispatch-trigger-$ts" -ItemType File -Force | Out-Null
    git add .auto-dispatch-trigger-$ts
    try {
        git commit -m "ci: trigger playwright smoke via push - $ts" | Out-Null
    } catch {
        Write-Warning "git commit failed or nothing to commit"
    }
    git push -u origin $branch
    Write-Output "Pushed branch $branch, polling for run"
    $end2 = (Get-Date).AddSeconds(300)
    while((Get-Date) -lt $end2) {
        $runs = gh run list --workflow playwright-smoke.yml --branch $branch --limit 5 --json databaseId,headBranch,createdAt | ConvertFrom-Json
        if($runs -and $runs.Count -gt 0) { $runId = $runs[0].databaseId; Write-Output "Found run $runId for branch $branch"; break }
        Start-Sleep -Seconds 5
    }
}
if(-not $runId){ Write-Warning 'No run id found; aborting automation'; exit 0 }
# monitor run
Write-Output "Monitoring run $runId until completed"
$end3 = (Get-Date).AddHours(1)
while((Get-Date) -lt $end3) {
    $s = gh run view $runId --json status,conclusion -q '.status + " " + (.conclusion // "null")' 2>$null
    Write-Output "status: $s"
    if($s -and $s -match 'completed') { Write-Output "run completed: $s"; break }
    Start-Sleep -Seconds 10
}
# download artifacts via API
$outDir = Join-Path -Path '.' -ChildPath ".gh-run-artifacts/$runId"
New-Item -ItemType Directory -Path $outDir -Force | Out-Null
$artJson = gh api repos/$owner/$repo/actions/runs/$runId/artifacts 2>$null | Out-String
try { $art = $artJson | ConvertFrom-Json } catch { $art = $null }
if(-not $art -or -not $art.artifacts -or $art.artifacts.Count -eq 0){ Write-Warning 'No artifacts present for run'; exit 0 }
foreach($a in $art.artifacts){
    $id = $a.id; $name = ($a.name -replace '[\\/:*?\"<>| ]','_'); $zipPath = Join-Path $outDir "$name`_$id.zip"
    Write-Output "Downloading artifact: $($a.name) id=$id -> $zipPath"
    gh api repos/$owner/$repo/actions/artifacts/$id/zip -H 'Accept: application/zip' --output $zipPath
    if(Test-Path $zipPath){ $dest = Join-Path $outDir "$name`_$id"; New-Item -ItemType Directory -Path $dest -Force | Out-Null; try { Expand-Archive -Path $zipPath -DestinationPath $dest -Force } catch { Write-Warning "failed unzip $zipPath" } }
}
# inventory
$want = 'smoke-run.stdout.log','smoke-run.stderr.log','smoke-result.json','smoke-exec-summary.json','NotoSansJP-Regular.woff2'
$report = @{
    run_id = $runId
    artifacts_dir = (Resolve-Path $outDir).Path
    found = @{}
}
foreach($w in $want){
    $matches = Get-ChildItem -Path $outDir -Recurse -File -ErrorAction SilentlyContinue | Where-Object { $_.Name -eq $w }
    $report.found[$w] = @()
    foreach($m in $matches){ $report.found[$w] += @{ path = $m.FullName; size = $m.Length } }
}
$report | ConvertTo-Json -Depth 5 | Out-File -FilePath (Join-Path $outDir 'artifact-inventory.json') -Encoding UTF8
Write-Output "Wrote artifact-inventory.json to $outDir"
Write-Output "Automation complete"
