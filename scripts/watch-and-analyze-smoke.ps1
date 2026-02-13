#!/usr/bin/env pwsh
# watch-and-analyze-smoke.ps1
# - Monitor latest GH Actions run (playwright-smoke.yml / add-embedded-notojp)
# - When completed: download artifact 'playwright-screenshots', analyze diff, extract logs, and save outputs to .gh-logs

$ErrorActionPreference = 'Stop'

# Config
$branch = 'add-embedded-notojp'
$workflow = 'playwright-smoke.yml'
$artifactName = 'playwright-screenshots'
$repo = 'infinityjp-maker/URMS'
$pollIntervalSec = 15

# Helpers
function TrimQuotes($s){ return ($s -as [string]).Trim('"') }
function SafeRun($cmd){
  Write-Output ">> $cmd"
  iex $cmd
}

# 1) Get latest run ID
$runId = gh run list --branch $branch --workflow $workflow --limit 1 --json databaseId --jq '.[0].databaseId' 2>$null
if([string]::IsNullOrWhiteSpace($runId)){
  Write-Error "Failed to find latest run for branch=$branch workflow=$workflow"
  exit 1
}
$runId = TrimQuotes $runId
Write-Output "Latest runId: $runId"

# 2) Poll until completed
while ($true) {
  $status = gh run view $runId --json status --jq '.status' 2>$null | ForEach-Object { TrimQuotes $_ }
  $conclusion = gh run view $runId --json conclusion --jq '.conclusion' 2>$null | ForEach-Object { TrimQuotes $_ }
  Write-Output "$(Get-Date -Format o)  status=$status  conclusion=$conclusion"
  if ($status -eq 'completed') { break }
  Start-Sleep -Seconds $pollIntervalSec
}

# 3) Get final run info
$finalJson = gh run view $runId --repo $repo --json databaseId,status,conclusion,url --jq '{id:.databaseId,status:.status,conclusion:.conclusion,url:.url}' 2>$null
Write-Output "Final run info: $finalJson"

# Prepare directories
$artDir = ".gh-logs/artifacts-$runId"
if (Test-Path $artDir) {
  Write-Output "Removing existing $artDir to avoid extraction conflicts"
  Remove-Item -Recurse -Force $artDir
}
New-Item -ItemType Directory -Path $artDir | Out-Null

# 4) Download artifact
Write-Output "Downloading artifact '$artifactName' to $artDir"
gh run download $runId --name $artifactName --dir $artDir --repo $repo

Write-Output ("Files under " + $artDir + ":")
Get-ChildItem -Path $artDir -Recurse -Force | Select-Object FullName,Length | Format-Table -AutoSize

# 5) Analysis: analyze_diff on diff-playwright-smoke.png
$diffFile = Get-ChildItem -Path $artDir -Recurse -Filter 'diff-playwright-smoke.png' -File -ErrorAction SilentlyContinue | Select-Object -First 1 -ExpandProperty FullName
if ($diffFile) {
  $outAnalyze = ".gh-logs/analyze-diff-$runId.json"
  Write-Output "Found diff: $diffFile -> running analyze_diff.js -> $outAnalyze"
  node .github/workflow-scripts/analyze_diff.js $diffFile | Out-File -Encoding utf8 $outAnalyze
  Write-Output "Saved $outAnalyze"
} else {
  Write-Output "diff-playwright-smoke.png not found in artifact."
}

# 6) Row diff: baseline vs current
$baseline = 'Tests/playwright/baseline/playwright-smoke.png'
$current = Get-ChildItem -Path $artDir -Recurse -Filter 'playwright-smoke.png' -File -ErrorAction SilentlyContinue | Select-Object -First 1 -ExpandProperty FullName
if((Test-Path $baseline) -and $current){
  $outRow = ".gh-logs/row-diff-$runId.json"
  Write-Output "Running row_diff between baseline '$baseline' and current '$current' -> $outRow"
  node .github/workflow-scripts/row_diff.cjs $baseline $current | Out-File -Encoding utf8 $outRow
  Write-Output "Saved $outRow"
} else {
  Write-Output "Baseline or current screenshot missing; skipping row_diff."
}

