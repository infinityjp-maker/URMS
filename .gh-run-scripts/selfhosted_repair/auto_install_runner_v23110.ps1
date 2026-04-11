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

function Assert-Admin {
    $current = [Security.Principal.WindowsIdentity]::GetCurrent()
    $principal = New-Object Security.Principal.WindowsPrincipal($current)
    if (-not $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
        Write-Error "This script must be run as Administrator. Restart PowerShell as Administrator and re-run."
        exit 1
    }
}

Assert-Admin

# 1. Remove local runner folder if exists
if (Test-Path $RunnerRoot) {
    Write-Output "Removing existing runner folder: $RunnerRoot"
    try {
        Remove-Item -Path $RunnerRoot -Recurse -Force -ErrorAction Stop
    } catch {
        Write-Warning "Failed to remove $RunnerRoot: $($_.Exception.Message)"
    }
}

# also remove known marker dirs if they exist at repo root
$repoRoot = Split-Path -Parent $PSScriptRoot
$markers = @('.runner','_diag','_work')
foreach ($m in $markers) {
    $p = Join-Path $repoRoot $m
    if (Test-Path $p) {
        Write-Output "Removing marker: $p"
        try { Remove-Item -Path $p -Recurse -Force -ErrorAction Stop } catch { Write-Warning "Failed removing $p: $($_.Exception.Message)" }
    }
}

# Prompt for PAT
$pat = Read-Host -Prompt "Enter GitHub PAT (repo admin scope required)" -AsSecureString
$bstr = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($pat)
$plainPat = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($bstr)
[System.Runtime.InteropServices.Marshal]::ZeroFreeBSTR($bstr)
if ([string]::IsNullOrWhiteSpace($plainPat)) { Write-Error "No PAT provided"; exit 2 }

$hdr = @{ Authorization = "token $plainPat"; 'User-Agent' = 'auto-install-script' }

# 2. GitHub-side runner deletion (repo-level)
Write-Output "Listing repository runners for $RepoOwner/$RepoName"
try {
    $r = Invoke-RestMethod -Uri "https://api.github.com/repos/$RepoOwner/$RepoName/actions/runners" -Headers $hdr -ErrorAction Stop
    if ($r.runners) {
        foreach ($runner in $r.runners) {
            Write-Output "Deleting repo runner id=$($runner.id) name=$($runner.name)"
            try { Invoke-RestMethod -Method Delete -Uri "https://api.github.com/repos/$RepoOwner/$RepoName/actions/runners/$($runner.id)" -Headers $hdr -ErrorAction Stop } catch { Write-Warning "Failed to delete repo runner $($runner.id): $($_.Exception.Message)" }
        }
    }
} catch {
    Write-Warning "Failed to list/delete repo runners: $($_.Exception.Message)"
}

# 2b. Organization-level deletion (if any)
Write-Output "Listing organization runners for $RepoOwner (if org exists)"
try {
    $orgResp = Invoke-RestMethod -Uri "https://api.github.com/orgs/$RepoOwner/actions/runners" -Headers $hdr -ErrorAction Stop
    if ($orgResp.runners) {
        foreach ($runner in $orgResp.runners) {
            Write-Output "Deleting org runner id=$($runner.id) name=$($runner.name)"
            try { Invoke-RestMethod -Method Delete -Uri "https://api.github.com/orgs/$RepoOwner/actions/runners/$($runner.id)" -Headers $hdr -ErrorAction Stop } catch { Write-Warning "Failed to delete org runner $($runner.id): $($_.Exception.Message)" }
        }
    }
} catch {
    Write-Warning "Org runner list/delete may have failed or org not present: $($_.Exception.Message)"
}

# 3. Download v2.311.0 release asset (win-x64)
$tag = 'v2.311.0'
$releaseUrl = "https://api.github.com/repos/actions/runner/releases/tags/$tag"
Write-Output "Querying release $tag"
try {
    $rel = Invoke-RestMethod -Uri $releaseUrl -Headers @{ 'User-Agent'='auto-install-script' } -ErrorAction Stop
    $asset = $rel.assets | Where-Object { $_.name -match '^actions-runner-win-x64-.*\.zip$' -and $_.size -gt 50000000 } | Sort-Object size -Descending | Select-Object -First 1
    if (-not $asset) { Write-Error "Could not find suitable win-x64 asset for $tag"; exit 3 }
    $downloadUrl = $asset.browser_download_url
    $zipName = Join-Path $RunnerRoot $asset.name
    Write-Output "Selected asset: $($asset.name) size=$($asset.size)"
} catch {
    Write-Error "Failed to query release $tag: $($_.Exception.Message)"; exit 4
}

