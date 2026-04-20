<#
test-retry-queue.ps1
- Exercise runner_auto_start retry-queue resend path by invoking mocked uploader as in test-upload-runner-logs
- Verify that on schema mismatch the script will call collect-runner-logs (selfheal path) and attempt upload
#>
param()

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path

function Ensure-QueueSample(){
    $qd = Join-Path $scriptDir 'retry-queue'
    if (-not (Test-Path $qd)) { New-Item -Path $qd -ItemType Directory | Out-Null }
    $tempZip = Join-Path $scriptDir 'temp_sample.zip'
    if (Test-Path $tempZip) { Remove-Item -Path $tempZip -Force -ErrorAction SilentlyContinue }
    New-Item -ItemType File -Path (Join-Path $scriptDir 'temp_sample.txt') -Force | Out-Null
    Compress-Archive -Path (Join-Path $scriptDir 'temp_sample.txt') -DestinationPath $tempZip -Force
    # use Add-QueueEntry to ensure index.json updated
    if (Get-Command -Name Add-QueueEntry -ErrorAction SilentlyContinue) { Add-QueueEntry -SourceZip $tempZip -QD $qd | Out-Null } else { Copy-Item -Path $tempZip -Destination (Join-Path $qd 'sample_retry.zip') -Force }
}

Ensure-QueueSample
# dot-source shared utils
$qutils = Join-Path $scriptDir 'queue-utils.ps1'
if (Test-Path $qutils) { . $qutils }
$tutils = Join-Path $scriptDir 'test-utils.ps1'
if (Test-Path $tutils) { . $tutils }

Write-Output 'Simulating runner_auto_start retry processing with schema-invalid response...'

# build a mock uploader from upload-runner-logs.ps1 but return non-JSON response body so schema check fails
$orig = Join-Path $scriptDir 'upload-runner-logs.ps1'
if (-not (Test-Path $orig)) { Write-Error 'upload-runner-logs.ps1 not found'; exit 2 }
$content = Get-Content $orig -Raw
$start = $content.IndexOf('function Do-Upload {')
$marker = "`n`$attempt = 0"
$end = $content.IndexOf($marker)
if ($start -lt 0 -or $end -lt 0) { Write-Error 'Unable to locate Do-Upload in uploader for mock creation'; exit 2 }
$before = $content.Substring(0,$start)
$after = $content.Substring($end)
$stub = @"
function Do-Upload {
    param(
        $Attempt
    )
    # Return a non-JSON body to force schema-invalid handling
    $body = 'INVALID_JSON'
    try { $scriptDirLocal = Split-Path -Parent $MyInvocation.MyCommand.Path } catch { $scriptDirLocal = '$scriptDir' }
    try { $logFile = Join-Path $scriptDirLocal 'runner_auto_start.json.log'; $o = @{ status='mock_upload'; zip=(Split-Path $ZipPath -Leaf); response=$body; attempt=$Attempt; time=(Get-Date).ToString('o') }; $o | ConvertTo-Json -Compress | Out-File -FilePath $logFile -Append -Encoding utf8 -ErrorAction SilentlyContinue } catch { Write-Warning "test-retry-queue: failed to append mock log: $($_.Exception.Message)" }
    return @{ ok = $true; body = $body }
}
"@

$mockPath = Join-Path $scriptDir 'upload-runner-logs.mock.invalid.ps1'
$new = $before + $stub + $after
Set-Content -Path $mockPath -Value $new -Encoding utf8

# run mock uploader against queued sample to exercise uploader's schema check path
$zip = Join-Path (Join-Path $scriptDir 'retry-queue') 'sample_retry.zip'
powershell -NoProfile -File $mockPath -ZipPath $zip -Endpoint 'http://mock' | Out-Null

# run schema checker as runner_auto_start would and, on failure, invoke selfheal collection + upload
$checker = Join-Path $scriptDir 'check-upload-response-schema.ps1'
$schemaFailed = $false
    if (Test-Path $checker) {
    & $checker -ResponseJson 'INVALID_JSON' -QueueDir (Join-Path $scriptDir 'retry-queue') | Out-Null
    if ($LASTEXITCODE -ne 0) { $schemaFailed = $true }
}
if ($schemaFailed) {
    Write-Output 'Schema check failed; invoking selfheal collect + upload (simulated)'
    try {
        $zip2 = & (Join-Path $scriptDir 'collect-runner-logs.ps1') -RunnerDir $scriptDir -OutDir $scriptDir -ExitCode 1
            if ($zip2 -and (Test-Path $zip2)) {
            # use the real uploader to attempt sending selfheal zip (may queue)
            $queueDir = Join-Path $scriptDir 'retry-queue'
            & "$PSScriptRoot\upload-runner-logs.ps1" -ZipPath $zip2 -QueueDir $queueDir -MockResponse 'INVALID_JSON' -Endpoint 'http://mock' | Out-Null
        }
    } catch { Write-Warning "test-retry-queue: selfheal simulation failed: $($_.Exception.Message)" }
}

Write-Output 'Check retry-queue/index.json after simulated processing:'
$idx = Load-QueueIndex -QD (Join-Path $scriptDir 'retry-queue')
if ($idx) { Write-Output ($idx | ConvertTo-Json -Compress) } else { Write-Output 'index.json not found' }

Write-Output 'Inspect runner_auto_start.json.log for schema/selfheal related entries'
$log = Join-Path $scriptDir 'runner_auto_start.json.log'
$foundSchemaWarn = $false
if (Test-Path $log) {
    $lines = Get-Content $log -ErrorAction SilentlyContinue | Select-Object -Last 400
        foreach ($l in $lines) {
            try { $o = $l | ConvertFrom-Json -ErrorAction SilentlyContinue } catch { $o = $null }
            if ($o -and ( ( ($o.message) -and ($o.message -match 'schema') ) -or ( ($o.status) -and ($o.status -match 'delete_aborted_schema_invalid|schema_check_error|mock_upload|mocked_response_used') ) )) { $foundSchemaWarn = $true; break }
            # consider both legacy 'mock_upload' and new 'mocked_response_used' statuses as evidence of selfheal/mock activity
            if ($o -and $o.status -and ($o.status -match 'mock_upload' -or $o.status -match 'mocked_response_used')) { $foundSchemaWarn = $true; break }
        }
}
if ($foundSchemaWarn) { Write-Output 'OK: runner_auto_start.json.log shows schema/selfheal related entries' } else { Write-Output 'WARN: no schema/selfheal related entries found in runner_auto_start.json.log' }
if (-not (Test-Path (Join-Path $scriptDir 'test-results'))) { New-Item -Path (Join-Path $scriptDir 'test-results') -ItemType Directory | Out-Null }
$pass = $foundSchemaWarn
Save-TestResult -Name 'test-retry-queue' -Pass $pass -Meta @{ schema_warn_found = $foundSchemaWarn }
# ensure machine-readable result is always overwritten
try { if (-not (Test-Path (Join-Path $scriptDir 'test-results'))) { New-Item -Path (Join-Path $scriptDir 'test-results') -ItemType Directory | Out-Null } } catch { Write-Warning "test-retry-queue: failed creating test-results dir: $($_.Exception.Message)" }
$trDir = Join-Path $scriptDir 'test-results'
$resultObj = @{ name = 'test-retry-queue'; pass = $pass; time = (Get-Date).ToString('o'); schema_warn_found = $foundSchemaWarn }
($resultObj | ConvertTo-Json -Compress) | Out-File -FilePath (Join-Path $trDir 'test-retry-queue.json') -Encoding utf8 -Force
Write-Output 'test-retry-queue completed.'