# 7) Copy smoke-result JSONs to .gh-logs and extract consoleMessages
$smokeFiles = Get-ChildItem -Path $artDir -Recurse -Filter 'smoke-result*.json' -File -ErrorAction SilentlyContinue
$consoleSummary = @()
if ($smokeFiles) {
  foreach ($f in $smokeFiles) {
    $dst = Join-Path '.gh-logs' $f.Name
    Copy-Item $f.FullName $dst -Force
    Write-Output "Copied $($f.FullName) -> $dst"
    try {
      $j = Get-Content $f.FullName -Raw | ConvertFrom-Json
      if ($j.consoleMessages -and $j.consoleMessages.Count -gt 0) {
        Write-Output "Console messages in $($f.Name):"
        foreach ($m in $j.consoleMessages) {
          $consoleSummary += $m.text
          Write-Output " - $($m.text)"
        }
      } else {
        Write-Output "No consoleMessages in $($f.Name)"
      }
    } catch {
      Write-Output "Failed to parse JSON $($f.FullName): $_"
    }
  }
} else {
  Write-Output "No smoke-result*.json found in artifact."
}

# 8) Keyword search across artifact files
$keywords = @('CORS','ERR_FAILED','http-ping','127.0.0.1:8765')
$keywordHits = @{}
foreach ($k in $keywords) {
  Write-Output "Searching for '$k'..."
  $matches = Select-String -Path "$artDir\**\*" -Pattern $k -SimpleMatch -ErrorAction SilentlyContinue
  if ($matches) {
    $keywordHits[$k] = $matches.Count
    Write-Output "Matches for '$k':"
    $matches | Select-Object Path,LineNumber,Line | Format-Table -AutoSize
  } else {
    $keywordHits[$k] = 0
    Write-Output "No matches for '$k'"
  }
}

# 9) SUMMARY
Write-Output "`n=== SUMMARY ==="
try {
  $meta = $finalJson | ConvertFrom-Json
  Write-Output "Run ID: $($meta.id)"
  Write-Output "Status: $($meta.status)"
  Write-Output "Conclusion: $($meta.conclusion)"
  Write-Output "URL: $($meta.url)"
} catch {
  Write-Output "Final run info: $finalJson"
}

# analyze-diff results
$outAnalyze = ".gh-logs/analyze-diff-$runId.json"
if (Test-Path $outAnalyze) {
  $ad = Get-Content $outAnalyze -Raw | ConvertFrom-Json
  Write-Output "`nAnalyze diff result:"
  Write-Output (" - nonZeroPixels: {0}" -f $ad.nonZeroPixels)
  Write-Output (" - pct: {0}" -f $ad.pct)
} else {
  Write-Output "`nNo analyze-diff result."
}

# row-diff results
$outRow = ".gh-logs/row-diff-$runId.json"
if (Test-Path $outRow) {
  $rd = Get-Content $outRow -Raw | ConvertFrom-Json
  Write-Output "`nRow-diff result:"
  Write-Output (" - width: {0}, height: {1}, totalDiffPixels: {2}" -f $rd.width,$rd.height,$rd.total)
} else {
  Write-Output "`nNo row-diff result."
}

# console summary
Write-Output "`nConsoleMessages summary (collected):"
if ($consoleSummary.Count -gt 0) {
  $consoleSummary | Select-Object -Unique | ForEach-Object { Write-Output " - $_" }
} else {
  Write-Output " - (no console messages captured)"
}

# keyword summary
Write-Output "`nKeyword hits:"
foreach ($k in $keywords) {
  Write-Output (" - {0}: {1}" -f $k, $keywordHits[$k])
}

# saved files list
Write-Output "`nSaved files under .gh-logs:"
Get-ChildItem -Path .gh-logs -Recurse -Force | Select-Object FullName,Length | Format-Table -AutoSize

Write-Output "`nScript completed."
