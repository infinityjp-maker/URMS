Param(
    [string]$PfxPath = "",
    [string]$PfxPassword = "",
    [string]$OutputDir = "builds",
    [switch]$NoSign
)

$ErrorActionPreference = 'Stop'

$exe = Join-Path -Path $PSScriptRoot -ChildPath "..\..\Backend\src-tauri\target\release\urms.exe"
$exe = (Resolve-Path $exe).Path
$dist = Join-Path -Path $PSScriptRoot -ChildPath "..\..\dist"
$OutputDirPath = Join-Path -Path $PSScriptRoot -ChildPath "..\..\$OutputDir"
New-Item -ItemType Directory -Path $OutputDirPath -Force | Out-Null

Write-Output "Using exe: $exe"
Write-Output "Using dist: $dist"
Write-Output "Output dir: $OutputDirPath"

if (-not (Test-Path $exe)) {
    Write-Error "Release exe not found at $exe. Build the project first."
}

# Copy exe to output
Copy-Item -Path $exe -Destination (Join-Path $OutputDirPath "urms.exe") -Force

# Optionally sign
if (-not $NoSign -and $PfxPath) {
    if (-not (Get-Command signtool -ErrorAction SilentlyContinue)) {
        Write-Error "signtool not found in PATH. Install Windows SDK or provide signing tool."
    }
    Write-Output "Signing exe with $PfxPath"
    & signtool sign /fd SHA256 /a /f $PfxPath /p $PfxPassword (Join-Path $OutputDirPath "urms.exe")
}

# Archive dist if present
if (Test-Path $dist) {
    $zipPath = Join-Path $OutputDirPath "dist.zip"
    if (Test-Path $zipPath) { Remove-Item $zipPath -Force }
    Compress-Archive -Path (Join-Path $dist "*") -DestinationPath $zipPath -Force
    Write-Output "Created $zipPath"
} else {
    Write-Output "No dist folder found; skipping dist archive."
}

Write-Output "Packaging complete. Outputs in: $OutputDirPath"