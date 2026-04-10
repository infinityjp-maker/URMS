$ErrorActionPreference = 'Stop'
$releasePath = '.gh-run-scripts/selfhosted_repair/release.json'
if (-not (Test-Path $releasePath)) { Write-Error 'release.json not found'; exit 2 }
$release = Get-Content -Raw $releasePath | ConvertFrom-Json
$regex = '^actions-runner-win-x64-[0-9]+\.[0-9]+\.[0-9]+\.zip$'
$matched = @($release.assets | Where-Object { $_.name -match $regex })
if ($matched.Count -ne 1) {
    $matched | Select-Object -ExpandProperty name | Out-File .gh-run-scripts/selfhosted_repair/matched_names.txt -Encoding utf8
    "COUNT=$($matched.Count)" | Out-File .gh-run-scripts/selfhosted_repair/win_runner_url.txt -Encoding utf8
    Write-Output "MATCH_COUNT:$($matched.Count)"
    exit 2
}
$url = $matched[0].browser_download_url
$url | Out-File .gh-run-scripts/selfhosted_repair/win_runner_url.txt -Encoding utf8
Invoke-WebRequest -Uri $url -OutFile .github-runner.zip -UseBasicParsing
if (Test-Path '.github-runner') { Remove-Item -LiteralPath .github-runner -Recurse -Force -ErrorAction SilentlyContinue }
Expand-Archive -LiteralPath .github-runner.zip -DestinationPath .github-runner -Force
Get-ChildItem -LiteralPath .github-runner -Recurse -File | Select-Object -ExpandProperty FullName | Out-File .gh-run-scripts/selfhosted_repair/runner_files.txt -Encoding utf8
$s = if (Test-Path '.github-runner\svc.cmd') { 'present' } else { 'missing' }
$r = if (Test-Path '.github-runner\run.cmd') { 'present' } else { 'missing' }
$c = if (Test-Path '.github-runner\config.cmd') { 'present' } else { 'missing' }
@("svc.cmd=$s","run.cmd=$r","config.cmd=$c") | Out-File .gh-run-scripts/selfhosted_repair/runner_checks.txt -Encoding utf8
if ($s -eq 'missing') {
    "svc_missing:true" | Out-File .gh-run-scripts/selfhosted_repair/summary.txt -Encoding utf8
    Write-Output 'SVC_MISSING'
    exit 0
} else {
    "svc_missing:false" | Out-File .gh-run-scripts/selfhosted_repair/summary.txt -Encoding utf8
    Write-Output 'SVC_PRESENT'
    exit 0
}
