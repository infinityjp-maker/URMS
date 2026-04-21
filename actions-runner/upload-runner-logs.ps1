# upload-runner-logs.ps1
param(
    [Parameter(Mandatory=$true)][string]$ZipPath,
    [string]$Endpoint = 'https://selfheal.example.local/upload',
    [string]$Token = '<TOKEN_PLACEHOLDER>',
    [string]$QueueDir = $null,
    [string]$MockResponse = $null,
    [ValidateSet('Strict','Relaxed','Skip')][string]$CertMode = 'Strict',
    [int]$MaxRetries = 5,
    [int]$InitialBackoffSeconds = 2,
    [int]$MaxBackoffSeconds = 300
)

$LogFile = Join-Path (Split-Path -Parent $MyInvocation.MyCommand.Path) 'runner_auto_start.json.log'
function LogJson($obj) { try { $obj | ConvertTo-Json -Compress | Out-File -FilePath $LogFile -Append -Encoding utf8 } catch { Write-Warning "LogJson failed: $($_.Exception.Message)" } }

# Safely write a JSON-serializable object to a file path. Emits diagnostic via LogJson on failure.
function SafeWriteJsonToFile($obj, $path, [switch]$Force) {
    try {
        $json = $obj | ConvertTo-Json -Compress -ErrorAction Stop
        if ($Force) { $json | Out-File -FilePath $path -Encoding utf8 -Force } else { $json | Out-File -FilePath $path -Encoding utf8 }
        return $true
    } catch {
        try { LogJson @{ status='json_write_failed'; path=$path; reason=$_.Exception.Message; time=(Get-Date).ToString('o') } } catch {}
        return $false
    }
}

try {
    $scriptDirLocal = Split-Path -Parent $MyInvocation.MyCommand.Path
    $queueUtils = Join-Path $scriptDirLocal 'queue-utils.ps1'
    if (Test-Path $queueUtils) { . $queueUtils }
} catch { Write-Warning "upload-runner-logs: failed loading queue-utils: $($_.Exception.Message)" }

if (-not (Test-Path $ZipPath)) { Write-Output "ZIP_NOT_FOUND"; LogJson @{ status='fail'; reason='zip_not_found'; zip=$ZipPath; time=(Get-Date).ToString('o') }; exit 2 }

# allow overriding the retry queue dir for tests
if (-not $QueueDir -or $QueueDir -eq '') { $QueueDir = Join-Path (Split-Path -Parent $MyInvocation.MyCommand.Path) 'retry-queue' }

$hdr = @{ 'User-Agent' = 'urms-runner-uploader' }
if ($Token -and $Token -ne '<TOKEN_PLACEHOLDER>') { $hdr.Authorization = "Bearer $Token" }

# preserve any caller-provided $QueueDir; only set default when empty
if (-not $QueueDir -or $QueueDir -eq '') { $QueueDir = Join-Path (Split-Path -Parent $MyInvocation.MyCommand.Path) 'retry-queue' }

# TLS cert handling
switch ($CertMode) {
    'Skip' { [System.Net.ServicePointManager]::ServerCertificateValidationCallback = { return $true } }
    'Relaxed' { [System.Net.ServicePointManager]::ServerCertificateValidationCallback = { param($s,$c,$ch,$er) return $true } }
    default { # Strict: default system validation
    }
}

