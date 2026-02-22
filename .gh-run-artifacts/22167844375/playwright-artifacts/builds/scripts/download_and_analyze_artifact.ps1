param(
  [string]$ArtifactId = '0'
)

if(-not (Get-Command gh -ErrorAction SilentlyContinue)){
  Write-Error "gh CLI not found"
  exit 2
}

if($ArtifactId -eq 0){
  Write-Output "Selecting latest 'playwright-screenshots' artifact id from repository..."
  $raw = gh api /repos/infinityjp-maker/URMS/actions/artifacts --jq '.artifacts[] | select(.name=="playwright-screenshots") | .id'
  if(-not $raw){ Write-Error 'No playwright-screenshots artifacts found'; exit 2 }
  $ids = $raw -split "`n" | ForEach-Object { $_.Trim() } | Where-Object { $_ -match '^[0-9]+$' } | Sort-Object {[long]$_} -Descending
  $ArtifactId = $ids[0]
}

Write-Output "Using artifact id: $ArtifactId"
$zip = Join-Path "$(Get-Location)" "builds/artifacts_$ArtifactId.zip"
$url = "https://api.github.com/repos/infinityjp-maker/URMS/actions/artifacts/$ArtifactId/zip"
$token = gh auth token
if(-not $token){ Write-Error 'Failed to get gh auth token'; exit 2 }
Write-Output "Downloading $url -> $zip"
Invoke-WebRequest -Uri $url -Headers @{ Authorization = "token $token"; 'User-Agent'='gh-cli' } -OutFile $zip -UseBasicParsing
if(-not (Test-Path $zip)) { Write-Error 'Download failed'; exit 2 }

$dest = Join-Path "$(Get-Location)" "builds/artifacts_$ArtifactId"
if(Test-Path $dest){ Remove-Item -Recurse -Force $dest }
Expand-Archive -Path $zip -DestinationPath $dest -Force

# Copy screenshots to expected location
$target = Join-Path "$(Get-Location)" 'builds/screenshots'
if(Test-Path $target){ Remove-Item -Recurse -Force $target }
New-Item -ItemType Directory -Path $target | Out-Null
Copy-Item -Path (Join-Path $dest '*') -Destination $target -Recurse -Force

Write-Output 'Files copied to builds/screenshots:'
Get-ChildItem $target | Select-Object Name, Length | Format-Table -AutoSize

Write-Output 'Running compare...'
node Tests/playwright/compare_screenshots.cjs

Write-Output 'Analyzing diffs...'
node .github/workflow-scripts/analyze_diff.js builds/screenshots/diff-playwright-smoke.png builds/screenshots/diff-playwright-future-mode.png
node .github/workflow-scripts/row_diff.cjs Tests/playwright/baseline/playwright-smoke.png builds/screenshots/playwright-smoke.png

Write-Output 'Done'
