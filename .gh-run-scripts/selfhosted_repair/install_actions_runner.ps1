<#
install_actions_runner.ps1
Automates downloading and installing a GitHub Actions self-hosted runner on Windows.

USAGE (run as Administrator):
  pwsh -NoProfile -File .gh-run-scripts\selfhosted_repair\install_actions_runner.ps1

This script will:
 - create the runner folder (default: D:\GitHub\URMS\actions-runner)
 - download the latest actions-runner-win-x64.zip from GitHub Actions releases
 - expand it
 - request a registration token from the GitHub API (requires a PAT with repo/admin rights)
 - run config.cmd in unattended mode with labels: self-hosted,windows,urms
 - install and start the runner as a Windows service
 - optionally verify runner is Online via the API

SECURITY: You will be prompted for a GitHub PAT. Do not store it in plaintext unless you understand the risk.
#>

param(
    [string] $RunnerRoot = "D:\GitHub\URMS\actions-runner",
    [string] $RepoOwner = "infinityjp-maker",
    [string] $RepoName = "URMS",
    [switch] $VerifyAfter = $true
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

if (-not (Test-Path $RunnerRoot)) {
    New-Item -ItemType Directory -Path $RunnerRoot -Force | Out-Null
}

Set-Location -Path $RunnerRoot

## Resolve latest runner ZIP via GitHub Releases API to avoid 404s on latest/download
$apiUrl = 'https://api.github.com/repos/actions/runner/releases/latest'
$zipUrl = $null
$zipName = $null
Write-Output "Querying GitHub API for latest actions/runner release: $apiUrl"
try {
    $release = Invoke-RestMethod -Uri $apiUrl -Headers @{ 'User-Agent' = 'install-script' } -ErrorAction Stop
    if ($release -and $release.assets) {
        # Prefer ZIP assets matching name pattern and size > 50MB to avoid broken/signature/hash files
        $asset = $release.assets |
            Where-Object { $_.name -match '^actions-runner-win-x64-.*\.zip$' -and $_.size -gt 50000000 } |
            Sort-Object -Property size -Descending |
            Select-Object -First 1
        if ($asset -and $asset.browser_download_url) {
            $zipUrl = $asset.browser_download_url
            $zipName = Join-Path $RunnerRoot $asset.name
            Write-Output "Selected asset: $($asset.name) (size=$($asset.size))"
        }
    }
} catch {
    Write-Warning "Failed to query releases API: $($_.Exception.Message)"
}

# Fallback to hardcoded latest/download URL if API path failed to yield an asset
if (-not $zipUrl) {
    Write-Warning "Falling back to generic latest/download URL"
    $zipUrl = 'https://github.com/actions/runner/releases/latest/download/actions-runner-win-x64.zip'
    $zipName = Join-Path $RunnerRoot 'actions-runner-win-x64.zip'
}

Write-Output "Downloading runner from: $zipUrl"
try {
    Invoke-WebRequest -Uri $zipUrl -OutFile $zipName -Headers @{ 'User-Agent' = 'install-script' } -ErrorAction Stop
} catch {
    Write-Error "Failed to download runner zip: $($_.Exception.Message)"; exit 2
}

Write-Output "Extracting $zipName to $RunnerRoot"
try {
    Expand-Archive -Path $zipName -DestinationPath $RunnerRoot -Force
} catch {
    Write-Error "Failed to extract: $($_.Exception.Message)"; exit 3
}

# Verify RunnerService.exe exists after extraction
$runnerExe = Join-Path $RunnerRoot 'RunnerService.exe'
if (-not (Test-Path $runnerExe)) {
    # try to find it recursively (some zip layouts may extract into a subfolder)
    $found = Get-ChildItem -Path $RunnerRoot -Recurse -Filter 'RunnerService.exe' -ErrorAction SilentlyContinue | Select-Object -First 1
    if ($found) {
        $runnerExe = $found.FullName
        Write-Output "RunnerService.exe found at: $runnerExe"
    } else {
        Write-Error "RunnerService.exe not found after extracting $zipName. The selected ZIP may be invalid or incomplete."; exit 9
    }
}

# Prompt for PAT
$pat = Read-Host -Prompt "Enter GitHub PAT (repo scope, can create registration token)" -AsSecureString
$bstr = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($pat)
$plainPat = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($bstr)
[System.Runtime.InteropServices.Marshal]::ZeroFreeBSTR($bstr)

if ([string]::IsNullOrWhiteSpace($plainPat)) {
    Write-Error "No PAT provided; cannot create registration token."; exit 4
}

# Get registration token
$regUrl = "https://api.github.com/repos/$RepoOwner/$RepoName/actions/runners/registration-token"
Write-Output "Requesting registration token from GitHub API for $RepoOwner/$RepoName"
try {
    $hdr = @{ Authorization = "token $plainPat"; "User-Agent" = "install-script" }
    $resp = Invoke-RestMethod -Method Post -Uri $regUrl -Headers $hdr -ErrorAction Stop
    $regToken = $resp.token
} catch {
    Write-Error "Failed to obtain registration token: $($_.Exception.Message)"; exit 5
}

Write-Output "Configuring runner in unattended mode"
$configCmd = Join-Path $RunnerRoot 'config.cmd'
if (-not (Test-Path $configCmd)) { Write-Error "config.cmd not found in $RunnerRoot"; exit 6 }

$url = "https://github.com/$RepoOwner/$RepoName"
$labels = 'self-hosted,windows,urms'

## Ensure config.cmd --unattended runs only once by checking for the runner marker folder
$runnerMarker = Join-Path $RunnerRoot '.runner'
if (Test-Path $runnerMarker -PathType Container -ErrorAction SilentlyContinue) {
    Write-Output "Runner appears already configured (found .runner). Skipping config.cmd."
} else {
    Write-Output "Running: config.cmd --url $url --token <REDACTED> --labels $labels --unattended"
    & $configCmd --url $url --token $regToken --labels $labels --unattended
    if ($LASTEXITCODE -ne 0) { Write-Error "config.cmd failed (exit $LASTEXITCODE)"; exit 7 }
}

# For older runner versions (v2.311.0), use svc.cmd install/start
Write-Output "Installing runner service via svc.cmd"
 $svcCmd = Join-Path $RunnerRoot 'svc.cmd'
if (-not (Test-Path $svcCmd)) { Write-Error "svc.cmd not found at expected path: $svcCmd"; exit 8 }

Write-Output "Running: svc.cmd install"
& $svcCmd install
if ($LASTEXITCODE -ne 0) { Write-Error "svc.cmd install failed (exit $LASTEXITCODE)"; exit 9 }

Write-Output "Running: svc.cmd start"
& $svcCmd start
if ($LASTEXITCODE -ne 0) { Write-Error "svc.cmd start failed (exit $LASTEXITCODE)"; exit 10 }

if ($VerifyAfter) {
    Write-Output "Verifying runner registration via API"
    try {
        $hdr = @{ Authorization = "token $plainPat"; "User-Agent" = "install-script" }
        $runners = Invoke-RestMethod -Method Get -Uri "https://api.github.com/repos/$RepoOwner/$RepoName/actions/runners" -Headers $hdr -ErrorAction Stop
        $online = $runners.runners | Where-Object { $_.status -eq 'online' }
        if ($online) {
            Write-Output "Found online runners:"
            $online | Select-Object name,os,labels,status | Format-Table
        } else {
            Write-Output "No online runners detected yet. Check GitHub UI after a moment."
        }
    } catch {
        Write-Warning "Verification API call failed: $($_.Exception.Message)"
    }
}

Write-Output "Runner installation attempted. Check GitHub Actions -> Settings -> Runners for 'Online' status."
