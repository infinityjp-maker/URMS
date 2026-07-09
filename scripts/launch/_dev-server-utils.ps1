# URMS dev server — バックグラウンド起動 · 停止 · PID 管理
$ErrorActionPreference = 'Stop'

function Get-UrmsRepoRoot {
    return (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path
}

function Get-UrmsDevPaths {
    $root = Get-UrmsRepoRoot
    $logDir = Join-Path $root '.logs\dev'
    $pidFile = Join-Path $logDir 'pids.json'
    return @{ Root = $root; LogDir = $logDir; PidFile = $pidFile }
}

function Read-UrmsDevPids {
    param([string]$PidFile)
    if (-not (Test-Path $PidFile)) {
        return $null
    }
    try {
        return Get-Content -Raw -Path $PidFile | ConvertFrom-Json
    } catch {
        return $null
    }
}

function Save-UrmsDevPids {
    param(
        [string]$PidFile,
        [int]$ApiPid,
        [int]$DesktopPid
    )
    $payload = @{
        api     = $ApiPid
        desktop = $DesktopPid
        started = (Get-Date).ToString('o')
    }
    $payload | ConvertTo-Json | Set-Content -Path $PidFile -Encoding UTF8
}

function Test-ProcessAlive {
    param([int]$ProcessId)
    if ($ProcessId -le 0) {
        return $false
    }
    return $null -ne (Get-Process -Id $ProcessId -ErrorAction SilentlyContinue)
}

function Stop-PortListeners {
    param([int[]]$Ports)
    $stopped = 0
    $pids = New-Object 'System.Collections.Generic.HashSet[int]'

    foreach ($port in $Ports) {
        try {
            $connections = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction Stop
            foreach ($conn in $connections) {
                if ($conn.OwningProcess -gt 0) {
                    [void]$pids.Add([int]$conn.OwningProcess)
                }
            }
        } catch {
            $pattern = ":$port\s"
            netstat -ano | Select-String $pattern | ForEach-Object {
                $parts = ($_.Line -split '\s+') | Where-Object { $_ -ne '' }
                $pidText = $parts[-1]
                if ($pidText -match '^\d+$') {
                    [void]$pids.Add([int]$pidText)
                }
            }
        }
    }

    foreach ($pidValue in $pids) {
        Stop-Process -Id $pidValue -Force -ErrorAction SilentlyContinue
        $stopped++
    }

    return $stopped
}

function Stop-UrmsDevServers {
    $paths = Get-UrmsDevPaths
    $record = Read-UrmsDevPids -PidFile $paths.PidFile
    $stopped = 0

    if ($null -ne $record) {
        foreach ($name in @('api', 'desktop')) {
            $pidValue = [int]$record.$name
            if (Test-ProcessAlive -ProcessId $pidValue) {
                Stop-Process -Id $pidValue -Force -ErrorAction SilentlyContinue
                $stopped++
            }
        }
        Remove-Item -Path $paths.PidFile -Force -ErrorAction SilentlyContinue
    }

    # 旧 CMD 起動分 · ポート占有の残骸を解放
    try {
        $stopped += Stop-PortListeners -Ports @(3000, 1420)
    } catch {
        # Get-NetTCPConnection 非対応環境では無視
    }

    return $stopped
}

function Wait-UrmsHttpReady {
    param(
        [string]$Url,
        [int]$TimeoutSeconds = 45
    )
    $deadline = (Get-Date).AddSeconds($TimeoutSeconds)
    while ((Get-Date) -lt $deadline) {
        try {
            $response = Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec 2
            if ($response.StatusCode -ge 200 -and $response.StatusCode -lt 400) {
                return $true
            }
        } catch { }
        Start-Sleep -Seconds 1
    }
    return $false
}

function Start-UrmsDevServerProcess {
    param(
        [string]$Root,
        [string]$LogDir,
        [string]$Name,
        [string]$PnpmScript
    )

    New-Item -ItemType Directory -Force -Path $LogDir | Out-Null
    $stamp = Get-Date -Format 'yyyyMMdd-HHmmss'
    $stdoutSession = Join-Path $LogDir "$Name-$stamp.stdout.log"
    $stderrSession = Join-Path $LogDir "$Name-$stamp.stderr.log"

    $cmdLine = 'cmd /c cd /d "' + $Root + '" && npx pnpm@9.15.4 ' + $PnpmScript + ' 1>> "' + $stdoutSession + '" 2>> "' + $stderrSession + '"'
    $escapedCmd = $cmdLine -replace '"', '""'
    $vbs = 'CreateObject("WScript.Shell").Run "' + $escapedCmd + '", 0, False'
    $vbsPath = Join-Path $LogDir "start-$Name-$stamp.vbs"
    Set-Content -Path $vbsPath -Value $vbs -Encoding ASCII

    $proc = Start-Process -FilePath 'wscript.exe' `
        -ArgumentList $vbsPath `
        -WorkingDirectory $Root `
        -WindowStyle Hidden `
        -PassThru

    return $proc.Id
}

function Start-UrmsDevServers {
    param(
        [ValidateSet('web', 'tauri')]
        [string]$DesktopTarget = 'web',
        [switch]$SkipPrepare,
        [switch]$SkipPreview
    )

    $paths = Get-UrmsDevPaths
    $root = $paths.Root

    Stop-UrmsDevServers | Out-Null
    Start-Sleep -Seconds 4

    Set-Location $root

    if (-not $SkipPrepare) {
        Write-Host 'dev:prepare ...'
        & npx pnpm@9.15.4 run dev:prepare
        if ($LASTEXITCODE -ne 0) {
            throw "dev:prepare failed (exit $LASTEXITCODE)"
        }
    }

    Write-Host 'Starting API (background, port 3000) ...'
    $apiPid = Start-UrmsDevServerProcess -Root $root -LogDir $paths.LogDir -Name 'api' -PnpmScript 'dev:api'

    if (-not (Wait-UrmsHttpReady -Url 'http://127.0.0.1:3000/health' -TimeoutSeconds 45)) {
        $latest = Get-ChildItem -Path $paths.LogDir -Filter 'api-*.stderr.log' | Sort-Object LastWriteTime -Descending | Select-Object -First 1
        $hint = if ($latest) { $latest.FullName } else { Join-Path $paths.LogDir 'api.stderr.log' }
        throw "API did not become ready on port 3000. See $hint"
    }
    Write-Host '[OK] API ready'

    $desktopScript = if ($DesktopTarget -eq 'tauri') { 'dev:desktop' } else { 'dev:desktop:web' }
    Write-Host "Starting Desktop $DesktopTarget (background, port 1420) ..."
    $desktopPid = Start-UrmsDevServerProcess -Root $root -LogDir $paths.LogDir -Name 'desktop' -PnpmScript $desktopScript

    if (-not (Wait-UrmsHttpReady -Url 'http://127.0.0.1:1420/' -TimeoutSeconds 45)) {
        $latest = Get-ChildItem -Path $paths.LogDir -Filter 'desktop-*.stderr.log' | Sort-Object LastWriteTime -Descending | Select-Object -First 1
        $hint = if ($latest) { $latest.FullName } else { Join-Path $paths.LogDir 'desktop.stderr.log' }
        throw "Desktop UI did not become ready on port 1420. See $hint"
    }
    Write-Host '[OK] Desktop UI ready'

    Save-UrmsDevPids -PidFile $paths.PidFile -ApiPid $apiPid -DesktopPid $desktopPid

    if (-not $SkipPreview -and $DesktopTarget -eq 'web') {
        Write-Host '[OK] 1420 ready — open Canvas urms-hub preview link'
    }

    Write-Host ''
    Write-Host 'URMS dev servers (background)'
    Write-Host "  Product UI:  http://127.0.0.1:1420/"
    Write-Host "  Screen list: http://127.0.0.1:1420/#/screens"
    Write-Host "  API health:  http://127.0.0.1:3000/health"
    Write-Host "  Logs:        $($paths.LogDir)"
    Write-Host "  Stop:        scripts\launch\stop-dev-servers.bat"
    Write-Host ''

    return @{ ApiPid = $apiPid; DesktopPid = $desktopPid; LogDir = $paths.LogDir }
}
