# runner_auto_start.ps1
# Dynamic runner starter for URMS
# - repo: infinityflip-maker/URMS
# - token: <TOKEN_PLACEHOLDER>  <-- replace before use
# - run.cmd path: D:\GitHub\URMS\actions-runner\run.cmd
# - polling interval: 5 seconds
# - log: runner_auto_start.log (located next to this script)

$RepoOwner   = 'infinityflip-maker'
$RepoName    = 'URMS'
$Token       = '<TOKEN_PLACEHOLDER>'
$RunnerRoot  = 'D:\GitHub\URMS\actions-runner'
$RunCmd      = Join-Path $RunnerRoot 'run.cmd'
$PollSeconds = 5
$ScriptDir   = Split-Path -Parent $MyInvocation.MyCommand.Path
$Log         = Join-Path $ScriptDir 'runner_auto_start.log'
$PidFile     = Join-Path $ScriptDir 'runner_auto_start.pid'

# HTTP / API tuning
$RateLimitThreshold = 10
$MaxHttpRetries = 5
$InitialBackoffSeconds = 2
$MaxRestartAttempts = 5
$MaxBackoffSeconds = 600
$CacheTTLSeconds = 15

# Load config if present
try {
    $cfgPath = Join-Path $ScriptDir 'runner_auto_start.config.json'
    if (Test-Path $cfgPath) {
        $cfg = Get-Content $cfgPath -Raw | ConvertFrom-Json -ErrorAction SilentlyContinue
        if ($cfg.maxRestartAttempts) { $MaxRestartAttempts = [int]$cfg.maxRestartAttempts }
        if ($cfg.initialBackoffSeconds) { $InitialBackoffSeconds = [int]$cfg.initialBackoffSeconds }
        if ($cfg.maxBackoffSeconds) { $MaxBackoffSeconds = [int]$cfg.maxBackoffSeconds }
        if ($cfg.cacheTTLSeconds) { $CacheTTLSeconds = [int]$cfg.cacheTTLSeconds }
    }
} catch { Log 'WARN' "Failed loading config: $($_.Exception.Message)" }
$JsonLog     = Join-Path $ScriptDir 'runner_auto_start.json.log'
$MaxLogSizeBytes = 5MB

# simple in-memory cache for API responses
$CachedRunResponse = $null
$CachedRunTimestamp = $null

$StatusFile = Join-Path $ScriptDir 'runner_auto_start.status.json'

function Write-Status {
    param([string]$State, [string]$Message = $null, [int]$ExitCode = $null)
    $obj = @{ state = $State; timestamp = (Get-Date).ToString('o'); last_success = $null; last_error = $null }
    if (Test-Path $StatusFile) {
        try { $cur = Get-Content $StatusFile -Raw | ConvertFrom-Json -ErrorAction SilentlyContinue } catch { $cur = $null }
        if ($cur -and $cur.last_success) { $obj.last_success = $cur.last_success }
        if ($cur -and $cur.last_error) { $obj.last_error = $cur.last_error }
    }
    # attach latest test result if present in test-results directory
    try {
        $trDir = Join-Path $ScriptDir 'test-results'
        if (Test-Path $trDir) {
            $latestFile = Get-ChildItem -Path $trDir -File -ErrorAction SilentlyContinue | Sort-Object LastWriteTime -Descending | Select-Object -First 1
            if ($latestFile) { $latest = Get-Content $latestFile.FullName -Raw | ConvertFrom-Json -ErrorAction SilentlyContinue; if ($latest) { $obj.last_test_result = $latest } }
        }
    } catch { Log 'WARN' "Processing retry-queue failed: $($_.Exception.Message)" }
    if ($State -eq 'Idle' -and $ExitCode -eq 0) { $obj.last_success = (Get-Date).ToString('o') }
    if ($State -eq 'Error') { $obj.last_error = @{ time = (Get-Date).ToString('o'); message = $Message; exit_code = $ExitCode } }
    try { $obj | ConvertTo-Json -Compress | Out-File -FilePath $StatusFile -Encoding utf8 -Force } catch { Log 'WARN' "Write-Status failed: $($_.Exception.Message)" }
}

