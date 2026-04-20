<#
test-log-consistency.ps1
- Extract latest WARN/ERROR JSON lines from runner_auto_start.json.log
- Compare against retry-queue/last_schema_check.json to ensure schema failures are logged
#>
param()

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
 $log = Join-Path $scriptDir 'runner_auto_start.json.log'
 $rqDir = Join-Path $scriptDir 'retry-queue'
 $scPath = Join-Path $rqDir 'last_schema_check.json'

if (-not (Test-Path $log)) { Write-Output 'runner_auto_start.json.log not found'; exit 2 }
if (-not (Test-Path $scPath)) { Write-Output 'last_schema_check.json not found; nothing to compare'; exit 2 }

$lines = Get-Content $log -ErrorAction SilentlyContinue | Select-Object -Last 200
$warnErr = @()
foreach ($l in $lines) {
    try { $o = $l | ConvertFrom-Json -ErrorAction SilentlyContinue } catch { $o = $null }
    if ($o -and ($o.level -in @('WARN','ERROR'))) { $warnErr += $o }
}

$sc = Get-Content $scPath -Raw | ConvertFrom-Json -ErrorAction SilentlyContinue
if (-not $sc) { Write-Output 'Failed to parse last_schema_check.json'; exit 3 }

$matched = $false
foreach ($w in $warnErr) {
    if ($w.message -and $w.message -match 'schema_check') { $matched = $true; break }
}

if (-not (Test-Path (Join-Path $scriptDir 'test-results'))) { New-Item -Path (Join-Path $scriptDir 'test-results') -ItemType Directory | Out-Null }

$pass = $false
if ($sc.valid -eq $false -and $matched) { Write-Output 'OK: schema invalid and WARN present in JSON log' ; $pass = $true }
elseif ($sc.valid -eq $false -and -not $matched) { Write-Output 'FAIL: schema invalid but no WARN(schema_check) found in runner_auto_start.json.log'; $pass = $false }
elseif ($sc.valid -eq $true) { Write-Output 'OK: last schema check valid; no WARN expected'; $pass = $true }

$trDir = Join-Path $scriptDir 'test-results'
$res = @{ name = 'test-log-consistency'; pass = $pass; schema_valid = $sc.valid; matched_warn = $matched; time = (Get-Date).ToString('o') }
($res | ConvertTo-Json -Compress) | Out-File -FilePath (Join-Path $trDir 'test-log-consistency.json') -Encoding utf8 -Force

if ($pass) { exit 0 } else { exit 4 }
