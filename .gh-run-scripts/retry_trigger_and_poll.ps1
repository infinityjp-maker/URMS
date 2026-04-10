# Retry trigger and poll for selfheal-validate run
$repo = 'infinityjp-maker/URMS'
$testBranch = 'validate/final-trigger-test'
$maxAttempts = 3
$maxPolls = 12
$pollInterval = 8

$result = @{ attempts = @(); found = $false; run = $null }

# ensure main is synced
Write-Output 'Fetching origin and syncing main...'
git fetch origin || { Write-Error 'git fetch failed'; exit 1 }
git switch main
git reset --hard refs/remotes/origin/main

# prepare test branch from remote main
git switch -C $testBranch refs/remotes/origin/main

for ($a=1; $a -le $maxAttempts; $a++) {
    $attempt = @{ attempt = $a; pushed = $false; polls = @(); found = $false }
    Write-Output ("Attempt {0}: creating empty commit and pushing to {1}" -f $a, $testBranch)
    git commit --allow-empty -m "Retry trigger for selfheal-validate (attempt $a)" || Write-Output 'empty commit skipped'
    $pushOut = git push origin $testBranch --force 2>&1
    if ($LASTEXITCODE -ne 0) { Write-Output "git push failed: $pushOut" }
    else { $attempt.pushed = $true }

    # poll up to $maxPolls
    for ($p=1; $p -le $maxPolls; $p++) {
        Write-Output "poll #$p for attempt $a"
        $jqTemplate = @'
    .workflow_runs[] | select(.head_branch=="<<BRANCH>>" and .event=="push") | {id:.id,status:.status,conclusion:.conclusion,created_at:.created_at} | @json
'@
        $jq = $jqTemplate -replace '<<BRANCH>>', $testBranch
        $runs = gh api repos/$repo/actions/runs --jq $jq 2>$null
        if ($runs) {
            # take first matching run
            $first = $runs -split "\r?\n" | Select-Object -First 1
            $obj = $first | ConvertFrom-Json
            $id = $obj.id
            $status = $obj.status
            $conclusion = $obj.conclusion
            $jobs = gh api repos/$repo/actions/runs/$id/jobs --jq '.jobs | length' 2>$null
            $attempt.found = $true
            $attempt.run = @{ runId = $id; status = $status; conclusion = $conclusion; jobs_count = ($jobs -as [int]) }
            $result.found = $true
            $result.run = $attempt.run
            $attempt.polls += @{ poll = $p; timestamp = (Get-Date).ToString('o'); note = 'found' }
            Write-Output "FOUND runId=$id status=$status conclusion=$conclusion jobs_count=$jobs"
            break
        } else {
            $attempt.polls += @{ poll = $p; timestamp = (Get-Date).ToString('o'); note = 'not found' }
            Start-Sleep -Seconds $pollInterval
        }
    }

    $result.attempts += $attempt
    if ($attempt.found) { break }
}

# write summary
$summary = @{ attempts = $result.attempts; found = $result.found; run = $result.run }
$summary | ConvertTo-Json -Depth 6 | Set-Content '.gh-run-scripts/retry_trigger_summary.json'
Write-Output 'RETRY_COMPLETE'
Write-Output (ConvertTo-Json $summary -Depth 6)
exit 0
