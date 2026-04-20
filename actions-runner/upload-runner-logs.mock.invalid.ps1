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
    param(
        
    )
    # Return a non-JSON body to force schema-invalid handling
     = 'INVALID_JSON'
    try {  = Split-Path -Parent System.Management.Automation.InvocationInfo.MyCommand.Path } catch {  = 'D:\GitHub\URMS\actions-runner' }
    try {  = Join-Path  'runner_auto_start.json.log';  = @{ status='mock_upload'; zip=(Split-Path  -Leaf); response=; attempt=; time=(Get-Date).ToString('o') };  | ConvertTo-Json -Compress | Out-File -FilePath  -Append -Encoding utf8 -ErrorAction SilentlyContinue } catch { Write-Warning "test-retry-queue: failed to append mock log: " }
    return @{ ok = True; body =  }
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

