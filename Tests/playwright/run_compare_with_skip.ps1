$ErrorActionPreference = 'Stop'
$env:SKIP_RUN_SMOKE = '1'
Write-Output "Running compare_screenshots.cjs with SKIP_RUN_SMOKE=$env:SKIP_RUN_SMOKE"
node Tests/playwright/compare_screenshots.cjs
Write-Output 'compare_screenshots completed'
