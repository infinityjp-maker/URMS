<#
corrupt_runner_and_restart.ps1
Purpose: Overwrite RunnerService.exe with a 16KB dummy (for test), record SHA256,
and attempt to restart the runner service so selfheal will detect/repair on next cycle.

USAGE (on production runner):
  pwsh -NoProfile -File corrupt_runner_and_restart.ps1 -RunnerPath "C:\path\to\RunnerService.exe"

#>

param(
    [string] $RunnerPath = "",
    [int] $DummyKB = 16,
    [string] $ServiceName = ""
)

try {
    $psScriptRoot = Split-Path -Parent $MyInvocation.MyCommand.Definition
} catch {
    $psScriptRoot = Get-Location
}

if ([string]::IsNullOrWhiteSpace($RunnerPath)) {
    $RunnerPath = Join-Path $psScriptRoot "RunnerService.exe"
}

$logPath = Join-Path $psScriptRoot "corrupt_runner_record.txt"

Add-Content -Path $logPath -Value ("=== Corrupt test started: $(Get-Date -Format o) ===")

if (-not (Test-Path $RunnerPath)) {
    Add-Content -Path $logPath -Value ("ERROR: RunnerService.exe not found at: $RunnerPath")
    Write-Output "RunnerService.exe not found at: $RunnerPath"
    exit 2
}

# Record original info
$origSize = (Get-Item $RunnerPath).Length
$origHash = (Get-FileHash -Path $RunnerPath -Algorithm SHA256).Hash.ToLower()
Add-Content -Path $logPath -Value ("OriginalSizeBytes: $origSize")
Add-Content -Path $logPath -Value ("OriginalSHA256: $origHash")

# Create dummy data and overwrite
$sizeBytes = $DummyKB * 1024
$bytes = New-Object byte[] $sizeBytes
[System.IO.File]::WriteAllBytes($RunnerPath, $bytes)

# Record new info
$newSize = (Get-Item $RunnerPath).Length
$newHash = (Get-FileHash -Path $RunnerPath -Algorithm SHA256).Hash.ToLower()
Add-Content -Path $logPath -Value ("OverwrittenSizeBytes: $newSize")
Add-Content -Path $logPath -Value ("OverwrittenSHA256: $newHash")

Write-Output "Overwrote $RunnerPath -> $newSize bytes, SHA256: $newHash"

# Try to locate service if not provided
if ([string]::IsNullOrWhiteSpace($ServiceName)) {
    $svc = Get-WmiObject -Class Win32_Service | Where-Object { $_.PathName -and $_.PathName -like "*RunnerService.exe*" } | Select-Object -First 1
    if ($svc) { $ServiceName = $svc.Name }
}

if (-not [string]::IsNullOrWhiteSpace($ServiceName)) {
    try {
        Add-Content -Path $logPath -Value ("Attempting to restart service: $ServiceName")
        Restart-Service -Name $ServiceName -Force -ErrorAction Stop
        Add-Content -Path $logPath -Value ("Service restarted: $ServiceName at $(Get-Date -Format o)")
        Write-Output "Restarted service: $ServiceName"
    } catch {
        Add-Content -Path $logPath -Value ("Service restart failed: $($_.Exception.Message)")
        Write-Output "Service restart failed: $($_.Exception.Message)"
    }
} else {
    Add-Content -Path $logPath -Value ("No runner service detected to restart; please restart runner process manually if needed.")
    Write-Output "No runner service detected to restart; please restart runner process manually if needed."
}

Add-Content -Path $logPath -Value ("=== Corrupt test finished: $(Get-Date -Format o) ===")

Write-Output "Corruption record written to: $logPath"
