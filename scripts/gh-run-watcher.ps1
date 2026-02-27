<#
URMS-style gh-run watcher: clear responsibilities, durable, resumable.

Principles:
- Functions with single responsibility
- Robust `gh` invocation with retries and backoff
- Persistent state to resume interrupted runs
- Session-scoped logs and artifacts saved reliably
- No `exit` calls; script leaves session open
#>

param(
    [int]$MaxAttempts = 2,
    [int]$WorkflowId = 237401233,
    [string]$Branch = 'main',
    [int]$PollTimeoutSeconds = 35 * 60,
    [string]$StateFile = ".github/actions-runs/watcher-state.json",
    [string]$OutDirBase = ".github/actions-runs",
    [int]$GhMaxRetries = 5,
    [int]$GhBaseBackoffSeconds = 3
)

New-Item -ItemType Directory -Force -Path $OutDirBase | Out-Null
$SessionDir = Join-Path $OutDirBase ("session-$(Get-Date -Format 'yyyyMMdd-HHmmss')")
New-Item -ItemType Directory -Force -Path $SessionDir | Out-Null
$Global:LogFile = Join-Path $SessionDir ("watcher.log")

function URMS-WriteLog {
    param([string]$Message)
    $t = (Get-Date).ToString('s')
    $line = "[$t] $Message"
    try { Add-Content -Path $Global:LogFile -Value $line -Encoding UTF8 } catch { }
    Write-Host $line
}

function URMS-RunGh {
    param(
        [string]$GhArgs,
        [int]$MaxRetries = $GhMaxRetries,
        [int]$BaseBackoff = $GhBaseBackoffSeconds
    )
    for ($i=0; $i -lt $MaxRetries; $i++) {
        try {
            URMS-WriteLog "gh raw args: [$GhArgs] (attempt $($i+1))"
            $argArray = @()
            if ($GhArgs -ne $null -and $GhArgs.Trim().Length -gt 0) { $argArray = $GhArgs -split ' ' }
            URMS-WriteLog "gh argArray: [$($argArray -join '|')]"
            try {
                $output = & gh @argArray 2>&1
                $rc = $LASTEXITCODE
                $stdout = $output -as [string[]]
                $stderr = ''
            } catch {
                $stdout = @()
                $stderr = $_.Exception.Message
                $rc = 1
            }
        } catch {
            $stdout = $_.Exception.Message
            $stderr = ''
            $rc = 1
        }
        $outLines = @()
        if ($stdout) { $outLines += $stdout.TrimEnd("`n") }
        if ($stderr) { $outLines += $stderr.TrimEnd("`n") }
        if ($rc -eq 0) { return @{ rc = $rc; out = $outLines } }
        URMS-WriteLog "gh failed (rc=$rc). stderr: $stderr"
        $wait = [math]::Min(120, $BaseBackoff * [math]::Pow(2,$i))
        Start-Sleep -Seconds $wait
    }
    return @{ rc = 1; out = @("gh command failed after retries: gh $Args") }
}

function URMS-GetRepoSlug {
    try {
        $url = (git config --get remote.origin.url) -as [string]
        if (-not $url) { return $null }
        if ($url -match '[:/]([^/]+/[^/]+?)(?:\.git)?$') { return $matches[1] }
        return $null
    } catch { return $null }
}

function URMS-LoadState {
    param([string]$Path = $StateFile)
    if (Test-Path $Path) {
        try { return ConvertFrom-Json (Get-Content -Raw -Path $Path) } catch { URMS-WriteLog "state parse failed"; return $null }
    }
    return $null
}

function URMS-SaveState {
    param($Obj, [string]$Path = $StateFile)
    try { $json = $Obj | ConvertTo-Json -Depth 6; Set-Content -Path $Path -Value $json -Encoding UTF8 } catch { URMS-WriteLog "failed to save state: $($_.Exception.Message)" }
}

function Push-EmptyCommit {
    param([int]$Attempt)
    $msg = "ci: trigger smoke run attempt $Attempt $(Get-Date -Format o)"
    URMS-WriteLog "Push-EmptyCommit: $msg"
    try { git commit --allow-empty -m $msg 2>&1 | Out-Null } catch { URMS-WriteLog "git commit ignored or non-zero" }
    try { git push origin $Branch 2>&1 | Out-Null } catch { URMS-WriteLog "git push reported error (ignored)" }
}

