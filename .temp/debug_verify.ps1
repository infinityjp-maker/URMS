$pairs = @{
  'map_diff_playwright_smoke.json' = 'annotated-diff-playwright-smoke.html'
  'map_diff_playwright_future_mode.json' = 'annotated-diff-playwright-future-mode.html'
}
$template = Get-Content -Raw .\builds\screenshots\annotated-diff-template.html
foreach($map in $pairs.Keys){
  $out = $pairs[$map]
  $outPath = Join-Path .\builds\screenshots $out
  Write-Host "\n-- MAP: $map -- FILE: $out --"
  if(-not (Test-Path $outPath)){ Write-Host "Missing $outPath"; continue }
  $regenerated = $template -replace '\{\{MAP_URL\}\}',$map
  $regSnippet = ($regenerated -split "`n") | Select-String -Pattern "MAP_URL|$map" -Context 1
  $act = Get-Content -Raw -Path $outPath
  $actSnippet = ($act -split "`n") | Select-String -Pattern "MAP_URL|$map" -Context 1
  Write-Host "Regenerated snippet:"; $regSnippet | ForEach-Object { Write-Host "$($_.Line)" }
  Write-Host "Actual snippet:"; $actSnippet | ForEach-Object { Write-Host "$($_.Line)" }
  if(($regenerated -replace "`r`n","`n" -replace "`r","`n") -ne ($act -replace "`r`n","`n" -replace "`r","`n")){
    Write-Host "=> Files differ"
  } else {
    Write-Host "=> Files match"
  }
}
