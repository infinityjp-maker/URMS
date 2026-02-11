<#
Verify generated annotated-diff files match the template with expected MAP_URLs.
Exits 0 on success, non-zero on mismatch.
#>
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Definition
$templatePath = Join-Path $scriptDir 'annotated-diff-template.html'
if(-not (Test-Path $templatePath)){
  Write-Error "Template not found: $templatePath"
  exit 2
}

$template = Get-Content -Raw -Path $templatePath -ErrorAction Stop

$pairs = @{
  'map_diff_playwright_smoke.json' = 'annotated-diff-playwright-smoke.html'
  'map_diff_playwright_future_mode.json' = 'annotated-diff-playwright-future-mode.html'
}

$ok = $true
foreach($map in $pairs.Keys){
  $outName = $pairs[$map]
  $outPath = Join-Path $scriptDir $outName
  if(-not (Test-Path $outPath)){
    Write-Host "Missing generated file: $outPath" -ForegroundColor Yellow
    $ok = $false
    continue
  }

  $regenerated = $template -replace '\{\{MAP_URL\}\}',$map
  # normalize line endings for reliable comparison
  $regNorm = $regenerated -replace "`r`n","`n" -replace "`r","`n"
  $actual = Get-Content -Raw -Path $outPath
  $actNorm = $actual -replace "`r`n","`n" -replace "`r","`n"

  if($regNorm -ne $actNorm){
    Write-Host "Mismatch detected: $outName (expected MAP_URL = $map)" -ForegroundColor Red
    $ok = $false
  } else {
    Write-Host "OK: $outName"
  }
}

if(-not $ok){ exit 1 } else { Write-Host 'All files match template.'; exit 0 }
