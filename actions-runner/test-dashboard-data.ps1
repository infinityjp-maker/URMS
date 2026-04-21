<#
test-dashboard-data.ps1
- Generate status.json, retry-queue/index.json, last_schema_check.json sample files
- Verify files are present and show summary output suitable for dashboard consumption
#>
param()

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path

# status
$status = @{ state = 'Idle'; timestamp = (Get-Date).ToString('o'); last_success = (Get-Date).AddMinutes(-5).ToString('o'); last_error = $null }
$status | ConvertTo-Json -Compress | Out-File -FilePath (Join-Path $scriptDir 'runner_auto_start.status.json') -Encoding utf8 -Force

# retry-queue
if (-not (Test-Path (Join-Path $scriptDir 'retry-queue'))) { New-Item -Path (Join-Path $scriptDir 'retry-queue') -ItemType Directory | Out-Null }
$items = @('test1.zip','test2.zip')
$index = @{ count = $items.Count; files = $items; deleted_count = 1; updated = (Get-Date).ToString('o') }
$rqDir = Join-Path $scriptDir 'retry-queue'
$index | ConvertTo-Json -Compress | Out-File -FilePath (Join-Path $rqDir 'index.json') -Encoding utf8 -Force

# last schema check
$sc = @{ valid = $false; errors = @('missing_delete'); parsed = @{ ok = $true }; time = (Get-Date).ToString('o') }
($sc | ConvertTo-Json -Compress) | Out-File -FilePath (Join-Path $rqDir 'last_schema_check.json') -Encoding utf8 -Force

Write-Output 'Generated dashboard JSON fixtures:'
Write-Output (Get-Content (Join-Path $scriptDir 'runner_auto_start.status.json') -Raw)
Write-Output (Get-Content (Join-Path $rqDir 'index.json') -Raw)
Write-Output (Get-Content (Join-Path $rqDir 'last_schema_check.json') -Raw)

# perform integrity checks expected by the dashboard
$ok = $true
$st = Get-Content (Join-Path $scriptDir 'runner_auto_start.status.json') -Raw | ConvertFrom-Json -ErrorAction SilentlyContinue
if (-not $st -or $st.state -ne 'Idle') { Write-Output 'FAIL: status.json missing or state!=Idle'; $ok = $false } else { Write-Output 'OK: status.json state=Idle' }
$idx = Get-Content (Join-Path $rqDir 'index.json') -Raw | ConvertFrom-Json -ErrorAction SilentlyContinue
if (-not $idx -or $idx.count -ne 2 -or ($idx.deleted_count -ne 1)) { Write-Output 'FAIL: retry-queue index.json content unexpected'; $ok = $false } else { Write-Output 'OK: retry-queue index.json has expected count and deleted_count' }
$scj = Get-Content (Join-Path $rqDir 'last_schema_check.json') -Raw | ConvertFrom-Json -ErrorAction SilentlyContinue
if (-not $scj -or $scj.valid -ne $false -or -not ($scj.errors -contains 'missing_delete')) { Write-Output 'FAIL: last_schema_check.json unexpected'; $ok = $false } else { Write-Output 'OK: last_schema_check.json matches expected sample' }

if (-not (Test-Path (Join-Path $scriptDir 'test-results'))) { New-Item -Path (Join-Path $scriptDir 'test-results') -ItemType Directory | Out-Null }
$trDir = Join-Path $scriptDir 'test-results'
$res = @{ name = 'test-dashboard-data'; pass = $ok; status_check = $ok; time = (Get-Date).ToString('o') }
($res | ConvertTo-Json -Compress) | Out-File -FilePath (Join-Path $trDir 'test-dashboard-data.json') -Encoding utf8 -Force

if ($ok) { Write-Output 'Dashboard JSON fixtures integrity: PASS' } else { Write-Output 'Dashboard JSON fixtures integrity: FAIL' }

Write-Output 'Open actions-runner/dashboard/index.html in a browser to visually verify the dashboard.'
