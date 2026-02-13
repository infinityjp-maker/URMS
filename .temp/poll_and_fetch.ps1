param(
  [string]$PollRunId = '21950244778',
  [string[]]$FetchFailIds = @('21950244855','21950244785'),
  [int]$IntervalSec = 15,
  [int]$TimeoutSec = 1800
)
$start = Get-Date
$logsDir = ".gh-logs"
if(-not (Test-Path $logsDir)){ New-Item -ItemType Directory -Path $logsDir | Out-Null }
Write-Host "Polling run id $PollRunId until completed (interval ${IntervalSec}s, timeout ${TimeoutSec}s)"
while($true){
  $info = gh run view $PollRunId --json status,conclusion --jq '. | {status:.status,conclusion:.conclusion}' 2>$null | Out-String
  if(-not $info){ Write-Host "Failed to retrieve run $PollRunId via gh; aborting."; exit 2 }
  $obj = $info | ConvertFrom-Json
  Write-Host "Status: $($obj.status) — Conclusion: $($obj.conclusion)"
  if($obj.status -eq 'completed'){ break }
  $elapsed = (Get-Date) - $start
  if($elapsed.TotalSeconds -gt $TimeoutSec){ Write-Host "Timeout waiting for run $PollRunId"; exit 3 }
  Start-Sleep -Seconds $IntervalSec
}
Write-Host "Run $PollRunId completed with conclusion: $($obj.conclusion)"

# Fetch logs for requested failed run IDs
foreach($id in $FetchFailIds){
  $out = Join-Path $logsDir ("run-$id.log")
  Write-Host "Downloading logs for run $id -> $out"
  gh run view $id --log > $out 2>&1
  if($LASTEXITCODE -ne 0){ Write-Host "gh run view failed for $id" }
  else { Write-Host "Saved: $out" }
}

# Summarize conclusions for the fetched runs
Write-Host "\nSummary of fetched runs:"
$all = $FetchFailIds + $PollRunId
foreach($r in $all | Sort-Object -Unique){
  $j = gh run view $r --json conclusion,createdAt,headBranch,workflowName --jq '. | {id:$ENV:RUNID,workflow:.workflowName,conclusion:.conclusion,createdAt:.createdAt}' 2>$null | Out-String
  # graceful: if gh query fails, fallback to url
  if($j){
    $o = $j | ConvertFrom-Json
    Write-Host "$r — $($o.workflow) — conclusion: $($o.conclusion) — createdAt: $($o.createdAt)"
  } else {
    Write-Host "$r — (no metadata) — see .gh-logs/run-$r.log"
  }
}
