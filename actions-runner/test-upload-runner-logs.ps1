<#
test-upload-runner-logs.ps1
- Create a temporary mock of upload-runner-logs.ps1 where the network upload is stubbed
- Exercises three mock responses: delete=yes, delete=no, schema-invalid
- Verifies retry-queue/index.json updates accordingly
#>
param()

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
 $orig = Join-Path $scriptDir 'upload-runner-logs.ps1'
 # load queue utils and test utils
 $qutils = Join-Path $scriptDir 'queue-utils.ps1'
 if (Test-Path $qutils) { . $qutils }
 $tutils = Join-Path $scriptDir 'test-utils.ps1'
 if (Test-Path $tutils) { . $tutils }
if (-not (Test-Path $orig)) { Write-Error "upload-runner-logs.ps1 not found at $orig"; exit 2 }

function New-TestZip($outZip){
    $tmp = Join-Path $scriptDir 'test_upload_tmp'
    if (Test-Path $tmp) { Remove-Item -Recurse -Force $tmp }
    New-Item -ItemType Directory -Path $tmp | Out-Null
    Set-Content -Path (Join-Path $tmp 'sample.txt') -Value "sample" -Encoding utf8
    if (Test-Path $outZip) { Remove-Item $outZip -Force }
    Compress-Archive -Path (Join-Path $tmp '*') -DestinationPath $outZip -Force
}

function Make-MockUploader($mockBody, $mockName){
    $content = Get-Content $orig -Raw
    $start = $content.IndexOf('function Do-Upload {')
    $marker = "`n`$attempt = 0"
    $end = $content.IndexOf($marker)
    if ($start -lt 0 -or $end -lt 0) { throw 'Unable to locate Do-Upload block for patching' }
    $before = $content.Substring(0,$start)
    $after = $content.Substring($end)
    $stub = @"
function Do-Upload {
    param(
        $Attempt
    )
    # Mocked upload: return configured body only; allow original uploader code to perform deletion/index update
    $body = @'$mockBody'@
    try { $scriptDirLocal = Split-Path -Parent $MyInvocation.MyCommand.Path } catch { $scriptDirLocal = '$scriptDir' }
    # Log mock invocation for visibility into runner_auto_start.json.log
    try { $logFile = Join-Path $scriptDirLocal 'runner_auto_start.json.log'; $o = @{ status='mock_upload'; zip=(Split-Path $ZipPath -Leaf); response=$body; attempt=$Attempt; time=(Get-Date).ToString('o') }; $o | ConvertTo-Json -Compress | Out-File -FilePath $logFile -Append -Encoding utf8 -ErrorAction SilentlyContinue } catch { Write-Output "WARN: failed to append to runner_auto_start.json.log: $($_.Exception.Message)" }
    return @{ ok = $true; body = $body }
}
"@
    $mockPath = Join-Path $scriptDir "upload-runner-logs.mock.$mockName.ps1"
    $new = $before + $stub + $after
    Set-Content -Path $mockPath -Value $new -Encoding utf8
    return $mockPath
}

# prepare test zip and retry-queue
$testZip = Join-Path $scriptDir 'test_upload.zip'
New-TestZip -outZip $testZip
if (-not (Test-Path (Join-Path $scriptDir 'retry-queue'))) { New-Item -Path (Join-Path $scriptDir 'retry-queue') -ItemType Directory | Out-Null }

# helper to reset queue
function Reset-Queue(){
    $qd = Join-Path $scriptDir 'retry-queue'
    Get-ChildItem -Path $qd -File -ErrorAction SilentlyContinue | Where-Object {$_.Extension -eq '.zip'} | ForEach-Object { Remove-Item $_.FullName -Force -ErrorAction SilentlyContinue }
    $items = @()
    $index = @{ count = 0; files = $items; deleted_count = 0; updated = (Get-Date).ToString('o') }
    $index | ConvertTo-Json -Compress | Out-File -FilePath (Join-Path $qd 'index.json') -Encoding utf8 -Force
}

# Read/Repair index (sync with upload-runner-logs.ps1 behaviour)
# Use shared queue-utils: Load-QueueIndex / Repair-QueueIndex / Add-QueueEntry

