# Poll GitHub Actions runs for branch 'add-embedded-notojp' and print status until all runs complete or timeout.
param(
  [int]$IntervalSec = 15,
  [int]$TimeoutSec = 3600
)
$start = Get-Date
Write-Host "Starting CI monitor for branch: add-embedded-notojp (interval ${IntervalSec}s, timeout ${TimeoutSec}s)"
while($true){
  $json = gh run list --branch add-embedded-notojp --limit 20 --json databaseId,name,headBranch,workflow,status,conclusion,createdAt 2>$null | Out-String
  if(-not $json){ Write-Host "gh run list returned no output (check gh auth)"; exit 2 }
  $runs = $json | ConvertFrom-Json
  if(-not $runs){ Write-Host "No runs found for branch."; Start-Sleep -Seconds $IntervalSec; continue }

  $rows = @()
  $allCompleted = $true
  foreach($r in $runs){
    $rows += "[$($r.status.ToUpper())] $($r.workflow.name) — conclusion: $($r.conclusion) — createdAt: $($r.createdAt) — id: $($r.databaseId)"
    if($r.status -ne 'completed'){ $allCompleted = $false }
  }

  Clear-Host
  Write-Host "CI runs for branch 'add-embedded-notojp':"
  $rows | ForEach-Object { Write-Host $_ }

  if($allCompleted){
    Write-Host "\nAll listed runs are completed. Exiting monitor.\n"
    # show conclusions summary
    $summary = $runs | Group-Object -Property conclusion | ForEach-Object { "$($_.Name): $($_.Count)" }
    Write-Host "Conclusions: "
    $summary | ForEach-Object { Write-Host " - $_" }
    exit 0
  }

  $elapsed = (Get-Date) - $start
  if($elapsed.TotalSeconds -gt $TimeoutSec){ Write-Host "Timeout reached after $($elapsed.TotalMinutes) minutes."; exit 3 }
  Start-Sleep -Seconds $IntervalSec
}
