<#
auto_install_runner_v23110.ps1
Automate removal of existing runner, GitHub-side cleanup, download v2.311.0, configure and install as service (svc.cmd), and verify Online.

USAGE (run as Administrator):
  pwsh -NoProfile -File .gh-run-scripts\selfhosted_repair\auto_install_runner_v23110.ps1

This script will:
 - remove local D:\GitHub\URMS\actions-runner if present
 - remove repo/organization runners via GitHub API (requires PAT)
 - download release v2.311.0 actions-runner-win-x64 zip and extract to actions-runner
 - request a registration token and run config.cmd --unattended
 - run svc.cmd install/start
 - poll GitHub until runner appears Online

SECURITY: You will be prompted for a GitHub PAT. Do not share it.
#>

param(
    [string] $RunnerRoot = "D:\GitHub\URMS\actions-runner",
    [string] $RepoOwner = "infinityjp-maker",
    [string] $RepoName = "URMS",
    [int] $PollIntervalSeconds = 10,
    [int] $TimeoutMinutes = 10
)

# Ensure we operate outside the runner folder and remove/recreate it early
Set-Location "D:\GitHub\URMS"

# Logging helpers
function Log-Info([string]$m) { Write-Host "[INFO] $m" }
function Log-Warn([string]$m) { Write-Warning "[WARN] $m" }
function Log-Err([string]$m) { Write-Error "[ERROR] $m" }
function Log-Succ([string]$m) { Write-Host "[OK] $m" -ForegroundColor Green }

# GitHub API helper with simple retry and status handling
function Invoke-GitHubApiWithRetry {
    param(
        [string]$Method = 'GET',
        [string]$Uri,
        [hashtable]$Headers,
        $Body = $null,
        [int]$MaxRetries = 3
    )
    for ($attempt=0; $attempt -le $MaxRetries; $attempt++) {
        try {
            if ($Body -ne $null) {
                return Invoke-RestMethod -Method $Method -Uri $Uri -Headers $Headers -Body $Body -ErrorAction Stop
            } else {
                return Invoke-RestMethod -Method $Method -Uri $Uri -Headers $Headers -ErrorAction Stop
            }
        } catch {
            $resp = $null
            try { $resp = $_.Exception.Response } catch { }
            $status = $null
            try { if ($resp -ne $null) { $status = [int]$resp.StatusCode } } catch { }
            $msg = $_.Exception.Message
            if ($status -in 401,403) { Log-Err "GitHub API authentication error (${status}): ${msg}"; exit 2 }
            if ($status -eq 404) { Log-Warn "GitHub API returned 404 for ${Uri}; continuing."; return $null }
            if ($status -ge 500 -and $status -lt 600) {
                Log-Warn "GitHub API server error (${status}), attempt ${attempt} of ${MaxRetries}: ${msg}"
                if ($attempt -eq $MaxRetries) { Log-Err "Exceeded retries for ${Uri}"; exit 3 }
                Start-Sleep -Seconds (5 * ($attempt + 1))
                continue
            }
            Log-Err "GitHub API call failed: ${msg}"; exit 4
        }
    }
}

# Attempt to remove a path with retries; if locked, list locking processes and wait
function Remove-Path-WithRetries([string]$Path, [int]$MaxRetries = 12, [int]$SleepSec = 5) {
    if (-not (Test-Path $Path)) { return }
    for ($i = 0; $i -le $MaxRetries; $i++) {
        try {
            Remove-Item -Path $Path -Recurse -Force -ErrorAction Stop
            Log-Info "Removed path: ${Path}"
            return
        } catch {
            $msg = $_.Exception.Message
            Log-Warn ("Attempt {0}: failed to remove {1}: {2}" -f $i, $Path, $msg)
            # try to enumerate processes that may be using files under the path
            try {
                $locking = @()
                Get-Process | ForEach-Object {
                    try {
                        foreach ($m in $_.Modules) {
                            if ($m.FileName -like "${Path}*") { $locking += $_.Id; break }
                        }
                    } catch { }
                }
                if ($locking.Count -gt 0) {
                    Log-Warn "Processes possibly locking files: ${($locking -join ', ')}"
                } else {
                    Log-Warn "No obvious locking processes detected; will retry after sleep."
                }
            } catch {
                Log-Warn "Could not enumerate processes: $($_.Exception.Message)"
            }
            if ($i -eq $MaxRetries) { Log-Err "Exceeded max retries removing ${Path}. Aborting."; exit 1 }
            Start-Sleep -Seconds $SleepSec
        }
    }
}

# Ensure we start outside the RunnerRoot and remove/recreate it safely
Remove-Path-WithRetries $RunnerRoot
New-Item -ItemType Directory -Path $RunnerRoot -Force | Out-Null

