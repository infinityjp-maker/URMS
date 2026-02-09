$ErrorActionPreference = 'Stop'
New-Item -ItemType Directory -Force -Path builds/screenshots | Out-Null
$env:URL = 'http://tauri.localhost/'
Write-Output "Running smoke.cjs with URL=$env:URL and saving STDOUT to builds/screenshots/smoke-result.json (stderr -> builds/screenshots/smoke-result.err)"
# Run node and capture stdout only to smoke-result.json; keep stderr separate
& node Tests/playwright/smoke.cjs > builds/screenshots/smoke-result.json 2> builds/screenshots/smoke-result.err
Write-Output 'smoke.cjs completed, stdout saved to builds/screenshots/smoke-result.json; stderr saved to builds/screenshots/smoke-result.err'