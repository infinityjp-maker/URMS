$ids=@(21817880499,21817880523)
Write-Host "Requesting reruns: $($ids -join ', ')"
foreach($id in $ids){ gh run rerun $id }
$deadline = (Get-Date).AddMinutes(10)
while((Get-Date) -lt $deadline) {
  $allDone = $true
  foreach($id in $ids) {
    $info = gh run view $id --json databaseId,status,conclusion --jq '.status + "|" + (.conclusion // "")'
    Write-Host "$id $info"
    if($info -match 'in_progress|queued') { $allDone = $false }
  }
  if($allDone) { break }
  Start-Sleep -Seconds 8
}
Write-Host "Finished monitoring"
gh pr checks 6 --repo infinityjp-maker/URMS
