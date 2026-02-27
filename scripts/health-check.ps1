param(
    [string]$Url = $env:URL,
    [int]$Retries = 60,
    [int]$DelaySeconds = 1,
    [int[]]$Ports = @(8765,8877)
)

if (-not $Url) { $Url = 'http://tauri.localhost/' }

function Test-TcpPort {
    param(
        [string]$TargetHost,
        [int]$Port,
        [int]$TimeoutMs = 1000
    )
    try {
        $tcp = New-Object System.Net.Sockets.TcpClient
        $iar = $tcp.BeginConnect($TargetHost, $Port, $null, $null)
        $wait = $iar.AsyncWaitHandle.WaitOne($TimeoutMs)
        if (-not $wait) {
            $tcp.Close()
            return $false
        }
        $tcp.EndConnect($iar)
        $tcp.Close()
        return $true
    } catch {
        return $false
    }
}

function Test-HttpUrl {
    param(
        [string]$Url,
        [int]$TimeoutSeconds = 3
    )
    try {
        $resp = Invoke-WebRequest -Uri $Url -TimeoutSec $TimeoutSeconds -UseBasicParsing -ErrorAction Stop
        $code = $resp.StatusCode -as [int]
        return [pscustomobject]@{ Ok = $true; Status = $code; Reason = "HTTP $code" }
    } catch {
        $msg = $_.Exception.Message
        return [pscustomobject]@{ Ok = $false; Status = $null; Reason = $msg }
    }
}

$start = Get-Date
$attempt = 0
$lastError = $null

function Log {
    param([string]$Message)
    $ts = (Get-Date).ToString('o')
    Write-Output "[$ts] $Message"
}

while ($attempt -lt $Retries) {
    $attempt++
    # HTTP check
    $httpResp = Test-HttpUrl -Url $Url

    # derive host for TCP checks
    $uri = $null
    try {
        $uri = [uri]$Url
    } catch {
        # if URL is not a URI, skip
        $uri = $null
    }

    $tcpResults = @{}
    if ($uri) {
        $targetHost = $uri.Host
        foreach ($p in $Ports) {
            $tcpResults[$p] = Test-TcpPort $targetHost $p
        }
    }

    $httpOk = $false
    $httpReason = ''
    if ($httpResp -ne $null -and $httpResp.Ok) {
        $httpOk = $true
        $httpReason = $httpResp.Reason
    } else {
        $httpOk = $false
        $httpReason = if ($httpResp) { $httpResp.Reason } else { 'HTTP check failed' }
    }

    $tcpSummary = ($Ports | ForEach-Object { "$($_):$($tcpResults[$_])" }) -join ' '
    Log "health-check: attempt $attempt/$Retries - HTTP: $httpReason - TCP: $tcpSummary"

    $anyTcpOk = $false
    foreach ($p in $Ports) { if ($tcpResults[$p]) { $anyTcpOk = $true; break } }
    if ($httpOk -and $anyTcpOk) {
        Log 'health-check OK'
        exit 0
    }

    $lastError = @()
    if (-not $httpOk) { $lastError += "HTTP GET failed: $httpReason" }
    if ($uri) {
        foreach ($p in $Ports) {
            if (-not $tcpResults[$p]) { $lastError += "TCP $p closed on $($uri.Host)" }
        }
    }

    Start-Sleep -Seconds $DelaySeconds
}

$reason = if ($lastError) { ($lastError -join '; ') } else { 'unknown' }
Log "health-check FAILED: $reason"
exit 1