function Log-Exception {
    param([System.Exception]$Ex)
    try {
        $obj = @{ timestamp = (Get-Date).ToString('o'); level = 'ERROR'; message = $Ex.Message; type = $Ex.GetType().FullName; stack = ($Ex.StackTrace -replace "\r|\n"," | "); pid = $PID }
        $json = $obj | ConvertTo-Json -Compress
        Ensure-Log-Rotation -Path $JsonLog
        Add-Content -Path $JsonLog -Value $json -ErrorAction SilentlyContinue
        Add-Content -Path $Log -Value ("[" + (Get-Date -Format 'yyyy-MM-dd HH:mm:ss') + "] [ERROR] " + $Ex.Message) -ErrorAction SilentlyContinue
    } catch { Write-Warning "Log-Exception failed: $($_.Exception.Message)" }
}

function Rotate-File {
    param([string]$Path, [int]$MaxVersions = 5)
    try {
        if (-not (Test-Path $Path)) { return }
        for ($i = $MaxVersions - 1; $i -ge 1; $i--) {
            $src = "${Path}.${i}"
            $dst = "${Path}.$($i + 1)"
            if (Test-Path $src) { Remove-Item -Path $dst -ErrorAction SilentlyContinue; Rename-Item -Path $src -NewName (Split-Path $dst -Leaf) -ErrorAction SilentlyContinue }
        }
        $first = "${Path}.1"
        Remove-Item -Path $first -ErrorAction SilentlyContinue
        Rename-Item -Path $Path -NewName (Split-Path $first -Leaf) -ErrorAction SilentlyContinue
    } catch { Write-Warning "Rotate-File failed: $($_.Exception.Message)" }
}

function Ensure-Log-Rotation {
    param([string]$Path)
    try {
        if (Test-Path $Path) {
            $fi = Get-Item $Path
            if ($fi.Length -gt $MaxLogSizeBytes) { Rotate-File -Path $Path -MaxVersions 5 }
        }
    } catch { Write-Warning "Ensure-Log-Rotation failed: $($_.Exception.Message)" }
}

function Log {
    param([ValidateSet('INFO','WARN','ERROR')] [string]$Level, [string]$Msg, [hashtable]$Meta = $null)
    $t = Get-Date -Format 'yyyy-MM-dd HH:mm:ss'
    $line = "[$t] [$Level] $Msg"
    try { 
        Ensure-Log-Rotation -Path $Log
        Add-Content -Path $Log -Value $line -ErrorAction SilentlyContinue
    } catch { Write-Warning "Log write failed: $($_.Exception.Message)" }

    # JSON line (structured logging)
    try {
        Ensure-Log-Rotation -Path $JsonLog
        $obj = @{ timestamp = (Get-Date).ToString('o'); level = $Level; message = $Msg; pid = $PID }
        if ($Meta) { foreach ($k in $Meta.Keys) { $obj[$k] = $Meta[$k] } }
        $json = $obj | ConvertTo-Json -Compress
        Add-Content -Path $JsonLog -Value $json -ErrorAction SilentlyContinue
    } catch { Write-Warning "Structured log write failed: $($_.Exception.Message)" }
}

