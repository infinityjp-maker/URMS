param(
  [Parameter(Mandatory=$true)][long]$RunId
)
Write-Output "Monitoring run $RunId"
while ($true) {
  $info = gh run view $RunId --json status,conclusion | ConvertFrom-Json
  $conc = if ($null -ne $info.conclusion -and $info.conclusion -ne '') { $info.conclusion } else { '' }
  Write-Output ((Get-Date).ToString('o') + ' ' + $info.status + '|' + $conc)
  if ($info.status -eq 'completed') { break }
  Start-Sleep -Seconds 8
}
$summary = gh run view $RunId --json databaseId,status,conclusion,url | ConvertFrom-Json
$summary | ConvertTo-Json -Depth 5
exit 0
