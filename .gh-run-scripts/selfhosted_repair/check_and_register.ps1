$ErrorActionPreference = 'Stop'

# Save runner file checks
$s = if (Test-Path '.github-runner\run.cmd') { 'present' } else { 'missing' }
$c = if (Test-Path '.github-runner\config.cmd') { 'present' } else { 'missing' }
$svc = if (Test-Path '.github-runner\bin\RunnerService.exe') { 'present' } else { 'missing' }
@("run.cmd=$s","config.cmd=$c","RunnerService.exe=$svc") | Out-File -FilePath .gh-run-scripts/selfhosted_repair/runner_checks.txt -Encoding utf8

# Save full file list
Get-ChildItem -LiteralPath .github-runner -Recurse -File | Select-Object -ExpandProperty FullName | Out-File -FilePath .gh-run-scripts/selfhosted_repair/runner_files.txt -Encoding utf8

# Obtain registration token (POST)
gh api -X POST repos/infinityjp-maker/URMS/actions/runners/registration-token > .gh-run-scripts/selfhosted_repair/token.json

# Parse token and register runner (replace)
$tokenJson = Get-Content -Raw .gh-run-scripts/selfhosted_repair/token.json | ConvertFrom-Json
if (-not $tokenJson.token) { Write-Error 'registration token not found'; exit 2 }
$token = $tokenJson.token

Push-Location .github-runner
.\config.cmd --url https://github.com/infinityjp-maker/URMS --token $token --unattended --replace *>&1 | Out-File -FilePath "..\.gh-run-scripts\selfhosted_repair\config_output.txt" -Encoding utf8
Pop-Location

# Read config output and construct summary
$configOut = Get-Content -Raw .gh-run-scripts/selfhosted_repair/config_output.txt -ErrorAction SilentlyContinue
$registered = $false
if ($configOut -and ($configOut -match 'Runner successfully added')) { $registered = $true }

$summary = [pscustomobject]@{
    timestamp = (Get-Date).ToString('o')
    runner_checks = '.gh-run-scripts/selfhosted_repair/runner_checks.txt'
    runner_files = '.gh-run-scripts/selfhosted_repair/runner_files.txt'
    token = '.gh-run-scripts/selfhosted_repair/token.json'
    config_output = '.gh-run-scripts/selfhosted_repair/config_output.txt'
    registered = $registered
    next_steps = 'Run as Administrator: cd D:\\GitHub\\URMS\\.github-runner\\bin ; .\\RunnerService.exe install ; .\\RunnerService.exe start ; then notify agent to continue verification.'
}
$summary | ConvertTo-Json -Depth 5 | Out-File -FilePath .gh-run-scripts/selfhosted_repair/summary.json -Encoding utf8

Write-Output 'CHECK_AND_REGISTER_DONE'