function Assert-Admin {
    $current = [Security.Principal.WindowsIdentity]::GetCurrent()
    $principal = New-Object Security.Principal.WindowsPrincipal($current)
    if (-not $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
        Log-Err "This script must be run as Administrator. Restart PowerShell as Administrator and re-run."
        exit 1
    }
}

Assert-Admin


# also remove known marker dirs if they exist at repo root
$repoRoot = Split-Path -Parent $PSScriptRoot
$markers = @('.runner','_diag','_work')
foreach ($m in $markers) {
    $p = Join-Path $repoRoot $m
    if (Test-Path ${p}) {
        Log-Info "Removing marker: ${p}"
        try { Remove-Item -Path $p -Recurse -Force -ErrorAction Stop } catch { Log-Warn "Failed removing ${p}: $($_.Exception.Message)" }
    }
}

# Prompt for PAT
$pat = Read-Host -Prompt "Enter GitHub PAT (repo admin scope required)" -AsSecureString
$bstr = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($pat)
$plainPat = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($bstr)
[System.Runtime.InteropServices.Marshal]::ZeroFreeBSTR($bstr)
if ([string]::IsNullOrWhiteSpace($plainPat)) { Log-Err "No PAT provided"; exit 2 }

$hdr = @{ Authorization = "token $plainPat"; 'User-Agent' = 'auto-install-script' }

# 2. GitHub-side runner deletion (repo-level)
Log-Info "=== Phase: GitHub repo runner cleanup ==="
Log-Info "Listing repository runners for ${RepoOwner}/${RepoName}"
$r = Invoke-GitHubApiWithRetry -Method 'GET' -Uri "https://api.github.com/repos/${RepoOwner}/${RepoName}/actions/runners" -Headers $hdr
if (${r} -and ${r}.runners) {
    foreach ($runner in ${r}.runners) {
        Log-Info "Deleting repo runner id=$($runner.id) name=$($runner.name)"
        $delUri = "https://api.github.com/repos/${RepoOwner}/${RepoName}/actions/runners/$($runner.id)"
        try { Invoke-GitHubApiWithRetry -Method 'DELETE' -Uri $delUri -Headers $hdr } catch { Log-Warn "Failed to delete runner $($runner.id): $($_.Exception.Message)" }
    }
}

# 2b. Organization-level deletion (if any)
    Log-Info "=== Phase: GitHub org runner cleanup (if any) ==="
    Log-Info "Listing organization runners for ${RepoOwner}"
    $orgResp = Invoke-GitHubApiWithRetry -Method 'GET' -Uri "https://api.github.com/orgs/${RepoOwner}/actions/runners" -Headers $hdr
    if (${orgResp} -and ${orgResp}.runners) {
        foreach ($runner in ${orgResp}.runners) {
            Log-Info "Deleting org runner id=$($runner.id) name=$($runner.name)"
            $delUri = "https://api.github.com/orgs/${RepoOwner}/actions/runners/$($runner.id)"
            try { Invoke-GitHubApiWithRetry -Method 'DELETE' -Uri $delUri -Headers $hdr } catch { Log-Warn "Failed to delete org runner $($runner.id): $($_.Exception.Message)" }
        }
    }

# 3. Download v2.311.0 release asset (win-x64)
$tag = 'v2.311.0'
$releaseUrl = "https://api.github.com/repos/actions/runner/releases/tags/$tag"
Log-Info "=== Phase: Query Release asset (${tag}) ==="
try {
    $rel = Invoke-GitHubApiWithRetry -Method 'GET' -Uri $releaseUrl -Headers @{ 'User-Agent'='auto-install-script' }
    $asset = ${rel}.assets | Where-Object { $_.name -match '^actions-runner-win-x64-.*\.zip$' -and $_.size -gt 50000000 } | Sort-Object size -Descending | Select-Object -First 1
    if (-not ${asset}) { Log-Err "Could not find suitable win-x64 asset for ${tag}"; exit 3 }
    $downloadUrl = ${asset}.browser_download_url
    $zipName = Join-Path $RunnerRoot ${asset}.name
    Log-Info "Selected asset: $($asset.name) size=$($asset.size)"
} catch {
    Log-Err "Failed to query release ${tag}: $($_.Exception.Message)"; exit 4
}

Log-Info "=== Phase: Download ZIP ==="
Log-Info "Downloading ${downloadUrl} -> ${zipName}"
try { Invoke-WebRequest -Uri $downloadUrl -OutFile $zipName -Headers @{ 'User-Agent'='auto-install-script' } -ErrorAction Stop } catch { Log-Err "Download failed: $($_.Exception.Message)"; exit 5 }