# ensure at least one queued zip exists before snapshot using uploader's queue logic
Reset-Queue
# add initial queued zip using shared Add-QueueEntry
if (Get-Command -Name Add-QueueEntry -ErrorAction SilentlyContinue) { Add-QueueEntry -SourceZip $testZip -QD (Join-Path $scriptDir 'retry-queue') } else { Copy-Item -Path $testZip -Destination (Join-Path (Join-Path $scriptDir 'retry-queue') 'init_test_upload.zip') -Force }
# capture global before snapshot
$globalBefore = Load-QueueIndex -QD (Join-Path $scriptDir 'retry-queue')

 # Case 1: server ok + delete = true
 $mock1 = '{"ok":true,"delete":true}'
 $m1 = Make-MockUploader($mock1,'ok_delete')
 $dest1 = Join-Path (Join-Path $scriptDir 'retry-queue') 'test_upload_1.zip'
 Reset-Queue
 $queueDir = Join-Path $scriptDir 'retry-queue'
 if (Get-Command -Name Add-QueueEntry -ErrorAction SilentlyContinue) {
         $added = Add-QueueEntry -SourceZip $testZip -QD $queueDir
         $zipToUpload = Join-Path $queueDir $added
 } else { Copy-Item -Path $testZip -Destination $dest1 -Force; $zipToUpload = $dest1 }
    $before = Load-QueueIndex -QD $queueDir
Write-Output "Running uploader (ok+delete) against queued zip..."
$uploaderPath = Join-Path $scriptDir 'upload-runner-logs.ps1'
& $uploaderPath -ZipPath $zipToUpload -QueueDir $queueDir -MockResponse $mock1 -Endpoint 'http://mock' | Out-Null
    $after = Load-QueueIndex -QD (Join-Path $scriptDir 'retry-queue')
Write-Output "Index before:"; Write-Output ($before | ConvertTo-Json -Compress)
Write-Output "Index after:"; Write-Output ($after | ConvertTo-Json -Compress)
if ($after -and $after.deleted_count -gt 0 -and ($after.count -eq 0)) { Write-Output 'OK: queued zip deleted and index updated (ok+delete)' } else { Write-Output 'FAIL: expected deleted_count>0 and count==0 for ok+delete' }
if ($after -and $after.deleted_count -gt 0 -and ($after.count -eq 0)) { Write-Output 'OK: queued zip deleted and index updated (ok+delete)'; $case1pass = $true } else { Write-Output 'FAIL: expected deleted_count>0 and count==0 for ok+delete'; $case1pass = $false }

 # Case 2: server ok + delete = false
 $dest2 = Join-Path (Join-Path $scriptDir 'retry-queue') 'test_upload_2.zip'
 Reset-Queue
 $mock2 = '{"ok":true,"delete":false}'
 $m2 = Make-MockUploader($mock2,'ok_nodelete')
 $queueDir = Join-Path $scriptDir 'retry-queue'
 if (Get-Command -Name Add-QueueEntry -ErrorAction SilentlyContinue) {
         $added = Add-QueueEntry -SourceZip $testZip -QD $queueDir
         $zipToUpload = Join-Path $queueDir $added
 } else { Copy-Item -Path $testZip -Destination $dest2 -Force; $zipToUpload = $dest2 }
    $before = Load-QueueIndex -QD $queueDir
Write-Output "Running uploader (ok+delete=false) against queued zip..."
& $uploaderPath -ZipPath $zipToUpload -QueueDir $queueDir -MockResponse $mock2 -Endpoint 'http://mock' | Out-Null
    $after = Load-QueueIndex -QD (Join-Path $scriptDir 'retry-queue')
