<#
Generate annotated-diff viewers from the template by replacing {{MAP_URL}}.
Usage: run this script from the repo root or double-click in Explorer.
#>
try{
  $scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Definition
  $templatePath = Join-Path $scriptDir 'annotated-diff-template.html'
  if(-not (Test-Path $templatePath)){
    Write-Error "Template not found: $templatePath"
    exit 2
  }

  $tmpl = Get-Content -Raw -Path $templatePath -ErrorAction Stop

  $pairs = @{
    'map_diff_playwright_smoke.json' = 'annotated-diff-playwright-smoke.html'
    'map_diff_playwright_future_mode.json' = 'annotated-diff-playwright-future-mode.html'
  }

  foreach($map in $pairs.Keys){
    $outName = $pairs[$map]
    $outPath = Join-Path $scriptDir $outName
    $content = $tmpl -replace '\{\{MAP_URL\}\}',$map
    Set-Content -Path $outPath -Value $content -Encoding UTF8
    Write-Host "Wrote: $outPath"
  }
}catch{
  Write-Error "Generation failed: $($_.Exception.Message)"
  exit 1
}
