param(
  [switch]$Detached
)
set-strictmode -Version Latest

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Definition
$RepoRoot = (Resolve-Path (Join-Path $ScriptDir '..\..') | ForEach-Object { $_.ProviderPath })
Push-Location $RepoRoot

# Self-detach so the script can continue after the invoking terminal is closed.
if(-not $Detached){
  $pwshCmd = (Get-Command pwsh -ErrorAction SilentlyContinue).Source
  if(-not $pwshCmd){ $pwshCmd = (Get-Command powershell -ErrorAction SilentlyContinue).Source }
  if($pwshCmd){
    $args = "-NoProfile -ExecutionPolicy Bypass -File \"$($MyInvocation.MyCommand.Definition)\" -Detached"
    Start-Process -FilePath $pwshCmd -ArgumentList $args -WindowStyle Hidden | Out-Null
    Write-Output "Orchestrator launched in background via $pwshCmd; exiting parent process.";
    Exit 0
  } else {
    Write-Output "pwsh/powershell not found in PATH; continuing in-process.";
  }
}

$LockFile = Join-Path $RepoRoot 'scripts/orchestrator/orchestrator.lock'
$StateFile = Join-Path $RepoRoot 'scripts/orchestrator/state.json'
$LogDir = Join-Path $RepoRoot 'logs'
# ensure orchestrator directory exists for lock/state
$OrchDir = Join-Path $RepoRoot 'scripts/orchestrator'
if(-not (Test-Path $OrchDir)){ New-Item -Path $OrchDir -ItemType Directory -Force | Out-Null }
if(-not (Test-Path $LogDir)){ New-Item -Path $LogDir -ItemType Directory | Out-Null }
$LogFile = Join-Path $LogDir ("playwright-smoke-orchestrator-{0}.log" -f (Get-Date -Format yyyyMMdd))

function Log([string]$msg){
  $t = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
  $line = "[$t] $msg"
  Add-Content -Path $LogFile -Value $line
  Write-Output $line
}

function Write-State($attempt,$runId,$status,$conclusion){
  $state = @{ attempt = $attempt; runId = $runId; status = $status; conclusion = $conclusion; updated = (Get-Date).ToString('o') }
  $state | ConvertTo-Json | Set-Content -Path $StateFile -Encoding UTF8
}

# Single instance
if(Test-Path $LockFile){
  try{
    $old = Get-Content $LockFile -ErrorAction SilentlyContinue
    if($old){
      $pid = [int]$old
      try{ Get-Process -Id $pid -ErrorAction Stop | Out-Null; Log("Orchestrator already running with PID $pid; exiting."); Exit 0 } catch { Log("Stale lockfile (PID $pid not running). Continuing and replacing lock.") }
    }
  } catch { }
}

# Write own PID to lock
$MyPid = $PID
# ensure lockfile directory exists
$LockDir = Split-Path -Parent $LockFile
if(-not (Test-Path $LockDir)){ New-Item -Path $LockDir -ItemType Directory -Force | Out-Null }
Set-Content -Path $LockFile -Value $MyPid
Log("Orchestrator started. PID=$MyPid")

try{
  $repo = 'infinityjp-maker/URMS'
  $branch = 'temp/disable-cdp'
  $workflowName = 'Playwright Smoke (PR)'
  $maxAttempts = 3
  $pollInterval = 15
  $perAttemptTimeout = 600
  $apiRetryMax = 3
  $apiRetryDelay = 2

  for($attempt=1;$attempt -le $maxAttempts;$attempt++){
    Log("--- Attempt $attempt START ---")
    # empty commit and push
    try{
      git checkout $branch 2>$null | Out-Null
      git commit --allow-empty -m "ci: retry Playwright smoke run (attempt $attempt)" 2>$null | Out-Null
      git push origin HEAD:$branch 2>&1 | ForEach-Object { Log("[git] $_") }
    } catch {
      Log("Git push failed: $($_.Exception.Message)")
    }

    # get runs (with API retries)
    $runsJson = $null
    for($i=1;$i -le $apiRetryMax;$i++){
      Log("API fetch attempt $i/$apiRetryMax for runs (branch=$branch)")
      $out = gh run list --repo $repo --branch $branch --limit 50 --json databaseId,workflowName,status,conclusion,createdAt 2>$null
      if($out -and $out.Trim() -ne ''){
        try{ $runsJson = $out | ConvertFrom-Json; break } catch { Log("Failed parsing JSON on attempt $i") }
      }
      Start-Sleep -Seconds $apiRetryDelay
    }
    if(-not $runsJson){
      Log("Failed to fetch runs JSON after $apiRetryMax attempts. Marking attempt as failed.")
      Write-State $attempt 0 'no_run' 'json_empty'
      Log("--- Attempt $attempt END (no run) ---")
      continue
    }

    # choose run
    $pw = $runsJson | Where-Object { $_.workflowName -eq $workflowName } | Sort-Object createdAt -Descending | Select-Object -First 1
    if(-not $pw){ $pw = $runsJson | Sort-Object createdAt -Descending | Select-Object -First 1 }
    if(-not $pw){
      Log("No run found after listing; failing attempt.")
      Write-State $attempt 0 'no_run' 'none'
      Log("--- Attempt $attempt END (no run) ---")
      continue
    }

    $runId = $pw.databaseId
    Log("Monitoring run ID $runId (workflow: $($pw.workflowName))")
    $start = Get-Date
    $elapsed = 0
    $completed = $false
    $view = $null

    while($elapsed -lt $perAttemptTimeout){
      # view with retry
      for($j=1;$j -le $apiRetryMax;$j++){
        $outv = gh run view $runId --repo $repo --json status,conclusion 2>$null
        if($outv -and $outv.Trim() -ne ''){ try{ $view = $outv | ConvertFrom-Json; break } catch { Log("Failed parse run view JSON on try $j") } }
        Start-Sleep -Seconds $apiRetryDelay
      }
      if(-not $view){ Log("gh run view returned empty after $apiRetryMax tries; will continue polling"); Start-Sleep -Seconds $pollInterval; $elapsed = (Get-Date -UFormat %s) - (Get-Date $start -UFormat %s); continue }

      Log("Run ID=$runId status=$($view.status) conclusion=$($view.conclusion)")
      if($view.status -eq 'completed'){
        $completed = $true
        break
      }
      Start-Sleep -Seconds $pollInterval
      $elapsed = (Get-Date -UFormat %s) - (Get-Date $start -UFormat %s)
    }

    if(-not $completed){
      Log("Polling timed out after $perAttemptTimeout seconds for run $runId. Marking attempt failed.")
      Write-State $attempt $runId 'timeout' ''
      Log("--- Attempt $attempt END (timeout) ---")
      continue
    }

    # completed
    Log("Run completed: runId=$runId conclusion=$($view.conclusion)")
    Write-State $attempt $runId $view.status $view.conclusion
    if($view.conclusion -eq 'success'){
      Log("SUCCESS on attempt $attempt. Exiting with code 0.")
      Remove-Item -Path $LockFile -ErrorAction SilentlyContinue
      Exit 0
    } else {
      Log("Attempt $attempt concluded with non-success: $($view.conclusion)")
      Log("--- Attempt $attempt END (non-success) ---")
      continue
    }
  }

  Log("All $maxAttempts attempts completed without success. Exiting with code 1.")
  Remove-Item -Path $LockFile -ErrorAction SilentlyContinue
  Exit 1

} finally {
  if(Test-Path $LockFile){ Remove-Item -Path $LockFile -ErrorAction SilentlyContinue }
  Pop-Location
}
