# collect-runner-logs.ps1
# Collects runner-related logs into a zip for selfheal ingestion
param(
    [string]$RunnerDir = (Split-Path -Parent $MyInvocation.MyCommand.Path),
    [string]$OutDir = $env:TEMP,
    [int]$EventLogCount = 200,
    [int]$ExitCode = -1
)

$ts = (Get-Date).ToString('yyyyMMdd_HHmmss')
$base = Join-Path $OutDir ("runner_logs_$ts")
New-Item -Path $base -ItemType Directory -ErrorAction SilentlyContinue | Out-Null

# files to collect
$files = @()
$files += Join-Path $RunnerDir 'runner_auto_start.log'
$files += Join-Path $RunnerDir 'runner_auto_start.json.log'
$files += Join-Path $RunnerDir 'runner_auto_start.status.json'

# collect run.cmd stdout/stderr if any
$runStdout = Join-Path $RunnerDir 'run.cmd.stdout'
$runStderr = Join-Path $RunnerDir 'run.cmd.stderr'
$files += $runStdout
$files += $runStderr

# Runner.Listener last-run logs (typical folder)
$possibleRL = Join-Path $RunnerDir '._diag'
if (Test-Path $possibleRL) {
    $diagFiles = Get-ChildItem -Path $possibleRL -File -Recurse -ErrorAction SilentlyContinue | Select-Object -ExpandProperty FullName
    $files += $diagFiles
} else {
    # also check Runner._diag in runner root
    $alt = Join-Path $RunnerDir '_diag'
    if (Test-Path $alt) { $files += (Get-ChildItem -Path $alt -File -Recurse -ErrorAction SilentlyContinue | Select-Object -ExpandProperty FullName) }
}

# copy existing files
foreach ($f in $files | Sort-Object -Unique) {
    try {
        if (Test-Path $f) {
            Copy-Item -Path $f -Destination $base -Force -ErrorAction SilentlyContinue
        }
    } catch { Write-Warning "collect-runner-logs: copying file $f failed: $($_.Exception.Message)" }
}

# collect Windows Event logs (Application and System) - last 200 entries each
try {
    $app = Get-WinEvent -LogName Application -MaxEvents $EventLogCount -ErrorAction SilentlyContinue | Format-List * | Out-String
    $sys = Get-WinEvent -LogName System -MaxEvents $EventLogCount -ErrorAction SilentlyContinue | Format-List * | Out-String
    $app | Out-File -FilePath (Join-Path $base 'EventLog_Application.txt') -Encoding utf8 -Force
    $sys | Out-File -FilePath (Join-Path $base 'EventLog_System.txt') -Encoding utf8 -Force
} catch {
    # fallback to wevtutil if necessary
    try { wevtutil qe Application /c:$EventLogCount /f:text > "$(Join-Path $base 'EventLog_Application.txt')" } catch { Write-Warning "collect-runner-logs: wevtutil Application failed: $($_.Exception.Message)" }
    try { wevtutil qe System /c:$EventLogCount /f:text > "$(Join-Path $base 'EventLog_System.txt')" } catch { Write-Warning "collect-runner-logs: wevtutil System failed: $($_.Exception.Message)" }
}

# create zip
if ($ExitCode -ne -1) { $zipName = "runner_logs_${ts}_exit${ExitCode}.zip" } else { $zipName = "runner_logs_${ts}.zip" }
$zip = Join-Path $OutDir $zipName
try {
    if (Test-Path $zip) { Remove-Item -Path $zip -Force -ErrorAction SilentlyContinue }
    Compress-Archive -Path (Join-Path $base '*') -DestinationPath $zip -Force -ErrorAction SilentlyContinue
} catch {
    # best-effort zip via .NET
    try {
        Add-Type -AssemblyName System.IO.Compression.FileSystem
        [System.IO.Compression.ZipFile]::CreateFromDirectory($base, $zip)
    } catch { Write-Warning "collect-runner-logs: .NET zip fallback failed: $($_.Exception.Message)" }
}

Write-Output $zip
Exit 0