function Safe-Invoke-RestMethod {
    param([string]$Uri, [hashtable]$Headers, [int]$MaxRetries = $MaxHttpRetries)
    $attempt = 0
    $delay = $InitialBackoffSeconds
    while ($attempt -le $MaxRetries) {
        try {
            $attempt++
            $resp = Invoke-WebRequest -Uri $Uri -Headers $Headers -UseBasicParsing -ErrorAction Stop

            # Rate-limit handling
            try {
                $remaining = $null
                if ($resp.Headers.'X-RateLimit-Remaining') { $remaining = [int]$resp.Headers.'X-RateLimit-Remaining' }
                if ($remaining -ne $null -and $remaining -le $RateLimitThreshold) {
                    Log 'WARN' "Low GitHub rate-limit remaining=${remaining}; backing off for ${delay}s"
                    Start-Sleep -Seconds $delay
                    $delay = [math]::Min($delay * 2, 600)
                }
            } catch { Write-Warning "Safe-Invoke-RestMethod rate-limit handling failed: $($_.Exception.Message)" }

            if ($resp.StatusCode -ge 200 -and $resp.StatusCode -lt 300) {
                if ($resp.Content) { return $resp.Content | ConvertFrom-Json }
                return $null
            }
            if ($resp.StatusCode -eq 404) { Log 'WARN' "GitHub API returned 404 for ${Uri}"; return $null }
            if ($resp.StatusCode -in 429,500,502,503,504) {
                Log 'WARN' "HTTP transient response ${($resp.StatusCode)}; attempt ${attempt} of ${MaxRetries}"
                if ($attempt -gt $MaxRetries) { Log 'ERROR' "Exceeded retries for ${Uri}"; throw }
                $jitter = Get-Random -Minimum 0 -Maximum $delay
                Start-Sleep -Seconds ($delay + $jitter)
                $delay = [math]::Min($delay * 2, 600)
                continue
            }
            Log 'ERROR' "HTTP request unexpected status ${($resp.StatusCode)} for ${Uri}"; throw
        } catch {
            $err = $_.Exception.Message
            if ($err -match '401|403') { Log 'ERROR' "GitHub API auth error: ${err}"; exit 2 }
            if ($attempt -gt $MaxRetries) { Log 'ERROR' "Request failed after ${MaxRetries} attempts: ${err}"; throw }
            Log 'WARN' "Request error attempt ${attempt} of ${MaxRetries}: ${err}"
            Start-Sleep -Seconds $delay
            $delay = [math]::Min($delay * 2, 600)
            continue
        }
    }
}

# single-instance guard via pidfile
if (Test-Path ${PidFile}) {
    try {
        $old = (Get-Content -Path ${PidFile} -ErrorAction SilentlyContinue) -as [int]
        if ($old) {
            if (Get-Process -Id $old -ErrorAction SilentlyContinue) {
                Log 'INFO' "runner_auto_start already running (pid=${old}), exiting"
                exit 0
            } else { Remove-Item -Path ${PidFile} -ErrorAction SilentlyContinue }
        }
    } catch { Remove-Item -Path ${PidFile} -ErrorAction SilentlyContinue }
}

