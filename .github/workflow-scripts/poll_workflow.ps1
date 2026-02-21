param(
  [string]$Repo = 'infinityjp-maker/URMS',
  [string]$Workflow = 'playwright-smoke.yml',
  [string]$Branch = 'feature/ui-polish-1',
  [int]$TimeoutMinutes = 15,
  [int]$SleepSeconds = 15
)
$deadline = (Get-Date).AddMinutes($TimeoutMinutes)
Write-Output "Polling workflow runs for $Repo/$Workflow on branch $Branch until $deadline"
$found = $null
while((Get-Date) -lt $deadline) {
  $runsJson = gh run list --repo $Repo --workflow $Workflow --limit 20 --json databaseId,headBranch,status,conclusion,createdAt 2>$null
  if($LASTEXITCODE -ne 0){ Write-Output "gh run list failed (exit $LASTEXITCODE), retrying..."; Start-Sleep -Seconds $SleepSeconds; continue }
  $runs = $runsJson | ConvertFrom-Json
  $r = $runs | Where-Object { $_.headBranch -eq $Branch } | Sort-Object {[datetime]$_.createdAt} -Descending | Select-Object -First 1
  if($null -ne $r){
    Write-Output "Found run: id=$($r.databaseId) status=$($r.status) conclusion=$($r.conclusion) createdAt=$($r.createdAt)"
    $found = $r
    if($r.status -ne 'in_progress' -and $r.status -ne 'queued'){
      break
    }
  } else {
    Write-Output "No run found yet"
  }
  Start-Sleep -Seconds $SleepSeconds
}
if($null -eq $found){ Write-Output 'No run detected within timeout'; exit 2 }
# Print final run info
Write-Output "Final run: id=$($found.databaseId) status=$($found.status) conclusion=$($found.conclusion) createdAt=$($found.createdAt)"
$found | ConvertTo-Json -Depth 5
 