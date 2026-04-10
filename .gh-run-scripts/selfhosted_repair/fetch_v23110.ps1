$ErrorActionPreference = 'Stop'
# Remove old
Remove-Item -LiteralPath .github-runner -Recurse -Force -ErrorAction SilentlyContinue
# Ensure directory
New-Item -ItemType Directory -Force -Path .gh-run-scripts/selfhosted_repair | Out-Null
# Download stable v2.311.0
$url = 'https://github.com/actions/runner/releases/download/v2.311.0/actions-runner-win-x64-2.311.0.zip'
$url | Out-File -FilePath .gh-run-scripts/selfhosted_repair/win_runner_url.txt -Encoding utf8
Invoke-WebRequest -Uri $url -OutFile .github-runner.zip -UseBasicParsing
# Extract
Expand-Archive -LiteralPath .github-runner.zip -DestinationPath .github-runner -Force
# Save file list
Get-ChildItem -LiteralPath .github-runner -Recurse -File | Select-Object -ExpandProperty FullName | Out-File .gh-run-scripts/selfhosted_repair/runner_files.txt -Encoding utf8
# Check presence
$s = if (Test-Path '.github-runner\svc.cmd') { 'present' } else { 'missing' }
$r = if (Test-Path '.github-runner\run.cmd') { 'present' } else { 'missing' }
$c = if (Test-Path '.github-runner\config.cmd') { 'present' } else { 'missing' }
@("svc.cmd=$s","run.cmd=$r","config.cmd=$c") | Out-File .gh-run-scripts/selfhosted_repair/runner_checks.txt -Encoding utf8
# Summary
if ($s -eq 'missing') {
  @("svc_missing:true","url:$url") | Out-File .gh-run-scripts/selfhosted_repair/summary.txt -Encoding utf8
  Write-Output 'SVC_MISSING'
} else {
  @("svc_missing:false","url:$url") | Out-File .gh-run-scripts/selfhosted_repair/summary.txt -Encoding utf8
  Write-Output 'SVC_PRESENT'
}