Log-Info "=== Phase: Extract ZIP ==="
try { Expand-Archive -Path $zipName -DestinationPath $RunnerRoot -Force } catch { Log-Err "Extract failed: $($_.Exception.Message)"; exit 6 }

# verify RunnerService.exe path does not apply for v2.311.0; look for svc.cmd
$svcCmd = Join-Path $RunnerRoot 'svc.cmd'
# If svc.cmd is not found directly, attempt to detect nested extraction (double-folder) and fix
if (-not (Test-Path "$RunnerRoot\svc.cmd")) {
    Log-Warn "svc.cmd not found at top-level of ${RunnerRoot}; attempting to detect nested folder."
    try {
        $nested = Get-ChildItem -Path $RunnerRoot -Directory -ErrorAction SilentlyContinue | Where-Object { Test-Path (Join-Path $_.FullName 'svc.cmd') } | Select-Object -First 1
        if ($nested) {
            Log-Info "Detected nested folder: ${nested.FullName}. Moving contents up."
            Get-ChildItem -Path $nested.FullName -Force | ForEach-Object {
                Move-Item -Path $_.FullName -Destination $RunnerRoot -Force
            }
            Remove-Item -Path $nested.FullName -Recurse -Force
        }
    } catch {
        Log-Warn "Nested-folder repair attempt failed: $($_.Exception.Message)"
    }
}

if (-not (Test-Path "$RunnerRoot\svc.cmd")) { Log-Err "svc.cmd not found after extraction and nested-folder repair; aborting"; exit 7 }

# 4. request registration token and run config.cmd
Log-Info "=== Phase: Register runner (config.cmd) ==="
$regUrl = "https://api.github.com/repos/${RepoOwner}/${RepoName}/actions/runners/registration-token"
Log-Info "Requesting registration token"
try {
    $regResp = Invoke-GitHubApiWithRetry -Method 'POST' -Uri $regUrl -Headers $hdr
    if (-not ${regResp}) { Log-Err "Failed to obtain registration token"; exit 8 }
    $regToken = ${regResp}.token
} catch {
    Log-Err "Failed to obtain registration token: $($_.Exception.Message)"; exit 8
}

$configCmd = Join-Path $RunnerRoot 'config.cmd'
if (-not (Test-Path ${configCmd})) { Log-Err "config.cmd not found: ${configCmd}"; exit 9 }

# guard: only run config if .runner does not exist
$runnerMarker = Join-Path $RunnerRoot '.runner'
if (Test-Path ${runnerMarker}) {
    Log-Info ".runner marker present; skipping config.cmd"
} else {
    Log-Info "Running config.cmd --unattended"
    & $configCmd --url "https://github.com/${RepoOwner}/${RepoName}" --token $regToken --labels 'self-hosted,windows,urms' --unattended
    if (${LASTEXITCODE} -ne 0) { Log-Err "config.cmd failed (exit ${LASTEXITCODE})"; exit 10 }
}

# 5. svc.cmd install/start (old behavior)
Log-Info "=== Phase: Install and start service ==="
Log-Info "Installing service via svc.cmd"
& $svcCmd install
if (${LASTEXITCODE} -ne 0) { Log-Err "svc.cmd install failed (exit ${LASTEXITCODE})"; exit 11 }
Log-Info "Starting service via svc.cmd"
& $svcCmd start
if (${LASTEXITCODE} -ne 0) { Log-Err "svc.cmd start failed (exit ${LASTEXITCODE})"; exit 12 }

# 6. Poll GitHub until runner is Online (timeout)
$deadline = (Get-Date).AddMinutes(${TimeoutMinutes})
${foundOnline} = $false
while ((Get-Date) -lt ${deadline}) {
    Log-Info "Checking repo runners for online status..."
    try {
        $list = Invoke-GitHubApiWithRetry -Method 'GET' -Uri "https://api.github.com/repos/${RepoOwner}/${RepoName}/actions/runners" -Headers $hdr
        if (${list} -and ${list}.runners) {
            foreach ($r in ${list}.runners) {
                if ($r.status -eq 'online' -and ($r.labels | Where-Object { $_.name -eq 'urms' })) {
                    Log-Info "Found online runner: $($r.name) id=$($r.id)"
                    ${foundOnline} = $true; break
                }
            }
        }
    } catch {
        Log-Warn "List runners failed: $($_.Exception.Message)"
    }
    if (${foundOnline}) { break }
    Start-Sleep -Seconds $PollIntervalSeconds
}

if (${foundOnline}) { Log-Succ "Runner is online." } else { Log-Warn "Runner not detected online within timeout."; exit 13 }

Log-Succ "Auto-installation complete."

*** End OF FILE