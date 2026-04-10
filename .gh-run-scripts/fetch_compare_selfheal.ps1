# Fetch server RAW for selfheal-validate.yml and compare to local copy
$repo = 'infinityjp-maker/URMS'
$path = '.github/workflows/selfheal-validate.yml'
$dir = '.gh-run-scripts'
New-Item -ItemType Directory -Force -Path $dir | Out-Null

try {
  $b64 = gh api "repos/$repo/contents/$path" --jq '.content' 2>$null
} catch {
  Write-Error "gh api failed: $_"
  exit 2
}
if (-not $b64) { Write-Error "No content from gh api"; exit 3 }
[System.IO.File]::WriteAllBytes("$dir/server_selfheal.yml",[System.Convert]::FromBase64String($b64))
Copy-Item $path "$dir/local_selfheal.yml" -Force
Format-Hex "$dir/server_selfheal.yml" > "$dir/server_hex.txt"
Format-Hex "$dir/local_selfheal.yml" > "$dir/local_hex.txt"

$serverBytes = [System.IO.File]::ReadAllBytes("$dir/server_selfheal.yml")
$localBytes = [System.IO.File]::ReadAllBytes("$dir/local_selfheal.yml")

function CountSequence([byte[]]$hay, [byte[]]$seq) {
  $count = 0
  for ($i=0; $i -le $hay.Length - $seq.Length; $i++) {
    $match = $true
    for ($j=0; $j -lt $seq.Length; $j++) { if ($hay[$i+$j] -ne $seq[$j]) { $match = $false; break } }
    if ($match) { $count++ }
  }
  return $count
}

$summary = @{
  server_length = $serverBytes.Length
  local_length = $localBytes.Length
  length_diff = $serverBytes.Length - $localBytes.Length
  server_bom = if ($serverBytes.Length -ge 3 -and $serverBytes[0] -eq 0xEF -and $serverBytes[1] -eq 0xBB -and $serverBytes[2] -eq 0xBF) { $true } else { $false }
  local_bom = if ($localBytes.Length -ge 3 -and $localBytes[0] -eq 0xEF -and $localBytes[1] -eq 0xBB -and $localBytes[2] -eq 0xBF) { $true } else { $false }
  server_crlf = CountSequence $serverBytes ([byte[]](0x0D,0x0A))
  local_crlf = CountSequence $localBytes ([byte[]](0x0D,0x0A))
  server_lf = ( ($serverBytes | Where-Object { $_ -eq 0x0A }).Count ) - (CountSequence $serverBytes ([byte[]](0x0D,0x0A)) )
  local_lf = ( ($localBytes | Where-Object { $_ -eq 0x0A }).Count ) - (CountSequence $localBytes ([byte[]](0x0D,0x0A)) )
  server_literal_backslash_n = CountSequence $serverBytes ([byte[]](0x5C,0x6E))
  local_literal_backslash_n = CountSequence $localBytes ([byte[]](0x5C,0x6E))
  server_tab = ( ($serverBytes | Where-Object { $_ -eq 0x09 }).Count )
  local_tab = ( ($localBytes | Where-Object { $_ -eq 0x09 }).Count )
  server_zwsp = CountSequence $serverBytes ([byte[]](0xE2,0x80,0x8B))
  local_zwsp = CountSequence $localBytes ([byte[]](0xE2,0x80,0x8B))
  server_fullwidth_space = CountSequence $serverBytes ([byte[]](0xE3,0x80,0x80))
  local_fullwidth_space = CountSequence $localBytes ([byte[]](0xE3,0x80,0x80))
}

# find first 200 differences
$diffs = New-Object System.Collections.ArrayList
$max = [Math]::Min(200, [Math]::Max($serverBytes.Length,$localBytes.Length))
for ($i=0; $i -lt $max; $i++) {
  $sb = if ($i -lt $serverBytes.Length) { $serverBytes[$i] } else { $null }
  $lb = if ($i -lt $localBytes.Length) { $localBytes[$i] } else { $null }
  if ($sb -ne $lb) {
    $entry = @{ index = $i; server = if ($sb -ne $null) { '{0:X2}' -f $sb } else { '---' }; local = if ($lb -ne $null) { '{0:X2}' -f $lb } else { '---' } }
    $null = $diffs.Add($entry)
  }
}
$summary.difference_count = $diffs.Count
$summary.sample_diffs = $diffs | Select-Object -First 100

$summary | Out-String | Set-Content "$dir/compare_summary.txt"

# dump first 400 lines of hex preview for manual review
$hexLines = @()
$hexLines += "=== server_hex (first 200 lines) ==="
$hexLines += Get-Content "$dir/server_hex.txt" -TotalCount 200
$hexLines += "=== local_hex (first 200 lines) ==="
$hexLines += Get-Content "$dir/local_hex.txt" -TotalCount 200
$hexLines | Set-Content "$dir/hex_preview.txt"

# structured diffs csv
$diffFile = "$dir/hex_diff.txt"
Set-Content $diffFile ("Index,Server,Local")
foreach ($d in $summary.sample_diffs) { Add-Content $diffFile ("{0},{1},{2}" -f $d.index,$d.server,$d.local) }

Write-Output "COMPARE_DONE"
exit 0