function Do-Upload {
    param($Attempt)
    try {
        if ($MockResponse -ne $null -and $MockResponse -ne '') {
            # use supplied mock response body instead of performing network I/O
            $body = $MockResponse
            LogJson @{ status='mocked_response_used'; endpoint=$Endpoint; zip=(Split-Path $ZipPath -Leaf); response=$body; attempt=$Attempt; time=(Get-Date).ToString('o') }
        } else {
            $b = [System.IO.File]::ReadAllBytes($ZipPath)
            $boundary = "----URMSBoundary$([System.Guid]::NewGuid().ToString())"
            $req = [System.Net.HttpWebRequest]::Create($Endpoint)
            $req.Method = 'POST'
            $req.ContentType = "multipart/form-data; boundary=$boundary"
            foreach ($k in $hdr.Keys) {
                try {
                    if ($k -ieq 'User-Agent') { $req.UserAgent = $hdr[$k] } else { $req.Headers.Add($k, $hdr[$k]) }
                } catch {
                    # Some headers are restricted or the property assignment may fail in some environments.
                    Write-Warning "upload-runner-logs: failed setting header ${k}: $($_.Exception.Message)"
                }
            }

            $ms = New-Object System.IO.MemoryStream
            $writer = New-Object System.IO.StreamWriter($ms)
            $writer.Write("--$boundary`r`n")
            $writer.Write("Content-Disposition: form-data; name=""file""; filename=""$(Split-Path $ZipPath -Leaf)""`r`n")
            $writer.Write("Content-Type: application/zip`r`n`r`n")
            $writer.Flush()
            $ms.Write($b, 0, $b.Length)
            $footer = "`r`n--$boundary--`r`n"
            $buf = [System.Text.Encoding]::UTF8.GetBytes($footer)
            $ms.Write($buf,0,$buf.Length)
            $ms.Seek(0,[System.IO.SeekOrigin]::Begin) | Out-Null
            $req.ContentLength = $ms.Length
            $reqStream = $req.GetRequestStream()
            $ms.CopyTo($reqStream)
            $reqStream.Close()

            $resp = $req.GetResponse()
            $sr = New-Object System.IO.StreamReader($resp.GetResponseStream())
            $body = $sr.ReadToEnd()
            LogJson @{ status='ok'; endpoint=$Endpoint; zip=(Split-Path $ZipPath -Leaf); response=$body; attempt=$Attempt; time=(Get-Date).ToString('o') }
        }

        # if uploading from a retry-queue, only delete local file when server responds with JSON { ok: true, delete: true }
        try {
            if ((Test-Path $QueueDir) -and ($ZipPath -like "*$($QueueDir)*")) {
                    try {
                        $parsed = $null
                        try { $parsed = $body | ConvertFrom-Json -ErrorAction SilentlyContinue } catch { $parsed = $null }
                        # coerce ok/delete to boolean to tolerate string "true" values from mock servers
                        if ($parsed) {
                            try { $parsed.ok = ($parsed.ok -eq $true) } catch { $parsed.ok = $false }
                            try { $parsed.delete = ($parsed.delete -eq $true) } catch { $parsed.delete = $false }
                        }
                        # debug: show evaluated parsed values to help diagnose deletion logic
                        try { Write-Host "DEBUG: parsed.ok=$($parsed.ok) parsed.delete=$($parsed.delete) ZipPath=$ZipPath" } catch { Write-Warning "upload-runner-logs: debug Write-Host failed: $($_.Exception.Message)" }
                        if ($parsed -and (($parsed.ok -eq $true) -and ($parsed.delete -eq $true))) {
                        # validate response schema via helper
                        try {
                            $checker = Join-Path (Split-Path -Parent $MyInvocation.MyCommand.Path) 'check-upload-response-schema.ps1'
                            if (Test-Path $checker) {
                                try {
                                    if ($QueueDir -and (Test-Path $QueueDir)) {
                                        $checkOut = & $checker -ResponseJson $body -QueueDir $QueueDir
                                    } else {
                                        $checkOut = & $checker -ResponseJson $body
                                    }
                                    $checkCode = $LASTEXITCODE
                                    if ($checkCode -ne 0) {
                                        # detailed schema mismatch log: expected (from checker) vs actual body
                                         $schemaDetail = $null
                                         try {
                                             if ($QueueDir -and ($QueueDir -ne '') -and (Test-Path $QueueDir)) {
                                                 $schemaFile = Join-Path $QueueDir 'last_schema_check.json'
                                                 if (Test-Path $schemaFile) {
                                                     try { $schemaDetail = Get-Content $schemaFile -Raw | ConvertFrom-Json -ErrorAction SilentlyContinue } catch { Write-Warning "upload-runner-logs: reading last_schema_check.json failed: $($_.Exception.Message)" }
                                                 }
                                             }
                                         } catch { Write-Warning "upload-runner-logs: reading last_schema_check.json failed: $($_.Exception.Message)" }
                                        LogJson @{ status='delete_aborted_schema_invalid'; zip=(Split-Path $ZipPath -Leaf); schema_check=$checkOut; schema_detail = $schemaDetail; actual_response = $body; time=(Get-Date).ToString('o') }
                                        return @{ ok=$true; body=$body }
                                    }
                                } catch { Write-Warning "upload-runner-logs: schema checker invocation failed; treating response as schema-invalid" ; return @{ ok=$true; body=$body } }
                            }
                        } catch { Write-Warning "upload-runner-logs: schema checker failed (outer); treating response as schema-invalid" }
                        try {
                            # determine canonical queue filename from index.json (prefer index first)
                            $indexPath = Join-Path $QueueDir 'index.json'
                            $idx = $null
                            if (Get-Command -Name Load-QueueIndex -ErrorAction SilentlyContinue) { $idx = Load-QueueIndex -QD $QueueDir } else {
                                if (Test-Path $indexPath) { try { $idx = Get-Content $indexPath -Raw | ConvertFrom-Json -ErrorAction SilentlyContinue } catch { $idx = $null } }
                            }
                            $targetName = $null
                            if ($idx -and $idx.files -and ($idx.files.Count -gt 0)) { $targetName = $idx.files[0] } else { $targetName = (Split-Path $ZipPath -Leaf) }
                            $targetPath = Join-Path $QueueDir $targetName
                            try { Remove-Item -Path $targetPath -Force -ErrorAction SilentlyContinue } catch { Write-Warning "upload-runner-logs: failed removing target ${targetPath}: $($_.Exception.Message)" }
                            # update index.json to remove entry and increment deleted_count using canonical targetName
                            if (Test-Path $indexPath) {
                                try {
                                    if (-not $idx) { $idx = Load-QueueIndex -QD $QueueDir }
                                    $files = @()
                                    if ($idx -and $idx.files) { $files = @($idx.files) | Where-Object { $_ -ne $targetName } }
                                    $deletedCount = 1
                                    if ($idx -and $idx.deleted_count) { $deletedCount = [int]$idx.deleted_count + 1 }
                                    $newIdx = @{ count = ($files | Measure-Object).Count; files = @($files); deleted_count = $deletedCount; updated = (Get-Date).ToString('o') }
                                    SafeWriteJsonToFile -obj $newIdx -path $indexPath -Force
                                } catch { LogJson @{ status='index_update_failed'; reason=$_.Exception.Message; time=(Get-Date).ToString('o') } }
                            }
                            LogJson @{ status='deleted_from_queue'; zip=$targetName; time=(Get-Date).ToString('o') }
                        } catch { LogJson @{ status='delete_failed'; zip=(Split-Path $ZipPath -Leaf); reason=$_.Exception.Message; time=(Get-Date).ToString('o') } }
                    } else {
                        LogJson @{ status='not_deleted_response_missing_ok_delete'; zip=$(Split-Path $ZipPath -Leaf); server_response=$body; time=(Get-Date).ToString('o') }
                    }
                } catch { LogJson @{ status='delete_error'; zip=$(Split-Path $ZipPath -Leaf); reason=$_.Exception.Message; time=(Get-Date).ToString('o') } }
            }
        } catch { Write-Warning "upload-runner-logs: queue deletion block failed: $($_.Exception.Message)" }

        return @{ ok=$true; body=$body }
    } catch {
        LogJson @{ status='fail'; reason=$_.Exception.Message; zip=$(Split-Path $ZipPath -Leaf); attempt=$Attempt; time=(Get-Date).ToString('o') }
        return @{ ok=$false; reason=$_.Exception.Message }
    }
}

