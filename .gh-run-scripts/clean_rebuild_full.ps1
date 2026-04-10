# Full clean rebuild: create clean branch from remote main, replace only `on:` block, PR, merge, trigger test branch, poll runs
$repo = 'infinityjp-maker/URMS'
$wf = '.github/workflows/selfheal-validate.yml'
$branch = 'fix/selfheal-validate-trigger-clean'
$testBranch = 'validate/final-trigger-test'

Write-Output "Starting clean rebuild workflow fix"

# ensure remote refs
git fetch origin || { Write-Error 'git fetch failed'; exit 1 }

# reset local main to remote main explicitly
git switch main
git reset --hard refs/remotes/origin/main || { Write-Error 'reset main failed'; exit 1 }

# create clean branch from remote main
git switch -C $branch refs/remotes/origin/main || { Write-Error "failed to create branch $branch"; exit 1 }

# read workflow file
if (-not (Test-Path $wf)) { Write-Error "Workflow file not found: $wf"; exit 1 }
$text = Get-Content $wf -Raw -Encoding UTF8
$lines = $text -split "\r?\n"

# find on: block start
$start = $null
for ($i=0; $i -lt $lines.Length; $i++) {
    if ($lines[$i] -match '^on:\s*$') { $start = $i; break }
}
if ($null -eq $start) { Write-Error 'on: block not found'; exit 1 }

# find end: next top-level key (non-indented line) after start
$end = $null
for ($j=$start+1; $j -lt $lines.Length; $j++) {
    $line = $lines[$j]
    if ($line -match '^\S') { $end = $j; break }
}
if ($null -eq $end) { $end = $lines.Length }

# build new on: block (LF endings) using single-quoted here-string to avoid parsing issues
$newOnText = @'
on:
    push:
        branches:
            - "validate/**"
            - "validate/*"
            - validate
            - validate/final-trigger-test
'@
$newOn = $newOnText -split "\r?\n"

# assemble new content: keep lines before start, then newOn, then remaining lines from end
$before = $lines[0..($start-1)]
$after = if ($end -lt $lines.Length) { $lines[$end..($lines.Length-1)] } else { @() }
$newLines = @()
if ($before) { $newLines += $before }
$newLines += $newOn
if ($after) { $newLines += $after }

# write back with UTF8 no BOM and LF
[System.IO.File]::WriteAllText($wf, ($newLines -join "`n"), [System.Text.Encoding]::UTF8)
Write-Output "Updated on: block in $wf"

# commit and push
git add $wf
git commit -m 'Fix trigger patterns for selfheal-validate workflow (clean rebuild)' || Write-Output 'no changes to commit'
git push -u origin $branch --force || { Write-Error 'git push failed'; exit 1 }

# create PR
$createOut = gh pr create --repo $repo --title '[self-heal] Fix trigger patterns (clean rebuild)' --body 'Ensure GitHub recognizes validate/** pushes.' --base main --head $branch --fill 2>&1
Write-Output $createOut
Start-Sleep -Seconds 2
# get PR number
$pr = $null
$text = $createOut -join "`n"
if ($text -match '/pull/(\d+)') { $pr = $Matches[1] } else { $pr = gh pr list --repo $repo --head $branch --json number --jq '.[0].number' 2>$null }
if (-not $pr) { Write-Error 'PR not found'; exit 1 }
Write-Output "PR_NUMBER=$pr"

# merge PR
$mergeOut = gh pr merge $pr --repo $repo --merge --delete-branch=false 2>&1
Write-Output $mergeOut

# sync main
git switch main
git fetch origin
git reset --hard refs/remotes/origin/main

# create test branch from remote main and force-push an empty commit
git switch -C $testBranch refs/remotes/origin/main
git commit --allow-empty -m 'Trigger selfheal-validate test (clean rebuild)' || Write-Output 'empty commit skipped'
git push origin $testBranch --force

# poll for run up to 12 times
$found = $false
$runInfo = $null
for ($i=0; $i -lt 12; $i++) {
    Write-Output "poll #$($i+1)"
    $runs = gh api repos/$repo/actions/runs --jq ".workflow_runs[] | select(.head_branch==\"$testBranch\") | {id:.id,status:.status,conclusion:.conclusion,created_at:.created_at} | @json" 2>$null
    if ($runs) {
        $r = $runs | ConvertFrom-Json
        $id = $r.id
        $status = $r.status
        $conclusion = $r.conclusion
        $jobs = gh api repos/$repo/actions/runs/$id/jobs --jq '.jobs | length' 2>$null
        $runInfo = @{ runId = $id; status = $status; conclusion = $conclusion; jobs_count = $jobs }
        Write-Output "FOUND runId=$id status=$status conclusion=$conclusion jobs_count=$jobs"
        $found = $true
        break
    }
    Start-Sleep -Seconds 8
}

if (-not $found) { Write-Output 'NO_RUN_DETECTED'; $runInfo = @{ runId = ''; status='none'; conclusion='none'; jobs_count=0 } }

# output summary
$summary = @{
    pr = $pr
    run = $runInfo
}
$summary | ConvertTo-Json -Depth 5 | Set-Content '.gh-run-scripts/clean_rebuild_summary.json'
Write-Output 'CLEAN_REBUILD_COMPLETE'
exit 0
