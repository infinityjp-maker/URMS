# URMS local environment setup
# Usage: powershell -NoProfile -ExecutionPolicy Bypass -File scripts/dev/setup-env.ps1
param(
  [switch]$SkipDockerInstall,
  [switch]$StartServers,
  [switch]$FullDocker
)

$ErrorActionPreference = 'Stop'
$Root = Resolve-Path (Join-Path $PSScriptRoot '..\..')
Set-Location $Root

$PnpmCmd = 'npx pnpm@9.15.4'
$DockerExe = "${env:ProgramFiles}\Docker\Docker\Docker Desktop.exe"

function Write-Step {
  param([string]$Message)
  Write-Host ''
  Write-Host "==> $Message" -ForegroundColor Cyan
}

function Test-PortOpen {
  param([int]$Port)
  try {
    $client = New-Object System.Net.Sockets.TcpClient
    $client.Connect('127.0.0.1', $Port)
    $client.Close()
    return $true
  } catch {
    return $false
  }
}

function Wait-Postgres {
  param([int]$TimeoutSec = 120)
  $deadline = (Get-Date).AddSeconds($TimeoutSec)
  while ((Get-Date) -lt $deadline) {
    if (Test-PortOpen -Port 5432) {
      Start-Sleep -Seconds 3
      return $true
    }
    Start-Sleep -Seconds 2
  }
  return $false
}

function Test-DockerCli {
  try {
    & docker version 2>$null | Out-Null
    return $LASTEXITCODE -eq 0
  } catch {
    return $false
  }
}

function Invoke-Pnpm {
  param([Parameter(Mandatory = $true)][string]$Args)
  $parts = $Args -split ' '
  & npx pnpm@9.15.4 @parts
  if ($LASTEXITCODE -ne 0) { throw "pnpm failed: $Args" }
}

function Import-RootEnv {
  $envPath = Join-Path $Root '.env'
  if (-not (Test-Path $envPath)) { return }
  Get-Content $envPath | ForEach-Object {
    $line = $_.Trim()
    if (-not $line -or $line.StartsWith('#')) { return }
    $i = $line.IndexOf('=')
    if ($i -le 0) { return }
    $key = $line.Substring(0, $i).Trim()
    if (-not (Get-Item -Path "env:$key" -ErrorAction SilentlyContinue)) {
      Set-Item -Path "env:$key" -Value $line.Substring($i + 1).Trim()
    }
  }
}

function Ensure-DockerDesktop {
  if (Test-DockerCli) { return $true }

  if (-not (Test-Path $DockerExe)) {
    if ($SkipDockerInstall) {
      Write-Host 'SKIP: Docker Desktop not installed (-SkipDockerInstall)'
      return $false
    }
    Write-Step 'Installing Docker Desktop via winget'
    & winget install Docker.DockerDesktop --accept-package-agreements --accept-source-agreements
    if (-not (Test-Path $DockerExe)) {
      Write-Host 'WARN: Docker Desktop install incomplete. Install manually from docker.com'
      return $false
    }
  }

  Write-Step 'Starting Docker Desktop'
  Start-Process -FilePath $DockerExe
  Write-Host 'Waiting for Docker Engine (up to 3 min)...'
  $deadline = (Get-Date).AddMinutes(3)
  while ((Get-Date) -lt $deadline) {
    if (Test-DockerCli) {
      Write-Host 'OK: Docker Engine ready'
      return $true
    }
    Start-Sleep -Seconds 5
  }
  Write-Host 'WARN: Docker Engine did not start. Open Docker Desktop manually and re-run.'
  return $false
}

Write-Step 'Node.js version'
$nodeVer = (& node -v) -replace '^v', ''
$nodeMajor = [int]($nodeVer.Split('.')[0])
if ($nodeMajor -lt 20) {
  throw "Node.js 20+ required (current: v$nodeVer)"
}
Write-Host "OK: Node v$nodeVer"

Write-Step '.env'
if (-not (Test-Path '.env')) {
  Copy-Item '.env.example' '.env'
  Write-Host 'OK: created .env from .env.example'
} else {
  Write-Host 'OK: .env exists'
}
Import-RootEnv

Write-Step 'pnpm install'
Invoke-Pnpm 'install'

Write-Step 'dev:prepare'
Invoke-Pnpm 'dev:prepare'

$dockerReady = $false
if ($FullDocker) {
  $dockerReady = Ensure-DockerDesktop
  if ($dockerReady) {
    Write-Step 'docker:up (postgres + api + web + nginx)'
    Invoke-Pnpm 'docker:up'
    Write-Host 'OK: http://localhost:8080/'
  }
} else {
  $dockerReady = Ensure-DockerDesktop
  if ($dockerReady) {
    Write-Step 'db:up (PostgreSQL only)'
    Invoke-Pnpm 'db:up'
    if (Wait-Postgres) {
      Write-Host 'OK: PostgreSQL on :5432'
      Write-Step 'db:migrate'
      Invoke-Pnpm 'db:migrate'
      Write-Step 'ssot:sync'
      Invoke-Pnpm 'ssot:sync'
      Write-Host 'OK: ssot:sync done'
    } else {
      Write-Host 'WARN: PostgreSQL did not start'
      $dockerReady = $false
    }
  }
}

if (-not $dockerReady) {
  Write-Host ''
  Write-Host '--- Without DB ---' -ForegroundColor Yellow
  Write-Host 'Wireframes (5180) and desktop shell (1420) work without PostgreSQL.'
  Write-Host 'Re-run after Docker Desktop: scripts\launch\setup-env.bat'
}

if ($StartServers -and -not $FullDocker) {
  Write-Step 'Starting dev servers (new windows)'
  & powershell -NoProfile -ExecutionPolicy Bypass -File (Join-Path $PSScriptRoot 'start-ui.ps1')
  $apiCmd = "Set-Location '$Root'; npx pnpm@9.15.4 dev:api"
  $webCmd = "Set-Location '$Root'; npx pnpm@9.15.4 dev"
  Start-Process powershell -ArgumentList '-NoProfile', '-ExecutionPolicy', 'Bypass', '-Command', $apiCmd
  Start-Process powershell -ArgumentList '-NoProfile', '-ExecutionPolicy', 'Bypass', '-Command', $webCmd
  Write-Host 'OK: API, Web, wireframes, desktop web started'
  Start-Sleep -Seconds 10
}

Write-Step 'dev:verify'
& powershell -NoProfile -ExecutionPolicy Bypass -File (Join-Path $PSScriptRoot 'verify-dev.ps1')
$verifyExit = $LASTEXITCODE

Write-Host ''
Write-Host '=== Setup complete ===' -ForegroundColor Green
Write-Host 'Desktop:    http://127.0.0.1:1420/'
Write-Host 'Wireframes: http://127.0.0.1:5180/index.html'
Write-Host 'Web UI:     http://127.0.0.1:5173/'
Write-Host 'API:        http://127.0.0.1:3000/health'
if ($FullDocker -and $dockerReady) {
  Write-Host 'MVP stack:  http://localhost:8080/'
}

exit $verifyExit