function Detect-Run {
    param([string]$Sha, [int]$WorkflowId)
    $repo = URMS-GetRepoSlug
    if (-not $repo) { URMS-WriteLog 'Detect-Run: cannot determine repo slug'; return $null }
    URMS-WriteLog "Detect-Run: looking for run with sha=$Sha workflow=$WorkflowId"
    $callArgs = "api repos/$repo/actions/runs"
    $res = URMS-RunGh -GhArgs $callArgs
    if ($res.rc -ne 0 -or -not $res.out) { return $null }
    $text = $res.out -join "`n"
    try {
        $obj = ConvertFrom-Json $text -ErrorAction Stop
        $found = $obj.workflow_runs | Where-Object { $_.workflow_id -eq $WorkflowId -and $_.head_sha -eq $Sha } | Select-Object -First 1
        if ($found) { return $found.id }
    } catch {
        URMS-WriteLog "Detect-Run: failed to parse API response"
    }
    return $null
}

function Wait-ForCompletion {
    param([int]$RunId, [int]$TimeoutSeconds)
    $runDir = Join-Path $OutDirBase ("run-$RunId")
    New-Item -ItemType Directory -Force -Path $runDir | Out-Null
    $elapsed = 0
    while ($elapsed -lt $TimeoutSeconds) {
        $res = URMS-RunGh -GhArgs "run view $RunId --json status,conclusion"
        if ($res.rc -eq 0 -and $res.out) {
            $txt = $res.out -join "`n"
            try {
                $info = ConvertFrom-Json $txt -ErrorAction Stop
                $status = $info.status
                URMS-WriteLog "Wait-ForCompletion: run $RunId status: $status"
                if ($status -and $status -eq 'completed') { break }
            } catch { URMS-WriteLog "Wait-ForCompletion: parse error" }
        } else { URMS-WriteLog "Wait-ForCompletion: gh call failed" }
        Start-Sleep -Seconds 15
        $elapsed += 15
    }
    $final = URMS-RunGh -GhArgs "run view $RunId --json status,conclusion"
    return @{ final = ($final.out -join "`n"); dir = $runDir }
}

function Save-RunLogs {
    param([int]$RunId, [string]$RunDir)
    $logFile = Join-Path $RunDir 'log.txt'
    $resLog = URMS-RunGh -GhArgs "run view $RunId --log"
    try { Set-Content -Path $logFile -Value ($resLog.out -join "`n") -Encoding UTF8 } catch { URMS-WriteLog "Save-RunLogs failed: $($_.Exception.Message)" }
    return $logFile
}

function Save-Artifacts {
    param([int]$RunId, [string]$RunDir)
    $artifactList = Join-Path $RunDir 'artifacts-list.txt'
    $repo = URMS-GetRepoSlug
    if ($repo) {
        $resArtifacts = URMS-RunGh -GhArgs "api repos/$repo/actions/runs/$RunId/artifacts"
        if ($resArtifacts.rc -eq 0 -and $resArtifacts.out) {
            $txt = $resArtifacts.out -join "`n"
            try {
                $meta = ConvertFrom-Json $txt -ErrorAction Stop
                $lines = @()
                foreach ($a in $meta.artifacts) { $lines += ("$($a.name):$($a.id)") }
                Set-Content -Path $artifactList -Value ($lines -join "`n") -Encoding UTF8
            } catch { URMS-WriteLog "Save-Artifacts: parse artifact list failed" }
        }
    }
    $dl = URMS-RunGh -GhArgs "run download $RunId --dir '$RunDir'"
    if ($dl.rc -ne 0) { URMS-WriteLog "Save-Artifacts: download reported error" }
    return $artifactList
}

function Parse-SmokeResult {
    param([string]$RunDir)
    $smoke = Get-ChildItem -Path $RunDir -Recurse -Filter 'smoke-result.full.json' -ErrorAction SilentlyContinue | Select-Object -First 1
    if (-not $smoke) { return $null }
    $parsed = Join-Path $RunDir 'smoke-result.parsed.json'
    try {
        $json = Get-Content -Raw -Path $smoke.FullName
        $obj = ConvertFrom-Json $json -ErrorAction Stop
        $res = @{ pingOk = $obj.pingOk; internalErrors = $obj.internalErrors }
        Set-Content -Path $parsed -Value (ConvertTo-Json $res -Depth 6) -Encoding UTF8
        URMS-WriteLog "Parse-SmokeResult: parsed saved to $parsed"
        return $res
    } catch {
        URMS-WriteLog "Parse-SmokeResult: failed to parse - $($_.Exception.Message)"
        return $null
    }
}

