$pairs = @{
  'map_diff_playwright_smoke.json' = 'annotated-diff-playwright-smoke.html'
  'map_diff_playwright_future_mode.json' = 'annotated-diff-playwright-future-mode.html'
}
$template = Get-Content -Raw .\builds\screenshots\annotated-diff-template.html
foreach($map in $pairs.Keys){
  $out = $pairs[$map]
  $outPath = Join-Path .\builds\screenshots $out
  Write-Host "\n-- MAP: $map -- FILE: $out --"
  $regenerated = $template -replace '\{\{MAP_URL\}\}',$map
  $regLines = $regenerated -split "`n"
  $actLines = (Get-Content -Raw $outPath) -split "`n"
  $max = [Math]::Max($regLines.Length, $actLines.Length)
  $found = $false
  for($i=0;$i -lt $max; $i++){
    $r = if($i -lt $regLines.Length){$regLines[$i]} else {"<NO LINE>"}
    $a = if($i -lt $actLines.Length){$actLines[$i]} else {"<NO LINE>"}
    if($r -ne $a){
      Write-Host "First difference at line $($i+1)"
      $start = [Math]::Max(0,$i-3)
      $end = [Math]::Min($max-1,$i+3)
      Write-Host "--- Regenerated (lines $($start+1)-$($end+1)) ---"
      for($j=$start;$j -le $end;$j++){ $ln = if($j -lt $regLines.Length){$regLines[$j]} else {"<NO LINE>"}; Write-Host "$($j+1): $ln" }
      Write-Host "--- Actual (lines $($start+1)-$($end+1)) ---"
      for($j=$start;$j -le $end;$j++){ $ln = if($j -lt $actLines.Length){$actLines[$j]} else {"<NO LINE>"}; Write-Host "$($j+1): $ln" }
      $found = $true
      break
    }
  }
  if(-not $found){ Write-Host "No difference found (unexpected)" }
}
