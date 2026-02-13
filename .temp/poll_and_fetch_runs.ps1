$ids = @(21950932805,21950932926,21950932844)
foreach ($id in $ids) {
  Write-Output "Polling run $id..."
  $deadline = (Get-Date).AddMinutes(20)
  while ((Get-Date) -lt $deadline) {
    $o = gh run view $id --json status,conclusion 2>$null | ConvertFrom-Json
    if ($o -ne $null) {
      $status = $o.status
      $conclusion = if ($o.conclusion) { $o.conclusion } else { 'null' }
      Write-Output "$id -> status=$status conclusion=$conclusion"
      if ($status -eq 'completed') { break }
    } else { Write-Output "$id -> (no data)" }
    Start-Sleep -Seconds 15
  }
  Write-Output "Fetching logs for $id..."
  gh run view $id --log > .gh-logs/run-$id.log 2>&1
  Write-Output "Saved .gh-logs/run-$id.log"
}