$attempt = 0
$backoff = $InitialBackoffSeconds
while ($attempt -lt $MaxRetries) {
    $attempt++
    $res = Do-Upload -Attempt $attempt
    if ($res.ok) { Write-Output $res.body; exit 0 }
    Start-Sleep -Seconds ($backoff + (Get-Random -Minimum 0 -Maximum $backoff))
    $backoff = [math]::Min($backoff * 2, $MaxBackoffSeconds)
}

# on final failure, move zip to retry queue for later resend
$QueueDir = Join-Path (Split-Path -Parent $MyInvocation.MyCommand.Path) 'retry-queue'
try { if (-not (Test-Path $QueueDir)) { New-Item -Path $QueueDir -ItemType Directory -Force | Out-Null } } catch { Write-Warning "upload-runner-logs: ensuring retry-queue dir failed: $($_.Exception.Message)" }
try {
    $dest = Join-Path $QueueDir (Split-Path $ZipPath -Leaf)
    Copy-Item -Path $ZipPath -Destination $dest -Force -ErrorAction SilentlyContinue
    # update index
    $items = @(Get-ChildItem -Path $QueueDir -File -ErrorAction SilentlyContinue | Select-Object -ExpandProperty Name)
    $index = @{ count = ($items | Measure-Object).Count; files = @($items); deleted_count = 0; updated = (Get-Date).ToString('o') }
    $indexPath = Join-Path $QueueDir 'index.json'
    SafeWriteJsonToFile -obj $index -path $indexPath -Force
    LogJson @{ status='queued'; zip=$(Split-Path $ZipPath -Leaf); queue_dest=$dest; time=(Get-Date).ToString('o') }
} catch {
    LogJson @{ status='queue_fail'; reason=$_.Exception.Message; zip=$(Split-Path $ZipPath -Leaf); time=(Get-Date).ToString('o') }
}

Write-Output "UPLOAD_FAILED_QUEUED"
exit 3
