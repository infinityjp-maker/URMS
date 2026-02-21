param(
  [int]$Count = 10,
  [string]$Repo = 'infinityjp-maker/URMS'
)

if(-not (Get-Command gh -ErrorAction SilentlyContinue)){
  Write-Error "gh CLI not found"
  exit 2
}

Set-StrictMode -Version Latest

$raw = gh api "/repos/$Repo/actions/artifacts" --jq '.artifacts[] | select(.name=="playwright-screenshots") | {id:.id,expired:.expired,created_at:.created_at}' 2>$null
if(-not $raw){ Write-Error 'No playwright-screenshots artifacts found via gh api'; exit 2 }

$items = $raw | ConvertFrom-Json | Sort-Object {[datetime]$_.created_at} -Descending | Select-Object -First $Count

$summary = @()
foreach($it in $items){
  $id = $it.id
  Write-Output "\n=== Artifact $id ==="
  $zip = Join-Path (Get-Location) "builds/artifacts_$id.zip"
  $dest = Join-Path (Get-Location) "builds/artifacts_$id"
  $url = "https://api.github.com/repos/$Repo/actions/artifacts/$id/zip"
  $token = gh auth token
  if(Test-Path $zip){ Remove-Item $zip -Force }
  Write-Output "Downloading artifact $id..."
  Invoke-WebRequest -Uri $url -Headers @{ Authorization = "token $token"; 'User-Agent'='gh-cli' } -OutFile $zip -UseBasicParsing
  if(Test-Path $dest){ Remove-Item -Recurse -Force $dest }
  Expand-Archive -Path $zip -DestinationPath $dest -Force

  # copy screenshots to working screenshots dir
  $screens = Join-Path (Get-Location) 'builds/screenshots'
  if(Test-Path $screens){ Remove-Item -Recurse -Force $screens }
  New-Item -ItemType Directory -Path $screens | Out-Null
  Copy-Item -Path (Join-Path $dest '*') -Destination $screens -Recurse -Force

  # run compare harness (skip re-run smoke)
  Write-Output 'Running compare harness...'
  $env:SKIP_RUN_SMOKE = '1'
  $proc = Start-Process -FilePath 'node' -ArgumentList 'Tests/playwright/compare_screenshots.cjs' -NoNewWindow -Wait -PassThru -RedirectStandardOutput (Join-Path $dest 'compare_output.txt') -RedirectStandardError (Join-Path $dest 'compare_error.txt')
  $out = Get-Content (Join-Path $dest 'compare_output.txt') -Raw -ErrorAction SilentlyContinue
  $err = Get-Content (Join-Path $dest 'compare_error.txt') -Raw -ErrorAction SilentlyContinue

  # run analyzers
  Write-Output 'Running analyzers...'
  node .github/workflow-scripts/analyze_diff.js (Join-Path $screens 'diff-playwright-smoke.png') (Join-Path $screens 'diff-playwright-future-mode.png') > (Join-Path $dest 'analyze_diff.json') 2> (Join-Path $dest 'analyze_diff.err')
  node .github/workflow-scripts/row_diff.cjs Tests/playwright/baseline/playwright-smoke.png (Join-Path $screens 'playwright-smoke.png') > (Join-Path $dest 'row_diff.json') 2> (Join-Path $dest 'row_diff.err')

  # parse results
  $passed = $false
  if($out -and $out -match 'All screenshot comparisons passed'){ $passed = $true }
  # parse diff pixel counts
  $smokeDiff = ($out -match 'playwright-smoke.png diff pixels: ([0-9]+)') ? [int]$matches[1] : $null
  $futureDiff = ($out -match 'playwright-future-mode.png diff pixels: ([0-9]+)') ? [int]$matches[1] : $null

  $summary += [pscustomobject]@{
    id = $id
    passed = $passed
    smokeDiff = $smokeDiff
    futureDiff = $futureDiff
    compareOut = if($out) { $out.Substring(0,[Math]::Min(400,$out.Length)) } else { '' }
    compareErr = if($err) { $err.Substring(0,[Math]::Min(400,$err.Length)) } else { '' }
  }
}

Write-Output "\n=== Summary ==="
$summary | Format-Table -AutoSize

Write-Output 'Done'
