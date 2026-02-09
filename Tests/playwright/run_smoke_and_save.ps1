$ErrorActionPreference = 'Stop'
New-Item -ItemType Directory -Force -Path builds/screenshots | Out-Null
$env:URL = 'http://tauri.localhost/'
Write-Output "Running smoke.cjs with URL=$env:URL and saving output to builds/screenshots/smoke-result.json"
# Run node in-process and capture both stdout/stderr to file
& node Tests/playwright/smoke.cjs *>&1 | Out-File -FilePath builds/screenshots/smoke-result.json -Encoding utf8
Write-Output 'smoke.cjs completed, output saved to builds/screenshots/smoke-result.json'