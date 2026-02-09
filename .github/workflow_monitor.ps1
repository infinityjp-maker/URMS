$runId = 21798914397
$repo = 'infinityjp-maker/URMS'
for ($i=0; $i -lt 60; $i++) {
  $out = gh run view $runId --repo $repo --json status,conclusion 2>$null
  if (-not $out) { Start-Sleep -Seconds 2; continue }
  try {
    $r = $out | ConvertFrom-Json
  } catch { Start-Sleep -Seconds 2; continue }
  if ($r.status -ne 'in_progress') { $r | ConvertTo-Json; exit 0 }
  Start-Sleep -Seconds 5
}
Write-Host 'timeout'
exit 1