# create runner root and download
New-Item -ItemType Directory -Path $RunnerRoot -Force | Out-Null
Write-Output "Downloading $downloadUrl -> $zipName"
try { Invoke-WebRequest -Uri $downloadUrl -OutFile $zipName -Headers @{ 'User-Agent'='auto-install-script' } -ErrorAction Stop } catch { Write-Error "Download failed: $($_.Exception.Message)"; exit 5 }

Write-Output "Extracting $zipName"
try { Expand-Archive -Path $zipName -DestinationPath $RunnerRoot -Force } catch { Write-Error "Extract failed: $($_.Exception.Message)"; exit 6 }

# verify RunnerService.exe path does not apply for v2.311.0; look for svc.cmd
$svcCmd = Join-Path $RunnerRoot 'svc.cmd'
if (-not (Test-Path $svcCmd)) { Write-Error "svc.cmd not found after extraction; aborting"; exit 7 }

# 4. request registration token and run config.cmd
$regUrl = "https://api.github.com/repos/$RepoOwner/$RepoName/actions/runners/registration-token"
Write-Output "Requesting registration token"
try { $regResp = Invoke-RestMethod -Method Post -Uri $regUrl -Headers $hdr -ErrorAction Stop; $regToken = $regResp.token } catch { Write-Error "Failed to obtain registration token: $($_.Exception.Message)"; exit 8 }

$configCmd = Join-Path $RunnerRoot 'config.cmd'
if (-not (Test-Path $configCmd)) { Write-Error "config.cmd not found: $configCmd"; exit 9 }

# guard: only run config if .runner does not exist
$runnerMarker = Join-Path $RunnerRoot '.runner'
if (Test-Path $runnerMarker) {
    Write-Output ".runner marker present; skipping config.cmd"
} else {
    Write-Output "Running config.cmd --unattended"
    & $configCmd --url "https://github.com/$RepoOwner/$RepoName" --token $regToken --labels 'self-hosted,windows,urms' --unattended
    if ($LASTEXITCODE -ne 0) { Write-Error "config.cmd failed (exit $LASTEXITCODE)"; exit 10 }
}

# 5. svc.cmd install/start (old behavior)
Write-Output "Installing service via svc.cmd"
& $svcCmd install
if ($LASTEXITCODE -ne 0) { Write-Error "svc.cmd install failed (exit $LASTEXITCODE)"; exit 11 }
Write-Output "Starting service via svc.cmd"
& $svcCmd start
if ($LASTEXITCODE -ne 0) { Write-Error "svc.cmd start failed (exit $LASTEXITCODE)"; exit 12 }

# 6. Poll GitHub until runner is Online (timeout)
$deadline = (Get-Date).AddMinutes($TimeoutMinutes)
$foundOnline = $false
while ((Get-Date) -lt $deadline) {
    Write-Output "Checking repo runners for online status..."
    try {
        $list = Invoke-RestMethod -Uri "https://api.github.com/repos/$RepoOwner/$RepoName/actions/runners" -Headers $hdr -ErrorAction Stop
        if ($list.runners) {
            foreach ($r in $list.runners) {
                if ($r.status -eq 'online' -and ($r.labels | Where-Object { $_.name -eq 'urms' })) {
                    Write-Output "Found online runner: $($r.name) id=$($r.id)"
                    $foundOnline = $true; break
                }
            }
        }
    } catch {
        Write-Warning "List runners failed: $($_.Exception.Message)"
    }
    if ($foundOnline) { break }
    Start-Sleep -Seconds $PollIntervalSeconds
}

if ($foundOnline) { Write-Output "Runner is online." } else { Write-Warning "Runner not detected online within timeout."; exit 13 }

Write-Output "Auto-installation complete."

*** End OF FILE