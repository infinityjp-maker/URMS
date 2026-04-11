<#
selfheal-production-run.ps1
Purpose: Wait for selfheal to run on the production runner, collect key logs,
and produce a short summary indicating whether repair succeeded.

USAGE (on production runner):
  pwsh -NoProfile -File selfheal-production-run.ps1 -TimeoutMinutes 20

#>

param(
    [int] $PollIntervalSeconds = 10,
    [int] $TimeoutMinutes = 20,
    [string] $DestinationRoot = ""
)

try {
    $psScriptRoot = Split-Path -Parent $MyInvocation.MyCommand.Definition
} catch {
    $psScriptRoot = Get-Location
}

if ([string]::IsNullOrWhiteSpace($DestinationRoot)) {
    $timestamp = (Get-Date -Format "yyyyMMdd_HHmmss")
    $DestinationRoot = Join-Path $psScriptRoot "selfheal_results_$timestamp"
}

New-Item -ItemType Directory -Path $DestinationRoot -Force | Out-Null

$files = @(
    "selfheal_repair_start.txt",
    "selfheal_repair_log.txt",
    "selfheal_repair_trace.txt",
    "selfheal_log_phase4.txt",
    "selfheal_final_info.txt"
)

$deadline = (Get-Date).AddMinutes($TimeoutMinutes)
Write-Output "Waiting for selfheal outputs until $deadline (poll every $PollIntervalSeconds s)"

while ((Get-Date) -lt $deadline) {
    $foundAll = $true
    foreach ($f in $files) {
        $p = Join-Path $psScriptRoot $f
        if (-not (Test-Path $p)) { $foundAll = $false; break }
    }
    if ($foundAll) { break }
    Start-Sleep -Seconds $PollIntervalSeconds
}

if (-not $foundAll) {
    Write-Output "Timeout waiting for selfheal outputs. Collected what exists."
}

# Copy whatever was produced
foreach ($f in $files) {
    $src = Join-Path $psScriptRoot $f
    if (Test-Path $src) {
        Copy-Item -Path $src -Destination $DestinationRoot -Force
    }
}

# Also copy aggregated logs folder if present
$agg = Join-Path $psScriptRoot "selfheal_logs"
if (Test-Path $agg) { Copy-Item -Path $agg -Destination $DestinationRoot -Recurse -Force }

# Inspect RunnerService.exe
$runner = Join-Path $psScriptRoot "RunnerService.exe"
$summary = Join-Path $DestinationRoot "selfheal_summary.txt"
Add-Content -Path $summary -Value ("Selfheal collection time: $(Get-Date -Format o)")
if (Test-Path $runner) {
    $size = (Get-Item $runner).Length
    $hash = (Get-FileHash -Path $runner -Algorithm SHA256).Hash.ToLower()
    Add-Content -Path $summary -Value ("RunnerService.exe Path: $runner")
    Add-Content -Path $summary -Value ("RunnerService.exe SizeBytes: $size")
    Add-Content -Path $summary -Value ("RunnerService.exe SHA256: $hash")
    Write-Output "RunnerService.exe: $size bytes, SHA256: $hash"
} else {
    Add-Content -Path $summary -Value "RunnerService.exe not found"
    Write-Output "RunnerService.exe not found at $runner"
}

# Look for indicators of ZIP download and expand
if (Test-Path (Join-Path $psScriptRoot "selfheal_repair_trace.txt")) {
    $trace = Get-Content -Path (Join-Path $psScriptRoot "selfheal_repair_trace.txt") -Raw
    $dl = $trace -match "ZipPath:|Expand-Archive completed"
    if ($dl) { Add-Content -Path $summary -Value "ZIP download/expand indicators: present" } else { Add-Content -Path $summary -Value "ZIP download/expand indicators: not found in trace" }
}

# Check Phase4 completion by presence of repair log and final info
if (Test-Path (Join-Path $psScriptRoot "selfheal_repair_log.txt") -and Test-Path (Join-Path $psScriptRoot "selfheal_final_info.txt")) {
    Add-Content -Path $summary -Value "Phase4 repair artifacts: present"
} else {
    Add-Content -Path $summary -Value "Phase4 repair artifacts: missing or incomplete"
}

Write-Output "Collected selfheal outputs to: $DestinationRoot"
Write-Output "Summary written to: $summary"
