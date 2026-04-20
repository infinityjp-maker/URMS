<#
monitor-runner-health.ps1
- Monitor `runner_auto_start.status.json` and trigger selfheal (collect -> upload) on anomalies.
- Appends JSON-lines to `monitor.log` and writes `monitor-latest.json`.
#>
param()

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$StatusFile = Join-Path $ScriptDir 'runner_auto_start.status.json'
$MonitorLog = Join-Path $ScriptDir 'monitor.log'
$LatestFile = Join-Path $ScriptDir 'monitor-latest.json'
$PrevFile = Join-Path $ScriptDir 'monitor-prev.json'

function Write-MonitorLine($obj){
    try { $line = $obj | ConvertTo-Json -Compress; Add-Content -Path $MonitorLog -Value $line -Encoding utf8 -ErrorAction SilentlyContinue; $obj | ConvertTo-Json -Compress | Out-File -FilePath $LatestFile -Encoding utf8 -Force } catch { Write-Warning "Write-MonitorLine failed: $($_.Exception.Message)" }
}

try {
    if (-not (Test-Path $StatusFile)) { Write-MonitorLine @{ time=(Get-Date).ToString('o'); state='Unknown'; message='status file missing' }; exit 1 }
    $status = Get-Content $StatusFile -Raw | ConvertFrom-Json -ErrorAction Stop
} catch {
    Write-MonitorLine @{ time = (Get-Date).ToString('o'); state='InvalidStatus'; error = $_.Exception.Message }
    exit 2
}

$prev = $null
if (Test-Path $PrevFile) {
    try { $prev = Get-Content $PrevFile -Raw | ConvertFrom-Json -ErrorAction SilentlyContinue } catch { Write-Warning "monitor-runner-health: reading prev failed: $($_.Exception.Message)"; $prev = $null }
}

$changed = $false
if (-not $prev) { $changed = $true } else { if ($prev.state -ne $status.state -or ($prev.last_error -ne $status.last_error)) { $changed = $true } }

$entry = @{ time=(Get-Date).ToString('o'); state = $status.state; last_error = $status.last_error; last_success = $status.last_success; changed = $changed }
Write-MonitorLine $entry

# if anomalous state, perform selfheal collect->upload
if ($changed -and ($status.state -eq 'Error' -or $status.last_error)) {
    Write-MonitorLine @{ time=(Get-Date).ToString('o'); action='selfheal_start'; reason = 'state=Error or last_error present' }
    try {
        $zip = & (Join-Path $ScriptDir 'collect-runner-logs.ps1') -RunnerDir $ScriptDir -OutDir $ScriptDir -ErrorAction Stop
        Write-MonitorLine @{ time=(Get-Date).ToString('o'); action='collected_logs'; zip = $zip }
        if ($zip -and (Test-Path $zip)) {
            try {
                $uploadResp = & (Join-Path $ScriptDir 'upload-runner-logs.ps1') -ZipPath $zip -Endpoint 'https://selfheal.example.local/upload' -Token '<TOKEN_PLACEHOLDER>' -CertMode 'Relaxed'
                Write-MonitorLine @{ time=(Get-Date).ToString('o'); action='upload_attempt'; zip=(Split-Path $zip -Leaf); response = $uploadResp }
            } catch {
                Write-MonitorLine @{ time=(Get-Date).ToString('o'); action='upload_failed'; reason=$_.Exception.Message }
            }
        } else {
            Write-MonitorLine @{ time=(Get-Date).ToString('o'); action='collect_failed'; reason='zip missing' }
        }
    } catch {
        Write-MonitorLine @{ time=(Get-Date).ToString('o'); action='selfheal_error'; reason=$_.Exception.Message }
    }
}

# persist latest monitor snapshot for change detection
try { $entry | ConvertTo-Json -Compress | Out-File -FilePath $PrevFile -Encoding utf8 -Force } catch { Write-Warning "monitor-runner-health: persisting prev snapshot failed: $($_.Exception.Message)" }

exit 0