# write our pid and ensure cleanup on exit
try {
    $PID | Out-File -FilePath ${PidFile} -Encoding utf8
} catch { Log 'WARN' "Writing pid file failed: $($_.Exception.Message)" }
    try {
        Log 'INFO' 'Starting runner_auto_start loop'
    # Validate state transitions at startup
    try {
        $chk = & (Join-Path $ScriptDir 'check_state_transitions.ps1')
        if ($LASTEXITCODE -ne 0) {
            Log 'WARN' 'State transition check failed at startup; invoking selfheal upload'
            try { $zip = & (Join-Path $ScriptDir 'collect-runner-logs.ps1') -RunnerDir $RunnerRoot -OutDir $ScriptDir; if ($zip) { & (Join-Path $ScriptDir 'upload-runner-logs.ps1') -ZipPath $zip -Endpoint 'https://selfheal.example.local/upload' -Token $Token -CertMode 'Relaxed' } } catch { Log 'WARN' "Startup selfheal upload failed: $($_.Exception.Message)" }
        }
    } catch { Log 'WARN' "Startup main block failed: $($_.Exception.Message)" }
    Write-Status -State 'Idle'
    # process any queued uploads at startup
    try {
        $queueDir = Join-Path $ScriptDir 'retry-queue'
        if (Test-Path $queueDir) {
            $files = Get-ChildItem -Path $queueDir -File -ErrorAction SilentlyContinue | Sort-Object LastWriteTime
            foreach ($f in $files) {
                try {
                    $zipPath = $f.FullName
                    Log 'INFO' "Processing queued zip: $($f.Name)"
                    $uploadOut = & (Join-Path $ScriptDir 'upload-runner-logs.ps1') -ZipPath $zipPath -Endpoint 'https://selfheal.example.local/upload' -Token $Token -CertMode 'Relaxed'
                    # parse server response and run schema check; uploader will perform deletion/index update when schema valid
                    try {
                        $parsed = $null
                        try { $parsed = $uploadOut | ConvertFrom-Json -ErrorAction SilentlyContinue } catch { $parsed = $null }
                        # run schema checker to ensure server response conforms
                        $checker = Join-Path $ScriptDir 'check-upload-response-schema.ps1'
                        if (Test-Path $checker) {
                            $checkOut = & $checker -ResponseJson $uploadOut -QueueDir $queueDir
                            $checkCode = $LASTEXITCODE
                            # Small retry loop to read last_schema_check.json written by the checker
                            $schemaDetail = $null
                            $schemaFile = Join-Path $queueDir 'last_schema_check.json'
                            for ($si = 0; $si -lt 3; $si++) {
                                if (Test-Path $schemaFile) {
                                    try { $schemaDetail = Get-Content $schemaFile -Raw | ConvertFrom-Json -ErrorAction SilentlyContinue; break } catch { Write-Warning "runner_auto_start: reading last_schema_check.json failed: $($_.Exception.Message)" }
                                }
                                Start-Sleep -Milliseconds 100
                            }
                            if ($checkCode -ne 0) {
                                Log 'WARN' "Schema check failed for $($f.Name); invoking selfheal path" @{ zip = $f.Name; schema = $checkOut }
                                try {
                                    $zip = & (Join-Path $ScriptDir 'collect-runner-logs.ps1') -RunnerDir $RunnerRoot -OutDir $ScriptDir
                                    if ($zip -and (Test-Path $zip)) {
                                        & (Join-Path $ScriptDir 'upload-runner-logs.ps1') -ZipPath $zip -Endpoint 'https://selfheal.example.local/upload' -Token $Token -CertMode 'Relaxed'
                                    }
                                } catch { Log 'WARN' "Selfheal upload failed: $($_.Exception.Message)" }
                            } else {
                                # schema valid — uploader handles deletion; log server intent
                                if ($parsed -and $parsed.ok -eq $true -and $parsed.delete -eq $true) {
                                    Log 'INFO' "Server requested delete for queued zip $($f.Name); uploader should have removed it" @{ zip = $f.Name }
                                } else {
                                    Log 'INFO' "Server did not request deletion for $($f.Name); file retained" @{ zip = $f.Name; response = $uploadOut }
                                }
                            }
                        } else {
                            Log 'WARN' "Schema checker not found; cannot validate response for $($f.Name)" @{ zip = $f.Name }
                        }
                    } catch { Log 'WARN' "Error parsing or validating upload response for $($f.Name): $($_.Exception.Message)" }
                } catch { Log 'WARN' "Queued upload failed for $($f.Name): $($_.Exception.Message)" }
            }
            # refresh index (ensure files always an array)
                try {
                $items = @(Get-ChildItem -Path $queueDir -File -ErrorAction SilentlyContinue | Select-Object -ExpandProperty Name)
                $index = @{ count = ($items | Measure-Object).Count; files = @($items); updated = (Get-Date).ToString('o') }
                $index | ConvertTo-Json -Compress | Out-File -FilePath (Join-Path $queueDir 'index.json') -Encoding utf8 -Force
            } catch { Log 'WARN' "Failed updating retry-queue index.json: $($_.Exception.Message)" }
        }
    } catch { Log 'WARN' "Processing startup queue block failed: $($_.Exception.Message)" }
    while ($true) {
        try {
            $uri = "https://api.github.com/repos/${RepoOwner}/${RepoName}/actions/runs?event=workflow_dispatch&per_page=1"
            $hdr = @{ Authorization = "token ${Token}"; 'User-Agent' = 'runner-auto-start' }

            # Use cached response when fresh to reduce API calls
            $useCache = $false
            if ($CachedRunResponse -ne $null -and $CachedRunTimestamp -ne $null) {
                $age = (Get-Date) - $CachedRunTimestamp
                if ($age.TotalSeconds -lt $CacheTTLSeconds) { $useCache = $true }
            }
            if ($useCache) {
                $resp = $CachedRunResponse
            } else {
                $resp = Safe-Invoke-RestMethod -Uri $uri -Headers $hdr -MaxRetries 3
                if ($resp) { $CachedRunResponse = $resp; $CachedRunTimestamp = Get-Date }
            }
            $run = $null
            if ($resp -and $resp.workflow_runs) { $run = $resp.workflow_runs | Select-Object -First 1 }

            if ($run -and $run.status -eq 'queued') {
                Log 'INFO' "Detected queued workflow run id=$($run.id). Preparing to start runner."
                Write-Status -State 'Waiting'

                # Pre-start health checks
                if (-not (Test-Path $RunnerRoot)) {
                    Log 'ERROR' "Runner root not found at $RunnerRoot; will retry later"
                    Start-Sleep -Seconds 10
                    continue
                }
                if (-not (Test-Path $RunCmd)) {
                    Log 'ERROR' "run.cmd not found at $RunCmd; will retry later"
                    Start-Sleep -Seconds 10
                    continue
                }
                if (Get-Process -Name 'Runner.Listener' -ErrorAction SilentlyContinue) {
                    Log 'WARN' 'Runner.Listener already running; skipping start'
                    Start-Sleep -Seconds 10
                    continue
                }

                # start run.cmd and capture process
                Log 'INFO' "Starting run.cmd"
                Write-Status -State 'Running'
                try {
                    $p = Start-Process -FilePath $RunCmd -WorkingDirectory $RunnerRoot -WindowStyle Hidden -PassThru
                } catch {
                    Log 'ERROR' "Failed to start run.cmd: $($_.Exception.Message)"
                    Write-Status -State 'Error' -Message "Failed to start run.cmd: $($_.Exception.Message)"
                    Start-Sleep -Seconds 10
                    continue
                }
                if (-not $p) { Log 'ERROR' 'Failed to start run.cmd (no process returned)'; Start-Sleep -Seconds 10; continue }

                # wait for Runner.Listener process to appear then exit
                Log 'INFO' 'Waiting for Runner.Listener process to appear (timeout 300s)'
                $listenerWait = 0
                while (-not (Get-Process -Name 'Runner.Listener' -ErrorAction SilentlyContinue)) {
                    Start-Sleep -Seconds 1
                    $listenerWait++
                    if ($listenerWait -gt 300) {
                        Log 'WARN' 'Runner.Listener did not appear within 300s; continuing to monitor'
                        break
                    }
                }
                if (Get-Process -Name 'Runner.Listener' -ErrorAction SilentlyContinue) {
                    Log 'INFO' 'Runner.Listener detected; waiting for it to exit'
                } else {
                    Log 'WARN' 'Runner.Listener not detected after start; will monitor starter process instead'
                }

                # wait either for Runner.Listener processes to exit or for starter $p to exit
                try {
                    while ($true) {
                        $rl = Get-Process -Name 'Runner.Listener' -ErrorAction SilentlyContinue
                        if (-not $rl) { break }
                        Start-Sleep -Seconds 1
                    }
                } catch { Log 'WARN' "Runner.Listener wait loop interrupted: $($_.Exception.Message)" }

                # attempt to gather exit info from starter process
                $exitInfo = $null
                $exitCode = $null
                try {
                    $p.Refresh()
                    if ($p.HasExited) { $exitCode = $p.ExitCode; $exitInfo = "ExitCode=$exitCode" } else { $exitInfo = 'starter-process still running' }
                } catch { Log 'WARN' "Failed gathering starter process exit info: $($_.Exception.Message)" }

                if (-not (Get-Process -Name 'Runner.Listener' -ErrorAction SilentlyContinue)) {
                    if ($exitInfo) {
                        if ($exitCode -ne $null) {
                            if ($exitCode -eq 0) {
                                Log 'INFO' "Runner.Listener exited; ${exitInfo}" @{ run_id = $run.id }
                                Write-Status -State 'Idle' -ExitCode 0
                            } else {
                                Log 'ERROR' "Runner.Listener/starter exited abnormally; ${exitInfo}" @{ run_id = $run.id; exit_code = $exitCode }
                                Write-Status -State 'Error' -Message "Starter exited abnormally" -ExitCode $exitCode
                                # collect logs for selfheal and upload to selfheal endpoint; if upload fails, uploader will queue
                                try {
                                    $zip = & (Join-Path $ScriptDir 'collect-runner-logs.ps1') -RunnerDir $RunnerRoot -OutDir $ScriptDir -ExitCode $exitCode
                                    if ($zip -and (Test-Path $zip)) {
                                        try { $uploadResp = & (Join-Path $ScriptDir 'upload-runner-logs.ps1') -ZipPath $zip -Endpoint 'https://selfheal.example.local/upload' -Token $Token -CertMode 'Relaxed' } catch { Log 'WARN' "upload-runner-logs failed: $($_.Exception.Message)" }
                                        if ($uploadResp) { Log 'INFO' "upload-runner-logs response: $uploadResp" @{ zip = (Split-Path $zip -Leaf) } }
                                    }
                                } catch { Log 'WARN' "collect-runner-logs failed: $($_.Exception.Message)" }
                                # auto-restart policy: exponential backoff for non-zero exit
                                $retryDelay = $InitialBackoffSeconds
                                for ($rAttempt = 1; $rAttempt -le $MaxRestartAttempts; $rAttempt++) {
                                    Log 'WARN' "Attempting auto-restart ${rAttempt} after ${retryDelay}s"
                                    Start-Sleep -Seconds $retryDelay
                                    try {
                                        $p2 = Start-Process -FilePath $RunCmd -WorkingDirectory $RunnerRoot -WindowStyle Hidden -PassThru -ErrorAction Stop
                                        Log 'INFO' 'Auto-restart started'
                                        break
                                    } catch {
                                        Log 'ERROR' "Auto-restart failed: $($_.Exception.Message)"
                                        $retryDelay = [math]::Min($retryDelay * 2, $MaxBackoffSeconds)
                                    }
                                }
                            }
                        } else {
                            Log 'INFO' "Runner.Listener exited; ${exitInfo}" @{ run_id = $run.id }
                            Write-Status -State 'Idle'
                        }
                    } else { Log 'INFO' 'Runner.Listener exited; no exit info available' @{ run_id = $run.id }; Write-Status -State 'Idle' }
                } else {
                    Log 'WARN' 'Runner.Listener still present after wait loop' @{ run_id = $run.id }
                    Write-Status -State 'Running'
                }
            } else {
                Start-Sleep -Seconds ${PollSeconds}
            }
            } catch {
            Log-Exception $_.Exception
            Start-Sleep -Seconds 10
        }
    }
}

# Integration notes (URMS selfheal)
# - Auto-restart: selfheal can monitor runner_auto_start.log and, on detection of repeated ERROR/WARN patterns,
#   invoke `shutdown`/`restart` of the runner host or re-run `run_runner_auto_start.cmd`.
# - Auto-log-collection: expose an endpoint or implement a small uploader that zips `runner_auto_start.log` and
#   artifacts under the runner folder and POSTs to the URMS selfheal collection API when an error occurs.
# - Auto-artifact-upload: after selfheal repairs (Phase4), upload the `runner_auto_start.log` and `selfheal` artifacts
#   to the GitHub Actions run as additional artifacts using the existing selfheal workflow helpers.
# Minimal integration points: add hooks in selfheal to call `powershell -File actions-runner\collect-runner-logs.ps1`
# which packages logs and calls the Release / artifact upload helper.

finally {
    try { Remove-Item -Path ${PidFile} -ErrorAction SilentlyContinue } catch { Write-Warning "Removing pid file failed: $($_.Exception.Message)" }
}