Write-Output "Index before:"; Write-Output ($before | ConvertTo-Json -Compress)
Write-Output "Index after:"; Write-Output ($after | ConvertTo-Json -Compress)
if ($after -and $after.deleted_count -eq 0 -and ($after.count -eq 1)) { Write-Output 'OK: queued zip retained (ok+delete=false)' } else { Write-Output 'FAIL: expected deleted_count==0 and count==1 for ok+delete=false' }
if ($after -and $after.deleted_count -eq 0 -and ($after.count -eq 1)) { Write-Output 'OK: queued zip retained (ok+delete=false)'; $case2pass = $true } else { Write-Output 'FAIL: expected deleted_count==0 and count==1 for ok+delete=false'; $case2pass = $false }

 # Case 3: schema invalid (non-JSON)
 $dest3 = Join-Path (Join-Path $scriptDir 'retry-queue') 'test_upload_3.zip'
 Reset-Queue
 $mock3 = 'INVALID_JSON'
 $m3 = Make-MockUploader($mock3,'invalid')
 $queueDir = Join-Path $scriptDir 'retry-queue'
 if (Get-Command -Name Add-QueueEntry -ErrorAction SilentlyContinue) {
    $added = Add-QueueEntry -SourceZip $testZip -QD $queueDir
    $zipToUpload = Join-Path $queueDir $added
} else { Copy-Item -Path $testZip -Destination $dest3 -Force; $zipToUpload = $dest3 }
 $before = Load-QueueIndex -QD $queueDir
Write-Output "Running uploader (invalid schema) against queued zip..."
& $uploaderPath -ZipPath $zipToUpload -QueueDir $queueDir -MockResponse $mock3 -Endpoint 'http://mock' | Out-Null
 $after = Load-QueueIndex -QD (Join-Path $scriptDir 'retry-queue')
Write-Output "Index before:"; Write-Output ($before | ConvertTo-Json -Compress)
Write-Output "Index after:"; Write-Output ($after | ConvertTo-Json -Compress)
if ($after -and $after.deleted_count -eq 0 -and ($after.count -eq 1)) { Write-Output 'OK: schema invalid -> file retained and index unchanged' } else { Write-Output 'FAIL: expected file retained and deleted_count==0 for schema invalid' }

if ($after -and $after.deleted_count -eq 0 -and ($after.count -eq 1)) { Write-Output 'OK: schema invalid -> file retained and index unchanged'; $case3pass = $true } else { Write-Output 'FAIL: expected file retained and deleted_count==0 for schema invalid'; $case3pass = $false }

# capture global after snapshot and write diff

# capture global after snapshot using shared loader
$globalAfter = Load-QueueIndex -QD (Join-Path $scriptDir 'retry-queue')
$diff = @{ before = $globalBefore; after = $globalAfter }
try { if (-not (Test-Path (Join-Path $scriptDir 'test-results'))) { New-Item -Path (Join-Path $scriptDir 'test-results') -ItemType Directory | Out-Null } } catch { Write-Warning "test-upload-runner-logs: failed creating test-results dir: $($_.Exception.Message)" }
try { if (-not (Test-Path (Join-Path $scriptDir 'test-results'))) { New-Item -Path (Join-Path $scriptDir 'test-results') -ItemType Directory | Out-Null } } catch { Write-Warning "test-upload-runner-logs: failed creating test-results dir: $($_.Exception.Message)" }
$trDir = Join-Path $scriptDir 'test-results'
($diff | ConvertTo-Json -Compress) | Out-File -FilePath (Join-Path $trDir 'retry-queue-diff.json') -Encoding utf8 -Force

# write overall test result via shared helper
# only return $true when all three case variables are explicitly $true
$overallPass = (($case1pass -eq $true) -and ($case2pass -eq $true) -and ($case3pass -eq $true))
Save-TestResult -Name 'test-upload-runner-logs' -Pass $overallPass -Meta @{ cases = @{ ok_delete = $case1pass; ok_nodelete = $case2pass; invalid_schema = $case3pass } }

Write-Output 'test-upload-runner-logs completed.'

# Ensure machine-readable test result JSON is written (overwrite)
try { if (-not (Test-Path (Join-Path $scriptDir 'test-results'))) { New-Item -Path (Join-Path $scriptDir 'test-results') -ItemType Directory | Out-Null } } catch { Write-Warning "test-upload-runner-logs: failed creating test-results dir: $($_.Exception.Message)" }
$resultObj = @{ name = 'test-upload-runner-logs'; pass = $overallPass; time = (Get-Date).ToString('o'); cases = @{ ok_delete = $case1pass; ok_nodelete = $case2pass; invalid_schema = $case3pass } }
$trDir = Join-Path $scriptDir 'test-results'
$outPath = Join-Path $trDir 'test-upload-runner-logs.json'
($resultObj | ConvertTo-Json -Compress) | Out-File -FilePath $outPath -Encoding utf8 -Force