function Update-State {
    param($KeyValues)
    $state = URMS-LoadState
    if (-not $state) { $state = @{} }
    foreach ($k in $KeyValues.Keys) { $state.$k = $KeyValues[$k] }
    $state.updated_at = (Get-Date).ToString('s')
    URMS-SaveState $state
}

function Restore-State {
    $s = URMS-LoadState
    if ($s) { URMS-WriteLog "Restore-State: loaded"; return $s }
    URMS-WriteLog "Restore-State: no state file"; return $null
}

# Main
URMS-WriteLog "Watcher start (MaxAttempts=$MaxAttempts WorkflowId=$WorkflowId Branch=$Branch)"
$state = Restore-State
if ($state -and $state.last_run_id) {
    URMS-WriteLog "Found saved run id: $($state.last_run_id); checking status"
    $resCheck = URMS-RunGh -GhArgs "run view $($state.last_run_id) --json status,conclusion"
    if ($resCheck.rc -eq 0 -and $resCheck.out) {
        $txt = $resCheck.out -join "`n"
        try { $info = ConvertFrom-Json $txt -ErrorAction Stop; $status = $info.status } catch { $status = $txt }
    } else { $status = $null }
    URMS-WriteLog "Saved run status: $status"
    if ($status -and $status -ne 'completed') {
        $poll = Wait-ForCompletion -RunId $state.last_run_id -TimeoutSeconds $PollTimeoutSeconds
        Save-RunLogs -RunId $state.last_run_id -RunDir $poll.dir | Out-Null
        Save-Artifacts -RunId $state.last_run_id -RunDir $poll.dir | Out-Null
        $parsed = Parse-SmokeResult -RunDir $poll.dir
        if ($parsed -and $parsed.pingOk -and (($parsed.internalErrors | Measure-Object).Count -eq 0)) {
            URMS-WriteLog "Restore-State: previous run satisfied success criteria"
            URMS-WriteLog "Watcher finished. Session will remain open."
            while ($true) { Start-Sleep -Seconds 60 }
        }
    }
}

$found = $false
for ($attempt=1; $attempt -le $MaxAttempts; $attempt++) {
    URMS-WriteLog "Attempt $attempt/$MaxAttempts"
    Push-EmptyCommit -Attempt $attempt
    $sha = (& git rev-parse --verify HEAD).Trim()
    URMS-WriteLog "pushed sha: $sha"
    Update-State @{ last_sha = $sha; last_attempt = $attempt }

    $runId = $null
    for ($i=0; $i -lt 24; $i++) {
        $runId = Detect-Run -Sha $sha -WorkflowId $WorkflowId
        if ($runId) { break }
        Start-Sleep -Seconds 5
    }
    if (-not $runId) { URMS-WriteLog "No run detected for sha $sha"; continue }
    URMS-WriteLog "Detected run id: $runId"
    Update-State @{ last_run_id = $runId }

    $poll = Wait-ForCompletion -RunId $runId -TimeoutSeconds $PollTimeoutSeconds
    URMS-WriteLog "Run completed: $($poll.final)"
    Save-RunLogs -RunId $runId -RunDir $poll.dir | Out-Null
    Save-Artifacts -RunId $runId -RunDir $poll.dir | Out-Null
    $parsed = Parse-SmokeResult -RunDir $poll.dir
    if ($parsed -and $parsed.pingOk -and (($parsed.internalErrors | Measure-Object).Count -eq 0)) {
        URMS-WriteLog "SUCCESS: run $runId meets criteria"
        $found = $true
        break
    } else {
        URMS-WriteLog "Attempt $attempt did not meet success criteria"
    }
}

if (-not $found) { URMS-WriteLog "No successful run after $MaxAttempts attempts" }
URMS-WriteLog "Watcher finished main flow. Session remains open. Use Ctrl+C to stop."
while ($true) { Start-Sleep -Seconds 60 }
